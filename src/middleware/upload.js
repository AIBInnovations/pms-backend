import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { AppError } from '../utils/index.js';
import { uploadToDrive } from '../utils/gdrive.js';

// ─── Cloudinary (images only) ────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pms-attachments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    resource_type: 'image',
  },
});

// ─── Multer with memory storage (for Drive uploads) ──
const memoryStorage = multer.memoryStorage();

// File filter — accept all common types
const ALLOWED_MIMES = [
  ...IMAGE_MIMES,
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  'application/zip', 'application/x-rar-compressed', 'application/gzip',
  'application/vnd.android.package-archive', // APK
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/octet-stream', // generic binary (exe, etc)
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

// Image upload → Cloudinary
export const uploadImage = multer({
  storage: cloudinaryStorage,
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Only images allowed', 400, 'INVALID_FILE_TYPE'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Any file upload → memory buffer (then routed to Cloudinary or Drive)
export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/**
 * After multer processes the file into memory, this middleware
 * routes it to Cloudinary (images) or Google Drive (everything else)
 * and sets file.cloudUrl with the final URL.
 */
export async function routeUpload(req, res, next) {
  if (!req.file) return next();

  try {
    const isImage = IMAGE_MIMES.includes(req.file.mimetype);

    if (isImage) {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'pms-attachments', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      req.file.cloudUrl = result.secure_url;
      req.file.storageType = 'cloudinary';
    } else {
      // Upload to Google Drive
      const { url, driveFileId } = await uploadToDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      req.file.cloudUrl = url;
      req.file.driveFileId = driveFileId;
      req.file.storageType = 'drive';
    }

    next();
  } catch (err) {
    console.error('[Upload] Failed:', err.message);
    next(new AppError('File upload failed', 500, 'UPLOAD_ERROR'));
  }
}

export { cloudinary };
