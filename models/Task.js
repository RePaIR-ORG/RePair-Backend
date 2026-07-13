import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    // ── Core Content ───────────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    // ── Optional Image ─────────────────────────────────────────────────
    // Cloudinary URL of an image attached to this task (e.g. reference picture)
    imageUrl: { type: String, default: '' },

    // ── Status ─────────────────────────────────────────────────────────
    // 'Pending'     – created but not yet started
    // 'In Progress' – student/specialist has begun work
    // 'Completed'   – fully done
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },

    // ── Student Mood ───────────────────────────────────────────────────
    mood: {
      type: String,
      default: '',
    },


    // ── Relations ──────────────────────────────────────────────────────
    // The student this task belongs to
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    // The specialist who created/assigned the task (for quick access & auth)
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Task', TaskSchema);
