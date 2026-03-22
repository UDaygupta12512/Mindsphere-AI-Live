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
import achievementsRoutes from './routes/achievements.js';
import certificatesRoutes from './routes/certificates.js';
import pointsRoutes from './routes/points.js';

dotenv.config({ path: '../.env.production' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// In development, allow all origins for easier testing
// Note: credentials:true is incompatible with origin:'*' per CORS spec
const corsConfig = process.env.NODE_ENV === 'production'
  ? {
      origin: [
        'https://mind-sphere-nine.vercel.app',
        'https://mind-sphere-cyan.vercel.app',
        'http://localhost:5173'
      ],
      credentials: true
    }
  : {
      origin: true,
      credentials: true
    };

app.use(cors(corsConfig));
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
app.use('/api/achievements', achievementsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/test', youtubeTestRoutes);

// Friendly root route for browser visits
app.get('/', (req, res) => {
  res.send('<h1>MindSphere v1.0 ✨</h1><p>API is running. Health: <a href="/api/health">/api/health</a></p>');
});

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
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set. Authentication will fail.');
      process.exit(1);
    }
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
