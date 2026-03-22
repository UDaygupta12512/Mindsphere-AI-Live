import React from 'react';
import { Upload, Cpu, BookOpen, Download } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            icon: <Upload className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "Upload Content",
            description: "Simply paste a YouTube URL or drag & drop your PDF files. Our system supports multiple formats and handles large files efficiently."
        },
        {
            number: "02",
            icon: <Cpu className="h-8 w-8 text-white" />,
            color: "bg-purple-600",
            title: "AI Processing",
            description: "Our advanced AI analyzes your content, extracts key concepts, and identifies learning objectives using natural language processing."
        },
        {
            number: "03",
            icon: <BookOpen className="h-8 w-8 text-white" />,
            color: "bg-green-600",
            title: "Course Generation",
            description: "AI creates comprehensive notes, interactive quizzes, flashcards, and a personalized tutor based on your content."
        },
        {
            number: "04",
            icon: <Download className="h-8 w-8 text-white" />,
            color: "bg-orange-600",
            title: "Learn & Export",
            description: "Study with the generated materials, chat with your AI tutor, and export everything in multiple formats for offline use."
        }
    ];

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        How It <span className="text-blue-600">Works</span>
                    </h2>
                    <p className="text-xl text-gray-600">
                        Transform any content into a complete learning experience in just four simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connector Line (Desktop only) */}
                    <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-gray-200 -z-0"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl shadow-sm md:bg-transparent md:shadow-none md:p-0">
                            {/* Step Number Bubble */}
                            <div className="absolute top-0 right-10 -mt-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white lg:right-4 lg:-mt-0 lg:left-[55%] lg:top-0">
                                {step.number}
                            </div>

                            <div className={`${step.color} w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-8 transform hover:scale-110 transition-transform duration-300`}>
                                {step.icon}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
