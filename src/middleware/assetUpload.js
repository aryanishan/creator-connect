import multer from 'multer';
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (!isImage && !isVideo) {
    cb(new Error('Only image and video files are allowed'));
    return;
  }

  cb(null, true);
};

const assetUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export default assetUpload;
