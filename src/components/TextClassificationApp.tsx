import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { Flag, ArrowLeft, ArrowRight, LogOut } from 'lucide-react';

const TextClassificationApp = () => {
  const { user, logout } = useAuth();
  const [texts, setTexts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagNotes, setFlagNotes] = useState('');
  const [classifications, setClassifications] = useState({});

  // Example categories (in production, these would come from Firebase config)
  const categories = [
    { id: 1, name: 'Category 1' },
    { id: 2, name: 'Category 2' },
    { id: 3, name: 'Category 3' },
    { id: 4, name: 'Category 4' }
  ];

  // Load texts for the user's assigned batch
  useEffect(() => {
    if (!user?.assignedBatchId) return;

    const textsRef = ref(database, 'texts');
    const query = ref(database, 'texts', 'orderByChild', 'batchId', 'equalTo', user.assignedBatchId);

    const unsubscribe = onValue(query, (snapshot) => {
      const textsData = snapshot.val();
      if (textsData) {
        const textsArray = Object.entries(textsData).map(([id, data]) => ({
          id,
          ...data
        }));
        setTexts(textsArray);
      }
    });

    return () => unsubscribe();
  }, [user?.assignedBatchId]);

  // Load existing classifications
  useEffect(() => {
    if (!user?.uid) return;

    const classificationsRef = ref(database, `classifications/${user.uid}`);
    
    const unsubscribe = onValue(classificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setClassifications(data);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Save classification
  const saveClassification = async () => {
    if (!selectedCategory || !user?.uid || !texts[currentIndex]) return;

    const classificationRef = push(ref(database, 'classifications'));
    const classification = {
      textId: texts[currentIndex].id,
      userId: user.uid,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
      flagged: isFlagged,
      flagNotes: isFlagged ? flagNotes : null
    };

    await set(classificationRef, classification);
    handleNext();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key >= '1' && e.key <= '4') {
        setSelectedCategory(parseInt(e.key));
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'f') {
        setIsFlagged(!isFlagged);
      } else if (e.key === 'Enter' && selectedCategory) {
        saveClassification();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCategory, isFlagged, currentIndex, texts]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetClassificationState();
    }
  };

  const handleNext = () => {
    if (currentIndex < texts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetClassificationState();
    }
  };

  const resetClassificationState = () => {
    setSelectedCategory(null);
    setIsFlagged(false);
    setFlagNotes('');
  };

  if (texts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
          Loading texts...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with logout */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.username}</h1>
          <button 
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{currentIndex + 1} of {texts.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / texts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Text Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Text #{currentIndex + 1}</h2>
          <p className="text-gray-700 leading-relaxed">
            {texts[currentIndex]?.text}
          </p>
        </div>

        {/* Classification Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`h-16 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center justify-center
                ${selectedCategory === category.id 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
            >
              <span className="text-lg font-bold">{category.id}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Flag Notes (only shown when flagged) */}
        {isFlagged && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <textarea
              placeholder="Enter notes about why this text was flagged..."
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
              className="w-full min-h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Navigation and Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium
              ${currentIndex === 0
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={() => setIsFlagged(!isFlagged)}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium
              ${isFlagged
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
          >
            <Flag className="w-4 h-4 mr-2" />
            {isFlagged ? 'Flagged' : 'Flag'}
          </button>

          <button
            onClick={saveClassification}
            disabled={!selectedCategory}
            className={`inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white
              ${!selectedCategory
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            Save & Next
          </button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Keyboard shortcuts: Use 1-4 for categories, ←/→ for navigation, F to flag, Enter to save and continue
        </div>
      </div>
    </div>
  );
};

export default TextClassificationApp;