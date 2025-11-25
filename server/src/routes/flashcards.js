import express from 'express';
import { generateFlashcards } from '../services/geminiService.js';

const router = express.Router();

// Generate dynamic flashcards
router.post('/generate', async (req, res) => {
  try {
    const { title, source, content, fileName, url } = req.body;

    if (!title || !source || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, source, and content are required'
      });
    }

    // Generate flashcards using AI
    const flashcards = await generateFlashcards({
      title,
      source,
      content,
      fileName,
      url
    });

    res.json({
      success: true,
      flashcards
    });

  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate flashcards'
    });
  }
});

export default router; 