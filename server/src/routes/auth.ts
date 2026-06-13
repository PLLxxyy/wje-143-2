import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, password, name, department } = req.body;
    if (!username || !password || !name) {
      res.status(400).json({ error: '用户名、密码和姓名为必填项' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, role, name, department) VALUES (?, ?, ?, ?, ?)').run(username, hash, 'student', name, department || '');

    const user = { id: result.lastInsertRowid as number, username, role: 'student', name };
    const token = generateToken(user);

    res.json({ token, user: { id: user.id, username, role: 'student', name, department: department || '' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(500).json({ error: message });
  }
});

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: '请输入用户名和密码' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
      id: number; username: string; password: string; role: string; name: string; department: string;
    } | undefined;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const tokenUser = { id: user.id, username: user.username, role: user.role, name: user.name };
    const token = generateToken(tokenUser);

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name, department: user.department } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(500).json({ error: message });
  }
});

router.get('/me', (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, role, name, department FROM users WHERE id = ?').get(req.user!.id);
    res.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    res.status(500).json({ error: message });
  }
});

export default router;
