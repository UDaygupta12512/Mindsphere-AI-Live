import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCourseContent } from '../services/geminiService.js';
import { getYoutubeVideosForLessons } from '../services/youtubeService.js';
import { getYoutubeVideosForLessonsNoKey } from '../services/youtubeServiceNoKey.js';

const router = express.Router();

// Catalog seed data - subset from the original catalogData.ts
const catalogCourses = [
  {
    id: 'catalog-1',
    title: 'Complete Web Development Bootcamp',
    description: 'Master modern web development with HTML, CSS, JavaScript, React, Node.js, and more. Build real-world projects and become a full-stack developer.',
    instructor: 'Dr. Sarah Chen',
    thumbnail: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Programming',
    level: 'Beginner',
    duration: '45 hours',
    rating: 4.9,
    studentsEnrolled: 15234,
    totalLessons: 42,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    summary: 'From zero to full-stack developer. This comprehensive bootcamp covers everything you need to build modern web applications.',
    whatYouLearn: [
      'Build responsive websites from scratch',
      'Master React.js and modern JavaScript',
      'Create full-stack applications with Node.js',
      'Deploy applications to production',
      'Work with databases and APIs'
    ],
    requirements: [
      'No programming experience required',
      'A computer with internet connection',
      'Willingness to learn and practice'
    ],
    lessons: [
      {
        title: 'Introduction to Web Development',
        description: 'Get started with web development fundamentals',
        duration: '15 min',
        content: 'Welcome to the Complete Web Development Bootcamp! In this lesson, you\'ll learn about the structure of the web, how websites work, and what tools you\'ll need to become a web developer.',
        isCompleted: false,
        order: 1,
        resources: []
      },
      {
        title: 'HTML Fundamentals',
        description: 'Master HTML structure and semantic markup',
        duration: '25 min',
        content: 'HTML is the foundation of web development. Learn about HTML elements, attributes, semantic markup, and best practices for creating well-structured web pages.',
        isCompleted: false,
        order: 2,
        resources: []
      }
    ],
    notes: [],
    quizzes: [],
    flashcards: []
  },
  {
    id: 'catalog-2',
    title: 'Data Science and Machine Learning',
    description: 'Learn data science, machine learning, and AI. Master Python, statistical analysis, and build predictive models with real datasets.',
    instructor: 'Prof. Michael Rodriguez',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Data Science',
    level: 'Intermediate',
    duration: '60 hours',
    rating: 4.8,
    studentsEnrolled: 12567,
    totalLessons: 38,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['Python', 'Machine Learning', 'Data Analysis', 'Neural Networks'],
    summary: 'Become a data scientist. Master Python, machine learning algorithms, and build AI models from scratch.',
    whatYouLearn: [
      'Master Python for data science',
      'Build machine learning models',
      'Perform statistical analysis',
      'Work with neural networks',
      'Create data visualizations'
    ],
    requirements: [
      'Basic Python knowledge',
      'Understanding of mathematics',
      'Familiarity with programming concepts'
    ],
    lessons: [],
    notes: [],
    quizzes: [],
    flashcards: []
  },
  {
    id: 'catalog-3',
    title: 'Digital Marketing Mastery',
    description: 'Complete digital marketing course covering SEO, social media, content marketing, email campaigns, and analytics to grow your business.',
    instructor: 'Emma Thompson',
    thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Business',
    level: 'Beginner',
    duration: '30 hours',
    rating: 4.7,
    studentsEnrolled: 18903,
    totalLessons: 28,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
    summary: 'Master digital marketing strategies. Learn SEO, social media, and content marketing to grow your business.',
    whatYouLearn: [
      'Master SEO and content marketing',
      'Run successful social media campaigns',
      'Create email marketing strategies',
      'Analyze marketing metrics',
      'Build a complete marketing plan'
    ],
    requirements: [
      'No prior marketing experience needed',
      'Access to social media platforms',
      'Basic computer skills'
    ],
    lessons: [],
    notes: [],
    quizzes: [],
    flashcards: []
  },
  {
    id: 'catalog-4',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn user interface and experience design principles. Master Figma, create beautiful designs, and build user-centered products.',
    instructor: 'Alex Kim',
    thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Design',
    level: 'Beginner',
    duration: '25 hours',
    rating: 4.8,
    studentsEnrolled: 9876,
    totalLessons: 32,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['UI Design', 'UX Research', 'Figma', 'Prototyping'],
    summary: 'Master UI/UX design. Learn design principles, user research, and create beautiful interfaces with Figma.',
    whatYouLearn: [
      'Master design principles and theory',
      'Create professional UI designs in Figma',
      'Conduct user research and testing',
      'Build design systems',
      'Create interactive prototypes'
    ],
    requirements: [
      'No design experience required',
      'Install Figma (free)',
      'Creative mindset'
    ],
    lessons: [],
    notes: [],
    quizzes: [],
    flashcards: []
  }
];

