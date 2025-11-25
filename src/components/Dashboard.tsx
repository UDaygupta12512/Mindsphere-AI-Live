import React from 'react';
import { Play, FileText, Clock, TrendingUp, Award, BookOpen, Target } from 'lucide-react';
import { Course } from '../types/course';

interface DashboardProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onCreateCourse: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onSelectCourse, onCreateCourse }) => {
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const totalHours = courses.reduce((acc, course) => {
    const minutes = parseInt(course.duration.split(' ')[0]);
    return acc + minutes;
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
      value: `${Math.floor(totalHours / 60)}h`,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
          <p className="text-xl text-gray-600">Track your progress and continue learning</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  {React.cloneElement(stat.icon, { className: 'h-6 w-6 text-white' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg ${course.source === 'youtube' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {course.source === 'youtube' ? (
                        <Play className="h-5 w-5 text-red-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">Created {course.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{course.progress}% Complete</p>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6">Start your learning journey by creating your first course</p>
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

        {/* Courses Grid */}
        {courses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${course.source === 'youtube' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {course.source === 'youtube' ? (
                          <Play className="h-6 w-6 text-red-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-500">{course.duration}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{course.totalLessons || course.lessons?.length || 8} lessons</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{course.level || 'Intermediate'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span>{course.rating || 4.8}★</span>
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
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
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