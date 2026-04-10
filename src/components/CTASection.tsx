import React from 'react';
import { ArrowRight, Sparkles, Zap, Target } from 'lucide-react';

interface CTASectionProps {
    onGetStarted: () => void;
    onViewExamples?: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted, onViewExamples }) => {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#050505] transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500 via-teal-400 to-yellow-400 px-8 py-20 text-center shadow-2xl">

                    {/* Decorative Icons at top */}
                    <div className="flex justify-center gap-6 mb-8 text-white/80">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Target className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl mb-6 drop-shadow-md">
                        Ready to Transform Your <br />
                        <span className="text-yellow-200">Learning Journey?</span>
                    </h2>

                    <p className="mx-auto max-w-2xl text-lg text-blue-50 mb-12 font-medium">
                        Join over 50,000 learners who've already revolutionized their study methods.
                        Start creating AI-powered courses in minutes, not hours.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <button
                            onClick={onGetStarted}
                            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            Start Creating Now <ArrowRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onViewExamples}
                            className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl border border-white/40 hover:bg-white/30 backdrop-blur-md transition-all"
                        >
                            View Examples
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-white/20 pt-12">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2 text-white font-bold text-xl">
                                <Sparkles className="h-5 w-5 text-yellow-300" /> Free
                            </div>
                            <p className="text-blue-100 text-sm">No credit card required</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2 text-white font-bold text-xl">
                                <Zap className="h-5 w-5 text-yellow-300" /> Instant
                            </div>
                            <p className="text-blue-100 text-sm">Generate courses in seconds</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2 text-white font-bold text-xl">
                                <Target className="h-5 w-5 text-pink-300" /> Smart
                            </div>
                            <p className="text-blue-100 text-sm">AI-powered learning optimization</p>
                        </div>
                    </div>

                    <div className="mt-8 text-white/60 text-xs font-medium uppercase tracking-widest">
                        Trusted by students from Harvard, MIT, Stanford, and 150+ other universities worldwide
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CTASection;
