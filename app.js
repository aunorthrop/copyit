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
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
let silenceTimer = null;
let isProcessingRestart = false;
let confidenceThreshold = 0.7; // Adjustable confidence threshold

const micButton = document.getElementById('micButton');
const textOutput = document.getElementById('textOutput');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');

// Enhanced initialization with better settings
function initRecognition() {
    if (!SpeechRecognition) return;
    
    recognition = new SpeechRecognition();
    
    // Enhanced settings for better accuracy
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    recognition.lang = languageSelect.value;
    
    // Enhanced audio settings (if supported)
    if ('webkitSpeechRecognition' in window) {
        recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
    }
    
    recognition.onstart = () => {
        isListening = true;
        restartAttempts = 0;
        isProcessingRestart = false;
        micButton.classList.add('listening');
        updateStatus('Listening... Speak clearly into your microphone', 'listening');
        
        if (textOutput.classList.contains('empty')) {
            textOutput.textContent = '';
            textOutput.classList.remove('empty');
        }
        
        // Set up silence detection
        setupSilenceDetection();
    };
    
    recognition.onresult = (event) => {
        // Reset silence timer when we get results
        resetSilenceTimer();
        
        let newInterimTranscript = '';
        let newFinalTranscript = '';
        
        // Process all results with confidence filtering
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            
            // Use the best alternative based on confidence
            let bestTranscript = '';
            let bestConfidence = 0;
            
            for (let j = 0; j < result.length; j++) {
                const alternative = result[j];
                if (alternative.confidence > bestConfidence) {
                    bestConfidence = alternative.confidence;
                    bestTranscript = alternative.transcript;
                }
            }
            
            // Only use results above confidence threshold
            if (bestConfidence >= confidenceThreshold || result.isFinal) {
                if (result.isFinal) {
                    newFinalTranscript += bestTranscript + ' ';
                    updateStatus(`Confidence: ${Math.round(bestConfidence * 100)}%`, 'success');
                } else {
                    newInterimTranscript += bestTranscript;
                }
            } else {
                // Low confidence - show warning
                updateStatus(`Low confidence (${Math.round(bestConfidence * 100)}%) - speak more clearly`, 'warning');
            }
        }
        
        // Update transcripts
        if (newFinalTranscript) {
            finalTranscript += newFinalTranscript;
        }
        interimTranscript = newInterimTranscript;
        
        // Update display with better formatting
        updateTextDisplay();
        
        // Auto-scroll to bottom
        textOutput.scrollTop = textOutput.scrollHeight;
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        const errorMessages = {
            'no-speech': 'No speech detected. Make sure your microphone is working and try speaking louder.',
            'audio-capture': 'Microphone not found or accessible. Check your microphone connection.',
            'not-allowed': 'Microphone access denied. Please allow microphone access and reload the page.',
            'network': 'Network error. Check your internet connection.',
            'aborted': 'Speech recognition was aborted.',
            'language-not-supported': 'Selected language is not supported.',
            'service-not-allowed': 'Speech recognition service not allowed.'
        };
        
        const errorMessage = errorMessages[event.error] || `Error: ${event.error}`;
        updateStatus(errorMessage, 'error');
        
        // Auto-restart on certain errors
        if (['no-speech', 'audio-capture', 'network'].includes(event.error) && 
            restartAttempts < MAX_RESTART_ATTEMPTS && isListening) {
            setTimeout(() => {
                if (isListening && !isProcessingRestart) {
                    restartRecognition();
                }
            }, 1000);
        } else {
            stopListening();
        }
    };
    
    recognition.onend = () => {
        if (silenceTimer) {
            clearTimeout(silenceTimer);
        }
        
        // Auto-restart if we should still be listening
        if (isListening && !isProcessingRestart && restartAttempts < MAX_RESTART_ATTEMPTS) {
            setTimeout(() => {
                if (isListening) {
                    restartRecognition();
                }
            }, 100);
        } else {
            isListening = false;
            micButton.classList.remove('listening');
            
            if (finalTranscript) {
                updateStatus('Recording stopped', 'default');
            } else {
                updateStatus('', 'default');
            }
            
            // Clean up interim results
            updateTextDisplay(true);
        }
    };
}

// Restart recognition with backoff
function restartRecognition() {
    if (isProcessingRestart || restartAttempts >= MAX_RESTART_ATTEMPTS) {
        return;
    }
    
    isProcessingRestart = true;
    restartAttempts++;
    
    updateStatus(`Reconnecting... (${restartAttempts}/${MAX_RESTART_ATTEMPTS})`, 'warning');
    
    setTimeout(() => {
        if (isListening && recognition) {
            try {
                recognition.lang = languageSelect.value;
                recognition.start();
            } catch (e) {
                console.error('Restart failed:', e);
                stopListening();
            }
        }
        isProcessingRestart = false;
    }, 500 * restartAttempts); // Exponential backoff
}

// Silence detection to restart recognition
function setupSilenceDetection() {
    resetSilenceTimer();
}

function resetSilenceTimer() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
    }
    
    // Restart after 10 seconds of silence
    silenceTimer = setTimeout(() => {
        if (isListening && !isProcessingRestart) {
            updateStatus('Silence detected - restarting...', 'warning');
            restartRecognition();
        }
    }, 10000);
}

