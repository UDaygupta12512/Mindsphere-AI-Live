import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, BookOpen, Zap, Award, Flame, Activity, Target } from 'lucide-react';
import { api } from '../lib/api';
import { AnalyticsDashboardData } from '../types/analytics';

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching analytics from /api/analytics...');
      const data = await api.get<AnalyticsDashboardData>('/api/analytics');
      console.log('Analytics data received:', data);
      
      // Check if data has the expected structure
      if (data && typeof data === 'object' && 'data' in data) {
        setAnalytics((data as any).data);
      } else if (data && 'overview' in data) {
        setAnalytics(data);
      } else {
        console.warn('Unexpected data structure:', data);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your analytics...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Available</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Start learning to see your analytics dashboard!'}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Tip: Create a course or enroll in a catalog course to get started.
          </p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, courseProgress, dailyActivity, weeklyStats, achievements, learningStats } = analytics;

  // Prepare data for charts with fallbacks
  const progressByDay = (dailyActivity || []).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    lessons: day.lessonsCompleted || 0,
    quizzes: day.quizzesTaken || 0,
    time: Math.round((day.timeSpent || 0) / 60) // Convert to hours
  }));

  const courseProgressChartData = (courseProgress || []).map(c => ({
    name: c.courseTitle.length > 15 ? c.courseTitle.substring(0, 15) + '...' : c.courseTitle,
    progress: c.progress || 0,
    fullName: c.courseTitle
  }));

  const StatCard = ({ icon: Icon, label, value, unit = '', color = 'blue' }: any) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-6 border border-${color}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}{unit}</p>
        </div>
        <Icon className={`h-10 w-10 text-${color}-600 opacity-80`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Your Learning Analytics</h1>
          <p className="text-gray-600">Track your progress and celebrate your achievements</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={overview.totalCoursesEnrolled}
            color="blue"
          />
          <StatCard
            icon={Target}
            label="Courses Completed"
            value={overview.totalCoursesCompleted}
            color="purple"
          />
          <StatCard
            icon={Zap}
            label="Quiz Average"
            value={overview.averageQuizScore}
            unit="%"
            color="yellow"
          />
          <StatCard
            icon={Clock}
            label="Study Time"
            value={Math.round(overview.totalStudyTime / 60)}
            unit="h"
            color="green"
          />
        </div>

        {/* Streak and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={overview.currentStreak}
            unit="days"
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            label="Longest Streak"
            value={overview.longestStreak}
            unit="days"
            color="indigo"
          />
          <StatCard
            icon={Activity}
            label="Lessons Completed"
            value={overview.totalLessonsCompleted}
            color="cyan"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Daily Activity Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="h-6 w-6 mr-3 text-blue-600" />
              Activity Overview (Last 14 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="lessons" fill="#3b82f6" name="Lessons" />
                <Bar dataKey="quizzes" fill="#8b5cf6" name="Quizzes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Course Progress Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-green-600" />
              Course Progress
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseProgressChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `${value}%`}
                />
                <Bar dataKey="progress" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Weekly Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(weeklyStats || []).slice(-4).map((week, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-600">{week.week}</p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-700"><strong>Lessons:</strong> {week.lessonsCompleted || 0}</p>
                  <p className="text-sm text-gray-700"><strong>Quizzes:</strong> {week.quizzesTaken || 0}</p>
                  <p className="text-sm text-gray-700"><strong>Time:</strong> {Math.round((week.totalTimeSpent || 0) / 60)}h</p>
                  <p className="text-sm text-blue-600 font-semibold"><strong>Avg Score:</strong> {week.averageQuizScore || 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="h-6 w-6 mr-3 text-yellow-600" />
            🏆 Achievements & Badges
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(achievements || []).map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-lg p-4 border-2 ${
                  achievement.unlockedDate
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="font-bold text-sm text-gray-900">{achievement.name}</p>
                <p className="text-xs text-gray-600 mb-3">{achievement.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${achievement.progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{Math.round(achievement.progress || 0)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">📚 Learning Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-gray-700 font-medium">Total Learning Time</span>
                <span className="text-2xl font-bold text-blue-600">{Math.round((learningStats?.totalMinutesLearned || 0) / 60)}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-gray-700 font-medium">Avg Study Session</span>
                <span className="text-2xl font-bold text-purple-600">{learningStats?.averageStudySession || 0}m</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-gray-700 font-medium">Most Active Day</span>
                <span className="text-lg font-bold text-green-600">{learningStats?.mostActiveDay || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                <span className="text-gray-700 font-medium">Study Style</span>
                <span className="text-lg font-bold text-pink-600">{learningStats?.preferredStudyTime || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Topics */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🎯 Topics & Skills</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                ✅ Mastered Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {learningStats?.topicsMastered && learningStats.topicsMastered.length > 0 ? (
                  learningStats.topicsMastered.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No mastered topics yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                🚀 In Progress
              </h3>
              <div className="flex flex-wrap gap-2">
                {learningStats?.topicsInProgress && learningStats.topicsInProgress.length > 0 ? (
                  learningStats.topicsInProgress.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No topics in progress</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Keep Up the Great Work! 🎉</h2>
          <p className="text-blue-100 mb-6">You're making excellent progress. Keep learning and achieve your goals!</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Continue Learning
            </button>
            <button className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-500">
              View Certificates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
