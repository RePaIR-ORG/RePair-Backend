import Student from '../models/Student.js';
import MoodHistory from '../models/MoodHistory.js';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/students
// @desc    Add a new student record for the authenticated specialist
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const addStudent = async (req, res) => {
  try {
    const { name, dob, gender, diagnosis, notes, assessmentStatus, parentName, email } = req.body;

    // Basic validation
    if (!name || !dob || !gender || !diagnosis) {
      return res.status(400).json({
        message: 'name, dob, gender, and diagnosis are required fields.',
      });
    }

    // Parse dd/mm/yyyy → JS Date
    const [day, month, year] = dob.split('/');
    const parsedDob = new Date(`${year}-${month}-${day}`);
    if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
      return res.status(400).json({ message: 'dob must be a valid past date in dd/mm/yyyy format.' });
    }

    // ── Auto-generate username ───────────────────────────────────────────────
    // Format: <student_firstname><parent_firstname>  e.g. "liam_sarah"
    const studentFirst = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const parentFirst  = (parentName || '').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'parent';
    const baseUsername = `${studentFirst}_${parentFirst}`;

    // Ensure uniqueness — append random 2-digit suffix if taken
    let username = baseUsername;
    let attempt  = 0;
    while (true) {
      const conflict = await Student.findOne({ username });
      if (!conflict) break;
      const suffix = String(Math.floor(10 + Math.random() * 90)); // 10–99
      username = `${baseUsername}${suffix}`;
      if (++attempt > 20) {
        // Extremely unlikely; generate a fully random fallback
        username = `${baseUsername}${Date.now().toString().slice(-4)}`;
        break;
      }
    }

    // ── Auto-generate default password ───────────────────────────────────────────────
    // Format: first 4 chars of student first name + birth year  e.g. "liam2019"
    const birthYear    = String(parsedDob.getFullYear());
    const namePart     = studentFirst.slice(0, 4).padEnd(4, '0'); // pad if name < 4 chars
    const rawPassword  = `${namePart}${birthYear}`;
    const salt         = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const student = await Student.create({
      name,
      parentName: parentName || '',
      email: email ? email.trim().toLowerCase() : '',
      dob: parsedDob,
      gender,
      diagnosis,
      notes: notes || '',
      assessmentStatus: assessmentStatus || 'pending',
      username,
      password: hashedPassword,
      specialist: req.user.id, // injected by `protect` middleware
    });

    res.status(201).json({
      message: 'Student added successfully.',
      student,
      // Return the plain-text default password ONCE so the specialist can share it
      defaultPassword: rawPassword,
      username,
    });
  } catch (error) {
    console.error('addStudent error:', error);
    res.status(500).json({ message: 'Server error while adding student.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/students
// @desc    Get all students for the authenticated specialist with pagination
// @query   page     (default: 1)
// @query   limit    (default: 10)
// @query   search   (optional, partial name match)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build filter: only this specialist's students
    const filter = { specialist: req.user.id };

    // Optional case-insensitive partial name search
    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    res.status(200).json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ message: 'Server error while fetching students.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/students/:id
// @desc    Get a single student by ID (must belong to the authenticated specialist)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      specialist: req.user.id, // ownership check — prevents cross-specialist access
    }).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json({ student });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }
    console.error('getStudentById error:', error);
    res.status(500).json({ message: 'Server error while fetching student.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/students/:id/assessment
// @desc    Save assessment result for a student (marks status as completed)
// @body    { assessmentType, assessmentScore, assessmentSeverity }
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const saveAssessmentResult = async (req, res) => {
  try {
    const { assessmentType, assessmentScore, assessmentSeverity } = req.body;

    if (!assessmentType || assessmentScore === undefined || !assessmentSeverity) {
      return res.status(400).json({
        message: 'assessmentType, assessmentScore, and assessmentSeverity are required.',
      });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, specialist: req.user.id }, // ownership check
      {
        assessmentStatus:   'completed',
        assessmentType,
        assessmentScore:    Number(assessmentScore),
        assessmentSeverity,
        assessmentTakenAt:  new Date(),
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json({ message: 'Assessment result saved.', student });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }
    console.error('saveAssessmentResult error:', error);
    res.status(500).json({ message: 'Server error while saving assessment result.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/students/:id/mood-history
// @desc    Return the last 7 days of mood history for a student.
//          Only accessible by the specialist who owns the student.
//          Response: { history: [{ date, mood | null, createdAt | null }] }
//          Array is ordered oldest → newest (7 slots, index 0 = 6 days ago).
// @access  Private (specialist JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentMoodHistory = async (req, res) => {
  try {
    // Ownership check — the student must belong to this specialist
    const student = await Student.findOne({
      _id: req.params.id,
      specialist: req.user.id,
    }).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Build the 7-day date range [today, yesterday, …, 6 days ago]
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }); // descending

    const earliest = dates[dates.length - 1];

    // Fetch all entries in the window
    const raw = await MoodHistory.find({
      student: req.params.id,
      date: { $gte: earliest },
    })
      .sort({ date: -1, createdAt: -1 })
      .select('mood date createdAt')
      .lean();

    // Group: latest entry per date
    const byDate = new Map();
    for (const entry of raw) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, entry);
    }

    // Build 7-slot array oldest → newest for chronological display
    const history = [...dates].reverse().map((date) => ({
      date,
      mood: byDate.get(date)?.mood ?? null,
      createdAt: byDate.get(date)?.createdAt ?? null,
    }));

    res.json({ history });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }
    console.error('getStudentMoodHistory error:', error);
    res.status(500).json({ message: 'Server error while fetching mood history.' });
  }
};
