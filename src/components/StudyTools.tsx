import React from 'react';
import { FileText, Target, BarChart2, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

const StudyTools = () => {
    const tools = [
        {
            icon: <FileText className="w-8 h-8 text-white" />,
            color: "bg-blue-500",
            title: "Smart Note Taking",
            description: "AI-generated notes that capture key concepts and relationships",
            features: ["Auto-summarization", "Keyword extraction", "Mind maps"],
            tag: "New"
        },
        {
            icon: <Target className="w-8 h-8 text-white" />,
            color: "bg-green-500",
            title: "Adaptive Testing",
            description: "Personalized quizzes that adapt to your learning progress",
            features: ["Difficulty adjustment", "Weak point focus", "Progress tracking"],
            tag: "New"
        },
        {
            icon: <BarChart2 className="w-8 h-8 text-white" />,
            color: "bg-teal-500", // Gradient fallback visually similar
            title: "Progress Analytics",
            description: "Detailed insights into your learning patterns and achievements",
            features: ["Performance metrics", "Time tracking", "Goal setting"],
            tag: "New"
        },
        {
            icon: <Calendar className="w-8 h-8 text-white" />,
            color: "bg-blue-600",
            title: "Study Scheduler",
            description: "AI-optimized study plans that fit your schedule and goals",
            features: ["Smart scheduling", "Deadline tracking", "Reminder system"],
            tag: "New"
        }
    ];

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                        ⚡ Advanced Study Tools
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Supercharge Your <br />
                        <span className="text-green-500">Study Sessions</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Access a comprehensive suite of AI-powered study tools designed to optimize your learning experience and help you achieve your academic goals faster than ever before.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tools.map((tool, index) => (
                        <div key={index} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`${tool.color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                                    {tool.icon}
                                </div>
                                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    {tool.tag}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                            <p className="text-gray-600 mb-6 h-12">{tool.description}</p>

                            <div className="space-y-3 mb-8">
                                {tool.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 rounded-xl border-2 border-gray-100 font-semibold text-gray-700 flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                Explore Tool <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StudyTools;
