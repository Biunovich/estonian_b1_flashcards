import { createMemo } from 'solid-js';
import '../styles/Flashcard.css';

function Flashcard(props) {
  const getDictionaryUrl = (word) => {
    const cleanWord = word.replace(/\s+[A-Z]\s*$/, '');
    const encodedWord = encodeURIComponent(cleanWord);
    return `https://sonaveeb.ee/search/unif/dlall/dsall/${encodedWord}/1/est`;
  };

  const wordDetails = createMemo(() => {
    const match = props.word.match(/(.*?)\s+([A-Z])\s*$/);
    if (match) {
      return {
        mainWord: match[1],
        type: match[2],
      };
    }
    return {
      mainWord: props.word,
      type: '',
    };
  });

  const formsText = createMemo(() => [props.secondForm, props.thirdForm].filter(Boolean).join(' · '));

  return (
    <div class="flashcard-container">
      <div class={`flashcard-wrapper slide-${props.direction}`}>
        <div class="flashcard" onClick={props.onFlip}>
          <div class={`flashcard-inner ${props.isFlipped ? 'flipped' : ''}`}>
            <div class="flashcard-front">
              <div class="flashcard-content">
                <div class="main-word">{wordDetails().mainWord}</div>
                {formsText() && <div class="word-forms">{formsText()}</div>}
                <div class="word-type">{wordDetails().type}</div>
              </div>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-content">
                <div class="main-word">{props.translation}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <a
        href={getDictionaryUrl(props.word)}
        target="_blank"
        rel="noopener noreferrer"
        class="dictionary-link"
      >
        Look up in Dictionary
      </a>
    </div>
  );
}

export default Flashcard;
