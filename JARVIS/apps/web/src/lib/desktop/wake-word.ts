/**
 * Explicit Opt-In Wake-Word Detector
 * Listens for "jarvis" or "hey jarvis" using browser Speech Recognition.
 * Strictly respects user consent and stops immediately when disabled.
 */

// SpeechRecognition type definitions for standard web browsers
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class WakeWordDetector {
  private recognition: any = null;
  private isListening: boolean = false;
  private wakeCallback: (() => void) | null = null;
  private wordPattern: RegExp = /\b(hey\s+)?jarvis\b/i;

  constructor(customPattern?: RegExp) {
    if (customPattern) this.wordPattern = customPattern;
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindow;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  start(onWake: () => void): boolean {
    if (!this.isSupported() || this.isListening) return false;

    const win = window as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.wakeCallback = onWake;

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (this.wordPattern.test(transcript)) {
            if (this.wakeCallback) {
              this.wakeCallback();
            }
          }
        }
      };

      this.recognition.onerror = () => {
        // Soft recovery on network/silence errors
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {}
        }
      };

      this.recognition.onend = () => {
        // Continuous listening loop while active
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {}
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch {
      this.isListening = false;
      return false;
    }
  }

  stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  getStatus(): boolean {
    return this.isListening;
  }
}

export const wakeWordDetector = new WakeWordDetector();

