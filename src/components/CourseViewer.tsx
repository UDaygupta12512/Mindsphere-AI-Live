import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, BookOpen, HelpCircle, Layers, Download, CheckCircle, Play, Clock, Users, Star, Award, FileText, Link, Code, Image } from 'lucide-react';
import { Course } from '../types/course';
import QuizComponent from './QuizComponent';
import FlashcardsComponent from './FlashcardsComponent';
import { coursesApi } from '../lib/api';

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
  onUpdateCourse: (course: Course) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack, onUpdateCourse }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'notes' | 'quiz' | 'flashcards'>('overview');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'lessons', label: 'Lessons', icon: <Play className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="h-4 w-4" /> },
  ];

  const handleQuizComplete = async (score: number) => {
    // Calculate progress bonus based on score (higher score = more progress)
    const progressBonus = Math.round(25 * (score / 100));
    const newProgress = Math.min(100, course.progress + progressBonus);
    const updatedCourse = {
      ...course,
      progress: newProgress
    };
    
    // Update local state
    onUpdateCourse(updatedCourse);
    
    // Sync to backend
    try {
      await coursesApi.updateProgress(course.id, {
        progress: newProgress
      });
    } catch (error) {
      console.error('Error updating quiz progress:', error);
    }
  };

  const handleFlashcardComplete = async () => {
    const newProgress = Math.min(100, course.progress + 15);
    const updatedCourse = {
      ...course,
      progress: newProgress
    };
    
    // Update local state
    onUpdateCourse(updatedCourse);
    
    // Sync to backend
    try {
      await coursesApi.updateProgress(course.id, {
        progress: newProgress
      });
    } catch (error) {
      console.error('Error updating flashcard progress:', error);
    }
  };

  const handleLessonComplete = async (lessonIndex: number) => {
    const updatedLessons = [...course.lessons];
    updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], isCompleted: true };
    
    const completedCount = updatedLessons.filter(l => l.isCompleted).length;
    const progressPercentage = Math.round((completedCount / course.totalLessons) * 100);
    
    const updatedCourse = {
      ...course,
      lessons: updatedLessons,
      completedLessons: completedCount,
      progress: progressPercentage,
      lastAccessed: new Date()
    };
    
    // Update local state
    onUpdateCourse(updatedCourse);
    
    // Sync to backend
    try {
      await coursesApi.updateProgress(course.id, {
        completedLessons: completedCount,
        progress: progressPercentage,
  lessons: updatedLessons as any
      });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const currentLesson = course.lessons && course.lessons[selectedLessonIndex];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  console.log('Debugging course.duration:', course.duration);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 mb-6 lg:mb-0 lg:pr-8">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {course.category || 'General'}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {course.level || 'Intermediate'}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.studentsEnrolled || 1247} students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{course.rating || 4.8} ({Math.floor(Math.random() * 500) + 100} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Play className="h-4 w-4" />
                    <span>{course.totalLessons || course.lessons?.length || 8} lessons</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Instructor: <span className="font-medium text-gray-900">{course.instructor || 'AI Generated'}</span>
                  </div>
                  {course.certificate && (
                    <div className="flex items-center space-x-1 text-sm text-green-600">
                      <Award className="h-4 w-4" />
                      <span>Certificate included</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">Course Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{course.progress}%</p>
                  <p className="text-sm text-gray-500">{course.completedLessons || 0} of {course.totalLessons || course.lessons?.length || 8} lessons</p>
                </div>
                <div className="w-48">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Download Resources</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
              
              <div className="space-y-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'lessons' && course.lessons && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Curriculum</h4>
                  {course.lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonIndex(index)}
                      className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors border ${
                        selectedLessonIndex === index
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : 'text-gray-600 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{lesson.title}</span>
                        {lesson.isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Sections</h4>
                </div>
              )}

              {/* Topics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Topics Covered</h4>
                <div className="space-y-1">
                  {course.topics.slice(0, 5).map((topic, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{topic}</span>
                    </div>
                  ))}
                  {course.topics.length > 5 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{course.topics.length - 5} more topics
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              {activeTab === 'overview' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Overview</h2>
                  
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{course.totalLessons || course.lessons?.length || 8}</div>
                      <div className="text-sm text-gray-600">Lessons</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{course.completedLessons || 0}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{course.quizzes.length}</div>
                      <div className="text-sm text-gray-600">Quizzes</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{course.flashcards.length}</div>
                      <div className="text-sm text-gray-600">Flashcards</div>
                    </div>
                  </div>

                  {/* Course Description */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Course</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {course.summary || `This comprehensive course covers ${course.topics.slice(0, 3).join(', ')} and more. Through interactive lessons, practical exercises, and real-world examples, you'll gain the knowledge and skills needed to master this subject. The course is designed for ${course.level?.toLowerCase()} learners and includes hands-on projects, quizzes, and downloadable resources.`}
                      </p>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Learn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.topics.slice(0, 6).map((topic, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setActiveTab('lessons')}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-5 w-5" />
                      <span>Start Learning</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('quiz')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <HelpCircle className="h-5 w-5" />
                      <span>Take Quiz</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('flashcards')}
                      className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Layers className="h-5 w-5" />
                      <span>Review Flashcards</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'lessons' && (
                <div>
                  {currentLesson ? (
                    <div>
                      {/* Video Player */}
                      <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
                        {currentLesson.videoUrl ? (
                          <div className="w-full h-full relative">
                            {currentLesson.isSearchUrl ? (
                              // Display YouTube search as a link with preview
                              <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-6">
                                <Play className="h-16 w-16 text-red-500 mb-4" />
                                <p className="text-white text-lg font-semibold mb-2">Watch on YouTube</p>
                                <p className="text-gray-400 text-sm mb-6 text-center">Click the button below to search for this topic on YouTube</p>
                                <a
                                  href={currentLesson.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                  Search YouTube for "{currentLesson.title?.replace('Search: ', '')}"
                                </a>
                              </div>
                            ) : (
                              // Display embedded YouTube video
                              <iframe
                                width="100%"
                                height="100%"
                                src={currentLesson.videoUrl}
                                title={currentLesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              ></iframe>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-white">
                              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg">Video content will be available soon</p>
                              <p className="text-sm opacity-75">Continue with the lesson content below</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lesson Content */}
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
                            <p className="text-gray-600">{currentLesson.description}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">{currentLesson.duration}</span>
                            {!currentLesson.isCompleted && (
                              <button
                                onClick={() => handleLessonComplete(selectedLessonIndex)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                            {currentLesson.isCompleted && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Completed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lesson Text Content */}
                        <div className="prose max-w-none mb-8">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {currentLesson.content}
                          </div>
                        </div>

                        {/* Resources */}
                        {currentLesson.resources && currentLesson.resources.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Resources</h3>
                            <div className="space-y-3">
                              {currentLesson.resources.map((resource) => (
                                <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    {getResourceIcon(resource.type)}
                                    <div>
                                      <p className="font-medium text-gray-900">{resource.title}</p>
                                      {resource.size && (
                                        <p className="text-sm text-gray-500">{resource.size}</p>
                                      )}
                                    </div>
                                  </div>
                                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                          <button
                            onClick={() => setSelectedLessonIndex(Math.max(0, selectedLessonIndex - 1))}
                            disabled={selectedLessonIndex === 0}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Previous Lesson</span>
                          </button>
                          
                          <span className="text-sm text-gray-500">
                            Lesson {selectedLessonIndex + 1} of {course.lessons.length}
                          </span>
                          
                          <button
                            onClick={() => setSelectedLessonIndex(Math.min(course.lessons.length - 1, selectedLessonIndex + 1))}
                            disabled={selectedLessonIndex === course.lessons.length - 1}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                          >
                            <span>Next Lesson</span>
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lessons Available</h3>
                      <p className="text-gray-600">Lessons will be generated based on your course content.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="p-8">
                  <h4 className="text-sm font-medium text-gray-600 mb-4">Sections</h4>
                  <div className="space-y-4">
                    {course.notes.map((note, index) => (
                      <div key={note.title + index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="font-semibold text-lg mb-3">{note.title}</div>
                        <ul className="list-disc ml-5 text-sm text-gray-600 space-y-2">
                          {(Array.isArray(note.summary) ? note.summary : [note.summary]).map((s: string | undefined, i: number) => (
                            s ? (
                              <li key={i}>
                                <span className="inline">
                                  <ReactMarkdown components={{p: 'span'}}>{s}</ReactMarkdown>
                                </span>
                              </li>
                            ) : null
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="p-8">
                  <QuizComponent 
                    quizzes={course.quizzes}
                    courseId={course.id}
                    onComplete={handleQuizComplete}
                  />
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="p-8">
                  <FlashcardsComponent 
                    flashcards={course.flashcards}
                    onComplete={handleFlashcardComplete}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer; 