import mongoose from 'mongoose';

const lessonResourceSchema = new mongoose.Schema({
  title: String,
  type: {
    type: String,
    enum: ['pdf', 'link', 'code', 'image']
  },
  url: String,
  size: String
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: String,
  videoUrl: String,
  content: String,
  isCompleted: {
    type: Boolean,
    default: false
  },
  order: Number,
  resources: [lessonResourceSchema],
  transcript: String
}, { _id: false });


const courseNoteSchema = new mongoose.Schema({
  title: String,
  summary: {
    type: [String],
    required: true
  },
  topics: [String]
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank', 'coding']
  },
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
  explanations: {
    type: Map,
    of: String
  },
  correctExplanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: String,
  questions: [quizQuestionSchema],
  completedAt: Date,
  score: Number
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  front: String,
  back: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },
  lastReviewed: Date,
  nextReview: Date,
  reviewCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  summary: String,
  sourceType: {
    type: String,
    enum: ['youtube', 'pdf', 'text', 'catalog'],
    required: true
  },
  source: String, // URL or file name
  sourceUrl: String,
  fileName: String,
  thumbnail: String,
  category: String,
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  duration: String,
  rating: {
    type: Number,
    default: 0
  },
  studentsEnrolled: {
    type: Number,
    default: 0
  },
  instructor: String,
  topics: [String],
  whatYouLearn: [String],
  requirements: [String],
  lessons: [lessonSchema],
  notes: [courseNoteSchema],
  quizzes: [quizSchema],
  flashcards: [flashcardSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  completedLessons: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0
  },
  certificate: {
    type: Boolean,
    default: false
  },
  lastAccessed: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
courseSchema.index({ user: 1, createdAt: -1 });
courseSchema.index({ sourceType: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
 