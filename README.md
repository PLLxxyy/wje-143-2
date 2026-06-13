# 消防培训考核系统

消防培训考核系统，支持培训课程管理、资料上传下载、在线考试答题、成绩统计分析。考试支持选择题和判断题，提交后立刻出成绩和错题解析，不及格可补考一次。

## 技术栈

- **前端**：Vite + React 18 + TypeScript（端口 5173）
- **后端**：Express + TypeScript + better-sqlite3（端口 3000）
- **认证**：JWT + bcryptjs
- **数据库**：SQLite，启动时自动创建
- **启动工具**：concurrently 同时启动前后端
- **文件上传**：multer

## 快速启动

```bash
# 安装所有依赖（根目录 + client + server）
npm run install:all

# 同时启动前后端
npm run dev
```

启动后访问 http://localhost:5173

## 目录结构

```
wje-143/
├── package.json              # 根目录，concurrently 启动脚本
├── README.md
├── client/                   # 前端
│   ├── index.html            # 全局样式（写在 style 标签内）
│   ├── vite.config.ts        # Vite 配置，proxy /api 到 3000
│   └── src/
│       ├── api.ts            # API 请求封装（含文件上传）
│       ├── App.tsx           # 路由 + 导航 + 鉴权
│       └── pages/
│           ├── Login.tsx     # 登录/注册
│           ├── CourseList.tsx     # 课程列表
│           ├── CourseDetail.tsx   # 课程详情 + 资料下载 + 报名
│           ├── ExamList.tsx       # 考试列表
│           ├── ExamTake.tsx       # 在线答题（计时 + 逐题作答 + 成绩 + 解析）
│           ├── Profile.tsx        # 个人中心（培训记录 + 考试成绩）
│           ├── AdminDashboard.tsx # 管理员统计后台
│           ├── AdminCourseCreate.tsx # 创建课程
│           └── AdminExamCreate.tsx   # 创建考试（动态录入题目）
└── server/                   # 后端
    ├── src/
    │   ├── index.ts          # Express 入口，启动时自动 seed
    │   ├── db.ts             # SQLite 建表（7 张表）
    │   ├── seed.ts           # 测试数据
    │   ├── middleware/auth.ts # JWT 鉴权 + 管理员守卫
    │   └── routes/
    │       ├── auth.ts       # 登录/注册/个人信息
    │       ├── courses.ts    # 课程 CRUD + 报名 + 资料上传下载
    │       ├── exams.ts      # 考试 CRUD + 答题 + 成绩
    │       └── stats.ts      # 统计数据 + 学员档案
    └── tsconfig.json
```

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin   | 123456 | 管理员 |
| student | 123456 | 学员 |

seed 数据还会额外创建 2 个学员账号（student2、student3），密码均为 123456。

## 功能说明

### 课程管理（管理员）
- 创建培训课程：课程名称、内容摘要、培训时间、地点
- 课程创建后学员可报名，管理员查看报名名单
- 课程结束后上传培训资料（操作视频、课件），学员在详情页下载查看

### 课程学习（学员）
- 浏览课程列表，查看课程详情和培训时间
- 点击报名参加，报名后在"我的培训"中可查
- 课程详情页下载管理员上传的培训资料

### 在线考试（学员）
- 管理员创建考试：关联课程、录入选择题/判断题、设满分和及格线
- 学员在考试列表看到待参加的考试，进入后逐题作答
- 答题页面有计时器，答完后点击提交
- 提交后立刻显示成绩、每道题的对错标记和解析
- 不及格可补考一次（每场考试最多 2 次机会）

### 个人中心（学员）
- 培训记录：已报名的课程列表和培训状态
- 考试成绩：历次考试成绩、及格/不及格标记

### 统计后台（管理员）
- 整体通过率和参与人数
- 各场考试的成绩分布（柱状图）
- 按考试查看详细统计：参与人数、平均分、最高分、通过率

## 注意事项

- 数据库文件保存在 `server/data.db`，首次启动自动创建并 seed 测试数据
- 考试每场限制最多 2 次答题机会（首次 + 一次补考）
- 培训资料通过 multer 上传，保存在 `server/uploads/` 目录
- 前端通过 Vite proxy 访问后端，开发环境无需跨域配置
- 如需重置数据，删除 `server/data.db` 和 `server/uploads/` 后重启服务即可
- seed 数据包含 3 门课程和 2 场考试（各 10 题），方便直接体验完整流程
