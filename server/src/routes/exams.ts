import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

interface QuestionRow {
  id: number;
  exam_id: number;
  type: string;
  content: string;
  options: string | null;
  answer: string;
  explanation: string;
  score: number;
  sort_order: number;
}

// Get exams list
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    let exams;
    if (req.user!.role === 'admin') {
      exams = db.prepare(`
        SELECT e.*, c.title as course_title, u.name as creator_name,
          (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id) as attempt_count,
          (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id AND passed = 1) as pass_count
        FROM exams e
        LEFT JOIN courses c ON e.course_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        ORDER BY e.created_at DESC
      `).all();
    } else {
      exams = db.prepare(`
        SELECT e.*, c.title as course_title, u.name as creator_name,
          (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id AND user_id = ?) as my_attempts,
          (SELECT MAX(score) FROM exam_attempts WHERE exam_id = e.id AND user_id = ?) as my_best_score,
          (SELECT passed FROM exam_attempts WHERE exam_id = e.id AND user_id = ? ORDER BY score DESC LIMIT 1) as my_passed
        FROM exams e
        LEFT JOIN courses c ON e.course_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        ORDER BY e.created_at DESC
      `).all(req.user!.id, req.user!.id, req.user!.id);
    }
    res.json(exams);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取考试列表失败';
    res.status(500).json({ error: message });
  }
});

// Get single exam detail
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const exam = db.prepare(`
      SELECT e.*, c.title as course_title
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!exam) {
      res.status(404).json({ error: '考试不存在' });
      return;
    }

    const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY sort_order').all(req.params.id) as QuestionRow[];

    const attempts = db.prepare(`
      SELECT * FROM exam_attempts WHERE exam_id = ? AND user_id = ? ORDER BY attempt_number
    `).all(req.params.id, req.user!.id) as { attempt_number: number; score: number; passed: number; submitted_at: string; answers: string }[];

    res.json({
      ...exam,
      questions: questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
        answer: req.user!.role === 'admin' ? q.answer : undefined,
        explanation: req.user!.role === 'admin' ? q.explanation : undefined
      })),
      my_attempts: attempts.length,
      my_best_score: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null,
      my_passed: attempts.some(a => a.passed === 1),
      attempts
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取考试详情失败';
    res.status(500).json({ error: message });
  }
});

// Create exam (admin)
router.post('/', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { course_id, title, total_score, pass_score, time_limit, questions } = req.body;
    if (!course_id || !title || !questions || questions.length === 0) {
      res.status(400).json({ error: '请填写完整考试信息并添加题目' });
      return;
    }

    const result = db.prepare('INSERT INTO exams (course_id, title, total_score, pass_score, time_limit, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(course_id, title, total_score || 100, pass_score || 60, time_limit || 60, req.user!.id);

    const examId = result.lastInsertRowid;
    const insertQuestion = db.prepare('INSERT INTO questions (exam_id, type, content, options, answer, explanation, score, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    questions.forEach((q: { type: string; content: string; options?: string[]; answer: string; explanation?: string; score?: number }, idx: number) => {
      insertQuestion.run(examId, q.type, q.content, q.options ? JSON.stringify(q.options) : null, q.answer, q.explanation || '', q.score || 5, idx + 1);
    });

    res.json({ id: examId, message: '考试创建成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建考试失败';
    res.status(500).json({ error: message });
  }
});

// Start or submit exam attempt
router.post('/:id/submit', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const examId = req.params.id;
    const { answers } = req.body;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId) as { id: number; pass_score: number; total_score: number } | undefined;
    if (!exam) {
      res.status(404).json({ error: '考试不存在' });
      return;
    }

    const attempts = db.prepare('SELECT COUNT(*) as cnt FROM exam_attempts WHERE exam_id = ? AND user_id = ?').get(examId, req.user!.id) as { cnt: number };
    if (attempts.cnt >= 2) {
      res.status(400).json({ error: '已达到最大考试次数，无法再次参加' });
      return;
    }

    const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ?').all(examId) as { id: number; type: string; answer: string; score: number; explanation: string; content: string; options: string | null }[];

    let totalScore = 0;
    const results = questions.map(q => {
      const userAnswer = answers[q.id] || '';
      const correct = userAnswer.toUpperCase() === q.answer.toUpperCase();
      if (correct) totalScore += q.score;
      return {
        question_id: q.id,
        content: q.content,
        type: q.type,
        options: q.options ? JSON.parse(q.options) : null,
        user_answer: userAnswer,
        correct_answer: q.answer,
        is_correct: correct,
        score: q.score,
        earned_score: correct ? q.score : 0,
        explanation: q.explanation
      };
    });

    const passed = totalScore >= exam.pass_score;
    const attemptNumber = attempts.cnt + 1;

    db.prepare('INSERT INTO exam_attempts (exam_id, user_id, score, answers, passed, attempt_number, submitted_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(examId, req.user!.id, totalScore, JSON.stringify(answers), passed ? 1 : 0, attemptNumber);

    res.json({
      score: totalScore,
      total_score: exam.total_score,
      pass_score: exam.pass_score,
      passed,
      attempt_number: attemptNumber,
      max_attempts: 2,
      can_retry: !passed && attemptNumber < 2,
      results
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '提交考试失败';
    res.status(500).json({ error: message });
  }
});

// Get exam attempts for admin
router.get('/:id/attempts', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const attempts = db.prepare(`
      SELECT ea.*, u.name, u.username, u.department
      FROM exam_attempts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.exam_id = ?
      ORDER BY ea.submitted_at DESC
    `).all(req.params.id);
    res.json(attempts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取考试记录失败';
    res.status(500).json({ error: message });
  }
});

export default router;
