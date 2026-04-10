import React from 'react';
import { Play, FileText, Clock, TrendingUp, Award, BookOpen, Target, ChevronRight, Brain } from 'lucide-react';
import { Course } from '../types/course';
import StudyTimer from './StudyTimer';
import LearningGoals from './LearningGoals';
import LearningStreak from './LearningStreak';
import WelcomeBanner from './WelcomeBanner';
import LearningPersonaCard from './LearningPersonaCard';
import CourseRecommender from './CourseRecommender';
import { useCountUp } from '../hooks/useCountUp';
import { srsApi } from '../lib/api';

interface DashboardProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onCreateCourse: () => void;
  userName?: string;
  currentStreak?: number;
  longestStreak?: number;
  onReviewClick?: () => void;
}

// Animated Stat Card Component
interface StatCardProps {
  stat: {
    label: string;
    value: number | string;
    icon: React.ReactElement;
    color: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  // Parse numeric values for animation
  const getNumericValue = (value: number | string): { num: number; suffix: string } => {
    if (typeof value === 'number') return { num: value, suffix: '' };
    const match = value.match(/^(\d+)(.*)$/);
    if (match) return { num: parseInt(match[1]), suffix: match[2] };
    return { num: 0, suffix: String(value) };
  };

	const { num, suffix } = getNumericValue(stat.value);
	const { displayValue, ref } = useCountUp({
	  end: num,
	  duration: 2000,
	  suffix: suffix,
	});

  return (
    <div ref={ref} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{displayValue}</p>
        </div>
        <div className={`p-3 rounded-lg ${stat.color}`}>
          {React.cloneElement(stat.icon, { className: 'h-6 w-6 text-white' })}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  courses,
  onSelectCourse,
  onCreateCourse,
  userName = 'Learner',
  currentStreak = 0,
  longestStreak = 0,
  onReviewClick
}) => {
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const [srsStats, setSrsStats] = React.useState<{
    total: number;
    dueNow: number;
    dueTomorrow: number;
    atRisk: number;
    needsReview: number;
    mastered: number;
  } | null>(null);

  // Load SRS stats on mount
  React.useEffect(() => {
    const loadSrsStats = async () => {
      try {
        const response = await srsApi.getStats();
        setSrsStats(response.stats);
      } catch (error) {
        console.error('Error loading SRS stats:', error);
      }
    };
    loadSrsStats();
  }, []);

  // Robust duration parsing that handles various formats
  const parseDurationMinutes = (duration: string): number => {
    if (!duration) return 0;
    // Handle "Xh Ym" or "X hours Y minutes" formats
    const hourMatch = duration.match(/(\d+)\s*h/i);
    const minMatch = duration.match(/(\d+)\s*m/i);
    let total = 0;
    if (hourMatch) total += parseInt(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1]);
    // Handle plain number (assumed minutes)
    if (!hourMatch && !minMatch) {
      const num = parseInt(duration);
      if (!isNaN(num)) total = num;
    }
    return total;
  };

  const totalMinutes = courses.reduce((acc, course) => {
    return acc + parseDurationMinutes(course.duration);
  }, 0);

  const stats = [
    {
      label: 'Total Courses',
      value: totalCourses,
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Completed',
      value: completedCourses,
      icon: <Award className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      label: 'Learning Hours',
      value: `${Math.floor(totalMinutes / 60)}h`,
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      label: 'Progress Rate',
      value: totalCourses > 0 ? `${Math.round((completedCourses / totalCourses) * 100)}%` : '0%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-dark-bg dark:to-gray-900 transition-colors duration-300 z-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Welcome Banner */}
        <div className="mb-8">
          <WelcomeBanner
            userName={userName}
            coursesInProgress={courses.filter(c => c.progress > 0 && c.progress < 100).length}
            currentStreak={currentStreak}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Main Content Grid - Sidebar with Timer, Goals, Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content - Recent Activity & Courses */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Recall Review Card */}
            {srsStats && srsStats.dueNow > 0 && (
              <div
                onClick={onReviewClick}
                className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 shadow-2xl cursor-pointer hover:shadow-3xl transition-all transform hover:scale-105 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-6 w-6" />
                      <h3 className="text-2xl font-bold">Active Recall Review</h3>
                    </div>
                    <p className="text-blue-100 mb-4">
                      You have {srsStats.dueNow} concept{srsStats.dueNow > 1 ? 's' : ''} ready for review
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {srsStats.atRisk > 0 && (
                        <div className="bg-white dark:bg-gray-800/20 rounded-lg p-3 backdrop-blur">
                          <div className="text-2xl font-bold">{srsStats.atRisk}</div>
                          <div className="text-xs opacity-90">At Risk</div>
                        </div>
                      )}
                      {srsStats.needsReview > 0 && (
                        <div className="bg-white dark:bg-gray-800/20 rounded-lg p-3 backdrop-blur">
                          <div className="text-2xl font-bold">{srsStats.needsReview}</div>
                          <div className="text-xs opacity-90">Need Review</div>
                        </div>
                      )}
                      {srsStats.mastered > 0 && (
                        <div className="bg-white dark:bg-gray-800/20 rounded-lg p-3 backdrop-blur">
                          <div className="text-2xl font-bold">{srsStats.mastered}</div>
                          <div className="text-xs opacity-90">Mastered</div>
                        </div>
                      )}
                    </div>
                    <button className="bg-white dark:bg-gray-800 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2">
                      <span>Review Now</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <Brain className="h-32 w-32 opacity-20" />
                </div>
              </div>
            )}

            {/* Continue Learning */}
            {courses.filter(c => c.progress > 0 && c.progress < 100).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Play className="h-6 w-6 text-blue-500" />
                  Continue Learning
                </h2>
                <div className="grid gap-4">
                  {courses
                    .filter(c => c.progress > 0 && c.progress < 100)
                    .slice(0, 2)
                    .map((course) => (
                      <div
                        key={course._id || course.id}
                        onClick={() => onSelectCourse(course)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${course.sourceType === 'youtube' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {course.sourceType === 'youtube' ? (
                              <Play className="h-6 w-6 text-red-600" />
                            ) : (
                              <FileText className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{course.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{course.progress}%</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 p-6">
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.slice(0, 3).map((course) => (
                        <div key={course._id || course.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" onClick={() => onSelectCourse(course)}>
                        <div className={`p-2 rounded-lg ${course.sourceType === 'youtube' ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {course.sourceType === 'youtube' ? (
                            <Play className="h-5 w-5 text-red-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Created {new Date(course.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{course.progress}% Complete</p>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Start your learning journey by creating your first course</p>
                    <button
                      aria-label="Create First Course"
                      onClick={onCreateCourse}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      Create First Course
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Course Recommender */}
            {courses.length > 0 && (
              <div>
                <CourseRecommender onCreateCourse={onCreateCourse} />
              </div>
            )}
          </div>

          {/* Sidebar - Study Tools */}
          <div className="space-y-6">
            {/* Learning Persona Card */}
            <LearningPersonaCard compact />
            <LearningStreak
              currentStreak={currentStreak}
              longestStreak={longestStreak}
            />
            <StudyTimer />
            <LearningGoals userName={userName} />
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id || course.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${course.sourceType === 'youtube' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {course.sourceType === 'youtube' ? (
                          <Play className="h-6 w-6 text-red-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-500">{course.duration}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{course.totalLessons || course.lessons?.length || 0} lessons</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{course.level || 'Intermediate'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 