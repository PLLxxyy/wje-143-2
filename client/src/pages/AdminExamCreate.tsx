import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

interface Course {
  id: number;
  title: string;
}

interface QuestionForm {
  type: 'choice' | 'judge';
  content: string;
  options: string[];
  answer: string;
  explanation: string;
  score: number;
}

export default function AdminExamCreate() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ course_id: 0, title: '', total_score: 100, pass_score: 60, time_limit: 60 });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses((data as Course[]).map(c => ({ id: c.id, title: c.title })));
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 'choice', content: '', options: ['', '', '', ''], answer: 'A', explanation: '', score: 10 }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: string | number | string[]) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'type' && value === 'judge') {
      updated[idx].answer = 'true';
    }
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = value;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.course_id) { setError('请选择关联课程'); return; }
    if (!form.title) { setError('请输入考试名称'); return; }
    if (questions.length === 0) { setError('请至少添加一道题目'); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content) { setError(`第 ${i + 1} 题内容不能为空`); return; }
      if (q.type === 'choice' && q.options.some(o => !o)) { setError(`第 ${i + 1} 题选项不能为空`); return; }
      if (!q.answer) { setError(`第 ${i + 1} 题请设置正确答案`); return; }
    }

    setLoading(true);
    try {
      await api.createExam({ ...form, questions });
      alert('考试创建成功');
      navigate('/exams');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
    setLoading(false);
  };

  return (
    <>
      <Link to="/exams" style={{ fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>&larr; 返回考试列表</Link>
      <h2 className="page-title">创建考试</h2>

      <div className="card" style={{ maxWidth: '800px' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>关联课程</label>
              <select value={form.course_id} onChange={e => setForm({ ...form, course_id: Number(e.target.value) })}>
                <option value={0}>请选择课程</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>考试名称</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="请输入考试名称" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>满分分数</label>
              <input type="number" value={form.total_score} onChange={e => setForm({ ...form, total_score: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>及格分数</label>
              <input type="number" value={form.pass_score} onChange={e => setForm({ ...form, pass_score: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <label>考试时限（分钟）</label>
            <input type="number" value={form.time_limit} onChange={e => setForm({ ...form, time_limit: Number(e.target.value) })} />
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
        <h3 style={{ fontSize: '18px' }}>题目列表（{questions.length} 题）</h3>
        <button className="btn btn-primary btn-sm" onClick={addQuestion}>添加题目</button>
      </div>

      {questions.map((q, idx) => (
        <div className="card" key={idx} style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '15px' }}>第 {idx + 1} 题</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => removeQuestion(idx)}>删除</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>题型</label>
              <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                <option value="choice">选择题</option>
                <option value="judge">判断题</option>
              </select>
            </div>
            <div className="form-group">
              <label>分值</label>
              <input type="number" value={q.score} onChange={e => updateQuestion(idx, 'score', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label>题目内容</label>
            <textarea value={q.content} onChange={e => updateQuestion(idx, 'content', e.target.value)} placeholder="请输入题目内容" style={{ minHeight: '60px' }} />
          </div>

          {q.type === 'choice' && (
            <>
              <div className="form-group">
                <label>选项</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ width: '24px', fontWeight: 600 }}>{String.fromCharCode(65 + oi)}.</span>
                    <input type="text" value={opt} onChange={e => updateOption(idx, oi, e.target.value)} placeholder={`选项 ${String.fromCharCode(65 + oi)}`} style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>正确答案</label>
                <select value={q.answer} onChange={e => updateQuestion(idx, 'answer', e.target.value)}>
                  {q.options.map((_, oi) => <option key={oi} value={String.fromCharCode(65 + oi)}>{String.fromCharCode(65 + oi)}</option>)}
                </select>
              </div>
            </>
          )}

          {q.type === 'judge' && (
            <div className="form-group">
              <label>正确答案</label>
              <select value={q.answer} onChange={e => updateQuestion(idx, 'answer', e.target.value)}>
                <option value="true">正确</option>
                <option value="false">错误</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>答案解析（选填）</label>
            <input type="text" value={q.explanation} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} placeholder="请输入答案解析" />
          </div>
        </div>
      ))}

      {questions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '创建中...' : '提交创建考试'}
          </button>
        </div>
      )}
    </>
  );
}
