import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/index.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const ALLOWED_MIMES = [
  ...IMAGE_MIMES,
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json',
  'application/zip', 'application/x-rar-compressed', 'application/gzip',
  'application/vnd.android.package-archive',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/octet-stream',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/**
 * Upload to Cloudinary — images as 'image', everything else as 'raw'.
 * Cloudinary supports any file type with resource_type: 'raw'.
 */
export async function routeUpload(req, res, next) {
  if (!req.file) return next();

  try {
    const isImage = IMAGE_MIMES.includes(req.file.mimetype);
    const resourceType = isImage ? 'image' : 'raw';
    const folder = isImage ? 'pms-attachments' : 'pms-files';

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType, public_id: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}` },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    req.file.cloudUrl = result.secure_url;
    next();
  } catch (err) {
    console.error('[Upload] Failed:', err.message);
    next(new AppError('File upload failed', 500, 'UPLOAD_ERROR'));
  }
}

export { cloudinary };