// Enhanced status update function
function updateStatus(message, type = 'default') {
    status.textContent = message;
    status.className = `status ${type}`;
    
    // Auto-clear success/warning messages
    if (['success', 'warning'].includes(type)) {
        setTimeout(() => {
            if (status.className.includes(type)) {
                status.textContent = isListening ? 'Listening...' : '';
                status.className = 'status';
            }
        }, 3000);
    }
}

// Enhanced text display update
function updateTextDisplay(final = false) {
    if (final) {
        textOutput.innerHTML = finalTranscript || '<span class="empty">Press the microphone button and start speaking...</span>';
        if (!finalTranscript) {
            textOutput.classList.add('empty');
        }
        return;
    }
    
    const displayText = finalTranscript + (interimTranscript ? `<span class="interim-text">${interimTranscript}</span>` : '');
    textOutput.innerHTML = displayText || '<span class="empty">Press the microphone button and start speaking...</span>';
    
    if (displayText) {
        textOutput.classList.remove('empty');
    }
}

function startListening() {
    if (!recognition) {
        initRecognition();
    }
    
    if (recognition && !isListening) {
        restartAttempts = 0;
        recognition.lang = languageSelect.value;
        
        // Request microphone permission explicitly
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                recognition.start();
            })
            .catch((error) => {
                updateStatus('Microphone access required. Please grant permission and try again.', 'error');
                console.error('Microphone permission error:', error);
            });
    }
}

function stopListening() {
    if (recognition && isListening) {
        isListening = false;
        isProcessingRestart = false;
        
        if (silenceTimer) {
            clearTimeout(silenceTimer);
        }
        
        recognition.stop();
        micButton.classList.remove('listening');
        updateStatus('Stopping...', 'default');
    }
}

// Enhanced event listeners
micButton.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// Language change handler with restart
languageSelect.addEventListener('change', () => {
    if (isListening) {
        const wasListening = isListening;
        stopListening();
        setTimeout(() => {
            if (wasListening) {
                startListening();
            }
        }, 500);
    }
});

copyBtn.addEventListener('click', async () => {
    const text = finalTranscript.trim();
    if (!text) {
        updateStatus('Nothing to copy', 'warning');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        updateStatus(`Copied ${text.length} characters!`, 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        updateStatus(`Copied ${text.length} characters!`, 'success');
    }
});

exportBtn.addEventListener('click', () => {
    const text = finalTranscript.trim();
    if (!text) {
        updateStatus('Nothing to export', 'warning');
        return;
    }
    
    // Enhanced export with metadata
    const timestamp = new Date().toISOString();
    const exportText = `Speech-to-Text Export
Generated: ${timestamp}
Language: ${languageSelect.options[languageSelect.selectedIndex].text}
Word Count: ${text.split(/\s+/).length}
Character Count: ${text.length}

---

${text}`;
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speech-to-text-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus('Exported successfully!', 'success');
});

clearBtn.addEventListener('click', () => {
    if (finalTranscript || interimTranscript) {
        if (confirm('Are you sure you want to clear all text?')) {
            finalTranscript = '';
            interimTranscript = '';
            updateTextDisplay(true);
            updateStatus('Cleared', 'success');
        }
    } else {
        updateStatus('Nothing to clear', 'warning');
    }
});

// Enhanced text editing
textOutput.addEventListener('input', () => {
    finalTranscript = textOutput.innerText;
    textOutput.classList.remove('empty');
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to toggle recording (when not editing)
    if (e.code === 'Space' && document.activeElement !== textOutput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        micButton.click();
    }
    
    // Ctrl/Cmd + C to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement !== textOutput) {
        e.preventDefault();
        copyBtn.click();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportBtn.click();
    }
    
    // Ctrl/Cmd + Backspace to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
        e.preventDefault();
        clearBtn.click();
    }
    
    // Escape to stop recording
    if (e.key === 'Escape' && isListening) {
        e.preventDefault();
        stopListening();
    }
});

// Enhanced microphone test function
async function testMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let avgVolume = 0;
        const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => a + b, 0);
            avgVolume = sum / bufferLength;
            
            if (avgVolume > 10) {
                updateStatus('Microphone is working! Volume detected.', 'success');
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            } else {
                requestAnimationFrame(checkVolume);
            }
        };
        
        updateStatus('Testing microphone... Please speak.', 'warning');
        checkVolume();
        
        // Timeout the test after 5 seconds
        setTimeout(() => {
            if (avgVolume <= 10) {
                updateStatus('Microphone test timeout. Check your microphone.', 'error');
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            }
        }, 5000);
        
    } catch (error) {
        updateStatus('Microphone test failed. Check permissions and hardware.', 'error');
        console.error('Microphone test error:', error);
    }
}

// Confidence threshold adjustment (you can expose this in UI)
function setConfidenceThreshold(threshold) {
    confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
    updateStatus(`Confidence threshold set to ${Math.round(confidenceThreshold * 100)}%`, 'success');
}

// Initialize on load with enhanced error handling
document.addEventListener('DOMContentLoaded', () => {
    initRecognition();
    
    // Add microphone test button functionality if it exists
    const testBtn = document.getElementById('testMicBtn');
    if (testBtn) {
        testBtn.addEventListener('click', testMicrophone);
    }
    
    updateStatus('Ready to start speech recognition', 'default');
});
