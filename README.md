# Dissertation Registration Web Application

A web application for managing dissertation registration requests between students and professors.

## Features

### Student Features

- Register/Login to account
- Browse available registration sessions
- Submit preliminary dissertation requests to professors
- Track the status of submitted requests
- View approval/rejection reasons

### Professor Features

- Register/Login to account
- Create and manage registration sessions with time constraints
- Review student requests
- Approve requests (with student limit per session)
- Reject requests with justification

## Architecture

### Technology Stack

- **Frontend**: React 19 + Vite + React Router
- **Backend**: Express.js (Node.js)
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful

### Project Structure

```
├── backend/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware (authentication)
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── uploads/         # File upload directory
│   └── server.js        # Main server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   ├── styles/      # CSS files
│   │   ├── utils/       # API utilities
│   │   ├── App.jsx      # Main App component
│   │   └── main.jsx     # Entry point
│   └── vite.config.js   # Vite configuration
```

## Database Schema

### Users

- `id` (INT, PK)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, hashed)
- `firstName` (VARCHAR)
- `lastName` (VARCHAR)
- `role` (ENUM: 'student', 'professor')
- `createdAt`, `updatedAt` (DATETIME)

### RegistrationSessions

- `id` (INT, PK)
- `professorId` (INT, FK -> Users)
- `title` (VARCHAR)
- `description` (TEXT)
- `startDate` (DATETIME)
- `endDate` (DATETIME)
- `maxStudents` (INT, default 5)
- `isActive` (BOOLEAN)
- `createdAt`, `updatedAt` (DATETIME)

### DissertationRequests

- `id` (INT, PK)
- `sessionId` (INT, FK -> RegistrationSessions)
- `studentId` (INT, FK -> Users)
- `professorId` (INT, FK -> Users)
- `status` (ENUM: 'pending', 'approved', 'rejected')
- `rejectionReason` (TEXT, nullable)
- `dissertationTitle` (VARCHAR)
- `preliminaryRequestFile` (VARCHAR, file path)
- `signedCoordinationRequestFile` (VARCHAR, file path)
- `professorReviewFile` (VARCHAR, file path)
- `createdAt`, `updatedAt` (DATETIME)

## Business Logic

1. **Session Management**: Professors can create registration sessions that cannot temporally overlap.

2. **Request Workflow**:

   - Student submits a preliminary request during an active session
   - Professor approves/rejects the request
   - If approved, professor provides student slots (limited by maxStudents)
   - Student cannot be approved by multiple professors simultaneously

3. **Validation**:
   - Sessions must have end date after start date
   - No overlapping sessions per professor
   - Session must be active (current time between startDate and endDate)
   - Student can only have one pending request per session
   - Student cannot be approved by multiple professors

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:

   ```
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your_secret_key_here
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` file (copy from `.env.example`):

   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with backend URL:

   ```
   VITE_API_URL=http://localhost:8080/api
   ```

5. Start the frontend dev server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Student Routes (Protected)

- `GET /api/student/sessions` - Get available active sessions
- `GET /api/student/requests` - Get all student requests
- `POST /api/student/requests` - Submit new request
- `GET /api/student/requests/:id` - Get specific request details

### Professor Routes (Protected)

- `GET /api/professor/sessions` - Get professor's sessions
- `POST /api/professor/sessions` - Create new session
- `GET /api/professor/sessions/:sessionId/requests` - Get session requests
- `PUT /api/professor/requests/:requestId/approve` - Approve request
- `PUT /api/professor/requests/:requestId/reject` - Reject request

## Usage

### As a Student

1. Register an account with role "student"
2. View available sessions during their active periods
3. Submit requests to professors
4. Track request status in "My Requests" tab

### As a Professor

1. Register an account with role "professor"
2. Create registration sessions with time boundaries and student limits
3. Review pending student requests
4. Approve requests (up to maxStudents limit) or reject with reason

## Build for Production

### Backend

```bash
cd backend
npm install
npm start  # Runs without nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run build  # Creates dist/ folder
npm run preview  # Preview production build locally
```

## Deployment

### Option 1: Heroku

```bash
git push heroku main
```

### Option 2: Vercel (Frontend Only)

```bash
vercel
```

### Option 3: AWS / Azure / Google Cloud

Follow platform-specific deployment guides.

## Testing

### Manual Testing Workflow

1. **Register two users**:

   - One as professor
   - One as student

2. **Professor creates session**:

   - Set start/end dates (current time)
   - Set max students to 2

3. **Student submits request**:

   - Select active session
   - Enter dissertation title
   - Submit

4. **Professor reviews and approves**:

   - Check request in session
   - Approve or reject

5. **Student verifies status**:
   - Check "My Requests" for update

## Future Enhancements

- File upload for signed documents
- Email notifications
- Student evaluation scoring
- Advanced filtering and search
- Dashboard analytics
- Two-factor authentication
- Role-based permissions refinement

## Contributing

1. Create a feature branch
2. Make changes with clear commit messages
3. Submit pull request

## License

Project for educational purposes.

## Support

For issues or questions, contact the development team.

---

**Last Updated**: January 2026
