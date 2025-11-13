const path = require('path');
const fileValidate = (file, allowedFormats, maxSizeMB) => {
    if (!file) {
        return { valid: false, message: "No file selected." };
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedFormats.includes(fileExtension)) {
        return { valid: false, message: `Invalid file format. Allowed formats: ${allowedFormats.join(", ")}` };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return { valid: false, message: `File size exceeds the limit of ${maxSizeMB}MB.` };
    }

    return { valid: true, message: "File is valid." };

}

module.exports = fileValidate;
