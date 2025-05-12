const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function downloadReport() {
  // Set up download path
  const downloadPath = path.resolve('./downloads');
  
  // Create downloads directory if it doesn't exist
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }
  
  // Launch browser with specific download settings
  const browser = await puppeteer.launch({
    headless: false, // Better to use false during testing to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1366, height: 768 }
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  // Configure the browser to download files to our specified path
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });
  
  try {
    // Navigate to the login page - update with actual URL
    console.log('Navigating to the reports page...');
    await page.goto('https://youractualurl.com/Reports/Index');
    
    // If you're not already logged in, handle the login
    // Uncomment and adjust if login is required
    /*
    console.log('Logging in...');
    await page.type('#loginUsername', 'your_username');
    await page.type('#loginPassword', 'your_password');
    await page.click('#loginLink');
    */
    
    // Wait for the page to load completely
    console.log('Waiting for page to load...');
    await page.waitForSelector('#reportName_chosen');
    
    // Click on the report dropdown to open it
    console.log('Selecting report type...');
    await page.click('#reportName_chosen');
    
    // Wait for dropdown options to become visible
    await page.waitForSelector('#reportName_chosen .chosen-results li');
    
    // Select the report type - you can modify this based on your requirements
    await page.click('#reportName_chosen .chosen-results li[data-option-array-index="0"]'); // For "Check Submissions"
    
    // Set date range - the inputs are controlled by a datepicker
    console.log('Setting date range...');
    await page.evaluate(() => {
      document.querySelector('#startDate').value = '2025-05-01'; 
      document.querySelector('#endDate').value = '2025-05-12';
    });
    
    // Select store if needed (optional)
    // console.log('Selecting stores...');
    // await page.click('#accessControl_chosen');
    // await page.waitForSelector('#accessControl_chosen .chosen-results li');
    // await page.click('#accessControl_chosen .chosen-results li[data-option-array-index="5"]'); // For "DISH - ALL"
    
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
    
    // Return the full data
    return jsonData;
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Function to wait for a file to be downloaded
async function waitForDownload(downloadPath, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkDownload = () => {
      // Get all files in the download directory
      const files = fs.readdirSync(downloadPath);
      
      // Look for Excel files that are completely downloaded
      const excelFiles = files.filter(file => 
        (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')) && 
        !file.endsWith('.crdownload') && 
        !file.endsWith('.part')
      );
      
      if (excelFiles.length > 0) {
        // Return the first Excel file found
        return resolve(excelFiles[0]);
      }
      
      // Check if timeout has been reached
      if (Date.now() - startTime > timeout) {
        return reject(new Error('Download timeout exceeded'));
      }
      
      // Check again after a short delay
      setTimeout(checkDownload, 500);
    };
    
    checkDownload();
  });
}

// Run the script
downloadReport()
  .then(data => {
    console.log(`Successfully processed ${data.length} rows of data`);
  })
  .catch(error => {
    console.error('Script failed:', error);
  }); 