# Auto-Captioning System

## Overview

The auto-captioning system provides intelligent, automated subtitle generation for videos in your Luffy Create project. It uses multiple strategies to ensure the best possible transcription quality.

## Features

- **On-Device Processing**: No internet connection required
- **Voice Activity Detection**: Automatically identifies speech regions
- **Smart Timestamp Optimization**: Creates well-timed caption segments
- **Multi-Strategy Transcription**: Falls back to different methods based on browser support
- **Real-Time Progress**: Shows live feedback during transcription

## How It Works

### 1. Audio Analysis
The system first analyzes the video's audio track to identify speech regions using Voice Activity Detection (VAD). It detects periods of silence vs. speech based on audio energy levels.

### 2. Transcription
The system uses one of two transcription methods:

- **Web Speech API** (Chrome, Edge, Safari): Uses native browser speech recognition for real transcription
- **Advanced Transcription Engine**: Advanced analysis with smart timestamp optimization

### 3. Segment Optimization
Words are grouped into well-timed caption segments based on:
- Maximum words per segment (default: 10)
- Maximum characters per segment (default: 60)
- Minimum segment duration (default: 0.8 seconds)
- Gap handling between segments

### 4. Final Formatting
The system applies formatting rules:
- Maximum 2 lines per caption
- Maximum 40 characters per line
- Smooth timestamp transitions
- Proper text wrapping

## Files

- `types.ts` - Type definitions for subtitle cues
- `srt.ts` - SRT file format utilities
- `transcriber.ts` - Main transcription interface
- `TranscriptionEngine.ts` - Audio processing and VAD
- `AdvancedTranscriptionEngine.ts` - Advanced transcription with mock data
- `WebSpeechTranscription.ts` - Real Web Speech API integration
- `SubtitleModal.tsx` - UI for caption editing

## Usage

1. Click the "Captions" button in the sidebar
2. Select a video from your project
3. Click "Auto-generate captions"
4. Edit the generated captions as needed
5. Export as .srt file

## Browser Support

- **Chrome**: Full support (best quality)
- **Edge**: Full support
- **Safari**: Full support
- **Firefox**: Requires enabling `media.webspeech.recognition.enable` flag

## Limitations

- Accuracy depends on audio quality and speaking clarity
- Background noise may reduce transcription quality
- Multi-language support is planned for future versions

## Future Enhancements

- [ ] Whisper Web integration for higher accuracy
- [ ] Multi-language support
- [ ] Speaker diarization (identify different speakers)
- [ ] Punctuation restoration
- [ ] Profanity filtering
