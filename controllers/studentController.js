import Student from '../models/Student.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/students
// @desc    Add a new student record for the authenticated specialist
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const addStudent = async (req, res) => {
  try {
    const { name, dob, gender, diagnosis, notes, assessmentStatus } = req.body;

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

    const student = await Student.create({
      name,
      dob: parsedDob,
      gender,
      diagnosis,
      notes: notes || '',
      assessmentStatus: assessmentStatus || 'pending',
      specialist: req.user.id, // injected by `protect` middleware
    });

    res.status(201).json({
      message: 'Student added successfully.',
      student,
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

