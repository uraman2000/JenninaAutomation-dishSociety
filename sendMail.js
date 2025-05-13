const nodemailer = require("nodemailer");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");
require("dotenv").config();

// Function to convert JSON data to XLSX file
function convertJsonToXlsx(jsonFilePath, xlsxFilePath) {
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Convert to worksheet
    const worksheet = xlsx.utils.json_to_sheet(
      Array.isArray(jsonData) ? jsonData : Object.entries(jsonData).map(([key, value]) => ({
        Location: key,
        MissingChecklists: Array.isArray(value) ? value.join(", ") : value
      }))
    );
    
    // Create workbook and add the worksheet
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Write to file
    xlsx.writeFile(workbook, xlsxFilePath);
    console.log(`Converted ${jsonFilePath} to ${xlsxFilePath}`);
    return true;
  } catch (error) {
    console.error(`Error converting ${jsonFilePath} to XLSX:`, error);
    return false;
  }
}

// Replace with your Brevo SMTP credentials
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USN,
    pass: process.env.BREVO_PASS,
  },
});

// Define source and destination files
const filesToConvert = [
  { json: "./output/lateEntries.txt", xlsx: "./output/lateEntries.xlsx" },
  { json: "./output/noChecklist.txt", xlsx: "./output/noChecklist.xlsx" },
];

// Convert files
filesToConvert.forEach(file => {
  try {
    if (fs.existsSync(file.json)) {
      convertJsonToXlsx(file.json, file.xlsx);
    }
  } catch (error) {
    console.log(`File ${file.json} does not exist or cannot be converted`);
  }
});

// Check if files exist and build attachments array
const attachmentFiles = [
  { filename: "lateEntries.xlsx", path: "./output/lateEntries.xlsx" },
  { filename: "noChecklist.xlsx", path: "./output/noChecklist.xlsx" },
  { filename: "reminders.txt", path: "./output/reminders.txt" },
];

const validAttachments = attachmentFiles.filter((file) => {
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
