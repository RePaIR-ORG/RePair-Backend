import Task from '../models/Task.js';
import Student from '../models/Student.js';

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Verifies the student exists and belongs to the authenticated specialist.
 * Returns the student doc or throws a formatted error.
 */
const resolveStudent = async (studentId, specialistId) => {
  // Guard: reject clearly-invalid IDs before hitting Mongoose
  if (!studentId || !/^[a-f\d]{24}$/i.test(studentId)) {
    const err = new Error('Invalid student ID format.');
    err.status = 400;
    throw err;
  }

  let student;
  try {
    student = await Student.findOne({
      _id: studentId,
      specialist: specialistId,
    }).lean();
  } catch (castErr) {
    const err = new Error('Invalid student ID.');
    err.status = 400;
    throw err;
  }

  if (!student) {
    const err = new Error('Student not found or access denied.');
    err.status = 404;
    throw err;
  }
  return student;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/students/:studentId/tasks
// @desc    List all tasks for a student (only accessible by owning specialist)
// @query   status  (optional) – filter by 'Pending' | 'In Progress' | 'Completed'
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getTasks = async (req, res) => {
  try {
    await resolveStudent(req.params.studentId, req.user.id);

    const filter = { student: req.params.studentId };
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({ tasks });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    console.error('getTasks error:', err);
    res.status(500).json({ message: 'Server error while fetching tasks.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/students/:studentId/tasks
// @desc    Assign a new task to a student (status always starts as 'Pending')
// @body    multipart/form-data: { title, description?, image? (file) }
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    await resolveStudent(req.params.studentId, req.user.id);

    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'title is required.' });
    }

    // req.file is populated by uploadTaskImage multer middleware if an image was attached
    const imageUrl = req.file ? req.file.path : '';

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      imageUrl,
      // status intentionally omitted — defaults to 'Pending' via schema
      student: req.params.studentId,
      specialist: req.user.id,
    });

    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Server error while creating task.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/students/:studentId/tasks/:taskId
// @desc    Update a task (title, description, image) — status is student-only
// @body    multipart/form-data: { title?, description?, image? (file) }
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    await resolveStudent(req.params.studentId, req.user.id);

    const { title, description } = req.body;

    const updates = {};
    if (title !== undefined)       updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    // status is explicitly excluded — only the student app can change task status

    // If a new image file was uploaded, replace the URL
    if (req.file) updates.imageUrl = req.file.path;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update.' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, student: req.params.studentId },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.status(200).json({ message: 'Task updated.', task });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Server error while updating task.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/students/:studentId/tasks/:taskId
// @desc    Delete a task
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    await resolveStudent(req.params.studentId, req.user.id);

    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      student: req.params.studentId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
    console.error('deleteTask error:', err);
    res.status(500).json({ message: 'Server error while deleting task.' });
  }
};
