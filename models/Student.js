import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    // ── Personal Info ──────────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true }, // stored as ISO date, displayed as dd/mm/yyyy
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },

    // ── Clinical Info ──────────────────────────────────────────────────
    diagnosis: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },

    // ── Assessment ─────────────────────────────────────────────────────
    // 'pending'   – specialist chose "Skip Assessment" (to be done later)
    // 'completed' – assessment was taken and results stored
    assessmentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },

    // Assessment result details (populated when assessmentStatus = 'completed')
    assessmentType:     { type: String, default: '' },       // e.g. 'ISAA'
    assessmentScore:    { type: Number, default: null },      // total numeric score
    assessmentSeverity: { type: String, default: '' },        // e.g. 'Mild Autism'
    assessmentTakenAt:  { type: Date,   default: null },      // timestamp of completion

    // ── Progress / Tracking (mirrors the old hard-coded shape) ─────────
    mood: { type: String, default: '' },
    taskCompletion: { type: String, default: '0%' }, // stored as "72%"

    // ── Ownership ──────────────────────────────────────────────────────
    // The specialist (User) who created this student record
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Student', StudentSchema);
