# JENNINA Application Guide

## What This Application Does
This application automatically downloads and processes reports from the Fusion Prep system. It identifies:
- Late entries (checks completed more than 20 minutes after scheduled time)
- Missing checklist items for each store

## Setup Guide for Non-Technical Users

### Step 1: Install Required Software
1. Download and install Node.js from [https://nodejs.org/](https://nodejs.org/) (choose the "LTS" version)
2. After installation, restart your computer

### Step 2: Configure Your Credentials
1. Find the file named `.env_SAMP` in the application folder
2. Make a copy of this file and rename it to `.env` (just remove the "_SAMP" part)
3. Open the `.env` file using Notepad or any text editor
4. Add your Fusion Prep account information:
   ```
   JENNINA_USERNAME=your_username
   JENNINA_PASSWORD=your_password
   ```
5. Save and close the file

### Step 3: Install Dependencies
1. Open Command Prompt (search for "cmd" in the Start menu)
2. Navigate to the application folder by typing:
   ```
   cd path\to\application\folder
   ```
   (Replace "path\to\application\folder" with the actual location of the folder)
3. Type the following command and press Enter:
   ```
   npm install
   ```
4. Wait for the installation to complete

### Step 4: Run the Application
1. In the same Command Prompt window, type:
   ```
   npm run dev
   ```
2. The application will start running
3. Wait for it to complete - you'll see messages in the Command Prompt window

## Understanding the Output
All results will be saved in the `output` folder:
- Excel files with detailed reports
- Text files with summaries of late entries and missing checks
- Formatted messages that can be sent to team members

## Troubleshooting
- If you see "Error: Cannot find module", make sure you completed Step 3
- If login fails, check your username and password in the `.env` file
- If nothing happens after running the application, check your internet connection

## Notes
- The application is set to use UTC-5 timezone
- Reports are downloaded to the `downloads` folder and processed automatically
- You can run the application daily to get updated reports

For additional help, please contact your system administrator.

## GitHub Actions Automation

This project includes a GitHub Actions workflow that automatically runs the application every day at 9:00 PM Philippine time.

### Setting Up GitHub Secrets

For the GitHub Action to work, you need to add your credentials as repository secrets:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the following secrets:
   - `JENNINA_USERNAME`: Your Fusion Prep username
   - `JENNINA_PASSWORD`: Your Fusion Prep password
   - `BREVO_USN`: Your Brevo SMTP username
   - `BREVO_PASS`: Your Brevo SMTP password
   - `TO_EMAIL`: Email address to send reports to

### Manual Execution

You can also manually trigger the workflow:
1. Go to the "Actions" tab in your GitHub repository
2. Select the "Run Scripts Daily" workflow
3. Click "Run workflow"

The workflow will execute both the main script (index.js) and the email sending script (sendMail.js) in sequence.
