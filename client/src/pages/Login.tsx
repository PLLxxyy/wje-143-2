import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  department: string;
}

interface Props {
  mode: 'login' | 'register';
  onLogin: (token: string, user: User) => void;
}

export default function Login({ mode, onLogin }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', name: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data: { token: string; user: User };
      if (mode === 'login') {
        data = await api.login({ username: form.username, password: form.password }) as { token: string; user: User };
      } else {
        if (!form.name) { setError('请输入姓名'); setLoading(false); return; }
        data = await api.register(form) as { token: string; user: User };
      }
      onLogin(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>{mode === 'login' ? '登录' : '注册'}</h2>
        <p className="login-subtitle">消防培训考核系统</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="请输入用户名" required />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="请输入密码" required />
          </div>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>姓名</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入真实姓名" required />
              </div>
              <div className="form-group">
                <label>部门（选填）</label>
                <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="请输入所属部门" />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {mode === 'login' ? (
            <span style={{ fontSize: '14px', color: '#888' }}>
              没有账号？<Link to="/register">立即注册</Link>
            </span>
          ) : (
            <span style={{ fontSize: '14px', color: '#888' }}>
              已有账号？<Link to="/login">去登录</Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
