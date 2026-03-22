import React from 'react';
import { Brain, Target, Zap, MessageSquare, FileText, Download } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Brain className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "AI-Generated Notes",
            description: "Automatically extract key concepts and create comprehensive lecture notes from any content.",
            tag: "Smart",
            tagColor: "bg-orange-100 text-orange-600"
        },
        {
            icon: <Target className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "Interactive Quizzes",
            description: "Generate targeted quizzes that test understanding and reinforce learning objectives.",
            tag: "Adaptive",
            tagColor: "bg-orange-100 text-orange-600"
        },
        {
            icon: <Zap className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "Smart Flashcards",
            description: "Create memory-boosting flashcards with spaced repetition algorithms.",
            tag: "Efficient",
            tagColor: "bg-orange-100 text-orange-600"
        },
        {
            icon: <MessageSquare className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "AI Tutor Chat",
            description: "Get instant answers and explanations from your personal AI teaching assistant.",
            tag: "24/7",
            tagColor: "bg-orange-100 text-orange-600"
        },
        {
            icon: <FileText className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "Course Summaries",
            description: "Receive concise summaries highlighting the most important learning points.",
            tag: "Focused",
            tagColor: "bg-orange-100 text-orange-600"
        },
        {
            icon: <Download className="h-8 w-8 text-white" />,
            color: "bg-blue-600",
            title: "Export Everything",
            description: "Download courses in multiple formats: PDF, SCORM, or interactive web packages.",
            tag: "Flexible",
            tagColor: "bg-orange-100 text-orange-600"
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Everything You Need to <span className="text-green-500">Learn Faster</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Our AI-powered platform transforms any content into a complete learning experience with all the tools you need to master new skills.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`${feature.color} p-4 rounded-xl shadow-lg shadow-blue-200`}>
                                    {feature.icon}
                                </div>
                                <span className={`${feature.tagColor} px-3 py-1 rounded-full text-xs font-semibold`}>
                                    {feature.tag}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
