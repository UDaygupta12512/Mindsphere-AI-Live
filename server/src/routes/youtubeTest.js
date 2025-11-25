import express from 'express';
import { searchYoutubeVideos } from '../services/youtubeService.js';

const router = express.Router();

// Test endpoint to verify YouTube API key works on Vercel
router.get('/test-youtube', async (req, res) => {
  try {
    const topic = req.query.topic || 'machine learning';
    const results = await searchYoutubeVideos(topic, 1);
    if (results && results.length > 0) {
      res.json({ success: true, video: results[0] });
    } else {
      res.status(404).json({ success: false, error: 'No videos found or API key not working.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
 