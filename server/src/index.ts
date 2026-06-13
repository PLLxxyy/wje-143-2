import express from 'express';
import cors from 'cors';
import path from 'path';
import './db';
import './seed';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import examRoutes from './routes/exams';
import statsRoutes from './routes/stats';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '消防培训考核系统运行正常' });
});

app.listen(PORT, () => {
  console.log(`消防培训考核系统后端已启动: http://localhost:${PORT}`);
});
