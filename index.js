const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const saveToFile = require("./saveToFile.js");
require('dotenv').config()
const url = "https://account.fusionprep.com/Reports/Index";
const username = process.env.JENNINA_USERNAME;
const password = process.env.JENNINA_PASSWORD;

const getTodayDate = () => {
    const now = new Date();

    // Get UTC time in milliseconds
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  
    // Subtract 5 hours in milliseconds for UTC-5
    const utcMinus5 = new Date(utcTime - 5 * 60 * 60000);
  
    // Get yesterday in UTC-5
    utcMinus5.setDate(utcMinus5.getDate() - 1);
  
    // Format as YYYY-MM-DD
    const year = utcMinus5.getFullYear();
    const month = String(utcMinus5.getMonth() + 1).padStart(2, '0');
    const day = String(utcMinus5.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
};

const login = async (page) => {
  await page.type("#UserName", username);
  await page.type("#Password", password);
  await page.click('input[type="submit"]');
};

// Function to wait for a file to be downloaded
async function waitForDownload(downloadPath, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkDownload = () => {
      const files = fs.readdirSync(downloadPath);
      const excelFiles = files.filter(file => 
        (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')) && 
        !file.endsWith('.crdownload') && 
        !file.endsWith('.part')
      );
      
      if (excelFiles.length > 0) {
        return resolve(excelFiles[0]);
      }
      
      if (Date.now() - startTime > timeout) {
        return reject(new Error('Download timeout exceeded'));
      }
      
      setTimeout(checkDownload, 500);
    };
    
    checkDownload();
  });
}

function formatReportData(jsonData) {
    // Skip the first entry (header)
    const dataWithoutHeader = jsonData.slice(1);
    
    return dataWithoutHeader.map(item => {
      // Extract date and time from the timestamp
      const dateTimeString = item['__EMPTY_5'] || '';
      const [datePart, timePart,ampm] = dateTimeString.split(' ');
      
      // Combine first and last name for team member
      const teamMember = `${item['__EMPTY_3'] || ''} ${item['__EMPTY_4'] || ''}`.trim();
      
      return {
        "Check": item['Checks - 5/11/2025 to 5/11/2025']?.toString() || '',
        "Name": item['__EMPTY'] || '',
        "Store": item['__EMPTY_2'] || '',
        "TeamMember": teamMember,
        "Date": datePart || '',
        "Time": `${timePart} ${ampm}` || ''
      };
    });
}

