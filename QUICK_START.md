# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Start Servers

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env
npm run dev

# Terminal 2 - Frontend (after backend starts)
cd frontend
cp .env.example .env.local
npm run dev
```

### 3. Access Application

- Frontend: http://localhost:5173
- API: http://localhost:8080/api

## Quick Test

### 1. Create Professor Account

- Go to http://localhost:5173/register
- Email: prof@test.com
- Password: test123
- Name: Jane Doe
- Role: **Professor**
- Click Register

### 2. Create Student Account

- Logout or open in private window
- Go to http://localhost:5173/register
- Email: student@test.com
- Password: test123
- Name: John Smith
- Role: **Student**
- Click Register

### 3. Professor: Create Session

- Log in as professor
- Dashboard shows "Create New Session"
- Fill in:
  - Title: "Summer 2026 Dissertations"
  - Description: "Dissertation coordination sessions"
  - Start: Today at current time (or future)
  - End: 1 week from now
  - Max Students: 2
- Click Create

### 4. Student: Submit Request

- Log in as student
- Dashboard shows available sessions
- Click "Submit Request"
- Enter dissertation title: "Machine Learning Applications"
- Click Submit

### 5. Professor: Review & Approve

- Log in as professor
- Click on the session you created
- See student's request
- Click "Approve"
- Request status changes to APPROVED

### 6. Student: Check Status

- Log in as student
- Click "My Requests" tab
- See request status is now APPROVED

## File Locations

| File                   | Purpose                   |
| ---------------------- | ------------------------- |
| `backend/server.js`    | Backend entry point       |
| `frontend/src/App.jsx` | Frontend routing          |
| `backend/models/`      | Database models           |
| `backend/routes/`      | API endpoints             |
| `frontend/src/pages/`  | Page components           |
| `README.md`            | Full documentation        |
| `PROJECT_STATUS.md`    | Project completion status |

## Troubleshooting

### Port 8080 Already in Use

```bash
# Kill process on port 8080
lsof -i :8080 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Port 5173 Already in Use

```bash
# Change Vite port in frontend/vite.config.js
# Or kill process: lsof -i :5173 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Database Issues

```bash
# Delete SQLite database to reset
rm backend/database.sqlite
# Restart backend to recreate
```

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## API Test Examples

### Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"prof@test.com",
    "password":"test123",
    "firstName":"Jane",
    "lastName":"Doe",
    "role":"professor"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prof@test.com","password":"test123"}'
```

### Get Sessions (use token from login response)

```bash
curl -X GET http://localhost:8080/api/professor/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Default Test Credentials

After completing the quick test above:

**Professor**

- Email: prof@test.com
- Password: test123

**Student**

- Email: student@test.com
- Password: test123

## Features to Test

### Professor Features

- [x] Create registration sessions
- [x] Set session capacity
- [x] View all sessions
- [x] See pending requests
- [x] Approve requests
- [x] Reject requests with reason
- [ ] Upload files (prepared for future)

### Student Features

- [x] View active sessions
- [x] Submit dissertation requests
- [x] See request status
- [x] Track approvals/rejections
- [ ] Upload coordination documents (prepared for future)

## Performance Notes

- First load may take a few seconds (database sync)
- Subsequent loads should be instant
- All data stored locally in SQLite

## Next Steps

1. Test all features thoroughly
2. Create more test accounts
3. Test error scenarios
4. Verify database relationships
5. Check responsive design on mobile

---

**Happy Testing!**
