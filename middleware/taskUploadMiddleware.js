import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary is already configured by uploadMiddleware.js, but we configure
// it again here so this module can be used independently without import order issues.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const taskStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'repair/tasks',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    // Preserve aspect ratio — no face-crop needed for task reference images
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Field name expected in multipart form: "image"
// File size limit: 5 MB
export const uploadTaskImage = multer({
  storage: taskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');
