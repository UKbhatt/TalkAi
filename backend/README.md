# AI Chat Backend

A complete Node.js backend API for the AI Chat application built with Express, MongoDB, and Socket.io.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: Registration, login, profile management
- **Chat System**: Real-time messaging with conversation management
- **Credits System**: Token-based usage tracking
- **Notifications**: Real-time notification system
- **Security**: Rate limiting, input validation, CORS protection

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-chat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. Start MongoDB (make sure it's running on your system)

4. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Chat
- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `DELETE /api/chat/conversations/:id` - Delete conversation

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/notifications` - Get user notifications
- `PUT /api/user/notifications/:id/read` - Mark notification as read
- `PUT /api/user/notifications/read-all` - Mark all notifications as read
- `DELETE /api/user/notifications/:id` - Delete notification
- `GET /api/user/stats` - Get user statistics

## Database Models

### User
- username, email, password
- credits, plan, preferences
- isActive, lastLogin

### Conversation
- title, userId
- settings (model, temperature, maxTokens)
- metadata (messageCount, totalTokens)

### Message
- conversationId, userId, content, role
- metadata (tokens, model, processingTime)
- isEdited, editedAt

### Notification
- userId, title, message, type
- isRead, readAt, actionUrl
- metadata (source, priority)

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet for security headers

## Real-time Features

- Socket.io integration for real-time messaging
- Live notification updates
- Conversation updates

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ai-chat |
| JWT_SECRET | JWT signing secret | - |
| OPENAI_API_KEY | OpenAI API key | - |
| ANTHROPIC_API_KEY | Anthropic API key | - |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## Development

The server runs on port 5000 by default. Make sure MongoDB is running and accessible at the configured URI.

For development, use `npm run dev` which uses nodemon for auto-restart on file changes.
