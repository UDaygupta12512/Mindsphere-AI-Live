import express from 'express';
import { generateLessons } from '../services/geminiService.js';

const router = express.Router();

// Generate dynamic lessons
router.post('/generate', async (req, res) => {
  try {
    const { title, source, content, fileName, url } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, source, and content are required'
      });
    }

    // Generate lessons using AI
    const lessons = await generateLessons({
      title,
      source,
      content,
      fileName,
      url
    });

    res.json({
      success: true,
      lessons
    });

  } catch (error) {
    console.error('Error generating lessons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate lessons'
    });
  }
});

export default router; 