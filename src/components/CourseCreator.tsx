import React, { useState } from 'react';
import { Upload, FileText, Globe, Loader2, CheckCircle } from 'lucide-react';
import { Course } from '../types/course';
import { coursesApi } from '../lib/api';

interface CourseCreatorProps {
  onCourseCreated: (course: Course) => void;
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ onCourseCreated }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleCreateCourse = async () => {
    if ((!file && activeTab === 'pdf') || (!url && activeTab === 'url') || !title) {
      return;
    }

    setIsLoading(true);

    try {
      const source = activeTab === 'pdf' ? file?.name || 'PDF Document' : url;
      // Map activeTab to backend sourceType
      // For now, treat URL as youtube (can be enhanced later to detect type)
      const sourceType = activeTab === 'url' ? 'youtube' : 'pdf';
      
      // Call backend API to create course
      const createdCourse = await coursesApi.create({
        sourceType,
        source,
        title
      });

      // Convert course to frontend format
      const newCourse: Course = {
        ...createdCourse,
        id: createdCourse._id,
        createdAt: new Date(createdCourse.createdAt),
        lastAccessed: createdCourse.lastAccessed ? new Date(createdCourse.lastAccessed) : undefined,
        source: activeTab === 'url' ? 'youtube' : 'pdf'
      };

      onCourseCreated(newCourse);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Course</h3>
            <p className="text-gray-600">MindSphere AI is analyzing your content and generating personalized learning materials...</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Analyzing content structure
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
              Generating intelligent notes
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
              Creating dynamic quizzes
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
              Building flashcards
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
          <p className="text-gray-600">Upload a PDF or provide a URL to generate your personalized learning experience</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all ${
                activeTab === 'pdf'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload PDF
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all ${
                activeTab === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-5 h-5 mr-2" />
              From URL
            </button>
          </div>

          {/* Course Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content Input */}
          {activeTab === 'pdf' ? (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500">PDF files only, up to 10MB</p>
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">{file.name}</p>
                    <p className="text-xs text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreateCourse}
            disabled={(!file && activeTab === 'pdf') || (!url && activeTab === 'url') || !title}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Course with AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator; 