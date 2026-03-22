import { Course } from '../types/course';

export interface CatalogCourse extends Omit<Course, 'createdAt' | 'lastAccessed' | '_id'> {
  id: string;
  whatYouLearn: string[];
  requirements: string[];
  isEnrolled?: boolean;
  createdAt?: Date;
  lastAccessed?: Date;
}

export const catalogCourses: CatalogCourse[] = [
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
        id: 'lesson-1-1',
        title: 'Introduction to Web Development',
        description: 'Get started with web development fundamentals',
        duration: '15 min',
        content: 'Welcome to the Complete Web Development Bootcamp! In this lesson, you\'ll learn about the structure of the web, how websites work, and what tools you\'ll need to become a web developer. We\'ll explore the relationship between HTML, CSS, and JavaScript, and discuss the modern web development landscape.',
        isCompleted: false,
        order: 1,
        resources: [],
        transcript: ''
      },
      {
        id: 'lesson-1-2',
        title: 'HTML Fundamentals',
        description: 'Master HTML structure and semantic markup',
        duration: '25 min',
        content: 'HTML is the foundation of web development. Learn about HTML elements, attributes, semantic markup, and best practices for creating well-structured web pages. We\'ll build your first webpage from scratch.',
        isCompleted: false,
        order: 2,
        resources: [],
        transcript: ''
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
  },
  {
    id: 'catalog-5',
    title: 'Python Programming Complete Course',
    description: 'From basics to advanced Python programming. Learn OOP, data structures, algorithms, and build real projects.',
    instructor: 'Dr. James Wilson',
    thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Programming',
    level: 'Beginner',
    duration: '40 hours',
    rating: 4.9,
    studentsEnrolled: 21456,
    totalLessons: 45,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['Python', 'OOP', 'Data Structures', 'Algorithms'],
    summary: 'Master Python programming from scratch. Learn fundamentals, OOP, and build real-world applications.',
    whatYouLearn: [
      'Master Python fundamentals',
      'Object-oriented programming',
      'Work with APIs and databases',
      'Build automation scripts',
      'Create real-world applications'
    ],
    requirements: [
      'No programming experience needed',
      'A computer with Python installed',
      'Dedication to practice coding'
    ],
    lessons: [],
    notes: [],
    quizzes: [],
    flashcards: []
  },
  {
    id: 'catalog-6',
    title: 'Financial Analysis and Modeling',
    description: 'Master financial analysis, Excel modeling, valuation techniques, and investment strategies used by professional analysts.',
    instructor: 'Robert Martinez',
    thumbnail: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Finance',
    level: 'Advanced',
    duration: '35 hours',
    rating: 4.7,
    studentsEnrolled: 5432,
    totalLessons: 30,
    completedLessons: 0,
    progress: 0,
    certificate: true,
    source: 'pdf',
    topics: ['Financial Modeling', 'Valuation', 'Excel', 'Investment Analysis'],
    summary: 'Master financial analysis and modeling. Learn valuation, Excel modeling, and investment strategies.',
    whatYouLearn: [
      'Build financial models in Excel',
      'Perform company valuations',
      'Analyze financial statements',
      'Create investment portfolios',
      'Master financial forecasting'
    ],
    requirements: [
      'Basic accounting knowledge',
      'Excel proficiency',
      'Understanding of business fundamentals'
    ],
    lessons: [],
    notes: [],
    quizzes: [],
    flashcards: []
  }
];

export const getCatalogCourses = (): CatalogCourse[] => {
  return catalogCourses;
};

export const getCatalogCourseById = (id: string): CatalogCourse | undefined => {
  return catalogCourses.find(course => course.id === id);
};

export const getCoursesByCategory = (category: string): CatalogCourse[] => {
  return catalogCourses.filter(course => course.category === category);
};

export const getCategories = (): string[] => {
  const categories = new Set(catalogCourses.map(course => course.category));
  return Array.from(categories);
};
