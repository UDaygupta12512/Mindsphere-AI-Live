import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, BookOpen, Zap, Award, Flame, Activity, Target } from 'lucide-react';
import { api } from '../lib/api';
import { AnalyticsDashboardData } from '../types/analytics';

// Generate a highly visualized PDF report
async function handleDownloadReport(analytics: AnalyticsDashboardData | null) {


  if (!analytics) return;

  // Initialize PDF - A4 size, pt units
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Colors
  const colors = {
    primary: '#2563EB',    // Blue-600
    secondary: '#1E40AF',  // Blue-800
    accent: '#F59E0B',     // Amber-500
    success: '#10B981',    // Emerald-500
    text: '#1F2937',       // Gray-800
    lightText: '#6B7280',  // Gray-500
    bgLight: '#F3F4F6',    // Gray-100
    white: '#FFFFFF'
  };

  // Helper: Add Header
  const addHeader = (title: string) => {
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(colors.white);
    doc.text(title, margin, 40);

    // Add Logo/Brand placeholder if needed
    doc.setFontSize(10);
    doc.text('MindSphere Analytics', pageWidth - margin, 40, { align: 'right' });
  };

  // Helper: Add Footer
  const addFooter = (pageNumber: number) => {
    doc.setFillColor(colors.bgLight);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.lightText);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 12);
    doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  };

  // Page 1: Overview

  addHeader('Learning Analytics Report');
  addFooter(1);

  // Start below the header (header height = 60), add extra breathing room
  let yPos = 80;

  // Student Info Section
  if (analytics) {
    const studentName = analytics.overview.name || 'Student';
    const studentEmail = analytics.overview.email || 'N/A';
    const joinedAt = analytics.overview.joinedAt || 'N/A';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(colors.text);
    doc.text(`Name: ${studentName}`, margin, yPos);
    yPos += 18; // larger spacing to avoid header overlap
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Email: ${studentEmail}`, margin, yPos);
    yPos += 16;
    doc.text(`Enrolled: ${joinedAt}`, margin, yPos);
    yPos += 20; // Extra space before next section
  }

  // Title Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colors.text);
  doc.text('Your Learning Journey', margin, yPos);
  yPos += 30;

  // Overview Stats Grid
  const statBoxWidth = (pageWidth - 2 * margin - 20) / 2;
  const statBoxHeight = 60;
  const stats = [
    { label: 'Total Courses Enrolled', value: analytics.overview.totalCoursesEnrolled, color: colors.primary },
    { label: 'Courses Completed', value: analytics.overview.totalCoursesCompleted, color: colors.success },
    { label: 'Average Quiz Score', value: `${analytics.overview.averageQuizScore}%`, color: colors.accent },
    { label: 'Total Study Time', value: `${Math.round(analytics.overview.totalStudyTime / 60)}h`, color: colors.secondary },
  ];

  stats.forEach((stat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margin + col * (statBoxWidth + 20);
    const y = yPos + row * (statBoxHeight + 10);

    doc.setFillColor(stat.color);
    doc.roundedRect(x, y, statBoxWidth, statBoxHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.white);
    doc.text(stat.label, x + 10, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(String(stat.value), x + 10, y + 45);
  });

  yPos += 2 * (statBoxHeight + 10) + 20;

  // Streaks Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.text);
  doc.text('Learning Streaks', margin, yPos);
  yPos += 25;

  const streakData = [
    { label: 'Current Streak', value: `${analytics.overview.currentStreak} days` },
    { label: 'Longest Streak', value: `${analytics.overview.longestStreak} days` },
    { label: 'Total Lessons Completed', value: analytics.overview.totalLessonsCompleted },
  ];

  streakData.forEach(item => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(colors.text);
    doc.text(`${item.label}:`, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.value), margin + 150, yPos);
    yPos += 20;
  });


  // Course Progress Summary (clear separation)
  yPos += 12;
  if (analytics) {
    const completed = (analytics.courseProgress || []).filter(c => c.status === 'Completed').length;
    const inProgress = (analytics.courseProgress || []).filter(c => c.status === 'In Progress').length;
    const notStarted = (analytics.courseProgress || []).filter(c => c.status === 'Not Started').length;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.text);
    // Print the summary header on its own line
    doc.text('Course Progress Summary', margin, yPos);
    yPos += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    // Print counts on a separate line
    doc.text(`Completed: ${completed}   In Progress: ${inProgress}   Not Started: ${notStarted}`, margin, yPos);
    yPos += 22; // extra space to clearly separate sections
  }

  // Course Progress Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.text);
  doc.text('Course Progress', margin, yPos);
  yPos += 25;

  analytics.courseProgress.forEach(course => {
    if (yPos > pageHeight - 100) {
      doc.addPage();
      addHeader('Learning Analytics Report');
      addFooter(doc.getNumberOfPages());
      yPos = 80;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.text);
    doc.text(course.courseTitle, margin, yPos);
    yPos += 14;

    // Progress bar
    const barWidth = pageWidth - 2 * margin;
    const barHeight = 12;
    doc.setFillColor(colors.bgLight);
    doc.roundedRect(margin, yPos, barWidth, barHeight, 3, 3, 'F');
    doc.setFillColor(colors.success);
    doc.roundedRect(margin, yPos, (barWidth * course.progress) / 100, barHeight, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colors.text);
    doc.text(`${Math.round(course.progress)}%`, margin + barWidth - 30, yPos + 9);
    yPos += barHeight + 10; // More space after each bar
  });

  // Save the PDF
  // Quiz Summary Section
  // Check if we need a new page before adding
  if (yPos > pageHeight - 140) {
    doc.addPage();
    addHeader('Learning Analytics Report');
    addFooter(doc.getNumberOfPages());
    yPos = 80;
  }
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.text);
  doc.text('Quiz Summary', margin, yPos);
  yPos += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const quizDays = (analytics.dailyActivity || []).filter(d => (d.quizzesTaken || 0) > 0);
  if (quizDays.length === 0) {
    doc.text('No quizzes attempted in the selected period.', margin, yPos);
    yPos += 15;
  } else {
    quizDays.forEach(d => {
      const dateLabel = d.date ? new Date(d.date).toLocaleDateString() : 'Unknown date';
      doc.text(`${dateLabel}: ${d.quizzesTaken} quiz${d.quizzesTaken > 1 ? 'zes' : ''} attempted`, margin, yPos);
      yPos += 13;
      if (yPos > pageHeight - 90) {
        doc.addPage();
        addHeader('Learning Analytics Report');
        addFooter(doc.getNumberOfPages());
        yPos = 80;
      }
    });
  }

  // Student Analysis Section
  if (yPos > pageHeight - 140) {
    doc.addPage();
    addHeader('Learning Analytics Report');
    addFooter(doc.getNumberOfPages());
    yPos = 80;
  }
  yPos += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.text);
  doc.text('Student Analysis', margin, yPos);
  yPos += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  // Simple analysis based on progress and quiz
  let analysis = '';
  if ((analytics.overview.totalCoursesCompleted || 0) > 0) {
    analysis += 'Great job completing your courses! ';
  } else {
    analysis += 'Keep working towards completing your courses. ';
  }
  if ((analytics.overview.averageQuizScore || 0) >= 70) {
    analysis += 'Your quiz performance is strong.';
  } else if ((analytics.overview.averageQuizScore || 0) >= 40) {
    analysis += 'Your quiz performance is improving. Review weak areas for better results.';
  } else {
    analysis += 'Focus on reviewing course material and practicing quizzes to improve your scores.';
  }
  // Allow text wrapping within margins
  doc.text(analysis, margin, yPos, { maxWidth: pageWidth - 2 * margin });
  yPos += 30;

  // Final footer update for current last page
  addFooter(doc.getNumberOfPages());
  doc.save('learning-analytics-report.pdf');
}

const AnalyticsDashboard: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
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
      const rawData = await api.get<any>('/api/analytics');
      
      // Backend returns {success: true, data: {...}} - extract the analytics data
      let analyticsData: AnalyticsDashboardData;
      if (rawData && rawData.data && rawData.data.overview) {
        analyticsData = rawData.data;
      } else if (rawData && rawData.overview) {
        analyticsData = rawData;
      } else {
        setError('Unexpected response format from server');
        return;
      }

      // Ensure all required fields have safe defaults
      analyticsData.overview = analyticsData.overview || {} as any;
      analyticsData.courseProgress = analyticsData.courseProgress || [];
      analyticsData.dailyActivity = analyticsData.dailyActivity || [];
      analyticsData.weeklyStats = analyticsData.weeklyStats || [];
      analyticsData.achievements = analyticsData.achievements || [];
      analyticsData.learningStats = analyticsData.learningStats || {} as any;
      
      setAnalytics(analyticsData);
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

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  };

  const StatCard = ({ icon: Icon, label, value, unit = '', color = 'blue' }: any) => {
    const c = colorMap[color] || colorMap.blue;
    return (
      <div className={`${c.bg} rounded-lg p-6 border ${c.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}{unit}</p>
          </div>
          <Icon className={`h-10 w-10 ${c.text} opacity-80`} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Download Report Button */}
        <div className="flex justify-end mb-4">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors"
            onClick={() => handleDownloadReport(analytics)}
          >
            📥 Download Report (PDF)
          </button>
        </div>
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

          {/* Enhanced Course Progress UI */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-green-600" />
              Course Progress
            </h2>
            <div className="space-y-6">
              {courseProgressChartData.length === 0 && (
                <div className="text-gray-400 text-center py-8">No course progress yet. Start learning to see your progress!</div>
              )}
              {courseProgressChartData.map((course) => (
                <div key={course.fullName} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-[120px]">
                    <span className="font-semibold text-gray-800 text-base" title={course.fullName}>{course.fullName}</span>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute left-0 top-0 h-5 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 transition-all duration-700"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                      <div className="absolute right-3 top-0 h-5 flex items-center text-xs font-bold text-gray-700">
                        {Math.round(course.progress)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Weekly Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              // Always show the last 3 weeks plus the current week (if not already included)
              const stats = weeklyStats || [];
              // Try to get unique week labels in order
              const uniqueWeeks = Array.from(new Set(stats.map(w => w.week)));
              // Get the last 3 weeks
              const last3 = uniqueWeeks.slice(-3);
              // Always include the last (current) week
              const currentWeek = uniqueWeeks[uniqueWeeks.length - 1];
              const weeksToShow = last3.includes(currentWeek) ? last3 : [...last3, currentWeek];
              // Filter stats to only those weeks
              const filtered = stats.filter(w => weeksToShow.includes(w.week));
              return filtered.map((week, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">{week.week}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700"><strong>Lessons:</strong> {week.lessonsCompleted || 0}</p>
                    <p className="text-sm text-gray-700"><strong>Quizzes:</strong> {week.quizzesTaken || 0}</p>
                    <p className="text-sm text-gray-700"><strong>Time:</strong> {Math.round((week.totalTimeSpent || 0) / 60)}h</p>
                    <p className="text-sm text-blue-600 font-semibold"><strong>Avg Score:</strong> {week.averageQuizScore || 0}%</p>
                  </div>
                </div>
              ));
            })()}
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
                className={`rounded-lg p-4 border-2 ${achievement.unlockedDate
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
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Continue Learning
            </button>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-500"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
