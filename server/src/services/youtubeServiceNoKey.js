// Alternative YouTube Search Service (No API Key Required)
// Uses web scraping and indirect methods to fetch YouTube videos

/**
 * Generate a YouTube search URL (user can click to browse)
 * @param {string} topic - The topic to search for
 * @returns {string} YouTube search URL
 */
export const getYoutubeSearchUrl = (topic) => {
  const encodedTopic = encodeURIComponent(`${topic} tutorial educational`);
  return `https://www.youtube.com/results?search_query=${encodedTopic}`;
};

/**
 * Generate a direct YouTube URL using Invidious (privacy-focused YouTube frontend)
 * Invidious doesn't require API keys and can search without authentication
 * @param {string} topic - The topic to search for
 * @returns {Promise<string>} Direct video embed URL or search URL
 */
export const getYoutubeVideoViaInvidious = async (topic) => {
  try {
    console.log(`📺 Searching Invidious for: "${topic}"`);
    
    // List of public Invidious instances
    const invidiosInstances = [
      'https://invidious.io',
      'https://invidious.snopyta.org',
      'https://inv.vern.cc',
      'https://invidious.libreserver.org'
    ];

    for (const instance of invidiosInstances) {
      try {
        const response = await fetch(
          `${instance}/api/v1/search?q=${encodeURIComponent(`${topic} tutorial`)}&type=video`,
          { timeout: 5000 }
        );
        
        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.length > 0) {
          const video = data[0];
          console.log(`✅ Found video on Invidious: "${video.title}"`);
          
          return {
            videoId: video.videoId,
            videoUrl: `${instance}/embed/${video.videoId}`,
            title: video.title,
            thumbnail: `${instance}/vi/${video.videoId}/maxresdefault.jpg`
          };
        }
      } catch (error) {
        console.warn(`⚠️ Invidious instance failed: ${instance}`);
        continue;
      }
    }

    console.warn(`⚠️ No videos found via Invidious for "${topic}"`);
    return null;
  } catch (error) {
    console.error('❌ Error fetching from Invidious:', error.message);
    return null;
  }
};

/**
 * Get a curated list of popular educational YouTube channels
 * Maps topics to popular educational YouTube channels
 * @param {string} topic - The topic to search for
 * @returns {Object} Channel info with name and search parameter
 */
export const getEducationalChannelForTopic = (topic) => {
  // Map of topics to popular educational YouTube channels
  const topicChannelMap = {
    // Programming & Tech
    'programming': { channelId: 'UC8butISFg04UIIvksVsqQ', name: 'freeCodeCamp', url: 'https://www.youtube.com/@freecodecamp' },
    'python': { channelId: 'UCfV36TX5AejfAGIbtwTc6Zw', name: 'Tech with Tim', url: 'https://www.youtube.com/@techwithtim' },
    'javascript': { channelId: 'UC8butISFg04UIIvksVsqQ', name: 'freeCodeCamp', url: 'https://www.youtube.com/@freecodecamp' },
    'web development': { channelId: 'UC29ju8yskXvMltBFnHQ0', name: 'Traversy Media', url: 'https://www.youtube.com/@traversymedia' },
    'react': { channelId: 'UC8butISFg04UIIvksVsqQ', name: 'freeCodeCamp', url: 'https://www.youtube.com/@freecodecamp' },
    'node.js': { channelId: 'UC8butISFg04UIIvksVsqQ', name: 'freeCodeCamp', url: 'https://www.youtube.com/@freecodecamp' },
    
    // Data Science & Machine Learning
    'machine learning': { channelId: 'UCWN3xxRkmTPmbKwht6VKZlA', name: 'StatQuest', url: 'https://www.youtube.com/@statquest' },
    'data science': { channelId: 'UCWN3xxRkmTPmbKwht6VKZlA', name: 'StatQuest', url: 'https://www.youtube.com/@statquest' },
    'artificial intelligence': { channelId: 'UCWN3xxRkmTPmbKwht6VKZlA', name: 'StatQuest', url: 'https://www.youtube.com/@statquest' },
    
    // Language Learning
    'english': { channelId: 'UCj_7xQITFA_rnIsvqXS_aXQ', name: 'BBC Learning English', url: 'https://www.youtube.com/@bbclearningenglish' },
    'spanish': { channelId: 'UCc6fcAIRnoMAOq7c7-_VzEw', name: 'Paul\'s Spanish School', url: 'https://www.youtube.com/@paulsspanishschool' },
    'french': { channelId: 'UC9FEq-0m_2-j2oT-tBLc_Q', name: 'Easy French', url: 'https://www.youtube.com/@EasyFrench' },
    
    // Business & Finance
    'business': { channelId: 'UCeQqXAH8aL98FyAF5gj9pIQ', name: 'Crash Course Business', url: 'https://www.youtube.com/@crashcourse' },
    'finance': { channelId: 'UCeQqXAH8aL98FyAF5gj9pIQ', name: 'Crash Course Business', url: 'https://www.youtube.com/@crashcourse' },
    
    // Science & Math
    'math': { channelId: 'UCYO_jab_esuFRV4b0AejZsQ', name: '3Blue1Brown', url: 'https://www.youtube.com/@3blue1brown' },
    'physics': { channelId: 'UCHnyfMX85ZVDqH6i1noUaFg', name: 'Khan Academy', url: 'https://www.youtube.com/@khanacademy' },
    'chemistry': { channelId: 'UCHnyfMX85ZVDqH6i1noUaFg', name: 'Khan Academy', url: 'https://www.youtube.com/@khanacademy' },
    'biology': { channelId: 'UCHnyfMX85ZVDqH6i1noUaFg', name: 'Khan Academy', url: 'https://www.youtube.com/@khanacademy' }
  };

  // Find matching topic (case-insensitive)
  const lowerTopic = topic.toLowerCase();
  for (const [key, value] of Object.entries(topicChannelMap)) {
    if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
      return value;
    }
  }

  // Default: return general education channel
  return {
    channelId: 'UC8butISFg04UIIvksVsqQ',
    name: 'freeCodeCamp',
    url: 'https://www.youtube.com/@freecodecamp'
  };
};

