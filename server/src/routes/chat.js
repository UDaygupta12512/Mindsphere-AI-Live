import express from 'express';
import Course from '../models/Course.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateChatResponse } from '../services/geminiService.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/chat - Send message and get AI response
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }
    
    // Get user's courses for context
    const courses = await Course.find({ user: req.userId })
      .select('title summary topics')
      .limit(10);
    
    const coursesContext = courses.map(course => ({
      title: course.title,
      summary: course.summary,
      topics: course.topics
    }));
    
    // Generate AI response with conversation history
    const reply = await generateChatResponse(message, coursesContext, history || []);
    
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate response. Please try again.' 
    });
  }
});

export default router;
 