# BD-Zen AI

A modern, fast, and polite AI Assistant designed for Bangladesh with native support for Bengali (বাংলা), English, and Banglish.

## Features
- **Intelligent Reasoning**: Powered by DeepSeek V4 & OpenRouter APIs.
- **Multimodal Support**: Document and visual image analysis.
- **Bilingual & Banglish**: Seamless communication in English and Bengali.
- **High Performance**: Streaming responses with ultra-low latency fallback.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file based on `.env.example`:
```env
OPENROUTER_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

### Development
```bash
npm run dev
```

### Build & Production
```bash
npm run build
npm start
```
