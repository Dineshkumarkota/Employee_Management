const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

function generateUniqueName(originalName) {
    const randomString = crypto.randomBytes(8).toString('hex'); // Generates a random 16-character string
    const ext = path.extname(originalName); // Get the file extension (e.g. .jpg, .png)
    return `${randomString}${ext}`;
}

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // Create directory if it doesn't exist
    }
};

storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dirPath = '/tmp/';
        ensureDirectoryExists(dirPath);  // Ensure the directory exists
        cb(null, dirPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = generateUniqueName(file.originalname);
        cb(null, uniqueName);
    }
});

const fileUpload = multer({ storage: storage });

module.exports = fileUpload;