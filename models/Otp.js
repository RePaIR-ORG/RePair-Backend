import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // MongoDB TTL index — document auto-deleted after 300 seconds (5 minutes)
    expires: 300,
  },
});

export default mongoose.model('Otp', OtpSchema);
