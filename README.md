# Farmer Assistant - AI-Powered Voice Assistant for Farmers

An intelligent web application that helps farmers get instant answers to their agricultural queries through voice-based conversations powered by AI.

## Features

- **Secure Authentication** - Email verification with OTP
- **Voice Conversations** - Real-time speech-to-text and text-to-speech
- **AI-Powered Responses** - Gemini AI for accurate agricultural guidance
- **Responsive Design** - Works on desktop and mobile devices
- **Conversation History** - Track all past conversations
- **WebSocket Support** - Real-time communication

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.io for WebSockets
- JWT for authentication
- Nodemailer for email verification
- Bcrypt for password hashing

### Frontend
- React 18
- Tailwind CSS
- Zustand for state management
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications
- Lucide React for icons

## Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Gmail account (for email verification)
- Gemini AI API key (coming soon)

## Getting Started

### 1. Clone the Repository

\`\`\`bash
cd Capstone
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env file with your credentials
\`\`\`

**Configure Backend Environment Variables (.env):**

\`\`\`env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/farmer-assistant

# JWT Secrets (change these!)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# OTP
OTP_EXPIRE_MINUTES=10

# Frontend URL
FRONTEND_URL=http://localhost:5173
\`\`\`

**Gmail App Password Setup:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use that password in EMAIL_PASSWORD

### 3. Frontend Setup

\`\`\`bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
\`\`\`

**Configure Frontend Environment Variables (.env):**

\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

### 4. Start MongoDB

Make sure MongoDB is running:

\`\`\`bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) - update MONGODB_URI in backend .env
\`\`\`

### 5. Run the Application

**Terminal 1 - Backend:**
\`\`\`bash
cd backend
npm run dev
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd frontend
npm run dev
\`\`\`

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

\`\`\`
Capstone/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   └── User.model.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── utils/
│   │   ├── email.js
│   │   └── jwt.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── VerifyOTP.jsx
    │   │   └── Dashboard.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── auth.service.js
    │   ├── store/
    │   │   └── authStore.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    ├── package.json
    └── vite.config.js
\`\`\`

## API Endpoints

### Authentication

- **POST** \`/api/auth/register\` - Register new user
- **POST** \`/api/auth/verify-otp\` - Verify OTP
- **POST** \`/api/auth/resend-otp\` - Resend OTP
- **POST** \`/api/auth/login\` - Login user
- **POST** \`/api/auth/refresh-token\` - Refresh access token
- **GET** \`/api/auth/me\` - Get current user (Protected)

## Current Status

### Completed
- Backend authentication system
- User registration with OTP
- Email verification via nodemailer
- Login with JWT tokens
- Token refresh mechanism
- Protected routes middleware
- Rate limiting and security
- Frontend authentication UI
- Landing page
- Login/Register pages
- OTP verification page
- Dashboard page
- Zustand state management
- Protected routes

### In Progress
- WebSocket integration
- Gemini AI integration
- Speech-to-text service
- Text-to-speech service
- Voice call interface
- Conversation history

## Testing the Application

1. **Register a New Account:**
   - Go to http://localhost:5173
   - Click "Get Started" or "Register"
   - Fill in your details
   - Check your email for OTP

2. **Verify Email:**
   - Enter the 6-digit OTP from your email
   - You'll be redirected to the dashboard

3. **Login:**
   - Use your email and password
   - Access the dashboard

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Token refresh mechanism
- Rate limiting on auth endpoints
- Helmet for security headers
- CORS configuration
- OTP expiry and attempt limits

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check MONGODB_URI in .env file

### Email Not Sending
- Verify Gmail credentials
- Enable "Less secure app access" or use App Password
- Check EMAIL_USER and EMAIL_PASSWORD in .env

### Port Already in Use
- Change PORT in backend .env
- Update VITE_API_URL in frontend .env accordingly

## Next Steps

1. Integrate Socket.io for real-time communication
2. Add Gemini AI API for intelligent responses
3. Implement speech-to-text functionality
4. Implement text-to-speech functionality
5. Build voice call interface
6. Add conversation history storage
7. Create profile management
8. Add multilingual support

## Contributing

This is a capstone project. Contributions and suggestions are welcome!

## License

This project is for educational purposes.

## Author

Capstone Project - Farmer Assistant

---

**Need Help?** Check the code comments or reach out for support!