// GET /api/catalog - Get catalog courses
router.get('/', (req, res) => {
  try {
    res.json(catalogCourses);
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch catalog. Please try again.' 
    });
  }
});

// POST /api/catalog/:id/enroll - Enroll in catalog course
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const catalogCourseId = req.params.id;
    console.log(`\n📚 ENROLL REQUEST for catalog course: ${catalogCourseId}`);
    
    // Find catalog course
    const catalogCourse = catalogCourses.find(c => c.id === catalogCourseId);
    
    if (!catalogCourse) {
      console.log('❌ Catalog course not found');
      return res.status(404).json({ 
        error: 'Catalog course not found' 
      });
    }
    
    console.log(`📖 Found catalog course: ${catalogCourse.title}`);
    
    // Check if user already enrolled
    const existingCourse = await Course.findOne({
      user: req.userId,
      title: catalogCourse.title,
      sourceType: 'catalog'
    });
    
    if (existingCourse) {
      console.log('⚠️ User already enrolled in this course');
      return res.status(400).json({ 
        error: 'You are already enrolled in this course',
        course: existingCourse
      });
    }
    
    console.log(`\n🤖 Generating content for: ${catalogCourse.title}`);
    console.log(`📝 Using Gemini to generate lessons, quizzes, notes, and flashcards...`);
    
    // Generate course content using Gemini AI
    const generatedContent = await generateCourseContent(
      catalogCourse.title,
      'pdf',
      catalogCourse.title
    );
    
    console.log(`✅ Generated ${generatedContent.lessons?.length || 0} lessons`);
    console.log(`✅ Generated ${generatedContent.quizQuestions?.length || 0} quiz questions`);
    console.log(`✅ Generated ${generatedContent.notes?.length || 0} study notes`);
    console.log(`✅ Generated ${generatedContent.flashcards?.length || 0} flashcards`);
    
    // Build course data with generated content
    const courseData = {
      title: catalogCourse.title,
      description: catalogCourse.description,
      summary: generatedContent.summary || catalogCourse.summary,
      sourceType: 'catalog',
      source: catalogCourse.title,
      thumbnail: catalogCourse.thumbnail,
      category: catalogCourse.category || generatedContent.category,
      level: catalogCourse.level || generatedContent.level,
      duration: catalogCourse.duration,
      rating: catalogCourse.rating,
      studentsEnrolled: catalogCourse.studentsEnrolled,
      instructor: catalogCourse.instructor,
      topics: catalogCourse.topics || generatedContent.topics || [],
      whatYouLearn: catalogCourse.whatYouLearn || [],
      requirements: catalogCourse.requirements || [],
      
      // Generated content
      lessons: (generatedContent.lessons || []).map((lesson, index) => ({
        ...lesson,
        isCompleted: false,
        order: lesson.order || index + 1,
        resources: [],
        transcript: ''
      })),
      notes: (generatedContent.notes || []).map(note => {
        let summaryArray = [];
        if (Array.isArray(note.summary)) {
          summaryArray = note.summary;
        } else if (typeof note.summary === 'string') {
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
        title: `${catalogCourse.title} Quiz`,
        questions: generatedContent.quizQuestions.map(q => {
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
        })
      }] : [],
      
      flashcards: (generatedContent.flashcards || []).map(card => ({
        ...card,
        reviewCount: 0
      })),
      
      totalLessons: generatedContent.lessons?.length || 0,
      completedLessons: 0,
      progress: 0,
      certificate: catalogCourse.certificate || true,
      user: req.userId,
      lastAccessed: new Date()
    };
    
    console.log(`\n🎬 Fetching YouTube videos for lessons...`);
    
    // Fetch YouTube videos for lessons
    const hasYoutubeKey = !!process.env.YOUTUBE_API_KEY;
    
    if (hasYoutubeKey) {
      console.log('🔑 Using YouTube Data API');
      courseData.lessons = await getYoutubeVideosForLessons(
        courseData.lessons,
        courseData.topics.join(', ')
      );
    } else {
      console.log('🔓 Using Invidious (no API key required)');
      courseData.lessons = await getYoutubeVideosForLessonsNoKey(
        courseData.lessons,
        courseData.topics.join(', ')
      );
    }
    
    const course = new Course(courseData);
    await course.save();
    
    console.log(`\n✅ Catalog course successfully created and saved to database`);
    console.log(`✅ Course ID: ${course._id}`);
    
    // Add course to user's courses AND enrolledCourses (for analytics)
    await User.findByIdAndUpdate(req.userId, {
      $push: { 
        courses: course._id,
        enrolledCourses: course._id
      },
      lastActivityDate: new Date()
    });
    
    console.log(`✅ Course added to user's enrolledCourses`);
    console.log(`\n🎉 Enrollment complete!\n`);
    
    res.status(201).json(course);
  } catch (error) {
    console.error('❌ Enroll course error:', error);
    res.status(500).json({ 
      error: 'Failed to enroll in course. Please try again.',
      details: error.message
    });
  }
});

export default router;
 