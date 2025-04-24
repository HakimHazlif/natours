const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Creste a transporter
  const transporter = nodemailer.createTransport({
    // variabels from mailtrap
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: false,
  });

  // 2. Define the email options
  const mailOptions = {
    from: 'Hakim Hazlif <hakim55@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3. Actually send the email
  // the try-catch body

  await transporter.sendMail(mailOptions); // this doesn't work
};

module.exports = sendEmail;

// for gamil
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
