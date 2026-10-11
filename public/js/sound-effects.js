/**
 * Sakellarious — Chancery Audio Synthesizer (§8)
 * Built with native Web Audio API for gentle, paper-like and wax-seal audio feedback.
 */

class SakellariosAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.hasUserInteracted = false;

    const unlock = () => {
      this.init();
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // 1. Folio Turn (pageTurn): soft filtered noise burst, paper-like, under 80ms
  pageTurn() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.07;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch (e) {}
  }

  // 2. Seal Confirm (sealConfirm): gentle low wax-seal thud
  sealConfirm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // 3. Chancery Bell Alert (alert): resonant single low bell tone
  bellAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t); // A4 bell harmonic

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch (e) {}
  }

  // Compatibility aliases
  click() { this.pageTurn(); }
  stampThud() { this.sealConfirm(); }
  alarm() { this.bellAlert(); }
  dataChirp() { this.pageTurn(); }
  powerToggle() { this.pageTurn(); }

  bindInteractiveElements() {
    document.querySelectorAll('.sak-btn, .chancery-nav-link, .sak-flow-stage, .scenario-chip').forEach(el => {
      el.addEventListener('mouseenter', () => {
        // Subtle hover
      });
      el.addEventListener('click', () => {
        this.pageTurn();
      });
    });
  }
}

window.brutalAudio = new SakellariosAudio();
window.sakellariosAudio = window.brutalAudio;
