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

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please authenticate.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please authenticate again.' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please authenticate again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please authenticate again.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
};

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

    // Update last accessed
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
      sourceType,
      source,
      title: title || 'Untitled Course',
      user: decoded.userId,
      ...catalogCourse
    };

    const course = new Course(courseData);
    await course.save();

    // Add course to user's courses
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
      { $set: req.body },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

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

    // Remove from user's courses
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

// Get catalog courses (pre-made courses)
app.get('/api/catalog', async (req, res) => {
  try {
    // Return sample catalog courses
    const catalogCourses = [
      {
        _id: 'catalog-1',
        title: 'Introduction to Machine Learning',
        description: 'Learn the fundamentals of machine learning and AI',
        category: 'Technology',
        level: 'Beginner',
        duration: '8 hours',
        rating: 4.8,
        studentsEnrolled: 15420,
        instructor: 'Dr. Sarah Chen',
        thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
        topics: ['Python', 'NumPy', 'Scikit-learn', 'Neural Networks'],
        whatYouLearn: ['Understand ML algorithms', 'Build predictive models', 'Work with real datasets']
      },
      {
        _id: 'catalog-2',
        title: 'Web Development Bootcamp',
        description: 'Complete guide to modern web development',
        category: 'Technology',
        level: 'Intermediate',
        duration: '12 hours',
        rating: 4.9,
        studentsEnrolled: 28500,
        instructor: 'John Smith',
        thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800',
        topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
        whatYouLearn: ['Build responsive websites', 'Create React applications', 'Backend development']
      },
      {
        _id: 'catalog-3',
        title: 'Data Science Essentials',
        description: 'Master data analysis and visualization',
        category: 'Data Science',
        level: 'Intermediate',
        duration: '10 hours',
        rating: 4.7,
        studentsEnrolled: 12300,
        instructor: 'Emily Johnson',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        topics: ['Python', 'Pandas', 'Matplotlib', 'SQL'],
        whatYouLearn: ['Data cleaning', 'Statistical analysis', 'Data visualization']
      }
    ];

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

    // Create a new course from catalog
    const course = new Course({
      title: req.body.title || 'Catalog Course',
      description: req.body.description,
      sourceType: 'catalog',
      category: req.body.category,
      level: req.body.level,
      duration: req.body.duration,
      instructor: req.body.instructor,
      thumbnail: req.body.thumbnail,
      topics: req.body.topics,
      whatYouLearn: req.body.whatYouLearn,
      user: decoded.userId
    });

    await course.save();

    // Add to user's enrolled courses
    await User.findByIdAndUpdate(decoded.userId, {
      $push: { enrolledCourses: course._id }
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

    res.json({
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Catch-all for other routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Export for Vercel serverless
export default app;
