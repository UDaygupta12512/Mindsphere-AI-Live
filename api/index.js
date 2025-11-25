import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  cachedDb = connection;
  console.log('✅ MongoDB connected');
  return cachedDb;
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  subscription: { type: String, enum: ['free', 'premium'], default: 'free' },
  lastActivityDate: { type: Date, default: Date.now },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Course Schema
const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: String,
  videoUrl: String,
  content: String,
  isCompleted: { type: Boolean, default: false },
  order: Number,
  resources: [{
    title: String,
    type: { type: String, enum: ['pdf', 'link', 'code', 'image'] },
    url: String,
    size: String
  }],
  transcript: String
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  summary: String,
  sourceType: { type: String, enum: ['youtube', 'pdf', 'text', 'catalog'], required: true },
  source: String,
  sourceUrl: String,
  fileName: String,
  thumbnail: String,
  category: String,
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  duration: String,
  rating: { type: Number, default: 0 },
  studentsEnrolled: { type: Number, default: 0 },
  instructor: String,
  topics: [String],
  whatYouLearn: [String],
  requirements: [String],
  lessons: [lessonSchema],
  notes: [{
    title: String,
    summary: [String],
    topics: [String]
  }],
  quizzes: [{
    title: String,
    questions: [{
      type: { type: String, enum: ['multiple-choice', 'true-false', 'fill-blank', 'coding'] },
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String,
      explanations: { type: Map, of: String },
      correctExplanation: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
    }],
    completedAt: Date,
    score: Number
  }],
  flashcards: [{
    front: String,
    back: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    lastReviewed: Date,
    nextReview: Date,
    reviewCount: { type: Number, default: 0 }
  }],
  totalLessons: { type: Number, default: 0 },
  completedLessons: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  certificate: { type: Boolean, default: false },
  lastAccessed: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Catalog courses data
const catalogCourses = [
  {
    id: 'catalog-1',
    title: 'Complete Web Development Bootcamp',
    description: 'Master modern web development with HTML, CSS, JavaScript, React, Node.js, and more.',
    instructor: 'Dr. Sarah Chen',
    thumbnail: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Programming',
    level: 'Beginner',
    duration: '45 hours',
    rating: 4.9,
    studentsEnrolled: 15234,
    totalLessons: 42,
    topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    summary: 'From zero to full-stack developer.',
    whatYouLearn: ['Build responsive websites', 'Master React.js', 'Create full-stack apps'],
    requirements: ['No experience required', 'Computer with internet']
  },
  {
    id: 'catalog-2',
    title: 'Data Science and Machine Learning',
    description: 'Learn data science, machine learning, and AI with Python.',
    instructor: 'Prof. Michael Rodriguez',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Data Science',
    level: 'Intermediate',
    duration: '60 hours',
    rating: 4.8,
    studentsEnrolled: 12567,
    totalLessons: 38,
    topics: ['Python', 'Machine Learning', 'Data Analysis', 'Neural Networks'],
    summary: 'Become a data scientist.',
    whatYouLearn: ['Master Python', 'Build ML models', 'Statistical analysis'],
    requirements: ['Basic Python', 'Math background']
  },
  {
    id: 'catalog-3',
    title: 'Digital Marketing Mastery',
    description: 'Complete digital marketing course covering SEO, social media, and analytics.',
    instructor: 'Emma Thompson',
    thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Business',
    level: 'Beginner',
    duration: '30 hours',
    rating: 4.7,
    studentsEnrolled: 18903,
    totalLessons: 28,
    topics: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
    summary: 'Master digital marketing strategies.',
    whatYouLearn: ['Master SEO', 'Social media campaigns', 'Email marketing'],
    requirements: ['No experience needed', 'Social media access']
  },
  {
    id: 'catalog-4',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn user interface and experience design principles with Figma.',
    instructor: 'Alex Kim',
    thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Design',
    level: 'Beginner',
    duration: '25 hours',
    rating: 4.8,
    studentsEnrolled: 9876,
    totalLessons: 32,
    topics: ['UI Design', 'UX Research', 'Figma', 'Prototyping'],
    summary: 'Master UI/UX design.',
    whatYouLearn: ['Design principles', 'Figma mastery', 'User research'],
    requirements: ['No experience required', 'Install Figma']
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API is running' });
});

