import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function AdminCourseCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', summary: '', training_time: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.summary || !form.training_time || !form.location) {
      setError('所有字段为必填项');
      return;
    }
    setLoading(true);
    try {
      await api.createCourse(form);
      alert('课程创建成功');
      navigate('/courses');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
    setLoading(false);
  };

  return (
    <>
      <Link to="/courses" style={{ fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>&larr; 返回课程列表</Link>
      <h2 className="page-title">创建培训课程</h2>

      <div className="card" style={{ maxWidth: '700px' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>课程名称</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="请输入课程名称" />
          </div>
          <div className="form-group">
            <label>培训内容摘要</label>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="请输入培训内容摘要" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>培训时间</label>
              <input type="text" value={form.training_time} onChange={e => setForm({ ...form, training_time: e.target.value })} placeholder="例如：2026-07-01 09:00 - 17:00" />
            </div>
            <div className="form-group">
              <label>培训地点</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="请输入培训地点" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '创建课程'}
          </button>
        </form>
      </div>
    </>
  );
}
