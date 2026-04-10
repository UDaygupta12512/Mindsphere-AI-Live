import React from 'react';
import { GraduationCap, Twitter, Github, Linkedin, Mail, Heart } from 'lucide-react';

interface FooterProps {
    onNavigate: (view: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-transparent text-gray-600 dark:text-gray-300 pt-20 pb-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">MindSphere AI</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                            Transform any content into engaging courses with AI. Making learning faster, smarter, and more personalized.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors text-gray-600 dark:text-gray-300">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors text-gray-600 dark:text-gray-300">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors text-gray-600 dark:text-gray-300">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Product</h3>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Features</button></li>
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">How it Works</button></li>
                            <li><button onClick={() => onNavigate('catalog')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Browse Courses</button></li>
                            <li><button onClick={() => onNavigate('create')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Create Course</button></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Learning</h3>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 dark:hover:text-white transition-colors">My Dashboard</button></li>
                            <li><button onClick={() => onNavigate('chatbot')} className="hover:text-blue-600 dark:hover:text-white transition-colors">AI Tutor</button></li>
                            <li><button onClick={() => onNavigate('analytics')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Analytics</button></li>
                            <li><button onClick={() => onNavigate('catalog')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Course Catalog</button></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Help Center</button></li>
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Community</button></li>
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Status</button></li>
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-white transition-colors">Terms of Service</button></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm">© 2024 MindSphere AI. All rights reserved.</p>
                    <div className="flex items-center gap-2 text-sm">
                        <span>Built with AI</span>
                        <span className="text-red-500">•</span>
                        <span>Made for Learners</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
