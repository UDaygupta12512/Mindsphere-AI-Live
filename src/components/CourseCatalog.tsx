import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Users, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { CatalogCourse } from '../utils/catalogData';
import { catalogApi } from '../lib/api';

interface CourseCatalogProps {
  onCourseSelect: (course: CatalogCourse) => void;
  enrolledCourseIds: string[];
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ onCourseSelect, enrolledCourseIds }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const courses = await catalogApi.getAll();
        const transformedCourses = courses.map((course: any) => ({
          id: course.id || '',
          title: course.title || 'Untitled',
          description: course.description || 'No description available.',
          instructor: course.instructor || 'Unknown',
          category: course.category || 'General',
          level: course.level || 'Beginner',
          rating: course.rating || 0,
          studentsEnrolled: course.studentsEnrolled || 0,
          thumbnail: course.thumbnail || '',
          duration: course.duration || '0h',
          totalLessons: course.totalLessons || 0,
          whatYouLearn: Array.isArray(course.whatYouLearn) ? course.whatYouLearn : [],
          requirements: Array.isArray(course.requirements) ? course.requirements : [],
          lessons: Array.isArray(course.lessons) ? course.lessons : [],
          notes: Array.isArray(course.notes) ? course.notes : [],
          topics: Array.isArray(course.topics) ? course.topics : [],
          source: course.source || 'unknown',
          progress: course.progress || 0,
          quizzes: Array.isArray(course.quizzes) ? course.quizzes : [],
          flashcards: Array.isArray(course.flashcards) ? course.flashcards : [],
          createdAt: course.createdAt ? new Date(course.createdAt) : new Date(),
          updatedAt: course.updatedAt ? new Date(course.updatedAt) : new Date(),
          summary: course.summary || '',
          completedLessons: course.completedLessons || 0,
          certificate: course.certificate || false,
        }));
        setCatalogCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching catalog:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCatalog();
  }, []);

  const getCategories = () => {
    const categories = new Set(catalogCourses.map(course => course.category));
    return Array.from(categories);
  };

  const categories = ['All', ...getCategories()];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = catalogCourses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.studentsEnrolled - a.studentsEnrolled;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const totalStudents = catalogCourses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);
  const avgRating = catalogCourses.length > 0 
    ? (catalogCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / catalogCourses.length).toFixed(1)
    : '0';

  const stats = [
    { label: 'Total Courses', value: catalogCourses.length, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Categories', value: getCategories().length, icon: Filter, color: 'bg-green-500' },
    { label: 'Students Learning', value: totalStudents.toLocaleString(), icon: Users, color: 'bg-orange-500' },
    { label: 'Avg Rating', value: avgRating, icon: Star, color: 'bg-yellow-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Your Next Course
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse our curated collection of expert-led courses. Learn at your own pace and master new skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses, instructors, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                aria-label="Filter by level"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCourses.length}</span> courses
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort courses"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 overflow-hidden"
                onClick={() => onCourseSelect(course)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
                    }}
                  />
                  {isEnrolled && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Enrolled
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className="inline-block px-3 py-1 bg-white/90 text-gray-900 text-xs font-semibold rounded-full">
                      {course.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {course.level}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-gray-900">{course.rating}</span>
                      <span className="text-xs text-gray-500">({course.studentsEnrolled.toLocaleString()})</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Instructor</p>
                      <p className="text-sm font-semibold text-gray-900">{course.instructor}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCourseSelect(course);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        isEnrolled
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {isEnrolled ? 'Continue' : 'View Course'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCatalog; 