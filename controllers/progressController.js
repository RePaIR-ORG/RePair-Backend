import Task from '../models/Task.js';
import Student from '../models/Student.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/specialist/progress-overview
// @desc    Returns an aggregated progress + mood-history snapshot for all
//          students owned by the authenticated specialist.
//
//          Response shape:
//          {
//            totalStudents: number,
//            totalTasks: number,
//            completedTasks: number,
//            pendingTasks: number,
//            inProgressTasks: number,
//            completionRate: number,           // 0-100 (rounded %)
//            moodDistribution: {               // counts per mood label
//              [mood: string]: number
//            },
//            recentMoods: [                    // last 30 mood-tagged tasks, newest first
//              { studentName, mood, date }
//            ],
//            studentProgress: [                // per-student summary
//              {
//                _id, name, diagnosis,
//                total, completed, pending, inProgress,
//                completionRate,               // 0-100
//                latestMood
//              }
//            ]
//          }
//
// @access  Private (specialist JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getProgressOverview = async (req, res) => {
  try {
    const specialistId = req.user.id;

    // ── 1. All students owned by this specialist ───────────────────────────
    const students = await Student.find({ specialist: specialistId })
      .select('_id name diagnosis mood')
      .lean();

    if (students.length === 0) {
      return res.json({
        totalStudents: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completionRate: 0,
        moodDistribution: {},
        recentMoods: [],
        studentProgress: [],
      });
    }

    const studentIds = students.map((s) => s._id);

    // ── 2. All tasks for those students ───────────────────────────────────
    const tasks = await Task.find({ student: { $in: studentIds } })
      .select('student status mood createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // ── 3. Global counters ────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // ── 4. Mood distribution ──────────────────────────────────────────────
    // Count tasks that have a non-empty mood tag
    const moodDistribution = {};
    tasks.forEach((t) => {
      if (t.mood && t.mood.trim()) {
        const key = t.mood.trim().toLowerCase();
        moodDistribution[key] = (moodDistribution[key] || 0) + 1;
      }
    });

    // ── 5. Recent moods (last 30 mood-tagged tasks) ───────────────────────
    // Build a quick lookup: studentId → name
    const studentNameMap = {};
    students.forEach((s) => { studentNameMap[String(s._id)] = s.name; });

    const recentMoods = tasks
      .filter((t) => t.mood && t.mood.trim())
      .slice(0, 30)
      .map((t) => ({
        studentName: studentNameMap[String(t.student)] ?? 'Unknown',
        mood: t.mood.trim().toLowerCase(),
        date: t.createdAt,
      }));

    // ── 6. Per-student progress breakdown ─────────────────────────────────
    // Group tasks by student
    const tasksByStudent = {};
    tasks.forEach((t) => {
      const sid = String(t.student);
      if (!tasksByStudent[sid]) tasksByStudent[sid] = [];
      tasksByStudent[sid].push(t);
    });

    const studentProgress = students.map((s) => {
      const sid = String(s._id);
      const sTasks = tasksByStudent[sid] || [];
      const sTotal = sTasks.length;
      const sCompleted = sTasks.filter((t) => t.status === 'Completed').length;
      const sPending = sTasks.filter((t) => t.status === 'Pending').length;
      const sInProgress = sTasks.filter((t) => t.status === 'In Progress').length;
      const sRate = sTotal > 0 ? Math.round((sCompleted / sTotal) * 100) : 0;

      // Latest mood: first non-empty mood-tagged task (already sorted desc)
      const latestMood =
        sTasks.find((t) => t.mood && t.mood.trim())?.mood?.trim().toLowerCase() ||
        s.mood?.trim().toLowerCase() ||
        '';

      return {
        _id: s._id,
        name: s.name,
        diagnosis: s.diagnosis,
        total: sTotal,
        completed: sCompleted,
        pending: sPending,
        inProgress: sInProgress,
        completionRate: sRate,
        latestMood,
      };
    });

    res.json({
      totalStudents: students.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
      moodDistribution,
      recentMoods,
      studentProgress,
    });
  } catch (error) {
    console.error('getProgressOverview error:', error);
    res.status(500).json({ message: 'Server error while fetching progress overview.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/specialist/students/:studentId/progress
// @desc    Returns detailed progress + full mood history for a single student.
//
//          Response shape:
//          {
//            totalTasks: number,
//            completedTasks: number,
//            pendingTasks: number,
//            inProgressTasks: number,
//            completionRate: number,         // 0-100
//            moodDistribution: {             // counts per mood label
//              [mood: string]: number
//            },
//            moodTimeline: [                 // all mood-tagged tasks, newest first
//              { mood, taskTitle, date }
//            ],
//            latestMood: string,
//          }
//
// @access  Private (specialist JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentProgress = async (req, res) => {
  try {
    const specialistId = req.user.id;
    const { studentId } = req.params;

    // Guard: valid 24-char hex id
    if (!studentId || !/^[a-f\d]{24}$/i.test(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }

    // Verify ownership
    const student = await Student.findOne({
      _id: studentId,
      specialist: specialistId,
    }).select('_id name mood').lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found or access denied.' });
    }

    // All tasks for this student, newest first
    const tasks = await Task.find({ student: studentId })
      .select('title status mood createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks   = tasks.filter((t) => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const completionRate  = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Mood distribution
    const moodDistribution = {};
    tasks.forEach((t) => {
      if (t.mood && t.mood.trim()) {
        const key = t.mood.trim().toLowerCase();
        moodDistribution[key] = (moodDistribution[key] || 0) + 1;
      }
    });

    // Full mood timeline (all mood-tagged tasks)
    const moodTimeline = tasks
      .filter((t) => t.mood && t.mood.trim())
      .map((t) => ({
        mood: t.mood.trim().toLowerCase(),
        taskTitle: t.title,
        date: t.createdAt,
      }));

    // Latest mood: from tasks first, then from student record
    const latestMood =
      moodTimeline[0]?.mood ||
      student.mood?.trim().toLowerCase() ||
      '';

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
      moodDistribution,
      moodTimeline,
      latestMood,
    });
  } catch (error) {
    console.error('getStudentProgress error:', error);
    res.status(500).json({ message: 'Server error while fetching student progress.' });
  }
};
