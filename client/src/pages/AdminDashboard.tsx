import { useState, useEffect } from 'react';
import { api } from '../api';

interface ExamStat {
  id: number;
  title: string;
  course_title: string;
  total_attempts: number;
  pass_count: number;
  avg_score: number;
}

interface Attempt {
  id: number;
  name: string;
  username: string;
  exam_title: string;
  score: number;
  total_score: number;
  pass_score: number;
  passed: number;
  attempt_number: number;
  submitted_at: string;
}

interface Distribution {
  range: string;
  count: number;
}

interface DashboardData {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  totalAttempts: number;
  totalPassed: number;
  passRate: number;
  scoreDistribution: Distribution[];
  examStats: ExamStat[];
  recentAttempts: Attempt[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res as DashboardData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div>加载中...</div>;
  if (!data) return <div className="empty-state"><p>加载失败</p></div>;

  const maxCount = Math.max(...data.scoreDistribution.map(d => d.count), 1);

  return (
    <>
      <h2 className="page-title">管理后台</h2>

      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-number">{data.totalStudents}</div>
          <div className="stat-label">学员总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.totalCourses}</div>
          <div className="stat-label">课程总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.totalExams}</div>
          <div className="stat-label">考试总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.passRate}%</div>
          <div className="stat-label">整体通过率</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">成绩分布</h3>
          {data.scoreDistribution.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '14px' }}>暂无考试数据</p>
          ) : (
            data.scoreDistribution.map(d => (
              <div className="chart-bar" key={d.range}>
                <span className="chart-label">{d.range}分</span>
                <div className="chart-track">
                  <div className="chart-fill" style={{ width: `${(d.count / maxCount) * 100}%` }}>
                    <span className="chart-value">{d.count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 className="card-title">各考试统计</h3>
          {data.examStats.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '14px' }}>暂无考试数据</p>
          ) : (
            data.examStats.map(e => (
              <div key={e.id} style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{e.title}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  参考 {e.total_attempts} 人次 | 通过 {e.pass_count} 人 | 平均分 {e.avg_score || '-'}
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${e.total_attempts > 0 && (e.pass_count / e.total_attempts) >= 0.6 ? 'pass' : 'fail'}`}
                    style={{ width: `${e.total_attempts > 0 ? (e.pass_count / e.total_attempts) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3 className="card-title">最近考试记录</h3>
        {data.recentAttempts.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '14px' }}>暂无考试记录</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>学员</th><th>考试</th><th>成绩</th><th>及格线</th><th>状态</th><th>第几次</th><th>提交时间</th></tr>
              </thead>
              <tbody>
                {data.recentAttempts.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}（{a.username}）</td>
                    <td>{a.exam_title}</td>
                    <td style={{ fontWeight: 600, color: a.passed ? '#2d6a4f' : '#dc3545' }}>{a.score} / {a.total_score}</td>
                    <td>{a.pass_score}</td>
                    <td><span className={`badge ${a.passed ? 'badge-success' : 'badge-danger'}`}>{a.passed ? '通过' : '未通过'}</span></td>
                    <td>第 {a.attempt_number} 次</td>
                    <td>{a.submitted_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
