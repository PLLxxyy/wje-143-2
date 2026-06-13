import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';
import Login from './pages/Login';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import ExamList from './pages/ExamList';
import ExamTake from './pages/ExamTake';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourseCreate from './pages/AdminCourseCreate';
import AdminExamCreate from './pages/AdminExamCreate';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  department: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data as User);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate(userData.role === 'admin' ? '/admin/dashboard' : '/courses');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Login mode="register" onLogin={handleLogin} />} />
        <Route path="*" element={<Login mode="login" onLogin={handleLogin} />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <>
      <header className="header">
        <h1>消防培训考核系统</h1>
        <nav className="header-nav">
          {isAdmin ? (
            <>
              <Link to="/admin/dashboard" className={location.pathname.startsWith('/admin/dashboard') ? 'active' : ''}>统计后台</Link>
              <Link to="/courses" className={location.pathname === '/courses' ? 'active' : ''}>课程管理</Link>
              <Link to="/exams" className={location.pathname === '/exams' ? 'active' : ''}>考试管理</Link>
            </>
          ) : (
            <>
              <Link to="/courses" className={location.pathname === '/courses' ? 'active' : ''}>培训课程</Link>
              <Link to="/exams" className={location.pathname === '/exams' ? 'active' : ''}>考试中心</Link>
              <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>个人中心</Link>
            </>
          )}
        </nav>
        <div className="header-user">
          <span>{user.name}（{isAdmin ? '管理员' : '学员'}）</span>
          <button className="btn-logout" onClick={handleLogout}>退出</button>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/courses" element={<CourseList user={user} />} />
          <Route path="/courses/:id" element={<CourseDetail user={user} />} />
          <Route path="/exams" element={<ExamList user={user} />} />
          <Route path="/exams/:id/take" element={<ExamTake user={user} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/course/create" element={<AdminCourseCreate />} />
          <Route path="/admin/exam/create" element={<AdminExamCreate />} />
          <Route path="*" element={<CourseList user={user} />} />
        </Routes>
      </main>
    </>
  );
}
