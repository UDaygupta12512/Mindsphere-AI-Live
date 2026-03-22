

import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCourseContent, generateComprehensiveNote, generateAdditionalQuizQuestions } from '../services/geminiService.js';
import { getYoutubeVideosForLessons } from '../services/youtubeService.js';
import { getYoutubeVideosForLessonsNoKey } from '../services/youtubeServiceNoKey.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// PATCH /api/courses/:courseId/quizzes/:quizIndex/complete - Mark quiz as completed with score
router.patch('/:courseId/quizzes/:quizIndex/complete', async (req, res) => {
  try {
    const { courseId, quizIndex } = req.params;
    const { score, completedAt } = req.body;
    console.log('PATCH /api/courses/:courseId/quizzes/:quizIndex/complete called');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    const course = await Course.findOne({ _id: courseId, user: req.userId });
    if (!course) {
      console.log('Course not found for user:', req.userId);
      return res.status(404).json({ error: 'Course not found' });
    }
    const idx = parseInt(quizIndex, 10);
    if (!Array.isArray(course.quizzes) || idx < 0 || idx >= course.quizzes.length) {
      console.log('Quiz not found at index:', idx);
      return res.status(404).json({ error: 'Quiz not found' });
    }
    // Update quiz score and completedAt (latest attempt)
    course.quizzes[idx].score = score;
    course.quizzes[idx].completedAt = completedAt ? new Date(completedAt) : new Date();
    // Store all attempts in scores array
    if (!course.quizzes[idx].scores) course.quizzes[idx].scores = [];
    course.quizzes[idx].scores.push({ score, completedAt: completedAt ? new Date(completedAt) : new Date() });
    console.log('Quiz after update:', course.quizzes[idx]);
    await course.save();
    console.log('Course saved successfully.');
    // Update user's lastActivityDate for analytics/streak tracking
    await User.findByIdAndUpdate(req.userId, {
      lastActivityDate: new Date()
    });
    res.json({ success: true, quiz: course.quizzes[idx] });
  } catch (error) {
    console.error('Complete quiz error:', error);
    res.status(500).json({ error: 'Failed to complete quiz. Please try again.' });
  }
});

// POST /api/courses/:courseId/notes/:noteIndex/comprehensive - Generate a comprehensive note for a section on demand
router.post('/:courseId/notes/:noteIndex/comprehensive', async (req, res) => {
  try {
    const { courseId, noteIndex } = req.params;
    const course = await Course.findOne({ _id: courseId, user: req.userId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const idx = parseInt(noteIndex, 10);
    if (!Array.isArray(course.notes) || idx < 0 || idx >= course.notes.length) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const note = course.notes[idx];
    // Compose course context (topics and other note titles)
    const courseContext = `Topics: ${course.topics?.join(', ') || ''}\nOther Sections: ${course.notes.map(n => n.title).filter(t => t !== note.title).join(', ')}`;
    const comprehensive = await generateComprehensiveNote(
      course.title,
      note.title,
      note.summary,
      courseContext
    );
    res.json({ comprehensive });
  } catch (error) {
    console.error('Generate comprehensive note error:', error);
    res.status(500).json({ error: 'Failed to generate comprehensive note. Please try again.' });
  }
});

// POST /api/courses/:courseId/quizzes/generate - Generate more quiz questions
router.post('/:courseId/quizzes/generate', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { quizIndex = 0, count = 5 } = req.body;
    
    console.log(`🎯 Generating ${count} questions for course: ${courseId}, quiz index: ${quizIndex}`);
    
    const course = await Course.findOne({ _id: courseId, user: req.userId });
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (!course.quizzes || course.quizzes.length === 0 || !course.quizzes[quizIndex]) {
      console.log('❌ Quiz not found');
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const quiz = course.quizzes[quizIndex];
    console.log(`📝 Quiz found. Current questions: ${quiz.questions.length}`);
    
    try {
      console.log(`🤖 Calling Gemini AI to generate questions...`);
      const generatedContent = await generateAdditionalQuizQuestions(course.title, course.topics?.join(', ') || 'General', count);
      console.log(`✅ Gemini AI returned:`, generatedContent.quizQuestions?.length || 0, `questions`);
      
      if (!generatedContent.quizQuestions || generatedContent.quizQuestions.length === 0) {
        console.log('⚠️ No questions generated by Gemini');
        return res.status(500).json({ error: 'Gemini AI did not generate any questions. Please try again.' });
      }
      
      const newQuestions = generatedContent.quizQuestions.map(q => {
        if (q.type === 'multiple-choice') {
          q.explanations = q.explanations || {};
          const buildFallback = () => {
            const correctOpt = q.correctAnswer;
            return `${correctOpt} is the correct answer because it most accurately addresses the question. This option provides the most relevant and accurate information based on the course material.`;
          };
          
          ['A', 'B', 'C', 'D'].forEach(opt => {
            if (!q.explanations[opt] || q.explanations[opt].trim().length < 10) {
              q.explanations[opt] = buildFallback();
            }
          });
          
          if (!q.correctExplanation || q.correctExplanation.trim().length < 10) {
            q.correctExplanation = buildFallback();
          }
        }
        if (!q.explanation || q.explanation.trim().length < 10) {
          q.explanation = `The correct answer is ${q.correctAnswer}.`;
        }
        return q;
      });
      
      // Add new questions to the quiz
      quiz.questions.push(...newQuestions);
      console.log(`📊 Quiz now has ${quiz.questions.length} questions total`);
      
      // Save the updated course
      await course.save();
      console.log(`💾 Course saved successfully`);
      
      res.json({ 
        success: true,
        message: `${newQuestions.length} new questions added`,
        totalQuestions: quiz.questions.length,
        newQuestions: newQuestions
      });
    } catch (geminiError) {
      console.error('❌ Gemini AI error:', geminiError.message);
      res.status(500).json({ error: `Gemini AI error: ${geminiError.message}` });
    }
  } catch (error) {
    console.error('❌ Generate quiz questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz questions. Please try again.' });
  }
});

