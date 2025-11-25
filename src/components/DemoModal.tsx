import React from 'react';
import { X, Play, Users, BookOpen, Brain, Award } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const demoSteps = [
    {
      title: "Upload Your Content",
      description: "Simply paste a YouTube URL or upload a PDF document",
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      image: "https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      title: "AI Processing",
      description: "Our advanced AI analyzes and extracts key concepts automatically",
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      title: "Interactive Learning",
      description: "Get structured notes, quizzes, flashcards, and AI tutoring",
      icon: <Users className="h-8 w-8 text-green-600" />,
      image: "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics",
      icon: <Award className="h-8 w-8 text-orange-600" />,
      image: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpg?auto=compress&cs=tinysrgb&w=400"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">How MindSphere AI Works</h2>
            <p className="text-gray-600">Transform any content into interactive courses in minutes</p>
          </div>
          <button
            aria-label="Close Demo Modal"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Demo Video Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl overflow-hidden">
            <div className="aspect-video flex items-center justify-center">
              <button className="group flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all">
                <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">MindSphere AI Demo</h3>
              <p className="text-white/80 text-sm">See how AI transforms content into courses</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            From Content to Course in 4 Simple Steps
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoSteps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features Highlight */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">What You Get</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">📝</div>
                <div className="text-sm text-gray-700 mt-1">Structured Notes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">🧠</div>
                <div className="text-sm text-gray-700 mt-1">Smart Quizzes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">🎯</div>
                <div className="text-sm text-gray-700 mt-1">Flashcards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">🤖</div>
                <div className="text-sm text-gray-700 mt-1">AI Tutor</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Start Creating Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal; 