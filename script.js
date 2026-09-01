document.addEventListener("DOMContentLoaded", function () {
  const candleHolder = document.getElementById("candleHolder");
  const successMessage = document.getElementById("successMessage");

  // Only the TOP segment of each "2" is a lit candle (2 total lit flames)
  const litCandles = Array.from(candleHolder.querySelectorAll(".seg-top"));

  let audioContext, analyser, microphone, dataArray;
  let listening = false;
  let blowCooldown = false;
  let candlesLeft = litCandles.length; // = 2

  const BLOW_THRESHOLD = 42;

  // ============ AUTO-START MICROPHONE ============
  initMic();

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
      detectBlow();
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
    }
  }

  function detectBlow() {
    if (!listening) return;

    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const average = sum / dataArray.length;

    if (average > BLOW_THRESHOLD && !blowCooldown && candlesLeft > 0) {
      blowOutCandle();
      blowCooldown = true;
      setTimeout(() => (blowCooldown = false), 500);
    }

    requestAnimationFrame(detectBlow);
  }

  function blowOutCandle() {
    const lit = litCandles.find((s) => !s.classList.contains("out"));
    if (!lit) return;

    lit.classList.add("out");
    spawnSmoke(lit);
    candlesLeft--;

    if (candlesLeft === 0) {
      setTimeout(() => {
        successMessage.style.display = "block";
        launchConfettiBurst();
      }, 400);
    }
  }

  function spawnSmoke(segEl) {
    const smoke = document.createElement("div");
    smoke.classList.add("smoke");
    smoke.style.top = "-30px";
    smoke.style.left = "50%";
    segEl.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1200);
  }

  // ============ MUSIC (Real Audio File via <audio> element) ============
  const audioEl = document.getElementById("birthdayAudio");
  const playMusicBtn = document.getElementById("playMusicBtn");

  playMusicBtn.addEventListener("click", () => {
    if (audioEl.paused) {
      audioEl.play()
        .then(() => {
          playMusicBtn.innerHTML = pauseIconSVG();
        })
        .catch((err) => {
          console.error("Audio playback failed:", err);
          alert("Could not play audio. Make sure the file exists at: " + audioEl.src);
        });
    } else {
      audioEl.pause();
      playMusicBtn.innerHTML = playIconSVG();
    }
  });

  audioEl.addEventListener("ended", () => {
    playMusicBtn.innerHTML = playIconSVG();
  });

  function playIconSVG() {
    return `<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><polygon points="5,3 19,12 5,21" /></svg>`;
  }

  function pauseIconSVG() {
    return `<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><rect x="5" y="3" width="5" height="18"/><rect x="14" y="3" width="5" height="18"/></svg>`;
  }

  // ============ GIFT / WISH MODAL ============
  const giftBtn = document.getElementById("giftBtn");
  const wishModal = document.getElementById("wishModal");
  const closeWishBtn = document.getElementById("closeWishBtn");

  giftBtn.addEventListener("click", () => {
    wishModal.classList.add("show");
    launchConfettiBurst(200);
  });

  closeWishBtn.addEventListener("click", () => {
    wishModal.classList.remove("show");
  });

  wishModal.addEventListener("click", (e) => {
    if (e.target === wishModal) wishModal.classList.remove("show");
  });

  // ============ CONFETTI ============
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  let confettiParticles = [];
  let confettiRunning = false;

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
      this.shape = Math.random() > 0.5 ? "circle" : "rect";
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
      if (this.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      }
      ctx.restore();
    }
  }

  function launchConfettiBurst(count = 150) {
    for (let i = 0; i < count; i++) confettiParticles.push(new Confetti());
    if (!confettiRunning) {
      confettiRunning = true;
      animateConfetti();
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach((p) => {
      p.update();
      p.draw();
    });
    confettiParticles = confettiParticles.filter((p) => p.y < canvas.height + 30);

    if (confettiParticles.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
});