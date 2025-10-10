const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dwellfoodcare@gmail.com', 
    pass: 'dgyd whrd fdjn jsat'
  }
});

exports.sendLoginMail = (to) => {
  try{
    let mailOptions = {
      from: 'dwellfoodcare@gmail.com',   // Sender address
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



