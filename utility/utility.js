const notificationController = require('../controllers/notificationController');
const mail = require('./sendMail');
const User = require("../models/user");
const statusConstant = require('./statusConstant');

const getUser = async (userfk) => {
  const user = await User.findByPk(userfk);
  return user;
};
  
const getAdmins = async () => {
  const admins = await User.findAll({
  where: { roles: 'admin'},
  });
  return admins;
};

exports.sendCreateBookingNotificationToAdmin = async(req) => {
  try {
  const admins = await getAdmins();
  const tokens = admins
  .flatMap((admin) => admin.fcmtokens || []) // Flatten arrays of fcmtokens
  .filter((token) => token); // Remove null/undefined tokens
  if (tokens.length > 0) {
  const notificationObj = {
        title: "Service Update",
        body: "A new booking has been created. Please verify and approve.",
        tokens: tokens, // Send notification to all aggregated tokens
        extraData: "AdminSection",
        image: "https://f2gfinance.com/f2g_logo.jpg",
        screen: "AdminSection",
      };

  return setReqAndSendNotificatonData(req, notificationObj);

  } else {
      console.log("No valid FCM tokens found for admins.");
      return null;
  } 
  }catch (error) {
  console.error("Error sending notification to admins:", error);
  throw error; // Re-throw to handle upstream if needed
}
};

exports.sendStatusNotification = async (req, entity, entityType) => {
  try {
    if (!entity?.usersfk) return;

    const user = await getUser(entity.usersfk);
    if (!user?.fcmtokens?.length) return;

    // Determine status message dynamically
    const statusText =
      statusConstant.STATUS_FK_VALUE[entity.statusfk] || "updated";

    // Choose proper title & screen based on entity type
    const entityName =
      entityType === "refferal" ? "Refferal" : "Booking";
    const screen =
      entityType === "refferal"
        ? "RefferalDetailsScreen"
        : "BookingDetailsScreen";

    // Dynamic message based on status
    const messages = {
      approved: `Your ${entityName.toLowerCase()} has been approved!`,
      disbursed: `Your ${entityName.toLowerCase()} has been disbursed!`,
      reject: `Unfortunately, your ${entityName.toLowerCase()} was rejected.`,
      "billing cleared": `Billing for your ${entityName.toLowerCase()} is cleared.`,
      "login incomplete": `Your ${entityName.toLowerCase()} login process is incomplete.`,
      default: `Your ${entityName.toLowerCase()} status has been updated to: ${statusText}`,
    };

    // Get message safely
    const body =
      messages[statusText?.toLowerCase()] || messages.default;

    const notificationObj = {
      tokens: user?.fcmtokens,
      title: `${entityName} Status Update`,
      body,
      extraData: screen,
      image: "https://f2gfinance.com/f2g_logo.jpg",
      screen,
    };

    return setReqAndSendNotificatonData(req, notificationObj);
  } catch (error) {
    console.error("Error sending status notification:", error);
  }
};

exports.sendCreateRefferalNotificationToAdmin = async(req) => {
  try {
  const admins = await getAdmins();
  const tokens = admins
  .flatMap((admin) => admin.fcmtokens || []) // Flatten arrays of fcmtokens
  .filter((token) => token); // Remove null/undefined tokens
  if (tokens.length > 0) {
  const notificationObj = {
        title: "Service Update",
        body: "A new refferal has been created. Please verify and approve.",
        tokens: tokens, // Send notification to all aggregated tokens
        extraData: "AdminSection",
        image: "https://f2gfinance.com/f2g_logo.jpg",
        screen: "AdminSection",
      };

  return setReqAndSendNotificatonData(req, notificationObj);

  } else {
      console.log("No valid FCM tokens found for admins.");
      return null;
  } 
  }catch (error) {
  console.error("Error sending notification to admins:", error);
  throw error; // Re-throw to handle upstream if needed
}
};
  
  function setReqAndSendNotificatonData(req, obj) {
      req.body.title = obj.title;
      req.body.body = obj.body;
      req.body.tokens = obj.tokens;
      req.body.extraData = obj.extraData;
      req.body.image = obj.image;
      req.body.screen = obj.screen;
      console.log("obj notificatio", req.body)
        notificationController.sendMultipleNotification(req);
       return "success";
  }
  
  exports.setReqAndSendNotificatonDataCron = (req, obj) => {
    req.body.title = obj.title;
    req.body.body = obj.body;
    req.body.tokens = obj.tokens;
    req.body.extraData = obj.extraData;
    req.body.image = obj.image;
    req.body.screen = obj.screen;
    console.log("obj notificatio", req.body)
      notificationController.sendMultipleNotification(req);
     return "success";
}

  exports.sendMail = (mailsId) => {
    mail.sendLoginMail(mailsId);
  }

  exports.sendAdminFeedBackMail = async (feedBack) => {
    const admins = await getAdmins();
    const adminEmails = admins.map((admin) => admin.email);
    mail.sendFeedBackMail(adminEmails, feedBack);
  }
  
  exports.sendFeedBackResolvedMailToUser = async (feedBack) => {
    if(feedBack?.email){
      mail.sendUserFeedBackResolvedMail(feedBack);
    }
  }
