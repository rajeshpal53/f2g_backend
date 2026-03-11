const cron = require('node-cron');
const utility = require('./utility'); // Adjust the path to your utility file
const User = require('../models/user'); // Adjust the path to your User model
require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Op } = require('sequelize');

// Cron job to send notifications every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily notification cron job at 9 AM');

  try {
    // Fetch users who should receive notifications
    const users = await User.findAll({
      attributes: ['id', 'fcmtokens'], // Fetch only necessary fields
    });

    // Iterate over users and send notifications
    for (const user of users) {
      if (user?.fcmtokens && user?.fcmtokens?.length > 0) {
        const req = { body: {} }; // Mock request object
        const notificationObj = {
          title: 'Daily Reminder',
          body: 'Don’t miss out on benefits!',
          tokens: user?.fcmtokens,
          extraData: 'Daily Notification',
          image: 'https://f2gfinance.com/f2g_logo.jpg',
          screen: "Home",
        };

        // Call the existing utility function to send notifications
        const result = utility.setReqAndSendNotificatonDataCron(req, notificationObj);
        console.log(`Notification sent to user ID ${user.id}:`, result);
      }
    }

    console.log('Daily notification cron job completed successfully.');
  } catch (error) {
    console.error('Error in daily notification cron job:', error);
  }
});


const BACKUP_DIR = process.env.DB_PATH;

// Make sure folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getDiskUsage(callback) {
  exec(`df -h ${BACKUP_DIR}`, (err, stdout) => {

    if (err || !stdout) {
      return callback("Unknown");
    }

    const lines = stdout.trim().split("\n");
    const parts = lines[1].split(/\s+/);

    callback(parts[4]); // ex: 62%
  });
}

function sendBackupSummaryMail(deletedCount) {

  getDiskUsage(async (usage) => {

    const summary = `
        Backup created successfully ✅<br><br>

        File saved at: ${BACKUP_DIR}<br>
        Old backups deleted: ${deletedCount}<br>
        Disk usage: ${usage}<br>
        Time: ${new Date().toLocaleString("en-IN")}
        `;

    await utility.sendAdminDbBackupMail(summary);

  });
}

// ========== CRON JOB ==========
// Everyday 11 PM IST
cron.schedule("0 23 * * *", async () => {

  try {
    console.log("⏳ DB Backup Started...");

    const date = new Date().toISOString().split("T")[0];

    const fileName = `f2g_backup_${date}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const dumpCommand = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${filePath}`;

    // const dumpCommand = `mysqldump ${process.env.DB_NAME} > ${filePath}`;

    exec(dumpCommand, async (error) => {

      if (error) {
        console.error("Backup Failed:", error);
        await utility.sendAdminDbBackupFailedMail(error.message || error.toString());
        return;
      }

      // Validate file size
      const stats = fs.statSync(filePath);
      if (stats.size < 1000) {
        console.error("Backup file invalid");
        await utility.sendAdminDbBackupFailedMail("backup file is invalid, file size is less than 1 kb");
        return;
      }

      console.log("✅ Backup Created Successfully");

    //   // Delete backups older than 15 days
    //   exec(`find ${BACKUP_DIR} -name "*.sql" -type f -mtime +15 -delete`);

      if (!BACKUP_DIR || BACKUP_DIR.length < 5) {
        console.error("Invalid BACKUP_DIR. Cleanup skipped.");
        return;
      }

      // ls -tp ${BACKUP_DIR}/*.sql | tail -n +21 | xargs rm --
      
      exec(
        `ls -tp "${BACKUP_DIR}"/*.sql 2>/dev/null | tail -n +14 | tee /tmp/deleted_backups.log | xargs -r rm --`,
        (err, stdout) => {

            let deletedCount = 0;
      
          if (err) {
            console.error("Rotation error:", err);
            return;
          }
      
          if (stdout) {
            deletedCount = stdout.trim().split("\n").length;
            console.log("🧹 Deleted backups:\n", stdout);
          } else {
            console.log("🧹 No old backups removed");
          }

          // Pass count to mail
          sendBackupSummaryMail(deletedCount);

        }
      );

    });

  } catch (err) {
    console.error("Cron Error:", err);
    await utility.sendAdminDbBackupFailedMail(err.message || err.toString() || "backup failed");
  }

}, {
  timezone: "Asia/Kolkata",
});


// cron.schedule('0 10 * * *', async () => {
//   try {

//     const result = await UserSession.destroy({
//       where: {
//         [Op.or]: [
//           {
//             expiresAt: {
//               [Op.lt]: new Date()
//             }
//           },
//           {
//             isRevoked: true,
//             updatedAt: {
//               [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
//             }
//           }
//         ]
//       }
//     });

//     console.log(`Cleaned ${result} old sessions`);

//   } catch (err) {
//     console.error('Session cleanup error:', err);
//   }
// });


