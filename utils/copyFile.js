const fs = require('fs');
const path = require('path');

const copyFile = (sourceFile, destinationPath) => {
    
    return new Promise((resolve, reject) => {
        const newFold = path.join(__dirname, '..', 'uploads', destinationPath);
        const newPath = path.join(__dirname, '..', 'uploads', destinationPath, sourceFile.filename);
        const newFilPath = path.resolve(newPath);
        const oldFilPath = path.resolve(sourceFile.path);
        if (!fs.existsSync(newFold)) {
            fs.mkdirSync(newFold, { recursive: true });
            fs.chmodSync(newFold, 0o777);
        }        
        fs.access(oldFilPath, fs.constants.F_OK, (err) => {
            if (err) {
                return reject({ status: false, message : 'Source file not found' });
            }
            
            fs.readFile(oldFilPath, (err, data) => {
                if (err) {
                    return reject({ status: false, message : 'Error reading the source file' });
                }
                fs.writeFile(newFilPath, data, (err) => {
                    if (err) {
                        return reject({ status: false, message : 'Error writing to the destination file' });
                    }
                    resolve({ status: true, message : 'File copied successfully' });
                });
            });
        });
    });
    
};

const deleteFile = (sourcePath) => {
  return new Promise((resolve, reject) => {
    try {
        if (!fs.existsSync(sourcePath)) {
          return resolve({ status: true, message : 'File Not found,Skipped' });
        }
        fs.unlink(sourcePath, (err) => {
          if (err) {
            return reject({ status: false, message : 'Error deleting the file' });
          }
          resolve({ status: true, message : 'File deleted successfully' });
        });
    } catch (err) {
      console.log(err);
      return reject({ status: false, message : 'Error deleting the file' });
    }
  });
};

module.exports = { copyFile, deleteFile}  
