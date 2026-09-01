// ============ CANDLE / MICROPHONE LOGIC ============
const startMicBtn = document.getElementById('startMicBtn');
const micStatus = document.getElementById('micStatus');
const volumeBar = document.getElementById('volumeBar');
const successMessage = document.getElementById('successMessage');
const candlesContainer = document.getElementById('candles');
const flames = [
  document.getElementById('flame1'),
  document.getElementById('flame2'),
  document.getElementById('flame3')
];

let audioContext, analyser, microphone, dataArray;
let candlesLeft = flames.length;
let listening = false;
let blowCooldown = false;

const BLOW_THRESHOLD = 45; // adjust sensitivity as needed

startMicBtn.addEventListener('click', initMic);

async function initMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    listening = true;
    micStatus.textContent = "🎤 Listening... Blow into your microphone!";
    startMicBtn.disabled = true;
    startMicBtn.textContent = "Microphone Active ✅";

    detectBlow();
  } catch (err) {
    micStatus.textContent = "⚠️ Microphone access denied or unavailable.";
    console.error(err);
  }
}

function detectBlow() {
  if (!listening) return;

  analyser.getByteFrequencyData(dataArray);

  // Average volume level
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  const average = sum / dataArray.length;

  // Update volume meter UI
  const percent = Math.min(100, (average / 100) * 100);
  volumeBar.style.width = percent + '%';

  if (average > BLOW_THRESHOLD && !blowCooldown && candlesLeft > 0) {
    blowOutOneCandle();
    blowCooldown = true;
    setTimeout(() => (blowCooldown = false), 600);
  }

  requestAnimationFrame(detectBlow);
}

function blowOutOneCandle() {
  // Find next lit candle
  const litFlame = flames.find(f => !f.classList.contains('out'));
  if (!litFlame) return;

  litFlame.classList.add('out');
  spawnSmoke(litFlame);
  candlesLeft--;

  if (candlesLeft === 0) {
    setTimeout(() => {
      successMessage.style.display = 'block';
      launchConfettiBurst();
    }, 400);
  }
}

function spawnSmoke(flameEl) {
  const smoke = document.createElement('div');
  smoke.classList.add('smoke');
  flameEl.parentElement.appendChild(smoke);
  setTimeout(() => smoke.remove(), 1200);
}

// ============ MUSIC SECTION ============
const musicSelect = document.getElementById('musicSelect');
const playMusicBtn = document.getElementById('playMusicBtn');
const stopMusicBtn = document.getElementById('stopMusicBtn');

let musicAudioCtx = null;
let musicTimeouts = [];
let musicPlaying = false;

// Simple melody generator using Web Audio API oscillators (no external files needed)
// Notes frequencies (Hz)
const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  G3: 196.00, A3: 220.00
};

// Classic "Happy Birthday" melody (simplified)
const happyBirthdayMelody = [
  ['C4', 0.3], ['C4', 0.2], ['D4', 0.5], ['C4', 0.5], ['F4', 0.5], ['E4', 1.0],
  ['C4', 0.3], ['C4', 0.2], ['D4', 0.5], ['C4', 0.5], ['G4', 0.5], ['F4', 1.0],
  ['C4', 0.3], ['C4', 0.2], ['C5', 0.5], ['A4', 0.5], ['F4', 0.5], ['E4', 0.5], ['D4', 1.0],
  ['A3', 0.3], ['A3', 0.2], ['G4', 0.5], ['F4', 0.5], ['G4', 0.5], ['F4', 1.0]
];

// A cheerier variation (slightly different rhythm/octave for variety)
const cheerfulMelody = [
  ['D4', 0.25], ['D4', 0.25], ['E4', 0.5], ['D4', 0.5], ['G4', 0.5], ['F4', 1.0],
  ['D4', 0.25], ['D4', 0.25], ['E4', 0.5], ['D4', 0.5], ['A4', 0.5], ['G4', 1.0],
  ['D4', 0.25], ['D4', 0.25], ['D5', 0.5], ['B4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1.0],
  ['B4', 0.25], ['B4', 0.25], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5], ['G4', 1.0]
];

// A "party" version with faster tempo
const partyMelody = happyBirthdayMelody.map(([note, dur]) => [note, dur * 0.65]);

const songMap = {
  song1: happyBirthdayMelody,
  song2: cheerfulMelody,
  song3: partyMelody
};

function playMelody(melody) {
  stopMelody(); // stop any currently playing
  musicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicPlaying = true;

  let time = musicAudioCtx.currentTime;

  melody.forEach(([note, duration]) => {
    const freq = NOTES[note];
    if (freq) {
      const osc = musicAudioCtx.createOscillator();
      const gain = musicAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.3, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(musicAudioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }
    time += duration;
  });

  // Auto reset play state when song ends
  const totalDuration = melody.reduce((acc, [, d]) => acc + d, 0);
  const resetTimeout = setTimeout(() => {
    musicPlaying = false;
  }, totalDuration * 1000);
  musicTimeouts.push(resetTimeout);
}

function stopMelody() {
  if (musicAudioCtx) {
    musicAudioCtx.close();
    musicAudioCtx = null;
  }
  musicTimeouts.forEach(t => clearTimeout(t));
  musicTimeouts = [];
  musicPlaying = false;
}

playMusicBtn.addEventListener('click', () => {
  const selected = musicSelect.value;
  if (!selected) {
    alert('Please select a song first! 🎵');
    return;
  }
  playMelody(songMap[selected]);
});

stopMusicBtn.addEventListener('click', stopMelody);

// ============ PRESENT / GIFT LOGIC ============
const present = document.getElementById('present');
const wishModal = document.getElementById('wishModal');
const closeWishBtn = document.getElementById('closeWishBtn');

present.addEventListener('click', () => {
  present.classList.add('open');
  setTimeout(() => {
    wishModal.classList.add('show');
    launchConfettiBurst(2000);
  }, 500);
});

closeWishBtn.addEventListener('click', () => {
  wishModal.classList.remove('show');
});

wishModal.addEventListener('click', (e) => {
  if (e.target === wishModal) {
    wishModal.classList.remove('show');
  }
});

// ============ CONFETTI ANIMATION ============
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let confettiParticles = [];

class Confetti {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = -20 - Math.random() * 100;
    this.size = Math.random() * 8 + 4;
    this.speedY = Math.random() * 3 + 2;
    this.speedX = Math.random() * 2 - 1;
    this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 6 - 3;
    this.shape = Math.random() > 0.5 ? 'circle' : 'rect';
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.y / 30) * 0.5;
    this.rotation += this.rotationSpeed;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    }
    ctx.restore();
  }
}

let confettiAnimationRunning = false;

function launchConfettiBurst(count = 150) {
  for (let i = 0; i < count; i++) {
    confettiParticles.push(new Confetti());
  }
  if (!confettiAnimationRunning) {
    confettiAnimationRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confettiParticles.forEach((p) => {
    p.update();
    p.draw();
  });

  // Remove particles that fell off screen
  confettiParticles = confettiParticles.filter(p => p.y < canvas.height + 30);

  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimationRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}