# StudyAI - AI-Powered Learning Companion

A comprehensive AI-powered study application that helps students learn, study, and excel with advanced features like problem solving, flashcards, study planning, and more.

## Features

- 🧠 **AI Problem Solver** - Get step-by-step solutions to math, physics, and chemistry problems
- 📸 **Scan & Solve** - Scan problems using your camera
- 🎯 **Flashcards** - Create and study flashcards with AI assistance
- 📚 **Study Planner** - Organize your study schedule effectively
- 📖 **Explainer** - Get detailed explanations on any topic
- 🗣️ **Voice Tutor** - Learn through voice-based tutoring sessions
- 📊 **Knowledge Graph** - Visualize connections between concepts
- 📝 **Exam Simulator** - Practice with simulated exams
- 🔄 **Teach Back** - Reinforce learning by teaching back to AI

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **AI**: Google Gemini, Groq
- **Database**: Supabase
- **Subscriptions**: RevenueCat
- **Data Fetching**: TanStack Query
- **Styling**: NativeWind (Tailwind CSS)
- **Animations**: React Native Reanimated

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI
- Supabase CLI (optional, for local development)

### Installation

1. Clone or download the repository
2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Fill in your API keys in `.env`

5. Run the app:
```bash
# Web
npm run web

# Android
npm run android

# iOS
npm run ios

# Start Metro bundler
npm start
```

## Project Structure

```
app/                    # Expo Router screens
  (auth)/              # Authentication screens
  (tabs)/              # Main tab navigation
  (onboarding)/        # Onboarding flow
components/             # Reusable components
  ui/                 # UI components
contexts/             # React contexts
hooks/                # Custom hooks
lib/                  # Utility functions and libraries
  solvers/            # AI problem solvers
assets/               # Images and assets
supabase/             # Supabase migrations and functions
```

## Development

### Environment Variables

Copy `.env.example` to `.env` and add your:
- `EXPO_PUBLIC_GEMINI_API_KEY
- `EXPO_PUBLIC_GROQ_API_KEY
- `EXPO_PUBLIC_SUPABASE_URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Available Scripts

- `npm start` - Start Metro bundler
- `npm run web` - Run on web
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run test` - Run tests
- `npm run typecheck` - Type checking

## License

MIT License
