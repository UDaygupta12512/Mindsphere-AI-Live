export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const topic = req.query.topic || 'python';
  if (!apiKey) {
    res.status(500).json({ error: 'YOUTUBE_API_KEY not set in environment.' });
    return;
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&maxResults=1&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
