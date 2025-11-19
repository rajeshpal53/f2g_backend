const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.EMAIL_PASS     // Your App Password from Google
  }
});

function generateScreenShotUrlLink(screenShotUrl) {
  return `${process.env.COMMON_URL}${screenShotUrl}`;
}

exports.sendLoginMail = (to) => {
  try{
    let mailOptions = {
      from: process.env.EMAIL,   // Sender address
      to: to,  // List of recipients
      subject: 'Welcome to Daily Sabji',  // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #4CAF50;">Welcome to Daily Sabji!</h2>
          <p>Thank you for choosing us for your service needs. We're here to provide you with the best service experience.</p>
          <p><strong>Get the best quotations</strong> for the services you require and <strong>book service providers now</strong>.</p>
          <p style="margin-top: 20px;">Best regards,<br>Daily Sabji Team</p>
          <hr>
          <p style="font-size: 12px; color: #555;">This is an automated email, please do not reply.</p>
        </div>
      ` // HTML body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error while sending mail:', error);
      }
      console.log('Email sent successfully:', info.response);
    });
  } catch (err){
    console.log("Error while sent Login Mail");
  }
}

exports.sendFeedBackMail = (adminEmails, feedBack) => {
  try {
    const screenShotLink = generateScreenShotUrlLink(feedBack.screenShotUrl);

    let mailOptions = {
      from: process.env.EMAIL,   // Sender address
      to: adminEmails,                  // List of admin recipients
      subject: `New Feedback Received: ${feedBack.feedbackType}`,  // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #007bff;">New Feedback Received</h2>
          <p><strong>Feedback Type:</strong> ${feedBack.feedbackType}</p>
          <p><strong>Description:</strong> ${feedBack.description}</p>

          <h3>User Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${feedBack.name}</li>
            <li><strong>Email:</strong> ${feedBack.mobile}</li>
            <li><strong>Email:</strong> ${feedBack.email}</li>
          </ul>

          <h3>Additional Details:</h3>
          <ul>
            <li><strong>Submitted On:</strong> ${new Date(feedBack.createdAt).toLocaleString()}</li>
            <li><strong>Last Updated:</strong> ${new Date(feedBack.updatedAt).toLocaleString()}</li>
          </ul>

          ${feedBack.screenShotUrl ? `
            <h3>Screenshot:</h3>
            <p><a href="${screenShotLink}" target="_blank" style="color: #007bff; text-decoration: none;">View Screenshot</a></p>
            <p><img src="${screenShotLink}" alt="Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;"/></p>
          ` : ''}

          <hr>
          <p style="color: #888;">This is an automated email. Please do not reply.</p>
        </div>
      ` // HTML body
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error while sending mail to admins:', error);
      }
      console.log('Admin feedBack email sent successfully:', info.response);
    });
  
} catch (err) {
  console.log('Error while sending admin feedback mail:', err);
}
};

exports.sendUserFeedBackResolvedMail = (feedBack) => {
  try {
    const screenShotLink = generateScreenShotUrlLink(feedBack.screenShotUrl);

    let mailOptions = {
      from: process.env.EMAIL,   // Sender address
      to: feedBack?.email,                  // List of admin recipients
      subject: `Your Feedback Has Been Resolved: ${feedBack.feedbackType}`,  // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #28a745;">Feedback Resolved 🎉</h2>
          <p>Dear <strong>${feedBack.name || 'User'}</strong>,</p>

          <p>We’re reaching out to let you know that the feedback you submitted has been reviewed and resolved by our team.</p>

          <h3>Feedback Details:</h3>
          <ul>
            <li><strong>Feedback Type:</strong> ${feedBack.feedbackType}</li>
            <li><strong>Description:</strong> ${feedBack.description}</li>
            <li><strong>Submitted On:</strong> ${new Date(feedBack.createdAt).toLocaleString()}</li>
            <li><strong>Resolved On:</strong> ${new Date(feedBack.updatedAt).toLocaleString()}</li>
          </ul>

          ${feedBack.resolvedMessage ? `
            <h3>Resolution Note:</h3>
            <p style="background:#f8f9fa; padding:10px; border-left:4px solid #28a745; border-radius:4px;">
              ${feedBack.resolvedMessage}
            </p>
          ` : ''}

          ${feedBack.screenShotUrl ? `
            <h3>Your Screenshot:</h3>
            <p><a href="${screenShotLink}" target="_blank" style="color: #007bff; text-decoration: none;">View Screenshot</a></p>
            <p><img src="${screenShotLink}" alt="Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;"/></p>
          ` : ''}

          <p>If you have any further questions or need additional help, please don’t hesitate to contact us.</p>

          <hr>
          <p style="color: #888;">Thank you for helping us improve our services.<br/>- Team F2G Finance</p>
        </div>
      `
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error while sending mail to admins:', error);
      }
      console.log('Admin feedBack email sent successfully:', info.response);
    });
  
} catch (err) {
  console.log('Error while sending admin feedback mail:', err);
}
};

exports.sendApplyForLoanMail = (adminEmails, applyForLoan) => {
  try {
    let mailOptions = {
      from: process.env.EMAIL,   // Sender address
      to: adminEmails,                // List of admin recipients
      subject: `New Loan requirement Received: ${applyForLoan?.loantype?.type}`,  // Subject line
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">

          <h2 style="color: #333; text-align: center;">📄 New Loan Requirement Received</h2>
          <p style="font-size: 15px; color: #555;">
            A user has requested a loan. Below are the details:
          </p>

          <hr style="margin: 20px 0;">

          <h3 style="color: #333;">👤 Applicant Details</h3>
          <p style="font-size: 14px; color: #444; line-height: 1.6;">
            <strong>Name:</strong> ${applyForLoan?.name || 'N/A'} <br>
            <strong>Mobile:</strong> ${applyForLoan?.mobile || 'N/A'} <br>
            <strong>Address:</strong> ${applyForLoan?.address || 'N/A'} 
          </p>

          <h3 style="color: #333; margin-top: 20px;">💰 Loan Details</h3>
          <p style="font-size: 14px; color: #444; line-height: 1.6;">
            <strong>Loan Type:</strong> ${applyForLoan?.loantype?.type || 'N/A'} <br>
            <strong>Loan Amount:</strong> ₹${applyForLoan?.loanAmount || 'N/A'}
          </p>

          <hr style="margin: 20px 0;">

          <p style="font-size: 14px; color: #666;">
            Please review the request and take necessary action.
          </p>

          <div style="text-align: center; margin-top: 25px;">
            <a href="#" style="padding: 10px 20px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 5px; font-size: 14px;">
              View Application
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 25px; text-align: center;">
            This is an automated message. Please do not reply.
          </p>

        </div>
      </div>
      ` // HTML body
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error while sending mail to admins:', error);
      }
      console.log('Admin feedBack email sent successfully:', info.response);
    });
  
} catch (err) {
  console.log('Error while sending admin feedback mail:', err);
}
};



