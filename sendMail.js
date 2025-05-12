const nodemailer = require("nodemailer");
const fs = require("fs");
require("dotenv").config();
// Replace with your Brevo SMTP credentials
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USN,
    pass: process.env.BREVO_PASS,
  },
});
console.log(process.env.BREVO_USN);
console.log(process.env.BREVO_PASS);

// Check if files exist and build attachments array
const attachmentFiles = [
  { filename: "lateEntries.txt", path: "./output/lateEntries.txt" },
  { filename: "noChecklist.txt", path: "./output/noChecklist.txt" },
  { filename: "reminders.txt", path: "./output/reminders.txt" },
];

const validAttachments = attachmentFiles.filter(file => {
  try {
    fs.accessSync(file.path, fs.constants.F_OK);
    return true;
  } catch (error) {
    console.log(`File ${file.path} does not exist, skipping attachment`);
    return false;
  }
});

const mailOptions = {
  from: '"Husband" <uraman073016@gmail.com>',
  to: process.env.TO_EMAIL,
  subject: "ANG AKING PAG MAMAHAL SAYO",
  text: "Sana marandaman mo ang pag mamahal ko sayo",
  attachments: validAttachments,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error sending email:", error);
  } else {
    console.log("Email sent:", info.response);
  }
});
