import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import DemoModal from './DemoModal';
import hero3dImage from '../assets/hero_3d.png';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  const stats = [
    { value: '10,000+', label: 'Courses Generated' },
    { value: '95%', label: 'Learning Efficiency' },
    { value: '50+', label: 'Languages Supported' }
  ];

  return (
    <div className="min-h-[90vh] bg-[#050505] text-white overflow-hidden relative flex items-center">
      {/* Intense Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-neon-purple/30 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-neon-blue/30 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>

      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div className="text-left z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-neon-blue to-purple-400 drop-shadow-[0_0_25px_rgba(0,243,255,0.4)]">
                Transform Your
              </span>
              <br />
              <span className="text-white drop-shadow-xl">Learning Journey</span>
            </h1>

            <p className="text-2xl text-gray-200 mb-12 leading-relaxed max-w-2xl border-l-4 border-neon-blue pl-8 font-light">
              Join thousands of learners who create personalized, AI-powered courses in <span className="text-neon-blue font-bold">minutes</span>. Experience the future of education today.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-20">
              <button
                onClick={onGetStarted}
                className="group relative bg-[#00f3ff] text-black text-lg px-10 py-5 rounded-2xl font-bold overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(0,243,255,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative z-10 flex items-center gap-3">
                  <span>Start Creating Now</span>
                  <ArrowRight className="h-6 w-6" />
                </div>
              </button>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-10 py-5 text-lg border-2 border-neon-purple/50 text-white rounded-2xl font-medium hover:bg-neon-purple/20 transition-all backdrop-blur-md shadow-[0_0_30px_rgba(188,19,254,0.2)] hover:shadow-[0_0_50px_rgba(188,19,254,0.4)]"
              >
                View Examples
              </button>
            </div>
          </div>

          <div className="relative h-full flex items-center justify-center">
            {/* 3D Asset Container with Floating Animation and Glow */}
            <div className="relative w-full max-w-[800px] animate-blob z-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 blur-[100px] rounded-full" />
              <img
                src={hero3dImage}
                alt="AI Core 3D Illustration"
                className="relative w-full h-auto object-contain drop-shadow-[0_0_60px_rgba(0,243,255,0.3)] transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

        </div>

        {/* Hero Stats (Fixed Visibility) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 md:mt-32">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-8 bg-[#111]/80 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-neon-purple/60 hover:bg-[#1a1a1a] transition-all duration-300 group shadow-2xl">
              {/* Force Solid Color with Shadow for Visibility */}
              <div className="text-5xl font-black text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.6)] mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                {stat.value}
              </div>
              <div className="text-xl text-gray-300 font-medium group-hover:text-white transition-colors">{stat.label}</div>
            </div>
          ))}
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