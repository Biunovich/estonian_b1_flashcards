import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import Flashcard from './components/Flashcard';
import wordsUrl from './data/words_combined.json?url';
import './App.css';

function App() {
  const [words, setWords] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isFlipped, setIsFlipped] = createSignal(false);
  const [direction, setDirection] = createSignal('right');
  const [language, setLanguage] = createSignal('est');
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);

  const currentWord = createMemo(() => words()[currentIndex()]);

  const handleNext = () => {
    const items = words();
    if (!items.length) {
      return;
    }
    setDirection('right');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    const items = words();
    if (!items.length) {
      return;
    }
    setDirection('left');
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDropdownOpen(false);
  };

  onMount(() => {
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
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyPress);
    });
  });

  onMount(async () => {
    try {
      const response = await fetch(wordsUrl);
      if (!response.ok) {
        throw new Error(`Failed to load words: ${response.status}`);
      }
      const data = await response.json();
      setWords(
        Object.entries(data).map(([word, details]) => ({
          word,
          ...details,
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load words.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="app">
      <div class="header">
        <h1>Estonian B1 Exam Flashcards</h1>
        <div class="language-dropdown">
          <button
            class="dropdown-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen())}
          >
            {language() === 'est' ? 'Русский' : 'English'} ▼
          </button>
          {isDropdownOpen() && (
            <div class="dropdown-content">
              <button
                classList={{ active: language() === 'est' }}
                onClick={() => handleLanguageChange('est')}
              >
                Русский
              </button>
              <button
                classList={{ active: language() === 'eng' }}
                onClick={() => handleLanguageChange('eng')}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>

      {loading() && <p class="status-message">Loading words...</p>}
      {error() && <p class="status-message error-message">{error()}</p>}

      {!loading() && !error() && currentWord() && (
        <div class="flashcard-section">
          <Flashcard
            key={`${currentIndex()}-${language()}`}
            word={currentWord().word}
            secondForm={currentWord().secondForm}
            thirdForm={currentWord().thirdForm}
            translation={
              language() === 'est'
                ? currentWord().ruTranslation
                : currentWord().enTranslation
            }
            isFlipped={isFlipped()}
            onFlip={handleFlip}
            direction={direction()}
          />
          <div class="navigation-buttons">
            <button
              onClick={handlePrevious}
              class="arrow-button"
              title="Previous (←)"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              class="arrow-button"
              title="Next (→)"
            >
              →
            </button>
          </div>
        </div>
      )}

      <footer class="legend">
        <h2>Word Types:</h2>
        <div class="legend-grid">
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
