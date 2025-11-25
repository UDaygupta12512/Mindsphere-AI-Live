import express from 'express';
import { generateQuizQuestions } from '../services/geminiService.js';

const router = express.Router();

// Generate dynamic quiz questions
router.post('/generate', async (req, res) => {
  try {
    const { title, source, content, fileName, url, timestamp } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, source, and content are required'
      });
    }

    // Generate quiz questions using AI
    const quizQuestions = await generateQuizQuestions({
      title,
      source,
      content,
      fileName,
      url,
      timestamp
    });

    res.json({
      success: true,
      quizQuestions
    });

  } catch (error) {
    console.error('Error generating quiz questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz questions'
    });
  }
});

export default router; 