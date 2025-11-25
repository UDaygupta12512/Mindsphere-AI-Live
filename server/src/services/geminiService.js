import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import JSON5 from 'json5';

let openRouterApiKey;
let geminiApiKeys = [];
let geminiModels = [];
let currentKeyIndex = 0;
let currentModelIndex = 0;

/**
 * Helper function to make Gemini API calls with key rotation and model fallback
 * @param {string} prompt - The prompt to send to the model
 * @param {number} maxRetries - Maximum number of retries per key/model combination
 * @returns {Promise<string>} Response text from the AI model
 */
const makeGeminiCallWithRotation = async (prompt, maxRetries = 2) => {
  const totalAttempts = geminiApiKeys.length * geminiModels.length;
  let lastError;
  
  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const apiKey = geminiApiKeys[currentKeyIndex];
    const modelName = geminiModels[currentModelIndex];
    
    try {
      console.log(`🔄 Gemini API attempt ${attempt + 1}/${totalAttempts} - Key: ${currentKeyIndex + 1}/${geminiApiKeys.length}, Model: ${modelName}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Check for safety ratings and blocked content
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn('⚠️ Finish reason not STOP:', candidate.finishReason);
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('Content blocked due to safety filters');
          }
        }
      }
      
      const text = response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      console.log(`✅ Gemini API succeeded with key ${currentKeyIndex + 1}, model: ${modelName}`);
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`❌ Gemini API failed with key ${currentKeyIndex + 1}, model: ${modelName} - ${error.message}`);
      
      // Move to next key, if all keys tried for current model, move to next model
      currentKeyIndex = (currentKeyIndex + 1) % geminiApiKeys.length;
      if (currentKeyIndex === 0) {
        currentModelIndex = (currentModelIndex + 1) % geminiModels.length;
      }
      
      // Add a small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // All attempts failed, fallback to OpenRouter if available
  if (openRouterApiKey) {
    console.log('🔄 Falling back to OpenRouter API...');
    try {
      return await makeOpenRouterCall(prompt);
    } catch (openRouterError) {
      console.error('❌ OpenRouter fallback also failed:', openRouterError.message);
    }
  }
  
  // Reset indices for next attempt
  currentKeyIndex = 0;
  currentModelIndex = 0;
  
  throw lastError || new Error('All Gemini API attempts failed');
};
/**
 * Helper function to make OpenRouter API calls with model fallback
 * @param {string} prompt - The prompt to send to the model
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<string>} Response text from the AI model
 */
const makeOpenRouterCall = async (prompt, modelOverride = null, maxRetries = 3) => {
  const models = modelOverride ? [modelOverride] : ['openai/gpt-4o', 'openai/gpt-3.5-turbo']; // Fallback order or specific model
  let lastError;
  
  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 OpenRouter API attempt ${attempt}/${maxRetries} with ${model}`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
            'X-Title': process.env.SITE_NAME || 'MindSphere AI',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;
          
          // Check for credit limit or insufficient funds errors
          const isCreditError = errorMessage.toLowerCase().includes('credit') || 
                               errorMessage.toLowerCase().includes('insufficient') ||
                               errorMessage.toLowerCase().includes('quota') ||
                               errorMessage.toLowerCase().includes('limit') ||
                               response.status === 402;
          
          if (isCreditError && model === 'openai/gpt-4o') {
            console.warn(`💸 Credit limit reached for GPT-4o, switching to GPT-3.5 Turbo`);
            break; // Break inner loop to try next model
          }
          
          throw new Error(`OpenRouter API error: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content in OpenRouter API response');
        }

        console.log(`✅ OpenRouter API succeeded with ${model} on attempt ${attempt}`);
        return content;
      } catch (error) {
        lastError = error;
        
        // Check if it's a credit error for GPT-4o
        if (error.message.toLowerCase().includes('credit') || 
            error.message.toLowerCase().includes('insufficient') ||
            error.message.toLowerCase().includes('quota') ||
            error.message.toLowerCase().includes('limit')) {
          if (model === 'openai/gpt-4o') {
            console.warn(`💸 Credit limit detected for GPT-4o: ${error.message}`);
            break; // Break to try GPT-3.5 Turbo
          }
        }
        
        // Check if error is retryable (503 Service Unavailable, 429 Too Many Requests, 500 Internal Server Error)
        const isRetryable = error.message.includes('503') || error.message.includes('429') || error.message.includes('500');
        
        if (!isRetryable) {
          // Not a retryable error, try next model
          break;
        }
        
        if (attempt === maxRetries) {
          // Last attempt failed for this model, try next model
          break;
        }
        
        // Calculate exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.warn(`⚠️ OpenRouter API error with ${model}. Retrying in ${delayMs}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // All models and retries exhausted
  throw lastError || new Error('All OpenRouter models failed');
};

// Generate a comprehensive note for a section on demand
export const generateComprehensiveNote = async (courseTitle, sectionTitle, summary, courseContext) => {
  if (geminiApiKeys.length === 0 && !openRouterApiKey) {
    throw new Error('AI system is not initialized. Please check your API keys.');
  }

  const prompt = `You are an expert educational content creator. Given the following course and section, generate a high-quality, one-page comprehensive note for the section. The note should be clear, well-structured, and suitable for deep understanding and revision. Avoid repeating the summary points; instead, expand on them with rich, specific, and educational content. Use engaging language and examples where appropriate.

Course Title: ${courseTitle}
Section Title: ${sectionTitle}
Section Summary (bullets):\n${summary}
Course Context (topics, other sections):\n${courseContext}

Return only the comprehensive note as a single string, no JSON or markdown formatting.`;

  try {
    // Try Gemini first, then fallback to OpenRouter
    if (geminiApiKeys.length > 0) {
      return await makeGeminiCallWithRotation(prompt);
    } else {
      return await makeOpenRouterCall(prompt);
    }
  } catch (error) {
    console.error('Error generating comprehensive note:', error);
    throw new Error('Failed to generate comprehensive note. Please try again.');
  }
};

export const initializeGemini = () => {
  // Initialize Gemini API keys (support multiple formats)
  geminiApiKeys = [];
  
  // Method 1: Comma-separated keys
  const geminiApiKeysEnv = process.env.GEMINI_API_KEYS;
  if (geminiApiKeysEnv) {
    geminiApiKeys = geminiApiKeysEnv.split(',').map(key => key.trim().replace(/"/g, '')).filter(key => key.length > 0);
  }
  
  // Method 2: Individual key environment variables
  const individualKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(key => key && key.trim().length > 0).map(key => key.trim().replace(/"/g, ''));
  
  // Combine both methods (remove duplicates)
  geminiApiKeys = [...new Set([...geminiApiKeys, ...individualKeys])];
  
  if (geminiApiKeys.length > 0) {
    console.log(`✅ Initialized ${geminiApiKeys.length} Gemini API key(s)`);
  }
  
  // Initialize OpenRouter API keys (support multiple keys)
  const openRouterKeys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_SECONDARY,
    process.env.OPENAI_API_KEY_TERTIARY
  ].filter(key => key && key.trim().length > 0).map(key => key.trim().replace(/"/g, ''));
  
  if (openRouterKeys.length > 0) {
    openRouterApiKey = openRouterKeys[0]; // Use first available OpenRouter key
    console.log(`✅ Initialized ${openRouterKeys.length} OpenRouter API key(s) (using first one)`);
  }
  
  // Initialize Gemini models (support multiple models for fallback)
  const geminiModelsEnv = process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.5-pro';
  geminiModels = geminiModelsEnv.split(',').map(model => model.trim()).filter(model => model.length > 0);
  console.log(`✅ Initialized ${geminiModels.length} Gemini model(s): ${geminiModels.join(', ')}`);
  
  if (geminiApiKeys.length === 0 && !openRouterApiKey) {
    console.warn('⚠️ No API keys configured. AI features will be disabled.');
    return false;
  }
  
  try {
    console.log(`✅ AI system initialized with ${geminiApiKeys.length} Gemini key(s), ${geminiModels.length} model(s), and ${openRouterApiKey ? 'OpenRouter fallback' : 'no OpenRouter fallback'}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AI system:', error.message);
    return false;
  }
};

export const generateCourseContent = async (title, sourceType, source) => {
  if (geminiApiKeys.length === 0 && !openRouterApiKey) {
    throw new Error('AI system is not initialized. Please check your API keys.');
  }
  
  let prompt;
  if (sourceType === 'pdf') {
   prompt = `You are an expert educational content creator. Analyze the following PDF content and generate a course:

Title: ${title}
Source Type: PDF
PDF Content: ${source}

Instructions:
1. Generate a brief summary (2-3 sentences).
2. Identify the category and level (Beginner, Intermediate, or Advanced).
3. List 3-5 key topics covered.
4. Create 5-8 lessons (title, description, duration, detailed content).
5. Generate exactly 5 multiple-choice questions (MCQ) based on the PDF content. For each question:
  - Provide 4 options (A, B, C, D).
  - IMPORTANT: Randomly vary the position of the correct answer (sometimes A, sometimes B, C, or D) to avoid predictable patterns.
  - Specify the correct answer.
  - For each incorrect option (A, B, C, D), provide a detailed, non-empty explanation of why it is incorrect. Do NOT leave any explanation blank or generic. Each explanation must be specific to the option and the question.
  - For the correct answer, provide a detailed, non-empty explanation of why it is correct. The explanation must clearly reference the question and the options, and explain why this answer is correct compared to the others. Do NOT leave this blank or generic.
  - If any explanation is missing, incomplete, or generic, regenerate that question.
  - Indicate the difficulty (easy, medium, or hard).
6. Generate 8-12 flashcards (front, back, difficulty).
7. Create 3-5 high-quality notes sections. For each note:
  - Provide a clear, concise headline (title) for the note. This will be shown as a clickable/expandable headline in the UI.
  - Provide a crisp summary (4-5 bullet points) for the note. Each bullet should be a key fact, insight, or takeaway from the section. Do NOT generate a comprehensive explanation or details at this stage.
  - Each note should be based on a key concept or section from the PDF.

Return the response as a valid JSON object with this exact structure:
{
  "summary": "string",
  "category": "string",
  "level": "Beginner|Intermediate|Advanced",
  "topics": ["string"],
  "lessons": [
    {
      "title": "string",
      "description": "string",
      "duration": "string",
      "content": "string",
      "order": number
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanations": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "correctExplanation": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "notes": [
    {
      "title": "string", // headline for the note
      "summary": "string", // crisp summary for the note (4-5 bullet points)
      "topics": ["string"]
    }
  ]
}`;
  } else {
    prompt = `You are an expert educational content creator. Create a comprehensive course structure based on the following:

Title: ${title}
Source Type: ${sourceType}
Source: ${source}

Generate a detailed course with:
1. A brief summary (2-3 sentences)
2. Category (e.g., Programming, Data Science, Business, Design, etc.)
3. Level (Beginner, Intermediate, or Advanced)
4. 3-5 key topics covered
5. 5-8 lessons with:
   - Title
   - Description (2-3 sentences)
   - Duration (e.g., "15 min", "30 min")
   - Detailed content (3-4 paragraphs)
6. 5-10 quiz questions with:
   - Question text
   - Type (multiple-choice, true-false, or fill-blank)
   - For multiple-choice questions: randomly vary the position of the correct answer (sometimes A, sometimes B, C, or D) to avoid predictable patterns
   - Options (for multiple-choice)
   - Correct answer
   - Explanation
   - Difficulty (easy, medium, or hard)
7. 8-12 flashcards with:
   - Front (question or term)
   - Back (answer or definition)
   - Difficulty level
8. 3-5 comprehensive notes with:
   - Title
   - Content (detailed explanation)
   - Related topics

Return the response as a valid JSON object with this exact structure:
{
  "summary": "string",
  "category": "string",
  "level": "Beginner|Intermediate|Advanced",
  "topics": ["string"],
  "lessons": [
    {
      "title": "string",
      "description": "string",
      "duration": "string",
      "content": "string",
      "order": number
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple-choice|true-false|fill-blank",
      "question": "string",
      "options": ["string"] or null,
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "notes": [
    {
      "title": "string",
      "content": "string",
      "topics": ["string"]
    }
  ]
}`;
  }

  try {
    // Try Gemini first, then fallback to OpenRouter
    let text;
    if (geminiApiKeys.length > 0) {
      text = await makeGeminiCallWithRotation(prompt);
    } else {
      text = await makeOpenRouterCall(prompt);
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object in the text
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonText = objMatch[0];
      }
    }

    try {
      // Try normal JSON.parse first
      return JSON.parse(jsonText);
    } catch (parseErr) {
      // Log the raw response for debugging
      console.error('Raw AI response (for debugging):', jsonText);
      
      try {
        // Apply comprehensive fixes to malformed JSON
        let fixed = jsonText
          // Remove markdown bold formatting
          .replace(/\*\*(.*?)\*\*/g, '$1')
          // Fix missing commas before closing quotes followed by keys
          .replace(/"\s*\n\s*"/g, '",\n      "')
          // Fix missing commas after closing braces/brackets
          .replace(/}\s*\n\s*{/g, '},\n    {')
          .replace(/]\s*\n\s*"/g, '],\n      "')
          // Fix missing commas after property values
          .replace(/"([^"]+)"\s*\n\s*"([^"]+)":/g, '"$1",\n      "$2":')
          // Fix trailing property without comma
          .replace(/([^,{\[]\s*)\n(\s*"[^"]+":)/g, '$1,\n$2')
          // Remove trailing commas before closing braces
          .replace(/,(\s*[}\]])/g, '$1')
          // Add missing commas between array elements
          .replace(/"\s*\n\s*"/g, '",\n        "')
          // Fix issues with explanations object
          .replace(/correctExplanation":\s*"([^"]+)"\s*"difficulty"/g, 'correctExplanation": "$1",\n      "difficulty"');
        
        console.error('Fixed AI response (for debugging):', fixed);
        return JSON.parse(fixed);
      } catch (fixErr) {
        try {
          // Try JSON5 as final fallback
          return JSON5.parse(jsonText.replace(/\*\*(.*?)\*\*/g, '$1'));
        } catch (json5Err) {
          console.error('All parsing attempts failed. Last error:', json5Err);
          console.error('Response substring (first 500 chars):', jsonText.substring(0, 500));
          
          // Return a fallback response structure
          return {
            summary: "A comprehensive course generated from the content provided.",
            category: "General",
            level: "Intermediate",
            topics: ["Learning", "Education"],
            lessons: [
              {
                title: "Introduction",
                description: "Introduction to the course content",
                duration: "1 hour",
                content: "This lesson provides an overview of the main topics covered.",
                order: 1
              }
            ],
            quizQuestions: [
              {
                type: "multiple-choice",
                question: "What is the main focus of this course?",
                options: ["Learning new concepts", "Testing knowledge", "Building skills", "All of the above"],
                correctAnswer: "D",
                correctExplanation: "This course focuses on comprehensive learning including concepts, testing, and skill building.",
                difficulty: "easy"
              }
            ],
            flashcards: [
              {
                front: "Key Learning Concept",
                back: "Important information from the course content",
                difficulty: "easy"
              }
            ],
            notes: [
              {
                title: "Course Overview",
                summary: ["Introduction to course topics", "Key concepts to learn"],
                topics: ["Learning", "Education"]
              }
            ]
          };
        }
      }
    }
  } catch (error) {
    console.error('Error generating course content:', error);
    throw new Error('Failed to generate course content. Please try again.');
  }
};

export const generateChatResponse = async (message, coursesContext) => {
  if (geminiApiKeys.length === 0 && !openRouterApiKey) {
    throw new Error('AI system is not initialized. Please check your API keys.');
  }
  
  const contextInfo = coursesContext.length > 0
    ? `The user is enrolled in these courses:\n${coursesContext.map(c => `- ${c.title}: ${c.summary || 'No summary'}`).join('\n')}`
    : 'The user has not enrolled in any courses yet.';
  
  const prompt = `You are a concise AI tutor helping a student learn. ${contextInfo}

Student's question: ${message}

IMPORTANT: Provide a SHORT, DIRECT answer (2-4 sentences max). 
- Answer the question directly and concisely
- No lengthy explanations or extra details unless specifically asked
- If the question relates to their enrolled courses, mention it briefly
- Be clear and to the point`;

  try {
    // Use OpenRouter GPT-3.5 for chatbot responses
    return await makeOpenRouterCall(prompt, 'openai/gpt-3.5-turbo');
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

export const generateAdditionalQuizQuestions = async (courseTitle, courseTopic, existingQuestions = 5) => {
  if (geminiApiKeys.length === 0 && !openRouterApiKey) {
    throw new Error('AI system is not initialized. Please check your API keys.');
  }

  const prompt = `You are an expert educational content creator. Generate ${existingQuestions} new and unique multiple-choice quiz questions for the following course topic. These questions should be different from the existing ones and test deeper understanding.

Course Title: ${courseTitle}
Course Topic: ${courseTopic}

For each question:
- Provide 4 distinct options (A, B, C, D).
- IMPORTANT: Randomly vary the position of the correct answer (sometimes A, sometimes B, C, or D) to avoid predictable patterns. Do NOT always put the correct answer in the same position.
- Specify the correct answer clearly.
- For each option, provide a detailed explanation of why it is correct or incorrect.
- Provide a specific explanation for why the correct answer is right, referencing the question and options.
- Vary the difficulty level (easy, medium, hard).

Return the response as a valid JSON object with this exact structure:
{
  "quizQuestions": [
    {
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanations": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "correctExplanation": "string",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  try {
    console.log('🤖 Calling AI for additional quiz questions...');
    
    // Try Gemini first, then fallback to OpenRouter
    let text;
    if (geminiApiKeys.length > 0) {
      text = await makeGeminiCallWithRotation(prompt);
      console.log('✅ Gemini API call completed');
    } else {
      text = await makeOpenRouterCall(prompt);
      console.log('✅ OpenRouter API call completed');
    }
    
    console.log('📝 Raw response length:', text.length, 'characters');
    
    if (!text || text.trim().length === 0) {
      throw new Error('AI returned empty response text');
    }

    let jsonText = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
      console.log('✅ Extracted JSON from code block');
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonText = objMatch[0];
        console.log('✅ Extracted JSON object from text');
      } else {
        console.error('❌ Could not find JSON in response');
        console.error('Response preview:', text.substring(0, 300));
        throw new Error('Could not find JSON in AI response');
      }
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.quizQuestions || !Array.isArray(parsed.quizQuestions)) {
        throw new Error('Parsed JSON does not contain quizQuestions array');
      }
      console.log('✅ Successfully parsed JSON. Questions count:', parsed.quizQuestions.length);
      return parsed;
    } catch (parseErr) {
      console.error('❌ JSON.parse failed:', parseErr.message);
      console.error('Attempted JSON (first 300 chars):', jsonText.substring(0, 300));
      try {
        const parsed = JSON5.parse(jsonText);
        if (!parsed.quizQuestions || !Array.isArray(parsed.quizQuestions)) {
          throw new Error('Parsed JSON5 does not contain quizQuestions array');
        }
        console.log('✅ Successfully parsed with JSON5. Questions count:', parsed.quizQuestions.length);
        return parsed;
      } catch (json5Err) {
        console.error('❌ JSON5.parse also failed:', json5Err.message);
        let fixed = jsonText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
        try {
          const parsed = JSON5.parse(fixed);
          if (!parsed.quizQuestions || !Array.isArray(parsed.quizQuestions)) {
            throw new Error('Parsed JSON5 (after cleanup) does not contain quizQuestions array');
          }
          console.log('✅ Successfully parsed after markdown removal. Questions count:', parsed.quizQuestions.length);
          return parsed;
        } catch (finalErr) {
          console.error('❌ All parsing attempts failed');
          console.error('Final error:', finalErr.message);
          console.error('Response (first 500 chars):', jsonText.substring(0, 500));
          throw new Error(`Failed to parse AI response: ${finalErr.message}`);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error generating additional quiz questions:', errorMsg);
    throw new Error(errorMsg || 'Failed to generate quiz questions. Please try again.');
  }
};

// Generate quiz questions based on content
export const generateQuizQuestions = async ({ title, source, content, fileName, url, timestamp }) => {
  const prompt = `Based on the following content, generate 4-6 quiz questions. Make them educational and relevant to the content.

Content Title: ${title}
Source Type: ${source}
${fileName ? `File Name: ${fileName}` : ''}
${url ? `URL: ${url}` : ''}

Content: ${content.substring(0, 3000)} ${content.length > 3000 ? '...' : ''}

Please generate questions with the following format:
{
  "quizQuestions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  try {
    const response = await makeAICall(prompt);
    return response.quizQuestions || [];
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
};

// Generate flashcards based on content
export const generateFlashcards = async ({ title, source, content, fileName, url }) => {
  const prompt = `Based on the following content, generate 6-8 educational flashcards with key concepts and terms.

Content Title: ${title}
Source Type: ${source}
${fileName ? `File Name: ${fileName}` : ''}
${url ? `URL: ${url}` : ''}

Content: ${content.substring(0, 3000)} ${content.length > 3000 ? '...' : ''}

Please generate flashcards with the following format:
{
  "flashcards": [
    {
      "front": "Key concept or term",
      "back": "Definition or explanation"
    }
  ]
}`;

  try {
    const response = await makeAICall(prompt);
    return response.flashcards || [];
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
};

// Generate lesson structure based on content
export const generateLessons = async ({ title, source, content, fileName, url }) => {
  const prompt = `Based on the following content, generate a structured lesson plan with 3-5 key learning modules.

Content Title: ${title}
Source Type: ${source}
${fileName ? `File Name: ${fileName}` : ''}
${url ? `URL: ${url}` : ''}

Content: ${content.substring(0, 3000)} ${content.length > 3000 ? '...' : ''}

Please generate lessons with the following format:
{
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Lesson content and key points",
      "order": 1
    }
  ]
}`;

  try {
    const response = await makeAICall(prompt);
    return response.lessons || [];
  } catch (error) {
    console.error('Error generating lessons:', error);
    throw error;
  }
};

// Helper function to make AI calls with the existing rotation system
const makeAICall = async (prompt) => {
  try {
    const text = await makeGeminiCallWithRotation(prompt);
    
    // Parse the response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (jsonErr) {
      try {
        // Apply comprehensive fixes to malformed JSON
        let fixed = jsonText
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/"\s*\n\s*"/g, '",\n      "')
          .replace(/}\s*\n\s*{/g, '},\n    {')
          .replace(/]\s*\n\s*"/g, '],\n      "')
          .replace(/([^,{\[]\s*)\n(\s*"[^"]+":)/g, '$1,\n$2')
          .replace(/,(\s*[}\]])/g, '$1');
        
        const parsed = JSON.parse(fixed);
        return parsed;
      } catch (fixErr) {
        try {
          const parsed = JSON5.parse(jsonText);
          return parsed;
        } catch (json5Err) {
          console.error('All parsing attempts failed in makeAICall:', json5Err);
          throw new Error('Failed to parse AI response');
        }
      }
    }
  } catch (error) {
    console.error('Error in makeAICall:', error);
    throw error;
  }
};
 