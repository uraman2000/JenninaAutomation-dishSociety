const fs = require('fs');
const path = require('path');

// Function to format the report data into the desired structure
function formatReportData(jsonData) {
  // Skip the first entry (header)
  const dataWithoutHeader = jsonData.slice(1);
  
  return dataWithoutHeader.map(item => {
    // Extract date and time from the timestamp
    const dateTimeString = item['__EMPTY_5'] || '';
    const [datePart, timePart] = dateTimeString.split(' ');
    
    // Combine first and last name for team member
    const teamMember = `${item['__EMPTY_3'] || ''} ${item['__EMPTY_4'] || ''}`.trim();
    
    return {
      "Check": item['Checks - 5/11/2025 to 5/11/2025']?.toString() || '',
      "Name": item['__EMPTY'] || '',
      "Store": item['__EMPTY_2'] || '',
      "TeamMember": teamMember,
      "Date": datePart || '',
      "Time": timePart || ''
    };
  });
}

// Read the existing JSON data
const downloadPath = path.resolve('./downloads');
const inputFile = path.join(downloadPath, 'extractedData.json');

try {
  // Read and parse the JSON file
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Format the data
  const formattedData = formatReportData(jsonData);
  
  // Save the formatted data to a new JSON file
  fs.writeFileSync(
    path.join(downloadPath, 'formattedData.json'), 
    JSON.stringify(formattedData, null, 2)
  );
  
  // Display a sample of the formatted data
  console.log('Formatted data sample:');
  console.log(JSON.stringify(formattedData.slice(0, 3), null, 2));
  
  console.log(`Successfully processed ${formattedData.length} rows of data`);
} catch (error) {
  console.error('Error processing data:', error);
} 