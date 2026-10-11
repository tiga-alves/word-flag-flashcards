(function () {
  'use strict';

  let context;
  let muted = false;
  let lastTypingTime = -1;

  // Audio is created only in response to a keyboard or button interaction.
  function getContext() {
    if (muted) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    try {
      if (!context) context = new AudioContext();
      if (context.state === 'suspended') {
        const resumed = context.resume();
        if (resumed && resumed.catch) resumed.catch(function () {});
      }
      return context;
    } catch (_) {
      return null;
    }
  }

  function note(audio, frequency, start, duration, volume, waveform) {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = waveform || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.onended = function () {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  function type() {
    const audio = getContext();
    if (!audio) return;
    const now = audio.currentTime;
    // Keep held keys from producing an excessively loud overlapping texture.
    if (lastTypingTime >= 0 && now - lastTypingTime < 0.025) return;
    lastTypingTime = now;
    const pitch = 620 + Math.random() * 90;
    note(audio, pitch, now, 0.055, 0.045, 'triangle');
    note(audio, pitch * 2.5, now, 0.026, 0.012);
  }

  function success() {
    const audio = getContext();
    if (!audio) return;
    const now = audio.currentTime;
    [523.25, 659.25, 783.99].forEach(function (frequency, index) {
      note(audio, frequency, now + index * 0.075, 0.28, 0.045);
    });
  }

  function updateButton() {
    const button = document.getElementById('sound-toggle');
    if (!button) return;
    button.textContent = muted ? 'Som desligado' : 'Som ligado';
    button.setAttribute('aria-pressed', String(!muted));
    button.setAttribute('aria-label', muted ? 'Ativar sons' : 'Desativar sons');
  }

  function toggle() {
    muted = !muted;
    updateButton();
    if (!muted) type();
    return muted;
  }

  window.FlagAudio = {
    type: type,
    success: success,
    toggle: toggle,
    isMuted: function () { return muted; }
  };

  function bindButton() {
    const button = document.getElementById('sound-toggle');
    if (button) button.addEventListener('click', toggle);
    updateButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButton, { once: true });
  } else {
    bindButton();
  }
})();
