# GistFM

GistFM is a web application that transforms written news articles and text into podcast-style audio summaries. Leveraging Google's Gemini 2.5 Flash models for both text summarization and text-to-speech synthesis, it provides users with a convenient way to consume content on the go.

## Features

- **Article to Audio:** Convert text or URL-based articles into spoken audio.
- **Customizable Experience:** Choose from multiple voices (Kore, Puck, Charon, Fenrir, Zephyr, Aoede) and tones (Professional, Casual, Witty, Brief).
- **Smart Summarization:** Uses AI to draft scripts suitable for audio delivery.
- **Bookmarks:** Save generated summaries to listen to later.
- **Dark/Light Mode:** Responsive UI with theme support.
- **Preview:** Read the generated script while listening to the audio.

## Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS
- **AI Models:** Google Gemini 2.5 Flash (Text & TTS)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Clone the repository (if applicable) or download the source code.
2. Install dependencies:

   ```bash
   npm install
   ```

### Configuration

1. Create a `.env.local` file in the root directory.
2. Add your Google Gemini API key:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Run Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

1. **Input Content:** Paste the full text of an article or enter a valid URL.
2. **Customize:** Select your preferred Voice (e.g., Fenrir, Kore) and Tone (e.g., Professional, Casual).
3. **Generate:** Click "Generate Audio". The app will draft a script and synthesize the audio.
4. **Listen:** Use the audio player to listen to your summary.
5. **Bookmark:** Save interesting summaries to your bookmarks list for later access.
