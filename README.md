# Task Manager Assignment

> 🚀 **Live Deployment:** [https://task-manager-internshala.vercel.app/](https://task-manager-internshala.vercel.app/)

This repository is now split cleanly into `frontend/` and `backend/`, with this root `README.md` as the main guide.

## Structure

```text
.
├── backend/
│   ├── docs/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Tech Stack

- Backend: `Node.js`, `Express.js`, `MongoDB`, `Mongoose`, `JWT`, `Zod`
- Frontend: `React.js`, `Vite`

## Install

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

## Run

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Backend Setup

Create `backend/.env` from `backend/.env.example`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/task-manager-internshala
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

If you use MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

## URLs

Development:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

Production-style flow:

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Start backend:
   ```bash
   cd backend
   npm start
   ```

Then the frontend is served by the backend at `http://localhost:5000`.

## Role-Based Access Control (RBAC)

This application strictly separates capabilities between different user roles, guaranteeing a seamless and secure Jira-like task flow.

### User
- **Create & View**: Can create personal tasks and view tasks that they created or were officially assigned to them by an Admin.
- **Status Control**: Has explicit permission to freely transition the active status (Pending, In-Progress, Completed) of their available tasks.
- **Request Updates**: Cannot arbitrarily rename governed tasks, but can click "Update" to submit a formal Title Update Request for an Admin to review.

### Admin
- **View All Entities**: Has full database visibility to view all Tasks across the whole system and all registered Users.
- **Assignment Privilege**: Holds the sole right to actively assign a task directly to any specific user exclusively during the Task's creation.
- **Update & Deletion Ownership**: Can natively overwrite titles, override logic, and permanently delete tasks across the board without restriction.
- **Request Handling**: Intercepts all user-submitted "Pending Update Requests" rendering on task cards, holding the power to "Approve" or "Reject" them.
- **Administrative Dashboard**: Can access the exclusive Admin Summary containing dynamically generated aggregate totals spanning the full system state.

## Postman

Import `backend/docs/postman_collection.json` into Postman.

Use:

- `baseUrl = http://localhost:5000`
- `token = <jwt after login>`
- `taskId = <task id after create>`

## Main API Routes

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
- `GET /api/v1/tasks/admin/summary`


