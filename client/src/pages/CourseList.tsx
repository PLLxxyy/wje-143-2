import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface Course {
  id: number;
  title: string;
  summary: string;
  training_time: string;
  location: string;
  status: string;
  creator_name: string;
  enrollment_count: number;
  enrolled?: boolean;
}

interface Props {
  user: User;
}

export default function CourseList({ user }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data as Course[]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEnroll = async (id: number) => {
    try {
      await api.enrollCourse(id);
      alert('报名成功');
      loadCourses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '报名失败');
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    upcoming: { label: '即将开始', cls: 'badge-info' },
    ongoing: { label: '进行中', cls: 'badge-warning' },
    completed: { label: '已结束', cls: 'badge-success' },
  };

  if (loading) return <div>加载中...</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>{isAdmin ? '课程管理' : '培训课程'}</h2>
        {isAdmin && <Link to="/admin/course/create" className="btn btn-primary">创建课程</Link>}
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>暂无培训课程</p>
          {isAdmin && <Link to="/admin/course/create" className="btn btn-primary">创建第一门课程</Link>}
        </div>
      ) : (
        <div className="grid-2">
          {courses.map(course => (
            <div className="card" key={course.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 className="card-title" style={{ marginBottom: 0, flex: 1 }}>
                  <Link to={`/courses/${course.id}`}>{course.title}</Link>
                </h3>
                <span className={`badge ${statusMap[course.status]?.cls || 'badge-info'}`}>
                  {statusMap[course.status]?.label || course.status}
                </span>
              </div>
              <div className="card-meta">
                {course.training_time} | {course.location} | 已报名 {course.enrollment_count} 人
              </div>
              <div className="card-desc">{course.summary}</div>
              {!isAdmin && !course.enrolled && course.status !== 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={() => handleEnroll(course.id)}>报名参加</button>
              )}
              {!isAdmin && course.enrolled && (
                <span className="badge badge-success">已报名</span>
              )}
              <Link to={`/courses/${course.id}`} className="btn btn-secondary btn-sm" style={{ marginLeft: '8px' }}>查看详情</Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
