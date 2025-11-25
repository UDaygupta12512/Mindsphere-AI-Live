import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

let apiKey = process.env.OPENAI_API_KEY;
let model = process.env.OPENAI_MODEL || 'openai/gpt-4o';
const siteUrl = process.env.SITE_URL || '';
const siteTitle = process.env.SITE_TITLE || '';

const retryWithExponentialBackoff = async (apiCall, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;
      const isRetryable = error.status === 503 || error.status === 429 || error.status === 500;
      if (!isRetryable) throw error;
      if (attempt === maxRetries) break;
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
};

export const initializeOpenRouter = () => {
  if (!apiKey) {
    console.warn('⚠️  OPENROUTER_API_KEY not set. AI features will be disabled.');
    return false;
  }
  console.log(`✅ OpenRouter API initialized with model: ${model}`);
  return true;
};

export const generateComprehensiveNote = async (courseTitle, sectionTitle, summary, courseContext) => {
  if (!apiKey) throw new Error('OpenAI API key not set.');
  const prompt = `You are an expert educational content creator. Given the following course and section, generate a high-quality, one-page comprehensive note for the section. The note should be clear, well-structured, and suitable for deep understanding and revision. Avoid repeating the summary points; instead, expand on them with rich, specific, and educational content. Use engaging language and examples where appropriate.\n\nCourse Title: ${courseTitle}\nSection Title: ${sectionTitle}\nSection Summary (bullets):\n${summary}\nCourse Context (topics, other sections):\n${courseContext}\nReturn only the comprehensive note as a single string, no JSON or markdown formatting.`;
  return await callOpenRouterAPI(prompt);
};

export const generateCourseContent = async (title, sourceType, source) => {
  if (!apiKey) throw new Error('OpenAI API key not set.');
  let prompt = `You are an expert educational content creator. Create a comprehensive course structure based on the following:\n\nTitle: ${title}\nSource Type: ${sourceType}\nSource: ${source}\n\nGenerate a detailed course with:\n1. A brief summary (2-3 sentences)\n2. Category (e.g., Programming, Data Science, Business, Design, etc.)\n3. Level (Beginner, Intermediate, or Advanced)\n4. 3-5 key topics covered\n5. 5-8 lessons with:\n   - Title\n   - Description (2-3 sentences)\n   - Duration (e.g., "15 min", "30 min")\n   - Detailed content (3-4 paragraphs)\n6. 5-10 quiz questions with:\n   - Question text\n   - Type (multiple-choice, true-false, or fill-blank)\n   - For multiple-choice questions: randomly vary the position of the correct answer (sometimes A, sometimes B, C, or D) to avoid predictable patterns\n   - Options (for multiple-choice)\n   - Correct answer\n   - Explanation\n   - Difficulty (easy, medium, or hard)\n7. 8-12 flashcards with:\n   - Front (question or term)\n   - Back (answer or definition)\n   - Difficulty level\n8. 3-5 comprehensive notes with:\n   - Title\n   - Content (detailed explanation)\n   - Related topics\n\nReturn the response as a valid JSON object.`;
  return await callOpenRouterAPI(prompt, true);
};

export const generateChatResponse = async (message, coursesContext) => {
  if (!apiKey) throw new Error('OpenAI API key not set.');
  const contextInfo = coursesContext.length > 0
    ? `The user is enrolled in these courses:\n${coursesContext.map(c => `- ${c.title}: ${c.summary || 'No summary'}`).join('\n')}`
    : 'The user has not enrolled in any courses yet.';
  const prompt = `You are a concise AI tutor helping a student learn. ${contextInfo}\n\nStudent's question: ${message}\n\nIMPORTANT: Provide a SHORT, DIRECT answer (2-4 sentences max).\n- Answer the question directly and concisely\n- No lengthy explanations or extra details unless specifically asked\n- If the question relates to their enrolled courses, mention it briefly\n- Be clear and to the point`;
  return await callOpenRouterAPI(prompt);
};

export const generateAdditionalQuizQuestions = async (courseTitle, courseTopic, existingQuestions = 5) => {
  if (!apiKey) throw new Error('OpenAI API key not set.');
  const prompt = `You are an expert educational content creator. Generate ${existingQuestions} new and unique multiple-choice quiz questions for the following course topic. These questions should be different from the existing ones and test deeper understanding.\n\nCourse Title: ${courseTitle}\nCourse Topic: ${courseTopic}\n\nFor each question:\n- Provide 4 distinct options (A, B, C, D).\n- IMPORTANT: Randomly vary the position of the correct answer (sometimes A, sometimes B, C, or D) to avoid predictable patterns. Do NOT always put the correct answer in the same position.\n- Specify the correct answer clearly.\n- For each option, provide a detailed explanation of why it is correct or incorrect.\n- Provide a specific explanation for why the correct answer is right, referencing the question and options.\n- Vary the difficulty level (easy, medium, hard).\n\nReturn the response as a valid JSON object.`;
  return await callOpenRouterAPI(prompt, true);
};

async function callOpenRouterAPI(prompt, expectJson = false) {
  const response = await retryWithExponentialBackoff(async () => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteTitle,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const error = new Error(`OpenRouter API error: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  });
  if (expectJson) {
    // Try to extract JSON from the response
    const text = response.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(text);
    } catch {
      // Try to extract JSON from code block
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        return JSON.parse(match[1]);
      }
      throw new Error('Failed to parse JSON from OpenRouter response');
    }
  }
  return response.choices?.[0]?.message?.content || '';
}
 