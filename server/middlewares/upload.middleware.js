const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
    'application/pdf',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('INVALID_FILE_TYPE'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
}).single('file');

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the 200MB limit.',
            status: 422,
          },
        });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(422).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Only JPG, PNG, PDF, and Video files are allowed.',
            status: 422,
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message,
          status: 400,
        },
      });
    }
    next();
  });
};

module.exports = uploadMiddleware;