// GET /api/courses/:courseId/notes/:noteIndex - Get a single note's details for a course
router.get('/:courseId/notes/:noteIndex', async (req, res) => {
  try {
    const { courseId, noteIndex } = req.params;
    const course = await Course.findOne({ _id: courseId, user: req.userId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const idx = parseInt(noteIndex, 10);
    if (!Array.isArray(course.notes) || idx < 0 || idx >= course.notes.length) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const note = course.notes[idx];
    // Only return the note fields (title, summary, details, topics)
    res.json({
      title: note.title,
      summary: note.summary,
      details: note.details,
      topics: note.topics || []
    });
  } catch (error) {
    console.error('Get note details error:', error);
    res.status(500).json({ error: 'Failed to fetch note details. Please try again.' });
  }
});

// GET /api/courses - Get all user courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ user: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch courses. Please try again.' 
    });
  }
});

// GET /api/courses/:id - Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found' 
      });
    }
    
    // Update last accessed
    course.lastAccessed = new Date();
    await course.save();
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch course. Please try again.' 
    });
  }
});

// POST /api/courses - Create new course
router.post('/', async (req, res) => {
  try {
    const { sourceType, source, catalogCourse, title } = req.body;
    
    // Validate input
    if (!sourceType) {
      return res.status(400).json({ 
        error: 'Source type is required' 
      });
    }
    
    let courseData;
    
    if (sourceType === 'catalog' && catalogCourse) {
      // Create course from catalog
      courseData = {
        ...catalogCourse,
        sourceType: 'catalog',
        user: req.userId,
        createdAt: new Date(),
        lastAccessed: new Date()
      };
      
      // Remove fields that shouldn't be copied
      delete courseData._id;
      delete courseData.id;
    } else {
      // Generate course using Gemini AI
      if (!source && !title) {
        return res.status(400).json({ 
          error: 'Source or title is required for course generation' 
        });
      }
      
      const courseTitle = title || source;
      
      // Generate course content using Gemini
      const generatedContent = await generateCourseContent(
        courseTitle,
        sourceType,
        source
      );
      
      // Build course data
      courseData = {
        title: courseTitle,
        description: `AI-generated course from ${sourceType === 'youtube' ? 'YouTube' : sourceType === 'pdf' ? 'PDF' : 'text content'}`,
        summary: generatedContent.summary || `Course about ${courseTitle}`,
        sourceType,
        source: source || courseTitle,
        sourceUrl: sourceType === 'youtube' ? source : undefined,
        fileName: sourceType === 'pdf' ? source : undefined,
        thumbnail: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: generatedContent.category || 'General',
        level: generatedContent.level || 'Intermediate',
        duration: '45-60 min',
        rating: 0,
        studentsEnrolled: 0,
        instructor: 'AI Generated',
        topics: generatedContent.topics || [],
        whatYouLearn: [],
        requirements: [],
        lessons: (generatedContent.lessons || []).map((lesson, index) => ({
          ...lesson,
          isCompleted: false,
          order: lesson.order || index + 1,
          resources: [],
          transcript: ''
        })),
        notes: (generatedContent.notes || []).map(note => {
          // Ensure summary is an array of bullet points
          let summaryArray = [];
          if (Array.isArray(note.summary)) {
            summaryArray = note.summary;
          } else if (typeof note.summary === 'string') {
            // Split by newlines, dashes, or bullet points and clean up
            summaryArray = note.summary
              .split(/[\n•\-]/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
          
          return {
            title: note.title,
            summary: summaryArray,
            topics: note.topics || []
          };
        }),
        quizzes: generatedContent.quizQuestions && generatedContent.quizQuestions.length > 0 ? [{
          title: `${courseTitle} Quiz`,
          questions: generatedContent.quizQuestions.map(q => {
            // Ensure explanations for all options and correct explanation
            if (q.type === 'multiple-choice') {
              q.explanations = q.explanations || {};
              
              // Better fallback that explains WHY this is the correct answer
              const buildFallback = () => {
                const correctOpt = q.correctAnswer;
                return `${correctOpt} is the correct answer because it most accurately addresses the question. This option provides the most relevant and accurate information based on the course material.`;
              };
              
              // Ensure each option has an explanation
              ['A', 'B', 'C', 'D'].forEach(opt => {
                if (!q.explanations[opt] || q.explanations[opt].trim().length < 10) {
                  q.explanations[opt] = buildFallback();
                }
              });
              
              // Ensure correct explanation
              if (!q.correctExplanation || q.correctExplanation.trim().length < 10) {
                q.correctExplanation = buildFallback();
              }
            }
            if (!q.explanation || q.explanation.trim().length < 10) {
              q.explanation = `The correct answer is ${q.correctAnswer}.`;
            }
            return q;
          })
        }] : [],
        flashcards: (generatedContent.flashcards || []).map(card => ({
          ...card,
          reviewCount: 0
        })),
        totalLessons: generatedContent.lessons?.length || 0,
        completedLessons: 0,
        progress: 0,
        certificate: true,
        user: req.userId,
        lastAccessed: new Date()
      };
    }
    
    // Fetch YouTube videos for lessons
    console.log('🎬 Fetching YouTube videos for lessons...');
    const hasYoutubeKey = !!process.env.YOUTUBE_API_KEY;
    console.log('YouTube API key present:', hasYoutubeKey, '| Value:', process.env.YOUTUBE_API_KEY ? '[SET]' : '[NOT SET]');
    if (hasYoutubeKey) {
      // Use YouTube Data API if key is available
      console.log('🔑 Using YouTube Data API (API key available)');
      courseData.lessons = await getYoutubeVideosForLessons(
        courseData.lessons,
        courseData.topics.join(', ')
      );
    } else {
      // Use no-key method (Invidious + channel search)
      console.log('🔓 Using Invidious/channel search (no API key required)');
      courseData.lessons = await getYoutubeVideosForLessonsNoKey(
        courseData.lessons,
        courseData.topics.join(', ')
      );
    }
    
    // Create course
    const course = new Course(courseData);
    await course.save();
    
    // Add course to user's courses AND enrolledCourses (for analytics)
    await User.findByIdAndUpdate(req.userId, {
      $push: { 
        courses: course._id,
        enrolledCourses: course._id
      },
      lastActivityDate: new Date()
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create course. Please try again.' 
    });
  }
});

// PATCH /api/courses/:id - Update course progress
router.patch('/:id', async (req, res) => {
  try {
    const { completedLessons, progress, lessons } = req.body;
    
    const course = await Course.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found' 
      });
    }
    
    // Update fields
    if (completedLessons !== undefined) {
      course.completedLessons = completedLessons;
    }
    
    if (progress !== undefined) {
      course.progress = progress;
    }
    
    if (lessons) {
      course.lessons = lessons;
    }
    
    course.lastAccessed = new Date();
    await course.save();
    
    // Update user's lastActivityDate for analytics/streak tracking
    await User.findByIdAndUpdate(req.userId, {
      lastActivityDate: new Date()
    });
    
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      error: 'Failed to update course. Please try again.' 
    });
  }
});

export default router;
 