const cron = require('node-cron');
const utility = require('./utility'); // Adjust the path to your utility file
const User = require('../models/user'); // Adjust the path to your User model

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
