import React, { useState, useEffect } from 'react';
import Flashcard from './components/Flashcard';
import wordsEst from './data/words_ru.json';
import wordsEng from './data/words_en.json';
import './App.css';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState('right');
  const [language, setLanguage] = useState('est');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const words = language === 'est' ? wordsEst.words : wordsEng.words;

  const handleNext = () => {
    setDirection('right');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    setDirection('left');
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? words.length - 1 : prevIndex - 1
    );
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowUp' || event.key === ' ') {
        event.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // Empty dependency array since handlers are stable

  return (
    <div className="app">
      <div className="header">
        <h1>Estonian B1 Exam Flashcards</h1>
        <div className="language-dropdown">
          <button 
            className="dropdown-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {language === 'est' ? 'Русский' : 'English'} ▼
          </button>
          {isDropdownOpen && (
            <div className="dropdown-content">
              <button 
                className={language === 'est' ? 'active' : ''}
                onClick={() => handleLanguageChange('est')}
              >
                Русский
              </button>
              <button 
                className={language === 'eng' ? 'active' : ''}
                onClick={() => handleLanguageChange('eng')}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flashcard-section">
        <Flashcard 
          key={`${currentIndex}-${language}`}
          word={words[currentIndex].word}
          translation={words[currentIndex].translation}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          direction={direction}
        />
        <div className="navigation-buttons">
          <button 
            onClick={handlePrevious} 
            className="arrow-button"
            title="Previous (←)"
          >
            ←
          </button>
          <button 
            onClick={handleNext} 
            className="arrow-button"
            title="Next (→)"
          >
            →
          </button>
        </div>
      </div>
      <footer className="legend">
        <h2>Word Types:</h2>
        <div className="legend-grid">
          <div><strong>A</strong> – omadussõna</div>
          <div><strong>D</strong> – määrsõna</div>
          <div><strong>G</strong> – käändumatu omadussõna</div>
          <div><strong>I</strong> – hüüdsõna</div>
          <div><strong>J</strong> – sidesõna</div>
          <div><strong>K</strong> – kaassõna</div>
          <div><strong>N</strong> – põhiarvsõna</div>
          <div><strong>O</strong> – järgarvsõna</div>
          <div><strong>P</strong> – asesõna</div>
          <div><strong>S</strong> – nimisõna</div>
          <div><strong>V</strong> – tegusõna</div>
          <div><strong>Y</strong> – lühend</div>
        </div>
      </footer>
    </div>
  );
}

export default App; 