// Function to identify late entries (more than 20 minutes)
function identifyLateEntries(reportData) {
  const storeData = require('./data.js');
  const lateEntries = [];
  const noChecklist = {};
  
  // Initialize noChecklist for each store
  storeData.forEach(store => {
    noChecklist[store.store] = [];
  });
  
  // Create a map to track which checklist items have been found for each store
  const foundChecklistItems = {};
  storeData.forEach(store => {
    foundChecklistItems[store.store] = new Set();
  });
  
  reportData.forEach(entry => {
    // Find the corresponding store in storeData - make case-insensitive
    const store = storeData.find(store => 
      store.store.toLowerCase() === entry.Store.toLowerCase()
    );
    if (!store) return;
    
    // Determine if the entry is AM or PM
    const entryPeriod = entry.Time.split(' ')[1].toUpperCase();
    
    // Find matching checklist items with the same AM/PM period
    // Make activity name matching more flexible with includes() rather than exact match
    const matchingChecklistItems = store.checklist.filter(item => {
      const itemPeriod = item.time.toLowerCase().includes('am') ? 'AM' : 'PM';
      return itemPeriod === entryPeriod && 
        (entry.Name.trim().toLowerCase() === item.activity.toLowerCase() ||
         entry.Name.trim().toLowerCase().includes(item.activity.toLowerCase()) ||
         item.activity.toLowerCase().includes(entry.Name.trim().toLowerCase()));
    });
    
    if (matchingChecklistItems.length > 0) {
      // Use the matching checklist item
      const checklistItem = matchingChecklistItems[0];
      
      // Mark this checklist item as found for this store
      foundChecklistItems[entry.Store].add(checklistItem.activity);
      
      // Parse scheduled time
      const scheduledTime = checklistItem.time.toLowerCase();
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':');
      let scheduledHourNumber = parseInt(scheduledHour);
      const scheduledMinuteNumber = parseInt(scheduledMinute);
      
      // Adjust for AM/PM
      if (scheduledTime.includes('pm') && scheduledHourNumber < 12) {
        scheduledHourNumber += 12;
      }
      if (scheduledTime.includes('am') && scheduledHourNumber === 12) {
        scheduledHourNumber = 0;
      }
      
      // Parse actual time
      const [actualTime, period] = entry.Time.split(' ');
      const [actualHour, actualMinute] = actualTime.split(':');
      let actualHourNumber = parseInt(actualHour);
      const actualMinuteNumber = parseInt(actualMinute);
      
      // Adjust for AM/PM
      if (period.toUpperCase() === 'PM' && actualHourNumber < 12) {
        actualHourNumber += 12;
      }
      if (period.toUpperCase() === 'AM' && actualHourNumber === 12) {
        actualHourNumber = 0;
      }
      
      // Calculate time difference in minutes
      const scheduledTimeInMinutes = scheduledHourNumber * 60 + scheduledMinuteNumber;
      const actualTimeInMinutes = actualHourNumber * 60 + actualMinuteNumber;
      const diffInMinutes = actualTimeInMinutes - scheduledTimeInMinutes;
      
      // Debug time calculations
      console.log(`\nTime calculation for ${entry.Store} - ${entry.Name}:`);
      console.log(`  Scheduled: ${checklistItem.time} (${scheduledHourNumber}:${scheduledMinuteNumber}) = ${scheduledTimeInMinutes} minutes`);
      console.log(`  Actual: ${entry.Time} (${actualHourNumber}:${actualMinuteNumber}) = ${actualTimeInMinutes} minutes`);
      console.log(`  Difference: ${diffInMinutes} minutes`);
      
      // If more than 20 minutes late, add to late entries
      if (diffInMinutes > 20) {
        console.log(`  LATE ENTRY DETECTED: ${diffInMinutes} minutes late`);
        lateEntries.push({
          ...entry,
          scheduledTime: checklistItem.time,
          lateByMinutes: diffInMinutes
        });
      }
    }
  });
  
  // Check which checklist items were not found for each store
  storeData.forEach(store => {
    store.checklist.forEach(item => {
      if (!foundChecklistItems[store.store].has(item.activity)) {
        noChecklist[store.store].push(item.activity);
      }
    });
  });
  
  return {
    lateEntries,
    noChecklist
  };
}

// Function to format reminder messages by store
function formatReminders(lateEntries, noChecklist) {
  let output = '';
  const storeData = require('./data.js');
  
  // Process each store
  storeData.forEach(store => {
    const storeName = store.store;
    
    // Get late entries for this store
    const storeLateCases = lateEntries.filter(entry => 
      entry.Store.toLowerCase() === storeName.toLowerCase()
    );
    
    // Get missing checklist items for this store
    const storeMissingItems = noChecklist[storeName] || [];
    
    // Skip if no issues for this store
    if (storeLateCases.length === 0 && storeMissingItems.length === 0) {
      return;
    }
    
    // Add store header
    output += `For ${storeName}\n\n`;
    
    // Add late entries if any
    if (storeLateCases.length > 0) {
      const lateActivities = storeLateCases.map(entry => entry.Name).join(', ');
      output += `Reminder that the ${lateActivities} wasn't done on time. \n\n`;
    }
    
    // Add missing checklist items if any
    if (storeMissingItems.length > 0) {
      if (storeLateCases.length > 0) {
        output += 'Also, ';
      } else {
        output += 'Reminder that ';
      }
      const missingItems = storeMissingItems.join(', ');
      output += `${missingItems} weren't completed. Let's make sure we're all getting those checklists done accurately and on schedule\n`;
    } else if (storeLateCases.length > 0) {
      output += `Let's make sure we're all getting those checklists done accurately and on schedule\n`;
    }
    
    output += '\n\n-----------------------------\n\n';
  });
  
  return output;
}

