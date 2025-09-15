// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    document.getElementById('unsupported').style.display = 'block';
    document.getElementById('micButton').disabled = true;
}

let recognition = null;
let isListening = false;
let finalTranscript = '';
let interimTranscript = '';

const micButton = document.getElementById('micButton');
const textOutput = document.getElementById('textOutput');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');

// Initialize speech recognition
function initRecognition() {
    if (!SpeechRecognition) return;
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = languageSelect.value;
    
    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('listening');
        status.textContent = 'Listening...';
        status.className = 'status listening';
        
        if (textOutput.classList.contains('empty')) {
            textOutput.textContent = '';
            textOutput.classList.remove('empty');
        }
    };
    
    recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update the text output
        const displayText = finalTranscript + (interimTranscript ? `<span class="interim-text">${interimTranscript}</span>` : '');
        textOutput.innerHTML = displayText || '<span class="empty">Press the microphone button and start speaking...</span>';
        
        // Auto-scroll to bottom
        textOutput.scrollTop = textOutput.scrollHeight;
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        status.textContent = `Error: ${event.error}`;
        status.className = 'status';
        
        if (event.error === 'no-speech') {
            status.textContent = 'No speech detected. Try again.';
        } else if (event.error === 'not-allowed') {
            status.textContent = 'Microphone access denied. Please allow microphone access and reload.';
        }
        
        stopListening();
    };
    
    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('listening');
        
        if (finalTranscript) {
            status.textContent = 'Recording stopped';
            status.className = 'status';
        } else {
            status.textContent = '';
        }
        
        // Clean up interim results
        textOutput.innerHTML = finalTranscript || '<span class="empty">Press the microphone button and start speaking...</span>';
    };
}

function startListening() {
    if (!recognition) {
        initRecognition();
    }
    
    if (recognition && !isListening) {
        recognition.lang = languageSelect.value;
        recognition.start();
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
        micButton.classList.remove('listening');
    }
}

// Event listeners
micButton.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

copyBtn.addEventListener('click', async () => {
    const text = finalTranscript.trim();
    if (!text) {
        status.textContent = 'Nothing to copy';
        status.className = 'status';
        setTimeout(() => status.textContent = '', 2000);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        status.textContent = 'Copied to clipboard!';
        status.className = 'status success';
        setTimeout(() => status.textContent = '', 2000);
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        status.textContent = 'Copied to clipboard!';
        status.className = 'status success';
        setTimeout(() => status.textContent = '', 2000);
    }
});

exportBtn.addEventListener('click', () => {
    const text = finalTranscript.trim();
    if (!text) {
        status.textContent = 'Nothing to export';
        status.className = 'status';
        setTimeout(() => status.textContent = '', 2000);
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speech-to-text-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    status.textContent = 'Exported successfully!';
    status.className = 'status success';
    setTimeout(() => status.textContent = '', 2000);
});

clearBtn.addEventListener('click', () => {
    finalTranscript = '';
    interimTranscript = '';
    textOutput.innerHTML = '<span class="empty">Press the microphone button and start speaking...</span>';
    textOutput.classList.add('empty');
    status.textContent = 'Cleared';
    status.className = 'status';
    setTimeout(() => status.textContent = '', 2000);
});

// Handle direct editing in the text output
textOutput.addEventListener('input', () => {
    finalTranscript = textOutput.innerText;
    textOutput.classList.remove('empty');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to toggle recording (when not editing)
    if (e.code === 'Space' && document.activeElement !== textOutput) {
        e.preventDefault();
        micButton.click();
    }
    
    // Ctrl/Cmd + C to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement !== textOutput) {
        copyBtn.click();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportBtn.click();
    }
    
    // Escape to stop recording
    if (e.key === 'Escape' && isListening) {
        stopListening();
    }
});

// Initialize on load
initRecognition();
