import db from './db';
import bcrypt from 'bcryptjs';

function seed() {
  console.log('Seeding database...');

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (existingAdmin) {
    console.log('Database already seeded.');
    return;
  }

  const hash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare('INSERT INTO users (username, password, role, name, department) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', hash, 'admin', '系统管理员', '安全管理部');
  insertUser.run('student', hash, 'student', '张三', '消防科');
  insertUser.run('student2', hash, 'student', '李四', '应急科');
  insertUser.run('student3', hash, 'student', '王五', '后勤科');

  const insertCourse = db.prepare('INSERT INTO courses (title, summary, training_time, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?)');
  insertCourse.run('消防安全基础知识培训', '学习消防安全基本常识，了解火灾预防措施和应急处理方法，掌握灭火器使用技巧。', '2026-07-01 09:00 - 2026-07-01 17:00', '三楼培训教室', 'upcoming', 1);
  insertCourse.run('灭火器实操演练', '现场操作各类灭火器，掌握干粉灭火器、CO2灭火器的正确使用方法。', '2026-07-15 14:00 - 2026-07-15 17:00', '楼外空地', 'upcoming', 1);
  insertCourse.run('火灾应急疏散演练', '模拟火灾场景，练习应急疏散流程，熟悉逃生路线和集合点。', '2026-06-01 09:00 - 2026-06-01 12:00', '全楼', 'completed', 1);

  const insertEnrollment = db.prepare('INSERT INTO enrollments (course_id, user_id) VALUES (?, ?)');
  insertEnrollment.run(1, 2);
  insertEnrollment.run(1, 3);
  insertEnrollment.run(2, 2);
  insertEnrollment.run(3, 2);
  insertEnrollment.run(3, 3);
  insertEnrollment.run(3, 4);

  const insertExam = db.prepare('INSERT INTO exams (course_id, title, total_score, pass_score, time_limit, created_by) VALUES (?, ?, ?, ?, ?, ?)');
  insertExam.run(1, '消防安全基础知识测试', 100, 60, 30, 1);
  insertExam.run(3, '应急疏散知识测试', 100, 60, 20, 1);

  const insertQuestion = db.prepare('INSERT INTO questions (exam_id, type, content, options, answer, explanation, score, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  // Exam 1 questions
  insertQuestion.run(1, 'choice', '火灾报警电话是多少？', JSON.stringify(['110', '119', '120', '122']), 'B', '我国火灾报警电话是119。', 10, 1);
  insertQuestion.run(1, 'choice', '使用灭火器时，应该对准火焰的哪个部位喷射？', JSON.stringify(['火焰顶部', '火焰根部', '火焰中部', '任意部位']), 'B', '灭火器应对准火焰根部喷射，才能有效灭火。', 10, 2);
  insertQuestion.run(1, 'choice', '以下哪种灭火器适用于电气火灾？', JSON.stringify(['泡沫灭火器', '干粉灭火器', '水基灭火器', '酸碱灭火器']), 'B', '干粉灭火器适用于电气火灾，因为干粉不导电。', 10, 3);
  insertQuestion.run(1, 'choice', '发生火灾时，以下哪种逃生方式是正确的？', JSON.stringify(['乘坐电梯', '跳楼逃生', '用湿毛巾捂住口鼻低姿逃生', '在原地等待']), 'C', '火灾逃生应使用湿毛巾捂住口鼻，弯腰低姿沿安全通道逃生。', 10, 4);
  insertQuestion.run(1, 'judge', '灭火器应放置在明显且便于取用的位置。', null, 'true', '灭火器应放在明显且便于取用的位置，以便紧急情况下快速使用。', 10, 5);
  insertQuestion.run(1, 'judge', '发生火灾时可以乘坐电梯快速逃生。', null, 'false', '火灾时严禁使用电梯，应走安全楼梯。', 10, 6);
  insertQuestion.run(1, 'judge', '发现火灾隐患应立即向有关部门报告。', null, 'true', '发现火灾隐患及时报告是每个公民的责任。', 10, 7);
  insertQuestion.run(1, 'choice', '消防安全"四个能力"不包括以下哪项？', JSON.stringify(['检查消除火灾隐患能力', '组织扑救初起火灾能力', '组织人员疏散逃生能力', '消防设备维修能力']), 'D', '消防安全四个能力包括：检查消除火灾隐患、扑救初起火灾、疏散逃生、消防宣传教育。', 10, 8);
  insertQuestion.run(1, 'judge', '消火栓周围可以堆放杂物。', null, 'false', '消火栓周围必须保持畅通，严禁堆放杂物。', 10, 9);
  insertQuestion.run(1, 'choice', '火灾中致人死亡的主要原因是？', JSON.stringify(['被火烧伤', '吸入有毒烟气', '房屋倒塌', '踩踏']), 'B', '火灾中约80%的死亡是由吸入有毒烟气导致的。', 10, 10);

  // Exam 2 questions
  insertQuestion.run(2, 'choice', '听到火灾警报后，应首先做什么？', JSON.stringify(['收拾贵重物品', '立即沿疏散路线撤离', '打电话报警', '打开窗户']), 'B', '听到火灾警报应立即按疏散路线撤离，不要贪恋财物。', 10, 1);
  insertQuestion.run(2, 'choice', '疏散时应沿墙壁行走，主要原因是？', JSON.stringify(['防止迷路', '便于找到安全出口标识', '防止被烟气呛到', '美观整齐']), 'B', '沿墙壁行走便于找到安全出口标识和消防设施。', 10, 2);
  insertQuestion.run(2, 'judge', '疏散过程中可以返回取物品。', null, 'false', '疏散过程中严禁返回取物品，必须尽快撤离。', 10, 3);
  insertQuestion.run(2, 'judge', '逃生时应该直立快跑。', null, 'false', '应弯腰低姿逃生，因为烟气向上飘散。', 10, 4);
  insertQuestion.run(2, 'choice', '疏散集合点应该设在什么地方？', JSON.stringify(['楼内大厅', '建筑物附近的空旷安全区域', '停车场', '马路对面']), 'B', '疏散集合点应设在建筑物附近的空旷安全区域。', 10, 5);
  insertQuestion.run(2, 'judge', '火灾时如果通道被堵，可以退回房间等待救援。', null, 'true', '当逃生通道被烟火封堵无法通过时，应退回房间关闭门窗，等待救援。', 10, 6);
  insertQuestion.run(2, 'choice', '在高层建筑中疏散时应使用？', JSON.stringify(['电梯', '安全楼梯', '窗户', '阳台']), 'B', '高层建筑疏散应使用安全楼梯，严禁使用电梯。', 10, 7);
  insertQuestion.run(2, 'judge', '每月应至少进行一次消防疏散演练。', null, 'true', '根据规定，应定期组织消防疏散演练，提高应急能力。', 10, 8);
  insertQuestion.run(2, 'choice', '被困在烟雾弥漫的房间时，应将门缝用什么堵住？', JSON.stringify(['纸张', '湿布条', '干毛巾', '塑料袋']), 'B', '用湿布条堵塞门缝可以防止烟气进入。', 10, 9);
  insertQuestion.run(2, 'judge', '消防通道可以临时停放车辆。', null, 'false', '消防通道是生命通道，严禁占用。', 10, 10);

  console.log('Seed data inserted successfully.');
}

seed();
