// Test script for dynamic quiz generation
const testDynamicQuizGeneration = async () => {
  const testContent = {
    title: "Introduction to JavaScript Programming",
    source: "pdf",
    content: `JavaScript is a programming language that enables interactive web pages and is an essential part of web applications. JavaScript is a high-level programming language that was initially designed to make web pages dynamic. It is a lightweight, interpreted, object-oriented language with first-class functions, and is best known as the scripting language for Web pages.

Key concepts include:
- Variables and Data Types: let, const, var
- Functions: function declarations, arrow functions, callbacks
- Objects: key-value pairs, methods, properties
- Arrays: ordered lists of values
- Control Flow: if/else, loops, switch statements
- DOM Manipulation: selecting and modifying HTML elements
- Event Handling: responding to user interactions`,
    fileName: "javascript-basics.pdf"
  };

  try {
    console.log('🧪 Testing dynamic quiz generation...');
    
    const response = await fetch('http://localhost:4000/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContent),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Quiz generation successful!');
    console.log('📊 Generated questions:', data.quizQuestions?.length || 0);
    
    if (data.quizQuestions && data.quizQuestions.length > 0) {
      console.log('\n📝 Sample question:');
      console.log('Question:', data.quizQuestions[0].question);
      console.log('Options:', data.quizQuestions[0].options);
      console.log('Correct Answer:', data.quizQuestions[0].correctAnswer);
    }

    return data;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
};

// Test flashcard generation
const testDynamicFlashcardGeneration = async () => {
  const testContent = {
    title: "Basic Machine Learning Concepts",
    source: "youtube",
    content: `Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. 

Key terms:
- Supervised Learning: Learning with labeled training data
- Unsupervised Learning: Finding patterns in data without labels  
- Neural Networks: Computing systems inspired by biological neural networks
- Deep Learning: Machine learning using deep neural networks
- Training Data: Dataset used to teach the algorithm
- Algorithm: Set of rules or instructions for solving problems`,
    url: "https://youtube.com/example"
  };

  try {
    console.log('\n🧪 Testing dynamic flashcard generation...');
    
    const response = await fetch('http://localhost:4000/api/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContent),
    });

    const data = await response.json();
    
    console.log('✅ Flashcard generation successful!');
    console.log('🎴 Generated flashcards:', data.flashcards?.length || 0);
    
    if (data.flashcards && data.flashcards.length > 0) {
      console.log('\n📋 Sample flashcard:');
      console.log('Front:', data.flashcards[0].front);
      console.log('Back:', data.flashcards[0].back);
    }

    return data;
  } catch (error) {
    console.error('❌ Flashcard test failed:', error.message);
    throw error;
  }
};

// Run tests
const runAllTests = async () => {
  console.log('🚀 Starting dynamic content generation tests...\n');
  
  try {
    await testDynamicQuizGeneration();
    await testDynamicFlashcardGeneration();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
};

// Export for browser console or Node.js
if (typeof window !== 'undefined') {
  window.testDynamicGeneration = runAllTests;
  window.testQuiz = testDynamicQuizGeneration;
  window.testFlashcards = testDynamicFlashcardGeneration;
  console.log('📝 Test functions available in browser console:');
  console.log('- testDynamicGeneration() - run all tests');
  console.log('- testQuiz() - test quiz generation');
  console.log('- testFlashcards() - test flashcard generation');
} else if (typeof module !== 'undefined') {
  module.exports = { runAllTests, testDynamicQuizGeneration, testDynamicFlashcardGeneration };
} 