import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface Question {
  id: number;
  type: 'choice' | 'judge';
  content: string;
  options: string[] | null;
  score: number;
  sort_order: number;
}

interface QuestionResult {
  question_id: number;
  content: string;
  type: string;
  options: string[] | null;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  score: number;
  earned_score: number;
  explanation: string;
}

interface ExamData {
  id: number;
  title: string;
  course_title: string;
  total_score: number;
  pass_score: number;
  time_limit: number;
  questions: Question[];
  my_attempts: number;
  my_best_score: number | null;
  my_passed: boolean;
}

interface SubmitResult {
  score: number;
  total_score: number;
  pass_score: number;
  passed: boolean;
  attempt_number: number;
  max_attempts: number;
  can_retry: boolean;
  results: QuestionResult[];
}

interface Props {
  user: User;
}

export default function ExamTake({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    loadExam();
  }, [id]);

  useEffect(() => {
    if (!started || !exam || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, result]);

  const loadExam = async () => {
    try {
      const data = await api.getExam(Number(id));
      setExam(data as ExamData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const startExam = () => {
    if (exam) {
      setTimeLeft(exam.time_limit * 60);
      setStarted(true);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.submitExam(exam.id, answers);
      setResult(data as SubmitResult);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '提交失败');
    }
    setSubmitting(false);
  }, [exam, answers, submitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div>加载中...</div>;
  if (!exam) return <div className="empty-state"><p>考试不存在</p></div>;

  // Show result page
  if (result) {
    return (
      <>
        <div className="result-header">
          <h2 style={{ marginBottom: '16px' }}>{exam.title} - 考试结果</h2>
          <div className={`result-score ${result.passed ? 'pass' : 'fail'}`}>{result.score}</div>
          <div className="result-info">满分 {result.total_score} 分 / 及格 {result.pass_score} 分</div>
          <div className="result-info">
            {result.passed ? '恭喜通过考试！' : '未达到及格线'}
            &nbsp;&nbsp;（第 {result.attempt_number} 次 / 最多 {result.max_attempts} 次）
          </div>
          <div style={{ marginTop: '16px' }}>
            {result.can_retry && (
              <button className="btn btn-primary" onClick={() => { setResult(null); setAnswers({}); setCurrentIdx(0); setStarted(false); }} style={{ marginRight: '12px' }}>
                立即补考
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/exams')}>返回考试列表</button>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>答题详情</h3>
        {result.results.map((r, idx) => (
          <div className="question-card" key={r.question_id}>
            <div className="question-content">
              <span className="question-number">{idx + 1}.</span>
              {r.content}
              <span className="question-type">{r.type === 'choice' ? '选择题' : '判断题'}</span>
              <span style={{ float: 'right', fontSize: '13px', color: r.is_correct ? '#2d6a4f' : '#dc3545', fontWeight: 600 }}>
                {r.is_correct ? `+${r.score}` : '+0'}
              </span>
            </div>

            {r.type === 'choice' && r.options && (
              <ul className="options-list">
                {r.options.map((opt, oi) => {
                  const key = String.fromCharCode(65 + oi);
                  let cls = '';
                  if (key === r.correct_answer) cls = 'correct';
                  else if (key === r.user_answer && !r.is_correct) cls = 'wrong';
                  return (
                    <li className={`option-item ${cls}`} key={key}>
                      <span className="option-key">{key}</span>
                      {opt}
                    </li>
                  );
                })}
              </ul>
            )}

            {r.type === 'judge' && (
              <div className="judge-options">
                <div className={`judge-btn ${r.correct_answer === 'true' ? 'correct' : r.user_answer === 'true' && !r.is_correct ? 'wrong' : ''}`}>
                  正确
                </div>
                <div className={`judge-btn ${r.correct_answer === 'false' ? 'correct' : r.user_answer === 'false' && !r.is_correct ? 'wrong' : ''}`}>
                  错误
                </div>
              </div>
            )}

            {r.explanation && <div className="explanation">解析：{r.explanation}</div>}
          </div>
        ))}
      </>
    );
  }

  // Not started yet
  if (!started) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '16px', textAlign: 'center' }}>{exam.title}</h2>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '2', marginBottom: '24px' }}>
          <p>关联课程：{exam.course_title}</p>
          <p>题目数量：{exam.questions.length} 题</p>
          <p>满分分数：{exam.total_score} 分</p>
          <p>及格分数：{exam.pass_score} 分</p>
          <p>考试时限：{exam.time_limit} 分钟</p>
          {exam.my_attempts > 0 && <p style={{ color: '#dc3545' }}>已考试 {exam.my_attempts} 次，最高分：{exam.my_best_score}</p>}
          {exam.my_passed && <p style={{ color: '#2d6a4f', fontWeight: 600 }}>已通过此考试</p>}
        </div>
        <div style={{ textAlign: 'center' }}>
          {!exam.my_passed && exam.my_attempts < 2 ? (
            <button className="btn btn-primary" onClick={startExam}>
              {exam.my_attempts === 0 ? '开始考试' : '开始补考'}
            </button>
          ) : exam.my_passed ? (
            <button className="btn btn-secondary" onClick={() => navigate('/exams')}>返回考试列表</button>
          ) : (
            <div>
              <p style={{ color: '#dc3545', marginBottom: '12px' }}>考试次数已用完</p>
              <button className="btn btn-secondary" onClick={() => navigate('/exams')}>返回考试列表</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Exam in progress
  const questions = exam.questions;
  const current = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <>
      {timeLeft < 120 && (
        <div className={`exam-timer ${timeLeft < 60 ? 'warning' : ''}`}>
          剩余时间：{formatTime(timeLeft)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>{exam.title}</h2>
        <span style={{ fontSize: '14px', color: '#888' }}>已答 {answeredCount}/{questions.length} 题</span>
      </div>

      <div className="progress-bar" style={{ marginBottom: '24px' }}>
        <div className="progress-fill pass" style={{ width: `${progress}%` }}></div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIdx(idx)}
            style={{
              width: '36px', height: '36px', borderRadius: '6px', border: idx === currentIdx ? '2px solid #e63946' : '1px solid #ddd',
              background: answers[q.id] ? '#e63946' : 'white', color: answers[q.id] ? 'white' : '#333',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px'
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="question-card">
        <div className="question-content" style={{ fontSize: '16px' }}>
          <span className="question-number">第 {currentIdx + 1} 题</span>
          {current.content}
          <span className="question-type">{current.type === 'choice' ? '选择题' : '判断题'}</span>
          <span style={{ float: 'right', color: '#888', fontSize: '13px' }}>({current.score}分)</span>
        </div>

        {current.type === 'choice' && current.options && (
          <ul className="options-list">
            {current.options.map((opt, oi) => {
              const key = String.fromCharCode(65 + oi);
              return (
                <li
                  key={key}
                  className={`option-item ${answers[current.id] === key ? 'selected' : ''}`}
                  onClick={() => handleAnswer(current.id, key)}
                >
                  <span className="option-key">{key}</span>
                  {opt}
                </li>
              );
            })}
          </ul>
        )}

        {current.type === 'judge' && (
          <div className="judge-options">
            <div
              className={`judge-btn ${answers[current.id] === 'true' ? 'selected' : ''}`}
              onClick={() => handleAnswer(current.id, 'true')}
            >
              正确
            </div>
            <div
              className={`judge-btn ${answers[current.id] === 'false' ? 'selected' : ''}`}
              onClick={() => handleAnswer(current.id, 'false')}
            >
              错误
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button className="btn btn-secondary" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>上一题</button>
        <div>
          {currentIdx < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>下一题</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '提交答卷'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
