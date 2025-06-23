const fs = require('fs');
const path = require('path');

/**
 * @param {string} filePath
 * @param {string} content
 * @return {void}
 */
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * @param {string} filePath
 * @param {boolean} [acceptNonExist=false]
 * @return {Promise<string | null>}
 */
function readFile(filePath, acceptNonExist = false) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, content) => {
      if (err) {
        if (acceptNonExist && err.code === 'ENOENT') {
          resolve(null);
        } else {
          reject(err);
        }
      } else {
        resolve(content);
      }
    });
  });
}

module.exports = {
  writeFile,
  readFile,
};
