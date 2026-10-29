(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ==========================================================================
  // 10 RECURSOS REALES (5 VIDEOS DE FLORES + 5 ARCHIVOS DE SONIDO PROPIOS)
  // ==========================================================================
  const VIDEOS = [
    { id: "01", name: "14244-255658092_medium.mp4", tag: "Flor Blanca", desc: "Movimiento suave de flor blanca" },
    { id: "02", name: "150539-798555683_medium.mp4", tag: "Flor Violeta", desc: "Pétalos violetas y contraste natural" },
    { id: "03", name: "170455-843367899_medium.mp4", tag: "Flor Amarilla", desc: "Flores amarillas bajo brisa constante" },
    { id: "04", name: "25950-353764155_medium.mp4", tag: "Capullo Rosa", desc: "Apertura y oscilación de capullo rosa" },
    { id: "05", name: "89185-613200477_medium.mp4", tag: "Ramo Silvestre", desc: "Conjunto botánico en movimiento denso" }
  ];

  const SOUNDS = [
    {
      id: "01",
      name: "425601__soundholder__emf-macbook-white-unibody-data-transmission-subtle-with-stereo-flying-glitches-and-high-tones.wav",
      short: "EMF Glitches & High Tones",
      desc: "Glitches electromagnéticos sutiles y frecuencias agudas"
    },
    {
      id: "02",
      name: "609250__aemyn__journey-to-the-interweb.mp3",
      short: "Journey to the Interweb",
      desc: "Textura electrónica y dron espacial contemporáneo"
    },
    {
      id: "03",
      name: "862900__bassimat__shimmering-ambient-kitchen-drone-texture-from-sizzling-sausages-and-boiling-eggs.wav",
      short: "Shimmering Ambient Drone",
      desc: "Textura ambiental densa, brillante y sostenida"
    },
    {
      id: "04",
      name: "865163__bassimat__granular-guitar-strings-texture.wav",
      short: "Granular Guitar Texture",
      desc: "Textura granular orgánica de cuerdas electroacústicas"
    },
    {
      id: "05",
      name: "874083__kkenny101__glitch-layer-01-loop.flac",
      short: "Glitch Layer Loop",
      desc: "Bucle percusivo y rítmico de interferencias digitales"
    }
  ];

  // ==========================================================================
  // ESTADO GLOBAL: EL SONIDO ES EL PROTAGONISTA
  // ==========================================================================
  const DEFAULTS = {
    glitchInt: 0.65,      // Glitch Intensity (0% a 100%)
    audioSens: 0.70,      // Audio Sensitivity (1% a 100%)
    pxSize: 16,           // Pixel Size (4 a 64 px)
    freqReact: 0.75,      // Frequency Reactivity (0% a 100%)
    decayTime: 1.2,       // Decay (0.2s a 4.0s)
    bankVol: 0.80,        // Volumen del sonido activo (0% a 100%)
    glitchFx: true
  };

  const S = Object.assign({}, DEFAULTS);

  let curVidIdx = 0;
  let curSndIdx = 0;

  // Variables de análisis acústico en tiempo real
  let liveRms = 0;          // Volumen / energía instantánea [0, 1]
  let liveBass = 0;         // Energía de frecuencias graves [0, 1]
  let liveMids = 0;         // Energía de frecuencias medias [0, 1]
  let liveHighs = 0;        // Energía de frecuencias agudas [0, 1]
  let liveFlux = 0;         // Transitorios rápidos / onsets [0, 1]
  let prevRms = 0;
  let dominantFreq = 0;     // Frecuencia dominante calculada en Hz
  let currentGlitch = 0;    // Nivel de distorsión suavizado con DECAY

  let toastT = 0;
  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ==========================================================================
  // GESTIÓN DEL DOCK Y PANELES
  // ==========================================================================
  document.querySelectorAll(".trigger").forEach((tr) => tr.addEventListener("click", () => {
    const id = tr.dataset.panel, open = tr.getAttribute("aria-expanded") === "true";
    document.querySelectorAll(".trigger").forEach((t) => {
      t.setAttribute("aria-expanded", "false");
      const p = $(t.dataset.panel);
      if (p) p.hidden = true;
    });
    if (!open) {
      tr.setAttribute("aria-expanded", "true");
      const p = $(id);
      if (p) p.hidden = false;
    }
  }));

  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => {
    const p = b.closest(".panel");
    if (p) p.hidden = true;
    const tr = document.querySelector('[data-panel="' + p.id + '"]');
    if (tr) tr.setAttribute("aria-expanded", "false");
  }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll("[data-close]").forEach((b) => {
        if (!b.closest(".panel").hidden) b.click();
      });
    }
  });

  // ==========================================================================
  // REPRODUCTOR DEL BANCO DE SONIDO PROPIO (EL PROTAGONISTA)
  // ==========================================================================
  const bankAudio = document.createElement("audio");
  bankAudio.loop = true;
  bankAudio.preload = "auto";

  let ac = null, bankSource = null, bankGain = null, analyser = null, comp = null;

  function initAudio() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();

    analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;

    bankGain = ac.createGain();
    bankGain.gain.value = S.bankVol;

    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;

    try {
      bankSource = ac.createMediaElementSource(bankAudio);
      bankSource.connect(bankGain);
      bankGain.connect(analyser);
      analyser.connect(comp);
      comp.connect(ac.destination);
    } catch (e) {
      console.warn("MediaElementSource ya vinculado:", e);
    }
  }

  const isAudioPlaying = () => {
    return bankAudio && !bankAudio.paused && !bankAudio.ended && bankAudio.currentTime > 0;
  };

  function updSoundUI() {
    document.querySelectorAll(".media-item[data-snd-idx]").forEach((el, i) => {
      el.classList.toggle("active", i === curSndIdx);
    });
    document.querySelectorAll(".btn-snd").forEach((el, i) => {
      el.classList.toggle("active", i === curSndIdx);
    });

    const s = SOUNDS[curSndIdx];
    const playing = isAudioPlaying();

    $("stSound").textContent = s.id + " · " + s.short;
    $("status").textContent = "Sonido: " + s.short + " · Flor: " + VIDEOS[curVidIdx].tag;

    $("soundBtn").setAttribute("aria-pressed", String(playing));
    $("soundBtn").textContent = playing ? "■ PAUSAR SONIDO" : "▶ REPRODUCIR SONIDO";

    $("sndPlay").classList.toggle("active", playing);
    $("sndPause").classList.toggle("active", !playing);

    $("audioState").textContent = playing ? "reproduciendo" : "pausado";
  }

  async function playSound() {
    if (!ac) initAudio();
    if (ac && ac.state !== "running") await ac.resume();

    try {
      await bankAudio.play();
      video.play().catch(() => {});
      updSoundUI();
      toast("Reproduciendo sonido: " + SOUNDS[curSndIdx].short);
    } catch (err) {
      console.warn("Autoplay en espera:", err);
      toast("Haz clic en ▶ para activar la reproducción");
    }
  }

  function pauseSound() {
    bankAudio.pause();
    updSoundUI();
    toast("Sonido pausado · Glitch en decaimiento suave");
  }

  function toggleSound() {
    if (isAudioPlaying()) pauseSound();
    else playSound();
  }

  function setSound(idx) {
    if (idx < 0 || idx >= SOUNDS.length) return;
    const wasPlaying = isAudioPlaying();
    curSndIdx = idx;
    const s = SOUNDS[idx];
    bankAudio.src = s.name;
    bankAudio.currentTime = 0;

    if (wasPlaying || (ac && ac.state === "running")) {
      playSound();
    } else {
      updSoundUI();
    }
    toast("Sonido seleccionado: " + s.short);
  }

  // Eventos de selección y transporte de audio
  document.querySelectorAll("[data-snd-idx]").forEach((btn) => {
    btn.addEventListener("click", () => setSound(Number(btn.dataset.sndIdx)));
  });
  document.querySelectorAll("[data-snd-quick]").forEach((btn) => {
    btn.addEventListener("click", () => setSound(Number(btn.dataset.sndQuick)));
  });

  $("soundBtn").addEventListener("click", toggleSound);
  $("sndPlay").addEventListener("click", playSound);
  $("sndPause").addEventListener("click", pauseSound);
  $("sndPlayPanel").addEventListener("click", playSound);
  $("sndPausePanel").addEventListener("click", pauseSound);

  $("sndLoopPanel").addEventListener("click", (e) => {
    bankAudio.loop = !bankAudio.loop;
    e.currentTarget.setAttribute("aria-pressed", String(bankAudio.loop));
    e.currentTarget.textContent = bankAudio.loop ? "⟲ Loop activo" : "⟲ Loop desactivado";
    toast(bankAudio.loop ? "Loop de audio activo" : "Loop de audio desactivado");
  });

  // Pantalla de inicio
  $("startBtn").addEventListener("click", async () => {
    $("startOverlay").classList.add("hidden");
    initAudio();
    if (ac && ac.state !== "running") await ac.resume();
    setSound(curSndIdx);
    playSound();
    video.play().catch(() => {});
  });

  // ==========================================================================
  // REPRODUCTOR DE VIDEO DE FLORES
  // ==========================================================================
  const video = $("flowerVideo") || document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.autoplay = true;

  video.addEventListener("error", (e) => {
    console.error("Error al cargar video de flor:", video.error, e);
  });

  function updVideoUI() {
    document.querySelectorAll(".media-item[data-vid-idx]").forEach((el, i) => {
      el.classList.toggle("active", i === curVidIdx);
    });
    document.querySelectorAll(".btn-vid").forEach((el, i) => {
      el.classList.toggle("active", i === curVidIdx);
    });
    const v = VIDEOS[curVidIdx];
    $("stVideo").textContent = v.id + " · " + v.tag;
    $("status").textContent = "Sonido: " + SOUNDS[curSndIdx].short + " · Flor: " + v.tag;
  }

  function setVideo(idx) {
    if (idx < 0 || idx >= VIDEOS.length) return;
    curVidIdx = idx;
    const v = VIDEOS[idx];
    video.src = v.name;
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
    updVideoUI();
    toast("Flor cargada: " + v.tag);
  }

  document.querySelectorAll("[data-vid-idx]").forEach((btn) => {
    btn.addEventListener("click", () => setVideo(Number(btn.dataset.vidIdx)));
  });
  document.querySelectorAll("[data-vid-quick]").forEach((btn) => {
    btn.addEventListener("click", () => setVideo(Number(btn.dataset.vidQuick)));
  });

  $("vPlay").addEventListener("click", () => video.play().catch(() => {}));
  $("vPause").addEventListener("click", () => video.pause());
  $("vPlayPanel").addEventListener("click", () => video.play().catch(() => {}));
  $("vPausePanel").addEventListener("click", () => video.pause());

  const toggleVidLoop = (btn) => {
    video.loop = !video.loop;
    btn.setAttribute("aria-pressed", String(video.loop));
    $("vLoop").setAttribute("aria-pressed", String(video.loop));
    $("vLoopPanel").setAttribute("aria-pressed", String(video.loop));
    $("vLoopPanel").textContent = video.loop ? "⟲ Loop activo" : "⟲ Loop desactivado";
    toast(video.loop ? "Loop de flor activo" : "Loop desactivado");
  };
  $("vLoop").addEventListener("click", (e) => toggleVidLoop(e.currentTarget));
  $("vLoopPanel").addEventListener("click", (e) => toggleVidLoop(e.currentTarget));

  // ==========================================================================
  // ANÁLISIS DE AUDIO EN TIEMPO REAL (WEB AUDIO API)
  // ==========================================================================
  const freqBuf = new Uint8Array(512);
  const timeBuf = new Uint8Array(512);

  function analyzeAudio() {
    if (!analyser || !isAudioPlaying() || S.bankVol <= 0) {
      liveRms = 0;
      liveBass = 0;
      liveMids = 0;
      liveHighs = 0;
      liveFlux = 0;
      prevRms = 0;
      dominantFreq = 0;
      return;
    }

    analyser.getByteFrequencyData(freqBuf);
    analyser.getByteTimeDomainData(timeBuf);

    // 1. RMS (Energía / Volumen real)
    let sumSquares = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      const v = (timeBuf[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rawRms = Math.sqrt(sumSquares / timeBuf.length);
    liveRms = Math.min(1, rawRms * (S.audioSens * 1.8));

    // 2. Transitorios rápidos / Onsets
    liveFlux = Math.max(0, rawRms - prevRms);
    prevRms = rawRms;

    // 3. Bandas de Frecuencia
    let bassSum = 0;
    for (let i = 1; i <= 6; i++) bassSum += freqBuf[i];
    liveBass = (bassSum / (6 * 255));

    let midsSum = 0;
    for (let i = 7; i <= 50; i++) midsSum += freqBuf[i];
    liveMids = (midsSum / (44 * 255));

    let highsSum = 0;
    for (let i = 51; i <= 220; i++) highsSum += freqBuf[i];
    liveHighs = (highsSum / (170 * 255));

    // 4. Frecuencia Dominante
    let maxBin = 1, maxVal = 0;
    for (let i = 1; i < 240; i++) {
      if (freqBuf[i] > maxVal) {
        maxVal = freqBuf[i];
        maxBin = i;
      }
    }
    if (maxVal > 30 && ac) {
      dominantFreq = Math.round(maxBin * (ac.sampleRate / analyser.fftSize));
    }
  }

  // ==========================================================================
  // MOTOR DE GLITCH REACTIVO (CONTROLADO POR EL SONIDO)
  // ==========================================================================
  const view = $("view"), vctx = view.getContext("2d");

  function fit(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return dpr;
  }

  function drawView(dt) {
    const dpr = fit(view), W = view.width, H = view.height;
    vctx.fillStyle = "#080A08";
    vctx.fillRect(0, 0, W, H);

    const canDraw = video && video.videoWidth > 0 && video.readyState >= 1;
    const ar = canDraw ? (video.videoWidth || 16) / (video.videoHeight || 9) : 16 / 9;
    let bw = W, bh = W / ar;
    if (bh > H) { bh = H; bw = H * ar; }
    const bx = (W - bw) / 2, by = (H - bh) / 2;

    if (!canDraw && video.paused) {
      video.play().catch(() => {});
    }

    // Intensidad objetivo a partir del volumen y sensibilidad
    const soundTarget = liveRms * S.glitchInt;

    // Interpolación y decaimiento suave (DECAY)
    if (soundTarget > currentGlitch) {
      currentGlitch = currentGlitch * 0.35 + soundTarget * 0.65;
    } else {
      const decayFactor = Math.max(0.1, S.decayTime);
      currentGlitch *= Math.exp(-dt / decayFactor);
    }
    if (currentGlitch < 0.005) currentGlitch = 0;

    // Actualizar telemetría visual
    const rmsPct = Math.round(liveRms * 100);
    const highsPct = Math.round(liveHighs * 100);
    const glitchPct = Math.round(Math.min(1, currentGlitch) * 100);

    $("audioMeter").style.width = rmsPct + "%";
    $("audioVal").textContent = rmsPct + "%";
    $("specMeter").style.width = highsPct + "%";
    $("specVal").textContent = highsPct + "%";
    $("glitchMeter").style.width = glitchPct + "%";
    $("glitchVal").textContent = glitchPct + "%";

    if (dominantFreq > 0) {
      $("lastHz").textContent = dominantFreq >= 1000 ? (dominantFreq / 1000).toFixed(1) + " kHz" : dominantFreq + " Hz";
    } else {
      $("lastHz").textContent = "—";
    }

    if (liveHighs > liveBass * 1.3) $("specBalance").textContent = "agudo / brillante";
    else if (liveBass > liveMids * 1.2) $("specBalance").textContent = "grave / submundo";
    else $("specBalance").textContent = "armónico";

    const badge = $("sysBadge"), badgeText = $("statusText");
    if (isAudioPlaying()) {
      if (currentGlitch > 0.45) {
        badgeText.textContent = "SIGNAL ACTIVE // HIGH ENERGY";
        badgeText.style.color = "var(--magenta)";
        badge.style.borderColor = "var(--magenta)";
      } else {
        badgeText.textContent = "AUDIO REACTIVE // LIVE";
        badgeText.style.color = "var(--acid)";
        badge.style.borderColor = "var(--acid)";
      }
    } else {
      badgeText.textContent = "AUDIO STANDBY";
      badgeText.style.color = "var(--gray-1)";
      badge.style.borderColor = "var(--gray-3)";
    }

    if (!canDraw) {
      vctx.fillStyle = "rgba(230,240,227,.6)";
      vctx.font = Math.round(11 * dpr) + "px 'IBM Plex Mono', monospace";
      vctx.textAlign = "center";
      vctx.fillText("CARGANDO FLOR DIGITAL...", W / 2, H / 2);
      vctx.textAlign = "start";
      return;
    }

    // ========================================================================
    // RENDERIZADO DEL VIDEO DE LA FLOR
    // Si no hay audio sonando (currentGlitch === 0), la flor se ve 100% limpia.
    // ========================================================================
    vctx.drawImage(video, bx, by, bw, bh);

    // INTERVENCIÓN GLITCH MODULADA POR EL AUDIO
    if (S.glitchFx && currentGlitch > 0.01) {
      const g = currentGlitch;
      const pxBlock = Math.max(4, S.pxSize * dpr);
      const vw = video.videoWidth, vh = video.videoHeight;

      // A. Desplazamiento horizontal por franjas (gobernado por volumen y graves)
      const numSlices = Math.min(20, Math.floor(2 + g * 14 + liveBass * 6));
      const maxShift = (g * 45 + liveBass * 25) * dpr;

      for (let s = 0; s < numSlices; s++) {
        const sliceH = Math.max(pxBlock, Math.round((Math.random() * 0.8 + 0.4) * pxBlock * 2));
        const sy = Math.floor(Math.random() * (bh - sliceH));
        const shiftX = (Math.random() - 0.5) * maxShift;

        if (Math.abs(shiftX) > 1.5 && vw > 0 && vh > 0) {
          const srcY = (sy / bh) * vh;
          const srcH = (sliceH / bh) * vh;
          vctx.drawImage(
            video,
            0, srcY, vw, srcH,
            bx + shiftX, by + sy, bw, sliceH
          );
        }
      }

      // B. Separación RGB / Aberración Cromática (gobernada por frecuencias agudas)
      if (S.freqReact > 0.05 && (g > 0.06 || liveHighs > 0.12)) {
        const rgbShift = Math.round((liveHighs * 0.7 + g * 0.5) * S.freqReact * 14 * dpr);
        const stripCount = Math.min(8, Math.floor(2 + g * 6));
        vctx.save();
        vctx.globalCompositeOperation = "screen";
        vctx.globalAlpha = Math.min(0.42, (g * 0.35 + liveHighs * 0.3) * S.freqReact);

        for (let i = 0; i < stripCount; i++) {
          const sh = Math.max(4 * dpr, Math.random() * 24 * dpr);
          const sy = by + Math.random() * (bh - sh);
          vctx.fillStyle = "#FF3BD4";
          vctx.fillRect(bx - rgbShift, sy, bw, sh);
          vctx.fillStyle = "#8BEA35";
          vctx.fillRect(bx + rgbShift, sy, bw, sh);
        }
        vctx.restore();
      }

      // C. Fragmentación en bloques digitales (píxeles grandes cuando el audio sube)
      if (g > 0.3 && vw > 0 && vh > 0) {
        const blocks = Math.floor(g * 5 + liveFlux * 6);
        vctx.save();
        vctx.imageSmoothingEnabled = false;
        for (let b = 0; b < blocks; b++) {
          const sw = Math.round((Math.random() * 0.2 + 0.08) * bw);
          const sh = Math.round((Math.random() * 0.12 + 0.04) * bh);
          const sx = bx + Math.random() * (bw - sw);
          const sy = by + Math.random() * (bh - sh);
          const offX = (Math.random() - 0.5) * g * 35 * dpr;
          const srcX = ((sx - bx) / bw) * vw;
          const srcY = ((sy - by) / bh) * vh;
          const srcW = (sw / bw) * vw;
          const srcH = (sh / bh) * vh;
          vctx.drawImage(video, srcX, srcY, srcW, srcH, sx + offX, sy, sw, sh);
        }
        vctx.restore();
      }

      // D. Scanlines dinámicas con el sonido
      const scanAlpha = Math.min(0.3, 0.06 + g * 0.22);
      vctx.fillStyle = "rgba(8, 10, 8, " + scanAlpha.toFixed(3) + ")";
      for (let y = Math.floor(by); y < by + bh; y += 4 * dpr) {
        vctx.fillRect(bx, y, bw, 1.5 * dpr);
      }

      // E. Transitorios rápidos / Golpes y glitches audibles (láseres e interferencias)
      if ((liveFlux > 0.12 || g > 0.5) && Math.random() < 0.45) {
        const laserY = by + Math.random() * bh;
        const laserH = Math.max(1, Math.round(Math.random() * 2.5 * dpr));
        vctx.fillStyle = Math.random() < 0.5 ? "rgba(255, 59, 212, 0.9)" : "rgba(139, 234, 53, 0.9)";
        vctx.fillRect(bx + Math.random() * bw * 0.15, laserY, bw * (0.3 + Math.random() * 0.6), laserH);
      }
    }
  }

  // ==========================================================================
  // OSCILOSCOPIO Y ESPECTRO EN VIVO (AUDIO REAL)
  // ==========================================================================
  const scope = $("scope"), sctx = scope.getContext("2d");
  const envC = $("env"), ectx = envC.getContext("2d");

  function drawScope() {
    if ($("signal").hidden) return;
    const dpr = fit(scope), W = scope.width, H = scope.height;
    sctx.clearRect(0, 0, W, H);

    const split = Math.round(W * 0.58), pad = 6 * dpr, mid = H / 2, amp = H * 0.38;

    sctx.strokeStyle = "rgba(230, 240, 227, 0.12)";
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.moveTo(0, Math.round(mid) + 0.5); sctx.lineTo(split - pad, Math.round(mid) + 0.5);
    sctx.moveTo(split + 0.5, 0); sctx.lineTo(split + 0.5, H);
    sctx.stroke();

    // 1. Forma de onda real del audio
    if (isAudioPlaying()) {
      sctx.strokeStyle = "#8BEA35";
      sctx.lineWidth = 1.5 * dpr;
      sctx.beginPath();
      const step = timeBuf.length / (split - pad);
      for (let x = 0; x < split - pad; x++) {
        const idx = Math.floor(x * step);
        const y = mid + ((timeBuf[idx] - 128) / 128) * amp;
        x ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
      }
      sctx.stroke();
    } else {
      sctx.strokeStyle = "rgba(230, 240, 227, 0.25)";
      sctx.beginPath();
      sctx.moveTo(0, mid); sctx.lineTo(split - pad, mid);
      sctx.stroke();
    }

    // 2. Espectro FFT de frecuencias del audio
    const N = 16, bw = (W - split - pad * 2) / N;
    for (let n = 0; n < N; n++) {
      const binIdx = Math.floor((n / N) * 120);
      const val = isAudioPlaying() ? freqBuf[binIdx] / 255 : 0;
      const h = Math.max(1, val * (H - pad * 2)), x = split + pad + n * bw;
      sctx.fillStyle = val > 0.6 ? "#FF3BD4" : "#8BEA35";
      sctx.fillRect(Math.round(x + bw * 0.15), Math.round(H - pad - h), Math.max(1, Math.round(bw * 0.7)), Math.round(h));
    }
  }

  function drawEnv() {
    if ($("signal").hidden) return;
    const dpr = fit(envC), W = envC.width, H = envC.height, pad = 6 * dpr;
    ectx.clearRect(0, 0, W, H);

    const barH = 14 * dpr;
    const top1 = pad + 4 * dpr, top2 = top1 + barH + 10 * dpr;
    const barW = W - pad * 2;

    ectx.fillStyle = "rgba(230, 240, 227, 0.1)";
    ectx.fillRect(pad, top1, barW, barH);
    ectx.fillRect(pad, top2, barW, barH);

    // Relleno RMS (Volumen audio)
    ectx.fillStyle = "#8BEA35";
    ectx.fillRect(pad, top1, barW * liveRms, barH);

    // Relleno Glitch
    ectx.fillStyle = "#FF3BD4";
    ectx.fillRect(pad, top2, barW * currentGlitch, barH);

    ectx.font = Math.round(8 * dpr) + "px 'IBM Plex Mono', monospace";
    ectx.fillStyle = "#E6F0E3";
    ectx.fillText("AUDIO RMS: " + Math.round(liveRms * 100) + "%", pad + 4 * dpr, top1 + barH - 3 * dpr);
    ectx.fillText("GLITCH: " + Math.round(currentGlitch * 100) + "%", pad + 4 * dpr, top2 + barH - 3 * dpr);
  }

  // ==========================================================================
  // CONFIGURACIÓN DE CONTROLES E INPUTS
  // ==========================================================================
  const RANGES = {
    glitchInt: { key: "glitchInt", fmt: (v) => v + " %", conv: (v) => v / 100 },
    audioSens: { key: "audioSens", fmt: (v) => v + " %", conv: (v) => v / 100 },
    pxSize: { key: "pxSize", fmt: (v) => v + " px" },
    freqReact: { key: "freqReact", fmt: (v) => v + " %", conv: (v) => v / 100 },
    decayTime: { key: "decayTime", fmt: (v) => (v / 1000).toFixed(1) + " s", conv: (v) => v / 1000 },
    bankVol: { key: "bankVol", fmt: (v) => v + " %", conv: (v) => v / 100 }
  };

  Object.entries(RANGES).forEach(([id, cfg]) => {
    const el = $(id), out = $(id + "Out");
    if (!el || !out) return;
    const upd = () => {
      const v = Number(el.value);
      S[cfg.key] = cfg.conv ? cfg.conv(v) : v;
      out.textContent = cfg.fmt(v);
      if (cfg.key === "bankVol" && bankGain && ac) {
        bankGain.gain.setTargetAtTime(S.bankVol, ac.currentTime, 0.05);
      }
    };
    el.addEventListener("input", upd);
    upd();
  });

  // Botón Restablecer Parámetros
  $("resetParamsBtn").addEventListener("click", () => {
    $("glitchInt").value = "65";
    $("audioSens").value = "70";
    $("pxSize").value = "16";
    $("freqReact").value = "75";
    $("decayTime").value = "1200";

    Object.assign(S, {
      glitchInt: 0.65,
      audioSens: 0.70,
      pxSize: 16,
      freqReact: 0.75,
      decayTime: 1.2
    });

    $("glitchIntOut").textContent = "65 %";
    $("audioSensOut").textContent = "70 %";
    $("pxSizeOut").textContent = "16 px";
    $("freqReactOut").textContent = "75 %";
    $("decayTimeOut").textContent = "1.2 s";

    toast("Parámetros restablecidos");
  });

  // Toggle de Glitch FX
  const tGlitch = $("tGlitch");
  if (tGlitch) {
    tGlitch.addEventListener("click", (e) => {
      S.glitchFx = !S.glitchFx;
      e.currentTarget.setAttribute("aria-pressed", String(S.glitchFx));
      toast(S.glitchFx ? "Glitch FX activado" : "Glitch FX desactivado");
    });
  }

  // Toggle de ventana de Señal
  $("tSignal").addEventListener("click", (e) => {
    const on = $("signal").hidden;
    $("signal").hidden = !on;
    e.currentTarget.setAttribute("aria-pressed", String(on));
  });
  $("sigHide").addEventListener("click", () => {
    $("signal").hidden = true;
    $("tSignal").setAttribute("aria-pressed", "false");
  });

  // Pantalla completa
  $("fsBtn").addEventListener("click", async () => {
    const st = $("stage");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (st.requestFullscreen) await st.requestFullscreen();
      else if (st.webkitRequestFullscreen) st.webkitRequestFullscreen();
    } catch (_) {
      toast("Pantalla completa no disponible");
    }
  });

  // ==========================================================================
  // BUCLE PRINCIPAL DE ANIMACIÓN
  // ==========================================================================
  let lastT = performance.now();

  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    // 1. Análisis de audio
    analyzeAudio();

    // 2. Renderizado de flor + glitch en canvas
    drawView(dt);

    // 3. Monitor de señal en vivo
    drawScope();
    drawEnv();

    requestAnimationFrame(loop);
  }

  // Inicialización de pista sonora y video por defecto
  setSound(0);
  setVideo(0);

  requestAnimationFrame(loop);
})();