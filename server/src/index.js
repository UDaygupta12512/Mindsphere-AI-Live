import express from 'express'; 
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import { initializeGemini } from './services/geminiService.js';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import catalogRoutes from './routes/catalog.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import quizRoutes from './routes/quiz.js';
import flashcardsRoutes from './routes/flashcards.js';
import lessonsRoutes from './routes/lessons.js';
import youtubeTestRoutes from './routes/youtubeTest.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/test', youtubeTestRoutes);

app.use((req, res) => {
  console.log(`404 Error: Route not found for ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

const startServer = async () => {
  try {
    await connectDB();
    initializeGemini();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT}`);
      console.log(`📡 API URL: http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
 