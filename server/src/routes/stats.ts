import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

// Admin dashboard stats
router.get('/dashboard', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student') as { count: number };
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
    const totalExams = db.prepare('SELECT COUNT(*) as count FROM exams').get() as { count: number };
    const totalAttempts = db.prepare('SELECT COUNT(*) as count FROM exam_attempts').get() as { count: number };
    const totalPassed = db.prepare('SELECT COUNT(*) as count FROM exam_attempts WHERE passed = 1').get() as { count: number };

    const passRate = totalAttempts.count > 0 ? Math.round((totalPassed.count / totalAttempts.count) * 100) : 0;

    // Score distribution
    const scoreDistribution = db.prepare(`
      SELECT
        CASE
          WHEN score >= 90 THEN '90-100'
          WHEN score >= 80 THEN '80-89'
          WHEN score >= 70 THEN '70-79'
          WHEN score >= 60 THEN '60-69'
          ELSE '0-59'
        END as range,
        COUNT(*) as count
      FROM exam_attempts
      GROUP BY range
      ORDER BY range DESC
    `).all();

    // Per-exam stats
    const examStats = db.prepare(`
      SELECT e.id, e.title, c.title as course_title,
        (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id) as total_attempts,
        (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id AND passed = 1) as pass_count,
        (SELECT ROUND(AVG(score), 1) FROM exam_attempts WHERE exam_id = e.id) as avg_score
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      ORDER BY e.created_at DESC
    `).all();

    // Recent attempts
    const recentAttempts = db.prepare(`
      SELECT ea.*, u.name, u.username, e.title as exam_title
      FROM exam_attempts ea
      JOIN users u ON ea.user_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      ORDER BY ea.submitted_at DESC
      LIMIT 20
    `).all();

    res.json({
      totalStudents: totalStudents.count,
      totalCourses: totalCourses.count,
      totalExams: totalExams.count,
      totalAttempts: totalAttempts.count,
      totalPassed: totalPassed.count,
      passRate,
      scoreDistribution,
      examStats,
      recentAttempts
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取统计数据失败';
    res.status(500).json({ error: message });
  }
});

// Student profile stats
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const enrollments = db.prepare(`
      SELECT e.enrolled_at, c.id as course_id, c.title, c.training_time, c.location, c.status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user!.id);

    const examHistory = db.prepare(`
      SELECT ea.*, e.title as exam_title, c.title as course_title, e.total_score, e.pass_score
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE ea.user_id = ?
      ORDER BY ea.submitted_at DESC
    `).all(req.user!.id);

    res.json({ enrollments, examHistory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取个人数据失败';
    res.status(500).json({ error: message });
  }
});

export default router;
