import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface Exam {
  id: number;
  title: string;
  course_title: string;
  total_score: number;
  pass_score: number;
  time_limit: number;
  creator_name?: string;
  attempt_count?: number;
  pass_count?: number;
  my_attempts?: number;
  my_best_score?: number | null;
  my_passed?: number;
}

interface Props {
  user: User;
}

export default function ExamList({ user }: Props) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await api.getExams();
      setExams(data as Exam[]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div>加载中...</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>{isAdmin ? '考试管理' : '考试中心'}</h2>
        {isAdmin && <Link to="/admin/exam/create" className="btn btn-primary">创建考试</Link>}
      </div>

      {exams.length === 0 ? (
        <div className="empty-state">
          <p>暂无考试</p>
          {isAdmin && <Link to="/admin/exam/create" className="btn btn-primary">创建第一场考试</Link>}
        </div>
      ) : (
        <div>
          {exams.map(exam => (
            <div className="card" key={exam.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="card-title">{exam.title}</h3>
                  <div className="card-meta">
                    关联课程：{exam.course_title} &nbsp;|&nbsp; 满分 {exam.total_score} 分 &nbsp;|&nbsp; 及格 {exam.pass_score} 分 &nbsp;|&nbsp; 限时 {exam.time_limit} 分钟
                  </div>
                </div>
                <div>
                  {isAdmin ? (
                    <div style={{ textAlign: 'right', fontSize: '13px', color: '#888' }}>
                      <div>{exam.attempt_count} 人次参考</div>
                      <div>通过 {exam.pass_count} 人</div>
                    </div>
                  ) : (
                    <>
                      {exam.my_best_score !== null && exam.my_best_score !== undefined && (
                        <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: exam.my_passed ? '#2d6a4f' : '#dc3545' }}>
                            最高分：{exam.my_best_score}
                          </span>
                          <span className={`badge ${exam.my_passed ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '8px' }}>
                            {exam.my_passed ? '已通过' : '未通过'}
                          </span>
                        </div>
                      )}
                      {exam.my_attempts !== undefined && exam.my_attempts >= 2 && !exam.my_passed && (
                        <span className="badge badge-danger">考试次数已用完</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!isAdmin && (
                <div style={{ marginTop: '16px' }}>
                  {exam.my_attempts !== undefined && exam.my_attempts < 2 && !exam.my_passed ? (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/exams/${exam.id}/take`)}>
                      {exam.my_attempts === 0 ? '开始考试' : '补考'}
                    </button>
                  ) : exam.my_passed ? (
                    <Link to={`/exams/${exam.id}/take`} className="btn btn-secondary btn-sm">查看答卷</Link>
                  ) : (
                    <Link to={`/exams/${exam.id}/take`} className="btn btn-primary btn-sm">开始考试</Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
