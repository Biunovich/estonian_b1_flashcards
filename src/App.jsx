import { For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import Flashcard from './components/Flashcard';
import AudioButton from './components/AudioButton';
import wordsUrl from './data/words_combined.json?url';
import './App.css';

function App() {
  const [words, setWords] = createSignal([]);
  const [wordOrder, setWordOrder] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isFlipped, setIsFlipped] = createSignal(false);
  const [direction, setDirection] = createSignal('right');
  const [language, setLanguage] = createSignal('est');
  const [studyMode, setStudyMode] = createSignal('flashcards');
  const [selectedAnswerId, setSelectedAnswerId] = createSignal(null);
  const [quizSeed, setQuizSeed] = createSignal(0);
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);
  const currentWord = createMemo(() => {
    const order = wordOrder();
    const items = words();
    return items[order[currentIndex()]];
  });

  const shuffleIndexes = (length) => {
    const indexes = Array.from({ length }, (_, index) => index);

    for (let index = indexes.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [indexes[index], indexes[randomIndex]] = [indexes[randomIndex], indexes[index]];
    }

    return indexes;
  };

  const shuffleItems = (items) => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  };

  const getWordDetails = (word) => {
    const match = word.match(/(.*?)\s+([A-Z])\s*$/);
    if (match) {
      return {
        mainWord: match[1],
        type: match[2],
      };
    }

    return {
      mainWord: word,
      type: '',
    };
  };

  const getTranslation = (word) => (
    language() === 'est'
      ? word.ruTranslation
      : word.enTranslation
  );

  const resetQuizAnswer = () => {
    setSelectedAnswerId(null);
    setQuizSeed((seed) => seed + 1);
  };

  const quizOptions = createMemo(() => {
    quizSeed();

    const word = currentWord();
    const items = words();
    if (!word || items.length < 4) {
      return [];
    }

    const answerLabel = studyMode() === 'est-to-translation'
      ? getTranslation(word)
      : getWordDetails(word.word).mainWord;
    const usedLabels = new Set([answerLabel]);
    const distractors = [];

    for (const candidate of shuffleItems(items.filter((item) => item.id !== word.id))) {
      const label = studyMode() === 'est-to-translation'
        ? getTranslation(candidate)
        : getWordDetails(candidate.word).mainWord;

      if (!label || usedLabels.has(label)) {
        continue;
      }

      usedLabels.add(label);
      distractors.push(candidate);

      if (distractors.length === 3) {
        break;
      }
    }

    const options = [word, ...distractors].map((item) => ({
      id: item.id,
      label: studyMode() === 'est-to-translation'
        ? getTranslation(item)
        : getWordDetails(item.word).mainWord,
    }));

    if (!answerLabel || options.length < 4) {
      return [];
    }

    return shuffleItems(options);
  });

  const handleModeChange = (newMode) => {
    setStudyMode(newMode);
    setIsFlipped(false);
    resetQuizAnswer();
  };

  const handleNext = () => {
    const order = wordOrder();
    if (!order.length) {
      return;
    }
    setDirection('right');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % order.length);
    setIsFlipped(false);
    resetQuizAnswer();
  };

  const handlePrevious = () => {
    const order = wordOrder();
    if (!order.length) {
      return;
    }
    setDirection('left');
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? order.length - 1 : prevIndex - 1));
    setIsFlipped(false);
    resetQuizAnswer();
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCurrentIndex(0);
    setIsFlipped(false);
    resetQuizAnswer();
    setIsDropdownOpen(false);
  };

  const handleAnswerSelect = (answerId) => {
    if (selectedAnswerId() !== null) {
      return;
    }

    setSelectedAnswerId(answerId);
  };

  onMount(() => {
    const handleKeyPress = (event) => {
      if (event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return;
      if (event.key === ' ' && event.target.closest?.('button, a')) return;
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (studyMode() === 'flashcards' && (event.key === 'ArrowUp' || event.key === ' ')) {
        event.preventDefault();
        handleFlip();
      } else if (studyMode() !== 'flashcards' && ['1', '2', '3', '4'].includes(event.key)) {
        const option = quizOptions()[Number(event.key) - 1];
        if (option) {
          handleAnswerSelect(option.id);
        }
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
      const items = Object.entries(data).map(([word, details]) => ({
        id: word,
        word,
        ...details,
      }));
      setWords(items);
      setWordOrder(shuffleIndexes(items.length));
      setCurrentIndex(0);
      setIsFlipped(false);
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

      <div class="study-controls" aria-label="Study controls">
        <div class="segmented-control" aria-label="Study mode">
          <button
            classList={{ active: studyMode() === 'flashcards' }}
            onClick={() => handleModeChange('flashcards')}
          >
            Flashcards
          </button>
          <button
            classList={{ active: studyMode() === 'est-to-translation' }}
            onClick={() => handleModeChange('est-to-translation')}
          >
            Est → {language() === 'est' ? 'Ru' : 'En'}
          </button>
          <button
            classList={{ active: studyMode() === 'translation-to-est' }}
            onClick={() => handleModeChange('translation-to-est')}
          >
            {language() === 'est' ? 'Ru' : 'En'} → Est
          </button>
        </div>
      </div>

      {loading() && <p class="status-message">Loading words...</p>}
      {error() && <p class="status-message error-message">{error()}</p>}

      {!loading() && !error() && currentWord() && (
        <div class="flashcard-section">
          <Show when={currentWord()} keyed>
            {(word) => (
              <>
                <Show
                  when={studyMode() !== 'flashcards'}
                  fallback={(
                    <Flashcard
                      word={word.word}
                      secondForm={word.secondForm}
                      thirdForm={word.thirdForm}
                      translation={getTranslation(word)}
                      isFlipped={isFlipped()}
                      onFlip={handleFlip}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                      direction={direction()}
                    />
                  )}
                >
                  <div class="quiz-card" classList={{ answered: selectedAnswerId() !== null }}>
                    <div class="quiz-prompt-label">
                      Pick the correct {studyMode() === 'est-to-translation' ? 'translation' : 'Estonian word'}
                    </div>
                    <div class="quiz-prompt">
                      <Show
                        when={studyMode() === 'est-to-translation'}
                        fallback={<div class="main-word">{getTranslation(word)}</div>}
                      >
                        <div class="main-word">{getWordDetails(word.word).mainWord}</div>
                        {[word.secondForm, word.thirdForm].filter(Boolean).join(' · ') && (
                          <div class="word-forms">{[word.secondForm, word.thirdForm].filter(Boolean).join(' · ')}</div>
                        )}
                        <div class="word-type">{getWordDetails(word.word).type}</div>
                      </Show>
                    </div>
                    <div class="quiz-options">
                      <For each={quizOptions()}>
                        {(option, index) => {
                          const isCorrect = option.id === word.id;
                          const isSelected = selectedAnswerId() === option.id;
                          return (
                            <button
                              class="quiz-option"
                              classList={{
                                correct: selectedAnswerId() !== null && isCorrect,
                                incorrect: selectedAnswerId() !== null && isSelected && !isCorrect,
                              }}
                              disabled={selectedAnswerId() !== null}
                              onClick={() => handleAnswerSelect(option.id)}
                            >
                              <span class="quiz-option-index">{index() + 1}</span>
                              <span>{option.label}</span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                    <Show when={selectedAnswerId() !== null}>
                      <div
                        class="quiz-result"
                        classList={{ success: selectedAnswerId() === word.id, error: selectedAnswerId() !== word.id }}
                      >
                        {selectedAnswerId() === word.id ? 'Correct' : 'Not quite'}
                      </div>
                    </Show>
                  </div>
                </Show>
                <Show when={studyMode() !== 'translation-to-est' || selectedAnswerId() !== null}>
                  <AudioButton word={word.word} />
                </Show>
              </>
            )}
          </Show>
          <div class="navigation-buttons">
            <button
              onClick={handlePrevious}
              class="arrow-button"
              title="Previous (←)"
            >
              ←
            </button>
            <Show when={studyMode() === 'flashcards'}>
              <button
                onClick={handleFlip}
                class="action-button flip-button"
                title="Flip (↑ or Space)"
              >
                Flip
              </button>
            </Show>
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
