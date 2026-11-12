# Estonian Language Flashcards

A web application for learning Estonian vocabulary using flashcards. The app supports both English and Russian translations.

## Features

- Flashcards with Estonian words and their translations
- Support for both English and Russian translations
- Word type indicators (noun, verb, adjective, etc.)
- Keyboard navigation support
- Dictionary lookup links for each word
- Smooth animations for card flipping and transitions
- Mobile-friendly design

## Keyboard Shortcuts

- `→` (Right Arrow): Next card
- `←` (Left Arrow): Previous card
- `↑` (Up Arrow) or `Space`: Flip card

## Word Types Legend

- A – omadussõna (adjective)
- D – määrsõna (adverb)
- G – käändumatu omadussõna (indeclinable adjective)
- I – hüüdsõna (interjection)
- J – sidesõna (conjunction)
- K – kaassõna (postposition/preposition)
- N – põhiarvsõna (cardinal number)
- O – järgarvsõna (ordinal number)
- P – asesõna (pronoun)
- S – nimisõna (noun)
- V – tegusõna (verb)
- Y – lühend (abbreviation)

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Build for production: `npm run build`

## Technologies Used

- React 18
- Vite
- CSS3 (with animations)

## Development

The application is built using React and Vite. The flashcards support both Russian and English translations of Estonian words. Each word includes its grammatical type indicator, and clicking on a card reveals its translation. The application includes keyboard navigation and smooth animations for a better user experience.

## Dictionary Integration

Each flashcard includes a link to Sonaveeb (Estonian dictionary) for detailed word information. The link is automatically generated based on the Estonian word.

## Contributing

Feel free to submit issues and enhancement requests.

## Acknowledgments

- Dictionary links provided by [Sonaveeb](https://sonaveeb.ee)

## Pronunciation audio

The Listen button plays the Estonian word and every available form in a single
recording. Repeated forms are spoken again. Recordings live in `public/audio/`
and are copied into the GitHub Pages build by Vite. They load only when Listen is
pressed; the manifest loads before Listen is enabled, and changing words stops playback. Translation-to-Estonian quizzes show
Listen after the answer has been selected.

`public/audio/manifest.json` maps the exact dictionary keys to MP3 filenames and
records the spoken forms and synthesis settings. Filenames include a hash of the
entry, its forms, and its settings, so changed recordings get new URLs.

To regenerate or resume missing files through llm-gateway:

```sh
export LLM_GATEWAY_TOKEN_FILE=/path/to/private/client-token
# Optional: export LLM_GATEWAY_URL=http://gateway-host:8080
python3 scripts/generate-audio.py --workers 3
```

The gateway URL defaults to the running `llm-gateway-caddy-1` container on the
`llm_clients` network. Credentials stay on the generation host; none are included
in the app or Git. The gateway must have Azure Neural TTS configured.

After successful generation, the manifest is replaced atomically and obsolete
generated MP3s are removed. Failed runs preserve the previous manifest and recordings.
After a recording exhausts its retries, no more words are scheduled; at most the
other in-flight recordings finish before exit. Existing files with matching settings
are reused on resume.

The generator runs three concurrent synthesis requests and uses FFmpeg from
`immich_server` for encoding. No TTS service is needed by the deployed app.
Configuration: Azure Neural, `et-EE-AnuNeural`, speed 1.0, model pauses between forms
separated by full stops, mono 22,050 Hz, 64 kbps MP3. No cleanup, audio filters,
local speed adjustment or added silence.
