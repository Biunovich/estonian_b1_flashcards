import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import '../styles/AudioButton.css';

let manifestPromise;
const loadManifest = () => {
  if (!manifestPromise) {
    manifestPromise = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Audio library unavailable');
        return response.json();
      })
      .catch((error) => {
        manifestPromise = undefined;
        throw error;
      });
  }
  return manifestPromise;
};

export default function AudioButton(props) {
  const [playing, setPlaying] = createSignal(false);
  const [loading, setLoading] = createSignal(true);
  const [audioUrl, setAudioUrl] = createSignal('');
  const [error, setError] = createSignal('');
  let audio;
  let disposed = false;

  const resetAudio = () => {
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = undefined;
    }
  };

  onCleanup(() => {
    disposed = true;
    resetAudio();
  });

  const prepare = async () => {
    setError('');
    setLoading(true);
    try {
      const manifest = await loadManifest();
      if (disposed) return;
      const entry = manifest.entries[props.word];
      if (!entry) throw new Error('Recording unavailable');
      setAudioUrl(`${import.meta.env.BASE_URL}audio/${entry.file}`);
    } catch {
      if (!disposed) setError('Could not load the audio library. Please retry.');
    } finally {
      if (!disposed) setLoading(false);
    }
  };

  onMount(prepare);

  const play = async () => {
    if (loading() || disposed) return;
    if (!audioUrl()) {
      await prepare();
      return;
    }
    if (playing()) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (!audio) {
        // Keep play() in the click handler's synchronous call stack for iOS.
        audio = new Audio(audioUrl());
        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
          resetAudio();
          if (disposed) return;
          setPlaying(false);
          setLoading(false);
          setError('Could not play audio. Please try again.');
        };
      }
      audio.currentTime = 0;
      await audio.play();
      if (!disposed) setPlaying(true);
    } catch {
      resetAudio();
      if (!disposed) setError('Could not play audio. Please try again.');
    } finally {
      if (!disposed) setLoading(false);
    }
  };

  return (
    <div class="word-audio">
      <button
        type="button"
        class="audio-button"
        disabled={loading()}
        aria-label={loading() ? 'Loading pronunciation' : !audioUrl() ? 'Retry audio library' : playing() ? 'Stop pronunciation' : 'Listen to Estonian word and forms'}
        onClick={play}
      >
        <span aria-hidden="true">{playing() ? '■' : '▶'}</span>
        {' '}{loading() ? 'Loading…' : !audioUrl() ? 'Retry audio' : playing() ? 'Stop' : 'Listen'}
      </button>
      <Show when={error()}><span class="audio-error" role="status">{error()}</span></Show>
    </div>
  );
}
