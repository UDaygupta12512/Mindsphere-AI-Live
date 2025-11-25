import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ==================== AI SERVICE ====================
let genAI = null;
let geminiModel = null;
let aiInitialized = false;

// Multi-key rotation variables
let geminiKeys = [];
let openrouterKeys = [];
let currentGeminiIndex = 0;
let currentOpenRouterIndex = 0;

// Gemini model fallback chain
const geminiModels = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite', 
  'gemini-2.5-pro'
];
let currentModelIndex = 0;

// OpenRouter model configurations
const openrouterModels = {
  contentGeneration: ['openai/gpt-4o', 'openai/gpt-3.5-turbo'], // For quiz, flashcards, etc.
  chat: ['openai/gpt-3.5-turbo'] // For chatbot
};

function initializeAI() {
  if (aiInitialized) return;
  
  // Initialize Gemini keys (support multiple keys)
  geminiKeys = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI_API_KEY_2;
  const geminiKey3 = process.env.GEMINI_API_KEY_3;
  const geminiKeysEnv = process.env.GEMINI_API_KEYS; // Comma-separated
  
  if (geminiKeysEnv) {
    geminiKeys = geminiKeysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  
  [geminiKey, geminiKey2, geminiKey3].forEach(key => {
    if (key && !geminiKeys.includes(key)) {
      geminiKeys.push(key);
    }
  });
  
  if (geminiKeys.length > 0) {
    try {
      genAI = new GoogleGenerativeAI(geminiKeys[0]);
      geminiModel = genAI.getGenerativeModel({ model: geminiModels[0] }); // Use first model from fallback chain
      console.log(`✅ Gemini AI initialized with ${geminiKeys.length} key(s) and ${geminiModels.length} fallback models`);
    } catch (e) {
      console.error('Failed to initialize Gemini:', e.message);
    }
  }
  
  // Initialize OpenRouter keys (support multiple keys)
  openrouterKeys = [];
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openrouterKey2 = process.env.OPENROUTER_API_KEY_2;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiKey2 = process.env.OPENAI_API_KEY_2;
  const openrouterKeysEnv = process.env.OPENROUTER_API_KEYS; // Comma-separated
  
  if (openrouterKeysEnv) {
    openrouterKeys = openrouterKeysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  
  [openrouterKey, openrouterKey2, openaiKey, openaiKey2].forEach(key => {
    if (key && !openrouterKeys.includes(key)) {
      openrouterKeys.push(key);
    }
  });
  
  if (openrouterKeys.length > 0) {
    console.log(`✅ OpenRouter initialized with ${openrouterKeys.length} key(s)`);
  }
  
  if (geminiKeys.length === 0 && openrouterKeys.length === 0) {
    console.warn('⚠️ No AI API keys configured');
  }
  
  aiInitialized = true;
}

// Call Gemini API with key rotation and model fallback
async function callGemini(prompt) {
  initializeAI();
  
  if (geminiKeys.length === 0) {
    throw new Error('No Gemini keys available');
  }
  
  let lastError;
  
  // Try each model in the fallback chain
  for (let modelIdx = 0; modelIdx < geminiModels.length; modelIdx++) {
    const currentModel = geminiModels[modelIdx];
    console.log(`🔄 Trying Gemini model: ${currentModel}`);
    
    // Try all keys for this model
    const maxKeyAttempts = Math.min(geminiKeys.length, 3);
    let modelFailed = false;
    
    for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
      const currentKey = geminiKeys[currentGeminiIndex];
      
      try {
        console.log(`🤖 Calling Gemini ${currentModel} with key ${currentGeminiIndex + 1}/${geminiKeys.length}...`);
        
        // Initialize with current key and model
        const tempGenAI = new GoogleGenerativeAI(currentKey);
        const tempModel = tempGenAI.getGenerativeModel({ model: currentModel });
        
        const result = await tempModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Gemini response received from ${currentModel} with key ${currentGeminiIndex + 1}`);
        return text;
      } catch (error) {
        lastError = error;
        console.error(`❌ Gemini ${currentModel} key ${currentGeminiIndex + 1} failed:`, error.message);
        
        // Move to next key
        currentGeminiIndex = (currentGeminiIndex + 1) % geminiKeys.length;
        
        // Small delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we get here, all keys failed for this model
    console.log(`❌ All keys failed for ${currentModel}, trying next model...`);
  }
  
  // If all models and keys failed, throw the last error
  throw lastError || new Error('All Gemini models and keys failed');
}

// Call OpenRouter API for content generation with model and key rotation
async function callOpenRouterForContent(prompt) {
  initializeAI();
  
  if (openrouterKeys.length === 0) {
    throw new Error('No OpenRouter keys available');
  }
  
  let lastError;
  const modelsToTry = openrouterModels.contentGeneration;
  
  // Try each model in the fallback chain
  for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
    const currentModel = modelsToTry[modelIdx];
    console.log(`🔄 Trying OpenRouter model: ${currentModel}`);
    
    // Try all keys for this model
    const maxKeyAttempts = Math.min(openrouterKeys.length, 3);
    
    for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
      const currentKey = openrouterKeys[currentOpenRouterIndex];
      
      try {
        console.log(`🤖 Calling OpenRouter ${currentModel} with key ${currentOpenRouterIndex + 1}/${openrouterKeys.length}...`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'https://mindsphere.vercel.app',
            'X-Title': 'MindSphere AI'
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenRouter error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content in OpenRouter response');
        }
        
        console.log(`✅ OpenRouter response received from ${currentModel} with key ${currentOpenRouterIndex + 1}`);
        return content;
      } catch (error) {
        lastError = error;
        console.error(`❌ OpenRouter ${currentModel} key ${currentOpenRouterIndex + 1} failed:`, error.message);
        
        // Move to next key
        currentOpenRouterIndex = (currentOpenRouterIndex + 1) % openrouterKeys.length;
        
        // Small delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`❌ All keys failed for ${currentModel}, trying next model...`);
  }
  
  throw lastError || new Error('All OpenRouter models and keys failed');
}

// Call OpenRouter API for chat (uses 3.5-turbo only)
async function callOpenRouterForChat(prompt) {
  initializeAI();
  
  if (openrouterKeys.length === 0) {
    throw new Error('No OpenRouter keys available');
  }
  
  let lastError;
  const model = openrouterModels.chat[0]; // Always use 3.5-turbo for chat
  const maxAttempts = Math.min(openrouterKeys.length, 3);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentKey = openrouterKeys[currentOpenRouterIndex];
    
    try {
      console.log(`💬 Calling OpenRouter chat with ${model} and key ${currentOpenRouterIndex + 1}/${openrouterKeys.length}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'https://mindsphere.vercel.app',
          'X-Title': 'MindSphere AI'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in OpenRouter response');
      }
      
      console.log(`✅ OpenRouter chat response received from key ${currentOpenRouterIndex + 1}`);
      return content;
    } catch (error) {
      lastError = error;
      console.error(`❌ OpenRouter chat key ${currentOpenRouterIndex + 1} failed:`, error.message);
      
      // Move to next key
      currentOpenRouterIndex = (currentOpenRouterIndex + 1) % openrouterKeys.length;
      
      // Small delay before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError || new Error('All OpenRouter chat keys failed');
}

// Smart AI call for content generation (quiz, flashcards, etc.) - Uses OpenRouter first with model fallback
async function callAIForContent(prompt) {
  initializeAI();
  
  // Try OpenRouter first (GPT-4o -> 3.5-turbo)
  try {
    return await callOpenRouterForContent(prompt);
  } catch (openrouterError) {
    console.log('OpenRouter failed, trying Gemini...');
    try {
      return await callGemini(prompt);
    } catch (geminiError) {
      console.error('Both AI services failed for content generation');
      throw new Error('AI services unavailable');
    }
  }
}

// Smart AI call with fallback (legacy function)
async function callAI(prompt) {
  initializeAI();
  
  // Try Gemini first
  if (geminiModel) {
    try {
      return await callGemini(prompt);
    } catch (geminiError) {
      console.log('Gemini failed, trying OpenRouter...');
      try {
        return await callOpenRouterForContent(prompt);
      } catch (openrouterError) {
        console.error('Both AI services failed');
        throw new Error('AI services unavailable');
      }
    }
  }
  
  // Try OpenRouter if Gemini unavailable
  try {
    return await callOpenRouterForContent(prompt);
  } catch (openrouterError) {
    console.error('OpenRouter failed and no Gemini available');
    throw new Error('AI services unavailable');
  }
}

// Parse JSON from AI response
function parseAIResponse(text) {
  if (!text) return null;
  
  try {
    // Remove markdown code blocks
    let cleanText = text.trim();
    const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1];
    }
    
    // Try parsing
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    // Try to extract just the JSON object
    try {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        return JSON.parse(objMatch[0]);
      }
    } catch (e2) {
      console.error('Failed to extract JSON object');
    }
    return null;
  }
}

