const fs = require('fs');
const path = require('path');

/**
 * Saves data (string, array, or object) to a file, creating the folder if it doesn't exist.
 * @param {string | any[] | object} data - The data to save.
 * @param {string} [folder='output'] - The folder to save the file in.
 * @param {string} [filename='output.txt'] - The name of the file.
 */
function saveToFile(data, folder = 'output', filename = 'output.txt') {
  if (
    typeof data !== 'string' &&
    !Array.isArray(data) &&
    typeof data !== 'object'
  ) {
    throw new Error('Only strings, arrays, or plain objects are allowed.');
  }

  // Convert array or object to string
  const output =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const folderPath = path.join(__dirname, folder);

  // Create the folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, filename);
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ Data saved to ${filePath}`);
}

module.exports = saveToFile;
