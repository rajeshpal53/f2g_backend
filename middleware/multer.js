
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../models/user');

// Helper function to get user name
const getUserName = async (usersfk) => {
  const user = await User.findByPk(usersfk);
  return user ? user?.name?.replace(/\s+/g, '_') : 'unknownUser';
};

const getUserMobile = async (usersfk) => {
    const user = await User.findByPk(usersfk);
    return user ? user?.mobile : 'unknownMobile';
  };

// Memory storage to hold the image temporarily
const storage = multer.memoryStorage();

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|xlsx|xls/;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel', // For .xls files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // For .xlsx files
  ];
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname, 'with MIME type:', file.mimetype);
    cb(new Error('Only image or Excel files are allowed'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage, // Store file in memory temporarily
  limits: { fileSize: 10 * 1024 * 1024 }, // Increase the limit to allow larger files for resizing
  fileFilter: fileFilter
});

// Middleware to compress and save images
const compressAndSaveImage = async (req, res, next) => {
    try {
      const baseUploadPath = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../f2g-frontend/assets');
  
      // Handle single or multiple files
      const files = req.files ? Object.values(req.files).flat() : req.file ? [req.file] : [];
  
      if (files.length === 0) {
        return next();
      }

      req.savedFiles = {};
  
      for (const file of files) {  //req?.body?.name || 'name')?.replace(/\s+/g, '_')
        let specificPath;
  
        // Determine the upload path based on the file fieldname
        if (file.fieldname === 'aadharCardFronturl' || file.fieldname === 'aadharCardBackurl') {
          // const usersfk = req.body.usersfk;
          const userName = req?.body?.name?.replace(/\s+/g, '_') || 'name';
          const aadharCard = req.body.aadharCard || 'unknownAadhar';
          const userFolder = `${userName}-${aadharCard}`;
          specificPath = path.join(baseUploadPath, 'aadharcards', userFolder);
        } else if (file.fieldname === 'profilePicurl') {
          specificPath = path.join(baseUploadPath, 'profilepics');
        } else if(file.fieldname === 'screenShotUrl') {
          specificPath = path.join(baseUploadPath, 'screenshots');
        } else if(file.fieldname === 'signatureImage') {
          specificPath = path.join(baseUploadPath, 'signatures');
        } else {
          return next(new Error('Invalid file field'));
        }
  
        // Ensure the directory exists
        fs.mkdirSync(specificPath, { recursive: true });
  
        // Generate the filename
        const originalExt = path.extname(file.originalname).toLowerCase();
        let prefix = 'file';
        let uniqueIdentifier;
        switch (file.fieldname) {
          case 'aadharCardFronturl':
            prefix = 'aadharfront';
            uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
            break;
          case 'aadharCardBackurl':
            prefix = 'aadharback';
            uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
            break;
          case 'profilePicurl':
            prefix = 'profile';
            uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.mobile || 'mobile'}`;
            break;
          case 'screenShotUrl':
            uniqueIdentifier = `${(req?.body?.name ? req?.body?.name : 'name')?.replace(/\s+/g, '_')}-${Date.now()}`;
            break;
          case 'signatureImage':
            uniqueIdentifier = `${(req?.body?.shopname || 'shopname')?.replace(/\s+/g, '_')}-${req?.body?.whatsappnumber || 'whatsapp-number'}`;
            break;
          default:
            prefix = 'unknown-file';
        }
  
        const finalFilename = uniqueIdentifier + path.extname(file.originalname);
        const fullPath = path.join(specificPath, finalFilename);
  
        // // Compress and save the image
        // await sharp(file.buffer)
        //   .resize({ width: 1024 }) // Resize to a max width of 1024px (adjust as needed)
        //   .toFormat(originalExt === '.gif' ? 'gif' : originalExt.slice(1), { quality: 80 }) // Convert to JPEG with 80% quality
        //   .toFile(fullPath);

         // Compress and save the image (if applicable)
        if (/jpeg|jpg|png|gif/.test(originalExt)) {
          await sharp(file.buffer)
            .resize({ width: 1024 }) // Resize to a max width of 1024px
            .toFormat(originalExt === '.gif' ? 'gif' : originalExt.slice(1), { quality: 80 })
            .toFile(fullPath);
        } else if (/xlsx|xls/.test(originalExt)) {
          // Save Excel file directly
          fs.writeFileSync(fullPath, file.buffer);
        }

        req.savedFiles[file.fieldname] = fullPath?.replace(baseUploadPath, 'assets').split(path.sep).join('/');;
      }
  
      next();
    } catch (error) {
      next(error);
    }
  };
module.exports = { upload, compressAndSaveImage };