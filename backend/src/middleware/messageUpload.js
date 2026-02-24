import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimePrefixes = ['image/', 'video/'];
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const fileFilter = (req, file, cb) => {
  const isAllowedPrefix = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));
  const isAllowedExact = allowedMimeTypes.includes(file.mimetype);

  if (!isAllowedPrefix && !isAllowedExact) {
    cb(new Error('Unsupported attachment type'));
    return;
  }

  cb(null, true);
};

const messageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 12 * 1024 * 1024 }
});

export default messageUpload;
