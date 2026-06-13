import { useState, useEffect } from 'react';
import { api } from '../api';

interface Enrollment {
  course_id: number;
  title: string;
  training_time: string;
  location: string;
  status: string;
  enrolled_at: string;
}

interface ExamRecord {
  id: number;
  exam_id: number;
  exam_title: string;
  course_title: string;
  score: number;
  total_score: number;
  pass_score: number;
  passed: number;
  attempt_number: number;
  submitted_at: string;
}

interface ProfileData {
  enrollments: Enrollment[];
  examHistory: ExamRecord[];
}

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<'courses' | 'exams'>('courses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      setData(res as ProfileData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div>加载中...</div>;
  if (!data) return <div className="empty-state"><p>加载失败</p></div>;

  const statusMap: Record<string, { label: string; cls: string }> = {
    upcoming: { label: '即将开始', cls: 'badge-info' },
    ongoing: { label: '进行中', cls: 'badge-warning' },
    completed: { label: '已结束', cls: 'badge-success' },
  };

  return (
    <>
      <h2 className="page-title">个人中心</h2>

      <div className="tabs">
        <div className={`tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>
          培训记录（{data.enrollments.length}）
        </div>
        <div className={`tab ${tab === 'exams' ? 'active' : ''}`} onClick={() => setTab('exams')}>
          考试成绩（{data.examHistory.length}）
        </div>
      </div>

      {tab === 'courses' && (
        <>
          {data.enrollments.length === 0 ? (
            <div className="empty-state"><p>暂无培训记录</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>课程名称</th><th>培训时间</th><th>地点</th><th>状态</th><th>报名时间</th></tr>
                </thead>
                <tbody>
                  {data.enrollments.map(e => (
                    <tr key={e.course_id}>
                      <td>{e.title}</td>
                      <td>{e.training_time}</td>
                      <td>{e.location}</td>
                      <td><span className={`badge ${statusMap[e.status]?.cls}`}>{statusMap[e.status]?.label}</span></td>
                      <td>{e.enrolled_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'exams' && (
        <>
          {data.examHistory.length === 0 ? (
            <div className="empty-state"><p>暂无考试记录</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>考试名称</th><th>关联课程</th><th>成绩</th><th>及格线</th><th>状态</th><th>第几次</th><th>提交时间</th></tr>
                </thead>
                <tbody>
                  {data.examHistory.map(e => (
                    <tr key={e.id}>
                      <td>{e.exam_title}</td>
                      <td>{e.course_title || '-'}</td>
                      <td style={{ fontWeight: 600, color: e.passed ? '#2d6a4f' : '#dc3545' }}>{e.score} / {e.total_score}</td>
                      <td>{e.pass_score}</td>
                      <td><span className={`badge ${e.passed ? 'badge-success' : 'badge-danger'}`}>{e.passed ? '通过' : '未通过'}</span></td>
                      <td>第 {e.attempt_number} 次</td>
                      <td>{e.submitted_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
