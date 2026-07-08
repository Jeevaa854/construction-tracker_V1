# 🏗️ Construction Project Tracking System (MERN)

A complete MERN‑stack application for managing construction projects with authentication, role‑based access control, tasks, resources, budgets, progress tracking, notifications, and reporting.

---

## 🚀 Features

### Backend (Express + MongoDB/Mongoose)
- **Auth & RBAC**: Register, login, logout, forgot/reset password, JWT, roles (`admin`, `manager`, `worker`)
- **Users**: CRUD, search, pagination, role assignment, avatar upload (Cloudinary)
- **Projects**: CRUD, assign managers/workers, milestones, status/priority, archive
- **Tasks**: CRUD, assignment, comments, file attachments, progress %, deadlines
- **Resources**: CRUD for equipment/material/tools/vehicles, vendors, allocation, maintenance
- **Budgets**: Plans, category breakdown, expense workflow, 90% budget alerts
- **Progress**: Logs (daily/weekly), site photos, auto completion sync
- **Notifications**: In‑app + email, preferences, read/unread
- **Reports**: Project PDF (PDFKit), Budget Excel (ExcelJS), Worker performance Excel
- **Security**: Helmet, CORS, rate limiting, sanitization, XSS protection, audit log

### Frontend (React + Vite + Tailwind)
- **Auth Pages**: Landing, Login, Register, Forgot/Reset Password  
- **Dashboard**: Live charts (Recharts)  
- **Projects**: Overview / Tasks / Budget / Progress tabs  
- **Tasks**: Global board, filters, comments  
- **Resources & Budgets**: CRUD + expense recording  
- **Reports**: One‑click downloads  
- **Notifications**: Inbox  
- **Profile & Settings**: Avatar upload, password, notification prefs  
- **UI**: Dark mode, glassmorphism, protected routing, toast feedback  

---

## ⚙️ Setup

### Backend
```bash
cd backend
cp .env.example .env   # Fill: MONGO_URI, JWT_SECRET, SMTP_*, CLOUDINARY_*
###Frontend
bash
cd frontend
npm install
npm run dev


📑 API Endpoints
Auth → /api/v1/auth/* (register, login, logout, me, forgot/reset/change password)

Users → /api/v1/users, /api/v1/users/:id, /users/me/avatar

Projects → /api/v1/projects, /api/v1/projects/:id, /projects/:id/workers

Tasks → /api/v1/tasks, /api/v1/tasks/:id, /tasks/:id/comments, /tasks/:id/attachments

Resources → /api/v1/resources, /api/v1/resources/:id, /resources/:id/maintenance

Budgets → /api/v1/budgets, /budgets/expenses, /budgets/expenses/:id/status

Progress → /api/v1/progress, /progress/:id, /progress/:id/photos

Notifications → /api/v1/notifications

Reports → /reports/project/:id/pdf, /budget/excel, /workers/excel


📂 Folder Structure
construction-tracker/
├── backend/
│   ├── config/        # db, cloudinary
│   ├── models/        # User, Project, Task, Resource, Budget, Expense, Progress, Notification, ActivityLog
│   ├── middleware/    # auth, errorHandler, validate, upload
│   ├── controllers/   # auth, user, project, task, resource, budget, progress, notification, report
│   ├── routes/        # same modules
│   ├── utils/         # generateToken, sendEmail, logActivity, notify
│   ├── app.js / server.js / package.json / .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── context/AuthContext.jsx
    │   ├── components/ Navbar, ProtectedRoute, Modal, Pagination, Badge
    │   ├── pages/ Landing, Login, Register, ForgotPassword, ResetPassword,
    │   │   Dashboard, Projects, ProjectDetail, Tasks, Resources, Budgets,
    │   │   Reports, Notifications, Profile, Settings, NotFound
    │   ├── App.jsx / main.jsx / index.css
    ├── index.html / tailwind.config.js / vite.config.js / package.json

npm install
npm run dev
