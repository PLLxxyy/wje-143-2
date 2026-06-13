import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Get all courses
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, u.name as creator_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `).all();

    let enriched = courses as Record<string, unknown>[];

    if (req.user!.role === 'student') {
      const enrollments = db.prepare('SELECT course_id FROM enrollments WHERE user_id = ?').all(req.user!.id) as { course_id: number }[];
      const enrolledIds = new Set(enrollments.map(e => e.course_id));
      enriched = enriched.map(c => ({ ...c, enrolled: enrolledIds.has(c.id as number) }));
    }

    res.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取课程列表失败';
    res.status(500).json({ error: message });
  }
});

// Get single course detail
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const course = db.prepare(`
      SELECT c.*, u.name as creator_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!course) {
      res.status(404).json({ error: '课程不存在' });
      return;
    }

    const materials = db.prepare('SELECT * FROM course_materials WHERE course_id = ?').all(req.params.id);
    const enrollments = db.prepare(`
      SELECT e.*, u.name, u.username, u.department
      FROM enrollments e JOIN users u ON e.user_id = u.id
      WHERE e.course_id = ?
    `).all(req.params.id);

    const userEnrolled = db.prepare('SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?').get(req.params.id, req.user!.id);

    res.json({ ...course, materials, enrollments, enrolled: !!userEnrolled });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取课程详情失败';
    res.status(500).json({ error: message });
  }
});

// Create course (admin)
router.post('/', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { title, summary, training_time, location } = req.body;
    if (!title || !summary || !training_time || !location) {
      res.status(400).json({ error: '所有字段为必填项' });
      return;
    }

    const result = db.prepare('INSERT INTO courses (title, summary, training_time, location, created_by) VALUES (?, ?, ?, ?, ?)').run(title, summary, training_time, location, req.user!.id);
    res.json({ id: result.lastInsertRowid, message: '课程创建成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建课程失败';
    res.status(500).json({ error: message });
  }
});

// Update course status (admin)
router.put('/:id/status', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['upcoming', 'ongoing', 'completed'].includes(status)) {
      res.status(400).json({ error: '无效的课程状态' });
      return;
    }
    db.prepare('UPDATE courses SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: '状态更新成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新状态失败';
    res.status(500).json({ error: message });
  }
});

// Enroll in course
router.post('/:id/enroll', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id;
    const existing = db.prepare('SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?').get(courseId, req.user!.id);
    if (existing) {
      res.status(400).json({ error: '您已报名该课程' });
      return;
    }

    db.prepare('INSERT INTO enrollments (course_id, user_id) VALUES (?, ?)').run(courseId, req.user!.id);
    res.json({ message: '报名成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '报名失败';
    res.status(500).json({ error: message });
  }
});

// Upload material (admin)
router.post('/:id/materials', authMiddleware, adminOnly, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请选择文件' });
      return;
    }

    db.prepare('INSERT INTO course_materials (course_id, filename, original_name) VALUES (?, ?, ?)').run(req.params.id, req.file.filename, req.file.originalname);
    res.json({ message: '上传成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '上传失败';
    res.status(500).json({ error: message });
  }
});

// Download material
router.get('/:courseId/materials/:materialId/download', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const material = db.prepare('SELECT * FROM course_materials WHERE id = ? AND course_id = ?').get(req.params.materialId, req.params.courseId) as { filename: string; original_name: string } | undefined;
    if (!material) {
      res.status(404).json({ error: '文件不存在' });
      return;
    }

    const filePath = path.join(uploadsDir, material.filename);
    res.download(filePath, material.original_name);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '下载失败';
    res.status(500).json({ error: message });
  }
});

export default router;
