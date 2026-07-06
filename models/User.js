import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  institutionName: { type: String },
  experience: { type: Number },
  serviceDomain: { type: String },
  focusAreas: [{ type: String }],
  profileUrl: { type: String, default: null },
  isEmailVerified: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);

