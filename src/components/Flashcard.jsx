import React from 'react';
import '../styles/Flashcard.css';

const Flashcard = ({ word, translation, isFlipped, onFlip, direction }) => {
  const getDictionaryUrl = (word) => {
    // Remove the last letter and any spaces before/after it
    const cleanWord = word.replace(/\s+[A-Z]\s*$/, '');
    const encodedWord = encodeURIComponent(cleanWord);
    return `https://sonaveeb.ee/search/unif/dlall/dsall/${encodedWord}/1/est`;
  };

  const getWordAndType = (word) => {
    const match = word.match(/(.*?)\s+([A-Z])\s*$/);
    if (match) {
      return {
        mainWord: match[1],
        type: match[2]
      };
    }
    return {
      mainWord: word,
      type: ''
    };
  };

  const { mainWord, type } = getWordAndType(word);

  return (
    <div className="flashcard-container">
      <div className={`flashcard-wrapper slide-${direction}`}>
        <div className="flashcard" onClick={onFlip}>
          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
            <div className="flashcard-front">
              <div className="flashcard-content">
                <div className="main-word">{mainWord}</div>
                <div className="word-type">{type}</div>
              </div>
            </div>
            <div className="flashcard-back">
              <div className="flashcard-content">
                <div className="main-word">{translation}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <a 
        href={getDictionaryUrl(word)} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="dictionary-link"
      >
        Look up in Dictionary
      </a>
    </div>
  );
};

export default Flashcard; 