async function downloadAndProcessReport() {
  // Set up download path
  const downloadPath = path.resolve('./downloads');
  
  // Create downloads directory if it doesn't exist
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  // Create a new page
  const page = await browser.newPage();
  
  // Configure download behavior
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });
  
  try {
    // Navigate to the login page
    console.log('Navigating to the reports page...');
    await page.goto(url, { waitUntil: "networkidle2" });
    
    // Login
    await login(page);
    
    // Wait for the report page to load
    console.log('Waiting for report page to load...');
    await page.waitForSelector('#reportName_chosen');
    
    // Click on the report dropdown to open it
    console.log('Selecting report type...');
    await page.click('#reportName_chosen');
    
    // Wait for dropdown options to become visible
    await page.waitForSelector('#reportName_chosen .chosen-results li');
    
    // Select the report type
    await page.click('#reportName_chosen .chosen-results li[data-option-array-index="0"]');
    
    // Set date range using today's date
    console.log('Setting date range...');
    const today = getTodayDate();
    await page.evaluate((today) => {
      document.querySelector('#startDate').value = today;
      document.querySelector('#endDate').value = today;
    }, today);
    
    // Click download button
    console.log('Initiating download...');
    await page.click('#btnExport');
    
    // Wait for download to complete
    console.log('Waiting for download to complete...');
    const fileName = await waitForDownload(downloadPath);
    console.log(`File downloaded: ${fileName}`);
    
    // Read the Excel file
    const filePath = path.join(downloadPath, fileName);
    const workbook = xlsx.readFile(filePath);
    
    // Get the first worksheet
    const sheetNames = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheetNames[0]];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    // Log the first few rows
    console.log('Excel data sample:');
    console.log(jsonData.slice(0, 5));
    console.log("getTodayDate()",getTodayDate())
    
    // Format the report data - remove date filtering to ensure we don't miss data
    console.log('Raw data length before formatting:', jsonData.length);
    const formattedData = formatReportData(jsonData).filter(entry => new Date(entry.Date).getDate() === new Date(getTodayDate()).getDate());
    console.log('Formatted data length:', formattedData.length);
    
    console.log('Formatted data sample:');
    console.log(formattedData.slice(0, 5));
    
    // Debug: Print all store names and activities to help troubleshoot matching
    console.log('\nDEBUG: All entries to be processed:');
    formattedData.forEach(entry => {
      console.log(`Store: "${entry.Store}", Activity: "${entry.Name}", Time: "${entry.Time}"`);
    });
    
    // Debug: Print checklist data
    console.log('\nDEBUG: Checklist configuration:');
    const storeData = require('./data.js');
    storeData.forEach(store => {
      console.log(`Store: "${store.store}"`);
      store.checklist.forEach(item => {
        console.log(`  Activity: "${item.activity}", Time: "${item.time}"`);
      });
    });
    
    // Identify late entries
    const result = identifyLateEntries(formattedData);
    console.log(`Found ${result.lateEntries.length} entries that are more than 20 minutes late:`);
    saveToFile(result.lateEntries, 'output', 'lateEntries.txt');
    console.log(result.lateEntries);
    console.log('Missing checklist items by store:');
    console.log(result.noChecklist);
    saveToFile(result.noChecklist, 'output', 'noChecklist.txt');
    
    // Format and save reminders
    const reminders = formatReminders(result.lateEntries, result.noChecklist);
    saveToFile(reminders, 'output', 'reminders.txt');
    
    return {
      rawData: jsonData,
      formattedData,
      lateEntries: result.lateEntries,
      noChecklist: result.noChecklist
    };
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    await browser.close();
    console.log("Browser closed");
  }
}

// Run the script
downloadAndProcessReport()
  .then(result => {
    console.log(`Successfully processed ${result.formattedData.length} rows of data`);
    console.log(`Found ${result.lateEntries.length} late entries`);
    console.log('Missing checklist items by store:');
    console.log(result.noChecklist);
  })
  .catch(error => {
    console.error('Script failed:', error);
  });
