import React, { useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';
import { Flashcard } from '../types/course';

interface FlashcardsComponentProps {
  flashcards: Flashcard[];
  onComplete: () => void;
}

const FlashcardsComponent: React.FC<FlashcardsComponentProps> = ({ flashcards, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<{[key: string]: 'easy' | 'hard'}>({});
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = flashcards[currentIndex];

  if (!flashcards.length) {
    return (
      <div className="text-center py-12">
        <RotateCcw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Flashcards Available</h3>
        <p className="text-gray-600">Flashcards will be generated based on your course content.</p>
      </div>
    );
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (difficulty: 'easy' | 'hard') => {
    const cardId = currentCard.id;
    setReviewedCards({ ...reviewedCards, [cardId]: difficulty });
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
      onComplete();
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCards({});
    setSessionComplete(false);
  };

  if (sessionComplete) {
    const totalReviewed = Object.keys(reviewedCards).length;
    const easyCards = Object.values(reviewedCards).filter(r => r === 'easy').length;
    const hardCards = Object.values(reviewedCards).filter(r => r === 'hard').length;

    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Session Complete!</h3>
        <p className="text-gray-600 mb-8">Great job reviewing your flashcards</p>
        
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalReviewed}</div>
            <div className="text-sm text-gray-600">Total Reviewed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{easyCards}</div>
            <div className="text-sm text-gray-600">Easy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{hardCards}</div>
            <div className="text-sm text-gray-600">Need Review</div>
          </div>
        </div>
        
        <button
          onClick={handleRestart}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Review Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Flashcard Review</h2>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flashcard */}
        <div 
          className="relative h-80 mb-8 cursor-pointer"
          onClick={handleFlip}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}>
            {/* Front */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <div className="h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm uppercase tracking-wider mb-4 opacity-80">Question</div>
                  <div className="text-xl font-medium leading-relaxed">
                    {currentCard.front}
                  </div>
                  <div className="text-sm opacity-80 mt-6">Click to reveal answer</div>
                </div>
              </div>
            </div>
            
            {/* Back */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
              <div className="h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm uppercase tracking-wider mb-4 opacity-80">Answer</div>
                  <div className="text-xl font-medium leading-relaxed">
                    {currentCard.back}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!isFlipped ? (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <button
              aria-label="Reveal Answer"
              onClick={handleFlip}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reveal Answer
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">How well did you know this?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleReview('hard')}
                className="flex items-center space-x-2 bg-red-100 text-red-700 px-6 py-3 rounded-lg hover:bg-red-200 transition-colors"
              >
                <XCircle className="h-5 w-5" />
                <span>Need Review</span>
              </button>
              
              <button
                onClick={() => handleReview('easy')}
                className="flex items-center space-x-2 bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Got It!</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardsComponent; 