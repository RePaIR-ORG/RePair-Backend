import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { uploadProfilePhoto } from '../controllers/uploadController.js';
import { sendOtp, verifyOtp } from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route GET /api/health
// @desc Check for status of server
// @access Public
router.get('/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user's full profile
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/auth/upload-photo
// @desc    Upload or replace the specialist's profile photo
// @access  Private
router.post('/upload-photo', protect, upload.single('photo'), uploadProfilePhoto);

// @route   POST /api/auth/send-otp
// @desc    Generate and email a 6-digit OTP to the given address
// @access  Public
router.post('/send-otp', sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Validate the submitted OTP against the DB record
// @access  Public
router.post('/verify-otp', verifyOtp);

export default router;