// ==================== MONGODB CONNECTION ====================
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

// ==================== SCHEMAS ====================
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

const User = mongoose.models.User || mongoose.model('User', userSchema);

const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: String,
  videoUrl: String,
  content: String,
  isCompleted: { type: Boolean, default: false },
  order: Number
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  summary: String,
  sourceType: { type: String, enum: ['youtube', 'pdf', 'text', 'catalog'], required: true },
  source: String,
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
      type: { type: String },
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String,
      difficulty: String
    }],
    completedAt: Date,
    score: Number
  }],
  flashcards: [{
    front: String,
    back: String,
    difficulty: String
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

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'API is running',
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)
  });
});

// ==================== AUTH ROUTES ====================
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
      user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription, createdAt: user.createdAt } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ==================== COURSES ROUTES ====================
app.get('/api/courses', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const courses = await Course.find({ user: decoded.userId }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findOne({ _id: req.params.id, user: decoded.userId });
    
    if (!course) return res.status(404).json({ error: 'Course not found' });

    course.lastAccessed = new Date();
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { sourceType, source, title, catalogCourse } = req.body;

    const course = new Course({
      sourceType: sourceType || 'text',
      source,
      title: title || 'Untitled Course',
      user: decoded.userId,
      thumbnail: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
      ...catalogCourse
    });

    await course.save();
    await User.findByIdAndUpdate(decoded.userId, { $push: { courses: course._id, enrolledCourses: course._id } });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.patch('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, user: decoded.userId },
      { $set: { ...req.body, lastAccessed: new Date() } },
      { new: true }
    );

    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findOneAndDelete({ _id: req.params.id, user: decoded.userId });
    
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await User.findByIdAndUpdate(decoded.userId, { $pull: { courses: course._id, enrolledCourses: course._id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ==================== CATALOG ROUTES ====================
app.get('/api/catalog', (req, res) => {
  res.json(catalogCourses);
});

app.post('/api/catalog/:id/enroll', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const catalogCourse = catalogCourses.find(c => c.id === req.params.id);
    if (!catalogCourse) return res.status(404).json({ error: 'Catalog course not found' });

    // Check if already enrolled
    const existingCourse = await Course.findOne({ user: decoded.userId, title: catalogCourse.title, sourceType: 'catalog' });
    if (existingCourse) {
      return res.status(400).json({ error: 'Already enrolled', course: existingCourse });
    }

    // Generate AI content for the course
    console.log('🤖 Generating AI content for catalog course...');
    
    const contentPrompt = `Generate educational content for a course titled "${catalogCourse.title}".
Topics: ${catalogCourse.topics.join(', ')}
Level: ${catalogCourse.level}

Return a JSON object with this EXACT structure:
{
  "lessons": [
    {"title": "Lesson Title", "description": "Brief description", "duration": "15 min", "content": "Detailed lesson content with key concepts explained", "order": 1}
  ],
  "quizQuestions": [
    {"type": "multiple-choice", "question": "Question text?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why A is correct", "difficulty": "easy"}
  ],
  "flashcards": [
    {"front": "Term or concept", "back": "Definition or explanation", "difficulty": "easy"}
  ],
  "notes": [
    {"title": "Note Title", "summary": ["Key point 1", "Key point 2", "Key point 3"], "topics": ["topic1"]}
  ]
}

Generate:
- 5-8 comprehensive lessons
- 8-10 quiz questions (mix of easy, medium, hard)
- 10-15 flashcards
- 3-5 detailed notes

Make content specific to ${catalogCourse.title} and its topics.`;

    let generatedContent = await callAIForContent(contentPrompt);
    generatedContent = parseAIResponse(generatedContent);
    
    // Fallback content if AI fails
    if (!generatedContent) {
      console.log('⚠️ AI generation failed, using fallback content');
      generatedContent = {
        lessons: catalogCourse.topics.map((topic, i) => ({
          title: `${topic} Fundamentals`,
          description: `Learn the core concepts of ${topic}`,
          duration: '20 min',
          content: `This lesson covers the essential concepts of ${topic} in ${catalogCourse.title}. You will learn the fundamentals, best practices, and practical applications.`,
          order: i + 1
        })),
        quizQuestions: catalogCourse.topics.slice(0, 5).map((topic, i) => ({
          type: 'multiple-choice',
          question: `What is a key concept in ${topic}?`,
          options: ['Fundamental principle', 'Advanced technique', 'Basic syntax', 'Core methodology'],
          correctAnswer: 'A',
          explanation: `The fundamental principle is the foundation of ${topic}.`,
          difficulty: ['easy', 'medium', 'hard'][i % 3]
        })),
        flashcards: catalogCourse.topics.map(topic => ({
          front: `What is ${topic}?`,
          back: `${topic} is a key component of ${catalogCourse.title} that helps you build professional skills.`,
          difficulty: 'easy'
        })),
        notes: [{
          title: 'Course Overview',
          summary: catalogCourse.whatYouLearn,
          topics: catalogCourse.topics.slice(0, 3)
        }]
      };
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
      lessons: generatedContent.lessons || [],
      quizzes: generatedContent.quizQuestions ? [{ title: 'Course Quiz', questions: generatedContent.quizQuestions }] : [],
      flashcards: generatedContent.flashcards || [],
      notes: generatedContent.notes || [],
      totalLessons: generatedContent.lessons?.length || catalogCourse.totalLessons || 10,
      completedLessons: 0,
      progress: 0,
      certificate: true,
      user: decoded.userId,
      lastAccessed: new Date()
    });

    await course.save();
    await User.findByIdAndUpdate(decoded.userId, { $push: { courses: course._id, enrolledCourses: course._id }, lastActivityDate: new Date() });

    console.log('✅ Course created with AI content');
    res.status(201).json(course);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// ==================== CONTENT GENERATION ROUTES ====================
app.post('/api/courses/:id/generate-content', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findOne({ _id: req.params.id, user: decoded.userId });
    
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { type } = req.body; // 'lessons', 'quiz', 'flashcards', 'notes', 'all'
    
    const prompt = `Generate ${type === 'all' ? 'comprehensive educational content' : type} for a course:
Title: ${course.title}
Topics: ${course.topics?.join(', ') || 'General'}
Level: ${course.level}
Description: ${course.description || course.summary || ''}

Return JSON with the requested content type(s).`;

    const aiResponse = await callAI(prompt);
    const content = parseAIResponse(aiResponse);
    
    if (content) {
      const updates = {};
      if (content.lessons) updates.lessons = content.lessons;
      if (content.quizQuestions) updates.quizzes = [{ title: 'Generated Quiz', questions: content.quizQuestions }];
      if (content.flashcards) updates.flashcards = content.flashcards;
      if (content.notes) updates.notes = content.notes;
      
      await Course.findByIdAndUpdate(course._id, { $set: updates });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// ==================== QUIZ ROUTES ====================
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { title, source, content, topics } = req.body;

    const prompt = `Generate 8-10 quiz questions for:
Title: ${title}
Topics: ${topics?.join(', ') || 'General'}
Content: ${(content || '').substring(0, 2000)}

Return JSON:
{
  "quizQuestions": [
    {
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Mix difficulties. Vary correct answer positions (A, B, C, or D).`;

    const aiResponse = await callAIForContent(prompt);
    const result = parseAIResponse(aiResponse);
    
    if (result?.quizQuestions) {
      res.json({ success: true, quizQuestions: result.quizQuestions });
    } else {
      // Fallback
      res.json({
        success: true,
        quizQuestions: [
          { type: 'multiple-choice', question: `What is a key concept in ${title}?`, options: ['Fundamental basics', 'Advanced topics', 'Introduction', 'Summary'], correctAnswer: 'A', explanation: 'Understanding fundamentals is essential.', difficulty: 'easy' },
          { type: 'multiple-choice', question: `Which best describes ${title}?`, options: ['A learning resource', 'A tool', 'A framework', 'A methodology'], correctAnswer: 'A', explanation: 'This course is designed as a comprehensive learning resource.', difficulty: 'easy' }
        ]
      });
    }
  } catch (error) {
    console.error('Quiz generate error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ==================== FLASHCARDS ROUTES ====================
app.post('/api/flashcards/generate', async (req, res) => {
  try {
    const { title, source, content, topics } = req.body;

    const prompt = `Generate 10-15 educational flashcards for:
Title: ${title}
Topics: ${topics?.join(', ') || 'General'}
Content: ${(content || '').substring(0, 2000)}

Return JSON:
{
  "flashcards": [
    {"front": "Term or question", "back": "Definition or answer", "difficulty": "easy|medium|hard"}
  ]
}

Include key terms, concepts, and important facts.`;

    console.log('🗂️ Generating flashcards...');
    const aiResponse = await callAIForContent(prompt);
    const result = parseAIResponse(aiResponse);
    
    if (result?.flashcards) {
      res.json({ success: true, flashcards: result.flashcards });
    } else {
      // Fallback
      res.json({
        success: true,
        flashcards: [
          { front: `What is ${title}?`, back: `A comprehensive course covering key concepts and practical skills.`, difficulty: 'easy' },
          { front: 'Key Learning Objective', back: 'Master the fundamentals and apply them in real scenarios.', difficulty: 'easy' }
        ]
      });
    }
  } catch (error) {
    console.error('Flashcards generate error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// ==================== LESSONS ROUTES ====================
app.post('/api/lessons/generate', async (req, res) => {
  try {
    const { title, source, content, topics } = req.body;

    const prompt = `Generate 5-8 comprehensive lessons for:
Title: ${title}
Topics: ${topics?.join(', ') || 'General'}
Content: ${(content || '').substring(0, 2000)}

Return JSON:
{
  "lessons": [
    {
      "title": "Lesson title",
      "description": "2-3 sentence description",
      "duration": "15 min",
      "content": "Detailed lesson content with examples and explanations (3-4 paragraphs)",
      "order": 1
    }
  ]
}

Make lessons progressive, building on previous knowledge.`;

    console.log('📚 Generating lessons...');
    const aiResponse = await callGemini(prompt);
    const result = parseAIResponse(aiResponse);
    
    if (result?.lessons) {
      res.json({ success: true, lessons: result.lessons });
    } else {
      // Fallback
      const topicsList = topics || ['Introduction', 'Core Concepts', 'Advanced Topics'];
      res.json({
        success: true,
        lessons: topicsList.map((topic, i) => ({
          title: `${topic}`,
          description: `Learn the essentials of ${topic}`,
          duration: '20 min',
          content: `This lesson covers ${topic} in detail. You'll learn the key concepts, best practices, and practical applications.`,
          order: i + 1
        }))
      });
    }
  } catch (error) {
    console.error('Lessons generate error:', error);
    res.status(500).json({ error: 'Failed to generate lessons' });
  }
});

// ==================== NOTES ROUTES ====================
app.post('/api/notes/generate', async (req, res) => {
  try {
    const { title, source, content, topics } = req.body;

    const prompt = `Generate 3-5 comprehensive study notes for:
Title: ${title}
Topics: ${topics?.join(', ') || 'General'}
Content: ${(content || '').substring(0, 2000)}

Return JSON:
{
  "notes": [
    {
      "title": "Note section title",
      "summary": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
      "topics": ["related", "topics"]
    }
  ]
}

Each note should focus on a major concept with actionable takeaways.`;

    console.log('📝 Generating notes...');
    const aiResponse = await callGemini(prompt);
    const result = parseAIResponse(aiResponse);
    
    if (result?.notes) {
      res.json({ success: true, notes: result.notes });
    } else {
      // Fallback
      res.json({
        success: true,
        notes: [{
          title: `${title} Overview`,
          summary: ['Key concept 1: Understanding the basics', 'Key concept 2: Practical applications', 'Key concept 3: Best practices', 'Key concept 4: Common patterns'],
          topics: topics?.slice(0, 3) || ['Learning', 'Practice']
        }]
      });
    }
  } catch (error) {
    console.error('Notes generate error:', error);
    res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// ==================== CHAT ROUTES ====================
app.post('/api/chat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { message, courseContext } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are a helpful AI tutor. ${courseContext ? `The student is learning: ${courseContext}` : ''}

Student question: ${message}

Provide a clear, concise, and helpful response (2-4 sentences). Be educational and encouraging.`;

    const text = await callOpenRouterForChat(prompt);
    
    res.json({ 
      reply: text || `I understand you're asking about "${message}". This is an interesting topic! Let me help you understand it better. Could you provide more context about what specific aspect you'd like to explore?`
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ==================== ANALYTICS ROUTES ====================
app.get('/api/analytics', async (req, res) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    const courses = await Course.find({ user: decoded.userId });

    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const completedLessons = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);

    let totalQuizScore = 0, quizCount = 0;
    courses.forEach(course => {
      course.quizzes?.forEach(quiz => {
        if (quiz.score !== undefined) { totalQuizScore += quiz.score; quizCount++; }
      });
    });

    const averageQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;
    const allTopics = [...new Set(courses.flatMap(c => c.topics || []))];

    res.json({
      success: true,
      data: {
        overview: {
          totalCoursesEnrolled: totalCourses,
          totalCoursesCompleted: completedCourses,
          totalLessonsCompleted: completedLessons,
          averageQuizScore,
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
          averageQuizScore: 0,
          timeSpent: Math.floor(Math.random() * 120) + 30,
          enrolledDate: c.createdAt?.toISOString(),
          lastAccessedDate: c.lastAccessed?.toISOString(),
          status: c.progress === 100 ? 'Completed' : c.progress > 0 ? 'In Progress' : 'Not Started'
        })),
        dailyActivity: Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return { date: d.toISOString(), lessonsCompleted: Math.floor(Math.random() * 3), quizzesTaken: Math.floor(Math.random() * 2), timeSpent: Math.floor(Math.random() * 60) + 15, flashcardsReviewed: Math.floor(Math.random() * 10) };
        }),
        weeklyStats: Array.from({ length: 4 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (i * 7));
          return { week: `Week ${4 - i}`, lessonsCompleted: Math.floor(Math.random() * 10), quizzesTaken: Math.floor(Math.random() * 5), totalTimeSpent: Math.floor(Math.random() * 300) + 60, averageQuizScore: Math.floor(Math.random() * 30) + 70, flashcardsReviewed: Math.floor(Math.random() * 30) };
        }),
        achievements: [
          { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', progress: completedLessons > 0 ? 100 : 0 },
          { id: '2', name: 'Quiz Master', description: 'Score 80%+ on 5 quizzes', icon: '🏆', progress: Math.min(quizCount * 20, 100) },
          { id: '3', name: 'Dedicated Learner', description: 'Maintain a 7-day streak', icon: '🔥', progress: Math.min((user?.currentStreak || 0) * 14, 100) },
          { id: '4', name: 'Course Completer', description: 'Complete your first course', icon: '📚', progress: completedCourses > 0 ? 100 : 0 },
          { id: '5', name: 'Knowledge Seeker', description: 'Enroll in 5 courses', icon: '🌟', progress: Math.min(totalCourses * 20, 100) }
        ],
        learningStats: {
          totalMinutesLearned: Math.floor(Math.random() * 500) + 120,
          averageStudySession: Math.floor(Math.random() * 30) + 15,
          preferredStudyTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
          mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)],
          topicsMastered: allTopics.slice(0, 3),
          topicsInProgress: allTopics.slice(3, 6)
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Catch-all
app.all('/api/*', (req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'API route not found' });
});

export default app;
