import React from 'react';
import { MessageSquare, Clock, Brain, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';

const AITutorSection = () => {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div className="z-10">
                        <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6">
                            ✨ AI-Powered Learning
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Your Personal <br />
                            <span className="text-blue-600">AI Tutor Chat</span>
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Get instant answers and explanations from your personal AI teaching assistant. Available 24/7 to help you understand concepts, solve problems, and accelerate your learning.
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">24/7 Availability</h3>
                                    <p className="text-gray-600 text-sm">Get help anytime, anywhere with instant responses</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Personalized Learning</h3>
                                    <p className="text-gray-600 text-sm">Adapts to your learning style and pace</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                    <Lightbulb className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Smart Explanations</h3>
                                    <p className="text-gray-600 text-sm">Complex concepts broken down into simple terms</p>
                                </div>
                            </div>
                        </div>

                        <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                            Try AI Tutor Now <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Right Content - Chat UI Mockup */}
                    <div className="relative">
                        {/* Decorative blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            {/* Chat Header */}
                            <div className="bg-blue-600 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-white font-semibold">AI Tutor Assistant</span>
                                </div>
                                <div className="text-blue-100 text-xs px-2 py-1 bg-blue-500 rounded-full">Online</div>
                            </div>

                            {/* Chat Body */}
                            <div className="p-6 space-y-6 bg-gray-50/50 min-h-[400px]">

                                {/* User Message */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                                        <p>Can you explain photosynthesis in simple terms?</p>
                                    </div>
                                </div>

                                {/* AI Message */}
                                <div className="flex justify-start gap-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed mb-2">
                                            Sure! Think of photosynthesis as plants making their own food using sunlight, water, and air. It's like having a solar-powered kitchen! 🌱
                                        </p>
                                        <p className="text-gray-500 text-sm">Would you like me to break this down further?</p>
                                    </div>
                                </div>

                                {/* User Message */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                                        <p>Yes, what are the main steps?</p>
                                    </div>
                                </div>

                                {/* AI Message (Partial) */}
                                <div className="flex justify-start gap-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed mb-3">Great question! Here are the main steps:</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Absorption of Light
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Electron Transfer
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Calvin Cycle (Sugar creation)
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AITutorSection;