/**
 * Create a YouTube embed URL for a direct topic search
 * This creates a clickable link that opens YouTube search results
 * @param {string} lessonTitle - Title of the lesson
 * @param {string} courseTopic - Topic of the course
 * @returns {Object} Object with search URL and channel info
 */
export const getYoutubeEmbedForLesson = async (lessonTitle, courseTopic) => {
  try {
    console.log(`🔍 Getting YouTube video for: "${lessonTitle}" (${courseTopic})`);
    
    // Try Invidious first (no API key needed)
    const invidiosResult = await getYoutubeVideoViaInvidious(lessonTitle);
    if (invidiosResult) {
      return invidiosResult;
    }

    // Fallback: Use educational channel URL
    const channel = getEducationalChannelForTopic(courseTopic);
    console.log(`📺 Using channel: ${channel.name}`);
    
    const searchQuery = `${lessonTitle} tutorial`;
    const youtubeSearchUrl = getYoutubeSearchUrl(searchQuery);
    
    return {
      videoId: null,
      videoUrl: youtubeSearchUrl,
      title: `Search: ${searchQuery}`,
      thumbnail: null,
      channel: channel.name,
      channelUrl: channel.url,
      isSearchUrl: true
    };
  } catch (error) {
    console.error('❌ Error getting YouTube video:', error.message);
    
    const searchUrl = getYoutubeSearchUrl(`${lessonTitle} tutorial`);
    return {
      videoId: null,
      videoUrl: searchUrl,
      title: `Search: ${lessonTitle}`,
      isSearchUrl: true
    };
  }
};

/**
 * Get YouTube videos for all lessons (no API key required)
 * @param {Array} lessons - Array of lesson objects
 * @param {string} courseTopic - Topic of the course
 * @returns {Promise<Array>} Array of lessons with videoUrl
 */
export const getYoutubeVideosForLessonsNoKey = async (lessons, courseTopic) => {
  try {
    console.log(`🎬 Fetching YouTube videos for ${lessons.length} lessons (no API key required)...`);
    
    const lessonsWithVideos = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const videoData = await getYoutubeEmbedForLesson(lesson.title, courseTopic);
          return {
            ...lesson,
            videoUrl: videoData.videoUrl || null,
            videoId: videoData.videoId || null,
            videoTitle: videoData.title,
            isSearchUrl: videoData.isSearchUrl || false
          };
        } catch (error) {
          console.error(`Error fetching video for "${lesson.title}":`, error.message);
          return lesson;
        }
      })
    );

    console.log(`✅ Completed fetching YouTube data for lessons`);
    return lessonsWithVideos;
  } catch (error) {
    console.error('❌ Error in getYoutubeVideosForLessonsNoKey:', error.message);
    return lessons;
  }
};
 