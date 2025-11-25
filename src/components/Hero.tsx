import React from 'react';
import { Play, FileText, Brain, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import DemoModal from './DemoModal';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  const features = [
    {
      icon: <Play className="h-6 w-6" />,
      title: 'YouTube Integration',
      description: 'Extract and transform video lectures into structured courses'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'PDF Processing',
      description: 'Convert academic papers and documents into interactive lessons'
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'AI-Generated Content',
      description: 'Automatic quiz creation, flashcards, and summaries'
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'AI Tutor Chatbot',
      description: 'Get instant answers and explanations from course content'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Next-Gen AI Learning Platform</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Any Content Into
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Interactive Courses
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            MindSphere AI uses advanced AI to convert YouTube videos and PDFs into comprehensive 
            micro-courses with structured notes, quizzes, flashcards, and an intelligent tutor bot.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              aria-label="Create Your First Course"
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Create Your First Course</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setIsDemoModalOpen(true)}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 hover:bg-white/80 transition-all duration-200 hover:transform hover:scale-105 group"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white/30 backdrop-blur-sm rounded-3xl p-8 border border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                10,000+
              </div>
              <div className="text-gray-600 mt-2">Courses Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                95%
              </div>
              <div className="text-gray-600 mt-2">Learning Efficiency</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                50+
              </div>
              <div className="text-gray-600 mt-2">Languages Supported</div>
            </div>
          </div>
        </div>
      </div>
      
      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </div>
  );
};

export default Hero; 