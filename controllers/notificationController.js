// notificationController.js
const admin = require('firebase-admin');
const User = require('../models/user');
const { Op, fn, col, where } = require("sequelize");
const sequelize = require("../config/database");

// Ensure Firebase Admin SDK is initialized
const sendNotification = async (req, res) => {
  try {
    const { token, title, body, extraData, image, screen } = req.body;
    console.log("token, title, body ", token, title, body, extraData, image)
    // Create the notification payload
    const message = {
      data: {
        extraData: extraData,
        image: image,
        screen: screen
      },
      notification: {
        title: title,
        body: body,
        image: image
      },
      token: token, // single device tokens
    };

    // Send the notification
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return res?.status(200)?.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    return res?.status(500)?.json({ success: false, message: 'Notification failed', error: error.message });
  }
};

const sendMultipleNotification = async (req, res) => {
  try {
    let { tokens, title, body, extraData, image, screen } = req.body;

    if (typeof tokens === "string") {
      tokens = tokens.split(",").map((token) => token.trim());
    }

    if (!Array.isArray(tokens)) {
      throw new Error(
        "Invalid tokens format. It must be an array or a comma-separated string."
      );
    }

    // Process notifications for each token
    const results = await Promise.all(
      tokens.map(async (token) => {
        console.log("Sending to:", token);

        const notdata = {
          token,
          data: {
            extraData: extraData || "",
            image: image || "",
            screen: screen || "",
          },
          notification: {
            title: title || "Offers",
            body: body || "Click to get new offers",
            image: image || "",
          },
        };

        try {
          const response = await admin.messaging().send(notdata);
          console.log("Successfully sent message:", response);
          return { token, success: true };
        } catch (error) {
          console.error(`Failed to send message to ${token}:`, error.message);

          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered" ||
            error.code === "messaging/invalid-argument" ||
            error.code === "messaging/unregistered"
          ) {
            // Remove invalid token from users
            const users = await User.findAll({
              where: sequelize.where(
                sequelize.fn(
                  "JSON_CONTAINS",
                  sequelize.col("fcmtokens"),
                  JSON.stringify([token])
                ),
                1
              ),
            });

            for (const user of users) {
              const updatedTokens = user.fcmtokens.filter((t) => t !== token);
              await user.update({ fcmtokens: updatedTokens });
              console.log(`Removed token from user ID ${user.id}`);
            }
          }

          return { token, success: false, error: error.message };
        }
      })
    );

    return {
      success: results.every((r) => r.success),
      message: results.every((r) => r.success)
        ? "All notifications sent successfully"
        : "Some notifications failed",
      results,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      message: "Notification failed",
      error: error.message,
    };
  }
};

module.exports = {
  sendNotification,
  sendMultipleNotification
};
