import React, { useState } from 'react';
import {
  ArrowLeft, Star, Users, Clock, BookOpen, Award,
  CheckCircle, Play, Lock, Loader
} from 'lucide-react';
import { CatalogCourse } from '../utils/catalogData';

interface CourseDetailProps {
  course: CatalogCourse;
  isEnrolled: boolean;
  onBack: () => void;
  onEnroll: (course: CatalogCourse) => void;
  onStartLearning: (course: CatalogCourse) => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  isEnrolled,
  onBack,
  onEnroll,
  onStartLearning
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnrollClick = async () => {
    setIsEnrolling(true);
    try {
      await onEnroll(course);
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Catalog</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
              <div className="relative h-96">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-3 py-1 bg-white/90 text-gray-900 text-sm font-semibold rounded-full">
                      {course.category}
                    </span>
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
                  <p className="text-lg text-white/90 mb-4">{course.description}</p>
                  <div className="flex items-center space-x-4 text-white">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{course.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-5 w-5" />
                      <span>{course.studentsEnrolled.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-5 w-5" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  {['overview', 'curriculum', 'instructor'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setExpandedSection(tab)}
                      className={`pb-4 font-semibold text-sm uppercase tracking-wide transition-colors ${
                        expandedSection === tab
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {expandedSection === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.whatYouLearn.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                    <ul className="space-y-2">
                      {course.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Description</h2>
                    <p className="text-gray-700 leading-relaxed">{course.summary}</p>
                  </div>
                </div>
              )}

              {expandedSection === 'curriculum' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Curriculum</h2>
                  <p className="text-gray-600 mb-6">
                    {course.totalLessons} lessons • {course.duration} total length
                  </p>

                  {course.lessons && course.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {course.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex-shrink-0">
                                {isEnrolled || index < 2 ? (
                                  <Play className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Lock className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                                <p className="text-sm text-gray-600">{lesson.description}</p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 ml-4">{lesson.duration}</span>
                          </div>
                          {(isEnrolled || index < 2) && (
                            <div className="mt-2 text-xs text-green-600 flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Preview available</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      Curriculum details will be available after enrollment
                    </p>
                  )}
                </div>
              )}

              {expandedSection === 'instructor' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Instructor</h2>
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                      {course.instructor.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.instructor}</h3>
                      <p className="text-gray-600 mb-4">
                        Expert educator passionate about making learning accessible and engaging.
                        With years of experience in {course.category.toLowerCase()}, they have helped
                        thousands of students achieve their learning goals.
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{course.rating}</p>
                          <p className="text-sm text-gray-600">Instructor Rating</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{course.studentsEnrolled.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Students</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{course.totalLessons}</p>
                          <p className="text-sm text-gray-600">Lessons</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Course includes:</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{course.totalLessons} comprehensive lessons</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{course.duration} of content</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Award className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">Certificate of completion</span>
                  </div>
                </div>
              </div>

              {isEnrolled ? (
                <div className="space-y-3">
                  <button
                    onClick={() => onStartLearning(course)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Continue Learning
                  </button>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">You're enrolled!</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-600">
                      <p>Progress: {course.progress}%</p>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnrollClick}
                    disabled={isEnrolling}
                    className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                      isEnrolling
                        ? 'opacity-75 cursor-not-allowed'
                        : 'hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {isEnrolling ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <span>Enroll Now - Free</span>
                    )}
                  </button>
                  {isEnrolling && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                        <div>
                          <p className="font-semibold text-blue-900">Generating your course...</p>
                          <p className="text-sm text-blue-700">AI is creating lessons, quizzes, and study materials</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                Full lifetime access • Learn at your own pace
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
 