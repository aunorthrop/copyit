# Speech to Text Tool

A lightning-fast, browser-based speech-to-text tool with real-time transcription. Zero latency, no API keys needed.

## Features

- ⚡ **Instant transcription** - Uses browser's native Web Speech API
- 🎙️ **Real-time display** - See text as you speak
- 🌍 **Multi-language support** - 12 languages available
- 📋 **Easy export** - Copy to clipboard or save as text file
- ⌨️ **Keyboard shortcuts** - Spacebar to record, Escape to stop
- 🎨 **Clean minimal UI** - Focus on what matters
- 🔒 **Privacy-first** - Everything runs locally in your browser

## Quick Start

1. Clone or download this repository
2. Open `index.html` in Chrome, Edge, or Safari
3. Click the microphone button and start speaking

## Keyboard Shortcuts

- **Space** - Start/stop recording
- **Ctrl/Cmd + C** - Copy text
- **Ctrl/Cmd + E** - Export as file
- **Escape** - Stop recording

## Browser Support

- ✅ Chrome (Desktop & Android)
- ✅ Edge
- ✅ Safari (macOS & iOS)
- ❌ Firefox (no Web Speech API support)

## File Structure

```
speech-to-text/
├── index.html      # Main HTML structure
├── styles.css      # All styling
├── app.js          # Speech recognition logic
└── README.md       # Documentation
```

## How It Works

The tool uses the Web Speech API for speech recognition, which processes audio directly in the browser. This means:
- No server required
- No API keys needed
- Works offline after initial load
- Complete privacy - audio never leaves your device

## Customization

### Change Languages
Edit the language options in `index.html`:
```html
<option value="en-US">English (US)</option>
<option value="es-ES">Spanish</option>
<!-- Add more languages -->
```

### Modify Styling
Edit `styles.css` to change colors, sizes, or layout.

### Adjust Recognition Settings
In `app.js`, modify the recognition settings:
```javascript
recognition.continuous = true;        // Keep listening
recognition.interimResults = true;    // Show partial results
recognition.maxAlternatives = 1;      // Number of alternatives
```

## Tips for Best Results

1. **Use a good microphone** - Built-in laptop mics work, but headsets are better
2. **Speak clearly** - Normal pace, don't rush
3. **Minimize background noise** - The quieter the better
4. **Use Chrome for best compatibility** - Has the most mature implementation

## License

MIT - Use freely for any purpose

## Troubleshooting

**"Microphone access denied"**
- Check browser permissions
- Reload the page and allow microphone access

**"No speech detected"**
- Check your microphone is working
- Speak louder or closer to the mic

**Not working in Firefox**
- Firefox doesn't support Web Speech API yet
- Use Chrome, Edge, or Safari instead
