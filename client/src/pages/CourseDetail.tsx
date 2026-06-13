import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface Material {
  id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
}

interface Enrollment {
  id: number;
  user_id: number;
  name: string;
  username: string;
  department: string;
  enrolled_at: string;
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
  materials: Material[];
  enrollments: Enrollment[];
  enrolled: boolean;
}

interface Props {
  user: User;
}

export default function CourseDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const data = await api.getCourse(Number(id));
      setCourse(data as Course);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    try {
      await api.enrollCourse(Number(id));
      alert('报名成功');
      loadCourse();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '报名失败');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.uploadMaterial(Number(id), file);
      alert('上传成功');
      loadCourse();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '上传失败');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateCourseStatus(Number(id), status);
      loadCourse();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!course) return <div className="empty-state"><p>课程不存在</p></div>;

  const statusMap: Record<string, { label: string; cls: string }> = {
    upcoming: { label: '即将开始', cls: 'badge-info' },
    ongoing: { label: '进行中', cls: 'badge-warning' },
    completed: { label: '已结束', cls: 'badge-success' },
  };

  return (
    <>
      <Link to="/courses" style={{ fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>&larr; 返回课程列表</Link>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 className="page-title" style={{ marginBottom: '8px' }}>{course.title}</h2>
            <span className={`badge ${statusMap[course.status]?.cls}`}>{statusMap[course.status]?.label}</span>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {course.status === 'upcoming' && <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('ongoing')}>开始课程</button>}
              {course.status === 'ongoing' && <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('completed')}>结束课程</button>}
            </div>
          )}
        </div>

        <div className="card-meta" style={{ marginBottom: '16px' }}>
          培训时间：{course.training_time} &nbsp;|&nbsp; 地点：{course.location} &nbsp;|&nbsp; 创建人：{course.creator_name} &nbsp;|&nbsp; 已报名 {course.enrollment_count} 人
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>培训内容</h3>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>{course.summary}</p>
        </div>

        {!isAdmin && !course.enrolled && course.status !== 'completed' && (
          <button className="btn btn-primary" onClick={handleEnroll}>报名参加</button>
        )}
        {!isAdmin && course.enrolled && (
          <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 16px' }}>已报名此课程</span>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">培训资料</h3>
        {isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
            <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>上传资料</button>
          </div>
        )}
        {course.materials.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '14px' }}>暂无培训资料</p>
        ) : (
          course.materials.map(m => (
            <div className="material-item" key={m.id}>
              <span style={{ fontSize: '14px' }}>{m.original_name}</span>
              <a href={`/api/courses/${course.id}/materials/${m.id}/download`} className="btn btn-secondary btn-sm">下载</a>
            </div>
          ))
        )}
      </div>

      {(isAdmin || course.enrolled) && (
        <div className="card">
          <h3 className="card-title">报名名单（{course.enrollments.length} 人）</h3>
          {course.enrollments.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '14px' }}>暂无报名</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>姓名</th><th>用户名</th><th>部门</th><th>报名时间</th></tr></thead>
                <tbody>
                  {course.enrollments.map(e => (
                    <tr key={e.id}><td>{e.name}</td><td>{e.username}</td><td>{e.department || '-'}</td><td>{e.enrolled_at}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
