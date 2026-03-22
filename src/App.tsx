import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import CourseCreator from './components/CourseCreator';
import CourseViewer from './components/CourseViewer';
import ChatBot from './components/ChatBot';
import AuthModal from './components/AuthModal';
import CourseCatalog from './components/CourseCatalog';
import CourseDetail from './components/CourseDetail';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CTASection from './components/CTASection';
import AITutorSection from './components/AITutorSection';
import StudyTools from './components/StudyTools';
import Footer from './components/Footer';
import { Course } from './types/course';
import { User } from './types/auth';
import { CatalogCourse } from './utils/catalogData';
import { coursesApi, catalogApi, api, getToken, removeToken } from './lib/api';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCatalogCourse, setSelectedCatalogCourse] = useState<CatalogCourse | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize auth and load user data on app start
  useEffect(() => {
    const initializeApp = async () => {
      const token = getToken();
      if (!token) return;

      try {
        // Validate token by fetching user data via API helper (uses correct base URL)
        const userData = await api.get<User>('/api/auth/me');
        setUser(userData);

        // Load user's courses
        const userCourses = await coursesApi.getAll();
        setCourses(userCourses.map(course => ({
          ...course,
          id: course._id,
          createdAt: new Date(course.createdAt),
          lastAccessed: course.lastAccessed ? new Date(course.lastAccessed) : undefined
        } as unknown as Course)));

        // Get all catalog courses to map titles back to IDs
        const catalogData = await catalogApi.getAll();

        // Extract enrolled course titles from catalog courses
        const enrolledTitles = userCourses
          .filter(c => c.sourceType === 'catalog')
          .map(c => c.title);

        // Map titles to catalog IDs
        const catalogIds = catalogData
          .filter(cat => enrolledTitles.includes(cat.title))
          .map(cat => (cat as { id?: string }).id)
          .filter((id): id is string => id !== undefined);

        setEnrolledCourseIds(catalogIds);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Clear invalid token
        removeToken();
        localStorage.removeItem('edusynth-user');
      }
    };

    initializeApp();
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('edusynth-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('edusynth-user');
    }
  }, [user]);

  const handleNavigate = (view: string) => {
    // Require authentication for certain views
    if (!user && ['dashboard', 'create', 'chatbot', 'analytics'].includes(view)) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    setSelectedCourse(null);
    setSelectedCatalogCourse(null);
  };

  const handleGetStarted = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setCurrentView('create');
    }
  };

  const handleAuth = async (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');

    // Fetch user's courses after authentication
    try {
      const userCourses = await coursesApi.getAll();
      setCourses(userCourses.map(course => ({
        ...course,
        id: course._id,
        createdAt: new Date(course.createdAt),
        lastAccessed: course.lastAccessed ? new Date(course.lastAccessed) : undefined
      } as unknown as Course)));

      // Get all catalog courses to map titles back to IDs
      const catalogData = await catalogApi.getAll();

      // Extract enrolled course titles
      const enrolledTitles = userCourses
        .filter(c => c.sourceType === 'catalog')
        .map(c => c.title);

      // Map titles to catalog IDs
      const catalogIds = catalogData
        .filter(cat => enrolledTitles.includes(cat.title))
        .map(cat => (cat as { id?: string }).id)
        .filter((id): id is string => id !== undefined);

      setEnrolledCourseIds(catalogIds);
    } catch (error) {
      console.error('Error loading courses after auth:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCourses([]);
    setEnrolledCourseIds([]);
    setCurrentView('home');
    removeToken();
    localStorage.removeItem('edusynth-user');
  };

  const handleCourseCreated = (course: Course) => {
    setCourses(prev => [course, ...prev]);
    setCurrentView('dashboard');
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(course =>
      (course._id || course.id) === (updatedCourse._id || updatedCourse.id) ? updatedCourse : course
    ));
    setSelectedCourse(updatedCourse);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourse(null);
  };

  const handleCatalogCourseSelect = (course: CatalogCourse) => {
    setSelectedCatalogCourse(course);
    setCurrentView('catalog-detail');
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
    setSelectedCatalogCourse(null);
  };

  const handleEnrollCourse = async (catalogCourse: CatalogCourse) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const enrolledCourse = await catalogApi.enroll(catalogCourse.id);

      const courseWithId: Course = {
        ...enrolledCourse,
        id: enrolledCourse._id,
        createdAt: new Date(enrolledCourse.createdAt),
        lastAccessed: enrolledCourse.lastAccessed ? new Date(enrolledCourse.lastAccessed) : new Date()
      } as unknown as Course;

      setCourses(prev => [courseWithId, ...prev]);
      setEnrolledCourseIds(prev => [...prev, catalogCourse.id]);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const handleStartLearning = (catalogCourse: CatalogCourse) => {
    // Find by title since catalog courses might have different IDs
    const enrolledCourse = courses.find(c => c.title === catalogCourse.title);
    if (enrolledCourse) {
      setSelectedCourse(enrolledCourse);
      setCurrentView('course');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <Features />
            <AITutorSection />
            <StudyTools />
            <HowItWorks />
            <CTASection onGetStarted={handleGetStarted} />
            <Footer />
          </>
        );
      case 'catalog':
        return (
          <CourseCatalog
            onCourseSelect={handleCatalogCourseSelect}
            enrolledCourseIds={enrolledCourseIds}
          />
        );
      case 'catalog-detail':
        return selectedCatalogCourse ? (
          <CourseDetail
            course={selectedCatalogCourse}
            isEnrolled={enrolledCourseIds.includes(selectedCatalogCourse.id)}
            onBack={handleBackToCatalog}
            onEnroll={handleEnrollCourse}
            onStartLearning={handleStartLearning}
          />
        ) : (
          <CourseCatalog
            onCourseSelect={handleCatalogCourseSelect}
            enrolledCourseIds={enrolledCourseIds}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            courses={courses}
            onSelectCourse={handleSelectCourse}
            onCreateCourse={() => setCurrentView('create')}
          />
        );
      case 'create':
        return <CourseCreator onCourseCreated={handleCourseCreated} />;
      case 'course':
        return selectedCourse ? (
          <CourseViewer
            course={selectedCourse}
            onBack={handleBackToDashboard}
            onUpdateCourse={handleUpdateCourse}
          />
        ) : (
          <Dashboard
            courses={courses}
            onSelectCourse={handleSelectCourse}
            onCreateCourse={() => setCurrentView('create')}
          />
        );
      case 'chatbot':
        return <ChatBot courses={courses} />;
      case 'analytics':
        return <AnalyticsDashboard onNavigate={handleNavigate} />;
      default:
        return <Hero onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onNavigate={handleNavigate}
        currentView={currentView}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <main>
        {renderCurrentView()}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

export default App; 