// ==================== AUTH ROUTES ====================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    await connectToDatabase();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sync courses to enrolledCourses
    if (user.courses && user.courses.length > 0) {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { enrolledCourses: { $each: user.courses } },
        lastActivityDate: new Date()
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login. Please try again.' });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ==================== COURSES ROUTES ====================

// Get all courses for user
app.get('/api/courses', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const courses = await Course.find({ user: decoded.userId }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course
app.get('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const course = await Course.findOne({ _id: req.params.id, user: decoded.userId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.lastAccessed = new Date();
    await course.save();

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course
app.post('/api/courses', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { sourceType, source, title, catalogCourse } = req.body;

    let courseData = {
      sourceType: sourceType || 'text',
      source,
      title: title || 'Untitled Course',
      user: decoded.userId,
      thumbnail: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
      ...catalogCourse
    };

    const course = new Course(courseData);
    await course.save();

    await User.findByIdAndUpdate(decoded.userId, {
      $push: { courses: course._id, enrolledCourses: course._id }
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
app.patch('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, user: decoded.userId },
      { $set: { ...req.body, lastAccessed: new Date() } },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await User.findByIdAndUpdate(decoded.userId, { lastActivityDate: new Date() });

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const course = await Course.findOneAndDelete({ _id: req.params.id, user: decoded.userId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await User.findByIdAndUpdate(decoded.userId, {
      $pull: { courses: course._id, enrolledCourses: course._id }
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ==================== CATALOG ROUTES ====================

// Get catalog courses
app.get('/api/catalog', (req, res) => {
  try {
    res.json(catalogCourses);
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Enroll in catalog course
app.post('/api/catalog/:id/enroll', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const catalogCourse = catalogCourses.find(c => c.id === req.params.id);
    if (!catalogCourse) {
      return res.status(404).json({ error: 'Catalog course not found' });
    }

    // Check if already enrolled
    const existingCourse = await Course.findOne({
      user: decoded.userId,
      title: catalogCourse.title,
      sourceType: 'catalog'
    });

    if (existingCourse) {
      return res.status(400).json({ error: 'Already enrolled in this course', course: existingCourse });
    }

    const course = new Course({
      title: catalogCourse.title,
      description: catalogCourse.description,
      summary: catalogCourse.summary,
      sourceType: 'catalog',
      source: catalogCourse.title,
      thumbnail: catalogCourse.thumbnail,
      category: catalogCourse.category,
      level: catalogCourse.level,
      duration: catalogCourse.duration,
      rating: catalogCourse.rating,
      studentsEnrolled: catalogCourse.studentsEnrolled,
      instructor: catalogCourse.instructor,
      topics: catalogCourse.topics,
      whatYouLearn: catalogCourse.whatYouLearn,
      requirements: catalogCourse.requirements,
      totalLessons: catalogCourse.totalLessons || 10,
      completedLessons: 0,
      progress: 0,
      certificate: true,
      user: decoded.userId,
      lastAccessed: new Date()
    });

    await course.save();

    await User.findByIdAndUpdate(decoded.userId, {
      $push: { courses: course._id, enrolledCourses: course._id },
      lastActivityDate: new Date()
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// ==================== ANALYTICS ROUTES ====================

app.get('/api/analytics', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    const courses = await Course.find({ user: decoded.userId });

    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const totalLessons = courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0);
    const completedLessons = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);

    // Calculate quiz scores
    let totalQuizScore = 0;
    let quizCount = 0;
    courses.forEach(course => {
      if (course.quizzes) {
        course.quizzes.forEach(quiz => {
          if (quiz.score !== undefined) {
            totalQuizScore += quiz.score;
            quizCount++;
          }
        });
      }
    });

    const averageQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;

    // Generate daily activity (last 14 days)
    const dailyActivity = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyActivity.push({
        date: date.toISOString(),
        lessonsCompleted: Math.floor(Math.random() * 3),
        quizzesTaken: Math.floor(Math.random() * 2),
        timeSpent: Math.floor(Math.random() * 60) + 15,
        flashcardsReviewed: Math.floor(Math.random() * 10)
      });
    }

    // Generate weekly stats
    const weeklyStats = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      weeklyStats.push({
        week: `Week ${4 - i} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`,
        lessonsCompleted: Math.floor(Math.random() * 10) + completedLessons,
        quizzesTaken: quizCount + Math.floor(Math.random() * 5),
        totalTimeSpent: Math.floor(Math.random() * 300) + 60,
        averageQuizScore: averageQuizScore || Math.floor(Math.random() * 30) + 70,
        flashcardsReviewed: Math.floor(Math.random() * 30)
      });
    }

    // Get all topics from courses
    const allTopics = courses.flatMap(c => c.topics || []);
    const uniqueTopics = [...new Set(allTopics)];
    const masteredTopics = uniqueTopics.slice(0, Math.min(3, uniqueTopics.length));
    const inProgressTopics = uniqueTopics.slice(3, Math.min(6, uniqueTopics.length));

    // Achievements
    const achievements = [
      { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', progress: completedLessons > 0 ? 100 : 0, unlockedDate: completedLessons > 0 ? new Date().toISOString() : null },
      { id: '2', name: 'Quiz Master', description: 'Score 80%+ on 5 quizzes', icon: '🏆', progress: Math.min(quizCount * 20, 100), unlockedDate: quizCount >= 5 ? new Date().toISOString() : null },
      { id: '3', name: 'Dedicated Learner', description: 'Maintain a 7-day streak', icon: '🔥', progress: Math.min((user?.currentStreak || 0) * 14, 100), unlockedDate: (user?.currentStreak || 0) >= 7 ? new Date().toISOString() : null },
      { id: '4', name: 'Course Completer', description: 'Complete your first course', icon: '📚', progress: completedCourses > 0 ? 100 : (courses.length > 0 ? Math.max(...courses.map(c => c.progress || 0)) : 0), unlockedDate: completedCourses > 0 ? new Date().toISOString() : null },
      { id: '5', name: 'Knowledge Seeker', description: 'Enroll in 5 courses', icon: '🌟', progress: Math.min(totalCourses * 20, 100), unlockedDate: totalCourses >= 5 ? new Date().toISOString() : null },
      { id: '6', name: 'Flash Card Pro', description: 'Review 100 flashcards', icon: '⚡', progress: Math.floor(Math.random() * 60) + 20 }
    ];

    res.json({
      success: true,
      data: {
        overview: {
          totalCoursesEnrolled: totalCourses,
          totalCoursesCompleted: completedCourses,
          totalLessonsCompleted: completedLessons,
          averageQuizScore: averageQuizScore,
          totalStudyTime: Math.floor(Math.random() * 500) + 120,
          currentStreak: user?.currentStreak || 0,
          longestStreak: user?.longestStreak || 0,
          lastActivityDate: user?.lastActivityDate?.toISOString() || new Date().toISOString()
        },
        courseProgress: courses.map(c => ({
          courseId: c._id.toString(),
          courseTitle: c.title,
          progress: c.progress || 0,
          lessonsCompleted: c.completedLessons || 0,
          totalLessons: c.totalLessons || 0,
          quizzesTaken: c.quizzes?.length || 0,
          averageQuizScore: c.quizzes?.length > 0 
            ? Math.round(c.quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / c.quizzes.length) 
            : 0,
          timeSpent: Math.floor(Math.random() * 120) + 30,
          enrolledDate: c.createdAt?.toISOString() || new Date().toISOString(),
          lastAccessedDate: c.lastAccessed?.toISOString() || new Date().toISOString(),
          status: c.progress === 100 ? 'Completed' : c.progress > 0 ? 'In Progress' : 'Not Started'
        })),
        dailyActivity,
        weeklyStats,
        achievements,
        learningStats: {
          totalMinutesLearned: Math.floor(Math.random() * 500) + 120,
          averageStudySession: Math.floor(Math.random() * 30) + 15,
          preferredStudyTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
          mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
          topicsMastered: masteredTopics,
          topicsInProgress: inProgressTopics
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==================== CHAT ROUTES ====================

app.post('/api/chat', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple AI response (you can integrate with Gemini API later)
    const reply = `I understand you're asking about: "${message}". This is a placeholder response. The full AI chat functionality requires Gemini API integration.`;

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ==================== QUIZ ROUTES ====================

app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { title, source, content } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Placeholder quiz questions
    const quizQuestions = [
      {
        type: 'multiple-choice',
        question: `What is the main topic of ${title}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'A',
        explanation: 'This is the correct answer based on the course content.'
      }
    ];

    res.json({ success: true, quizQuestions });
  } catch (error) {
    console.error('Quiz generate error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ==================== FLASHCARDS ROUTES ====================

app.post('/api/flashcards/generate', async (req, res) => {
  try {
    const { title, source, content } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Placeholder flashcards
    const flashcards = [
      { front: `What is ${title}?`, back: 'A course about learning new concepts.', difficulty: 'easy' }
    ];

    res.json({ success: true, flashcards });
  } catch (error) {
    console.error('Flashcards generate error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// ==================== LESSONS ROUTES ====================

app.post('/api/lessons/generate', async (req, res) => {
  try {
    const { title, source, content } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Placeholder lessons
    const lessons = [
      { title: 'Introduction', description: 'Getting started', duration: '10 min', order: 1 }
    ];

    res.json({ success: true, lessons });
  } catch (error) {
    console.error('Lessons generate error:', error);
    res.status(500).json({ error: 'Failed to generate lessons' });
  }
});

// Catch-all for other routes
app.all('/api/*', (req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'API route not found' });
});

// Export for Vercel serverless
export default app;
