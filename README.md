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