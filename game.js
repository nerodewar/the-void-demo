(() => {
  'use strict';

  const CONFIG = Object.freeze({
    duration: 120,
    targetDistance: 50,
    baseLightYearsPerSecond: 0.45,
    normalVelocity: 1350,
    damagedVelocity: 610,
    shieldRechargeSeconds: 3.4,
    engineOfflineSeconds: 4.1,
    postOutageShieldDelay: 0.7,
    maxMeteors: 12,
    spawnRateMultiplier: 1.2,
    starCount: 150,
    scoreThresholds: { twoStars: 26000, threeStars: 56000 },
    meteorTypes: [
      { id: 'small', image: 'IMGA1', weight: 0.57, hp: 1, points: 10, minSize: 48, maxSize: 70, speed: 1.02 },
      { id: 'medium', image: 'IMGA2', weight: 0.30, hp: 3, points: 35, minSize: 88, maxSize: 124, speed: 0.83 },
      { id: 'large', image: 'IMGA3', weight: 0.13, hp: 6, points: 80, minSize: 142, maxSize: 195, speed: 0.66 }
    ]
  });

  const ASSET_PATHS = Object.freeze({
    IMG00: '../assets/IMG00.png',
    IMGA1: '../assets/IMGA1.png',
    IMGA2: '../assets/IMGA2.png',
    IMGA3: '../assets/IMGA3.png',
    IMGA4: '../assets/IMGA4.png'
  });

  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#game-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const shell = $('#game-shell');
  const flightMusic = $('#debris-music');
  const query = new URLSearchParams(location.search);

  function getReturnUrl() {
    const requested = query.get('return') || '../index.html';
    try {
      const resolved = new URL(requested, location.href);
      return resolved.origin === location.origin ? resolved.href : new URL('../index.html', location.href).href;
    } catch {
      return new URL('../index.html', location.href).href;
    }
  }

  async function startFlightMusic() {
    if (!flightMusic || !flightMusic.paused) return true;
    flightMusic.volume = 0.52;
    flightMusic.loop = true;
    try {
      await flightMusic.play();
      return true;
    } catch {
      return false;
    }
  }

  function returnToMainTitle() {
    if (flightMusic) { flightMusic.pause(); flightMusic.currentTime = 0; }
    location.assign(getReturnUrl());
  }

  const ui = {
    loading: $('#loading-screen'), result: $('#result-screen'),
    loadingProgress: $('#loading-progress'), loadingCopy: $('#loading-copy'),
    restart: $('#restart-button'), continue: $('#continue-button'),
    timer: $('#timer'), distance: $('#distance'), kills: $('#kills'), combatScore: $('#combat-score'),
    shieldLabel: $('#shield-label'), heatLabel: $('#heat-label'), shieldMeter: $('#shield-meter'), heatMeter: $('#heat-meter'),
    velocity: $('#velocity'), velocityBars: $('#velocity-bars'), engineBars: $('#engine-bars'), engineState: $('#engine-state'),
    fireButton: $('#fire-button'), toast: $('#status-toast'),
    resultTitle: $('#result-title'), stars: $('#stars'), resultNarrative: $('#result-narrative'),
    resultDistance: $('#result-distance'), resultCombat: $('#result-combat'), resultOverall: $('#result-overall'), resultOutages: $('#result-outages')
  };

  const assets = {};
  const controls = { up: false, down: false, left: false, right: false, fire: false };
  let game = null;
  let toastTimer = 0;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function random(min, max) { return Math.random() * (max - min) + min; }
  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    const hundredths = Math.floor((safe % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function buildMeter(element) {
    element.replaceChildren();
    for (let i = 0; i < 12; i += 1) element.append(document.createElement('i'));
  }

  function setMeter(element, ratio, warnFrom = 2) {
    const lit = Math.round(clamp(ratio, 0, 1) * 12);
    [...element.children].forEach((segment, index) => {
      segment.className = '';
      if (index < lit) segment.classList.add(index >= 12 - warnFrom ? 'warn' : 'on');
    });
  }

  function showToast(text, danger = false, duration = 1500) {
    clearTimeout(toastTimer);
    ui.toast.textContent = text;
    ui.toast.classList.toggle('danger', danger);
    ui.toast.classList.add('show');
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), duration);
  }

  function loadImage(key, src, index, total) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        assets[key] = image;
        ui.loadingProgress.style.width = `${Math.round(((index + 1) / total) * 100)}%`;
        ui.loadingCopy.textContent = `Loading ${key}…`;
        resolve();
      };
      image.onerror = () => reject(new Error(`Unable to load ${src}`));
      image.src = src;
    });
  }

  async function preload() {
    const entries = Object.entries(ASSET_PATHS);
    for (let i = 0; i < entries.length; i += 1) {
      const [key, src] = entries[i];
      await loadImage(key, src, i, entries.length);
    }
    ui.loadingCopy.textContent = 'Flight systems online.';
  }

  class Star {
    constructor(width, height, initial = false) { this.reset(width, height, initial); }
    reset(width, height, initial = false) {
      this.x = random(0, width);
      this.y = initial ? random(0, height) : random(-height * 0.2, 0);
      this.z = random(0.3, 1.15);
      this.length = random(5, 19) * this.z;
      this.opacity = random(0.35, 1);
    }
    update(dt, speed, width, height) {
      this.y += speed * this.z * dt;
      if (this.y > height + 30) this.reset(width, height, false);
    }
    draw(ctx2d, speedScale) {
      const trail = this.length * (0.65 + speedScale * 0.55);
      const gradient = ctx2d.createLinearGradient(this.x, this.y - trail, this.x, this.y);
      gradient.addColorStop(0, 'rgba(100,185,255,0)');
      gradient.addColorStop(1, `rgba(190,230,255,${this.opacity})`);
      ctx2d.strokeStyle = gradient;
      ctx2d.lineWidth = Math.max(0.65, this.z * 1.55);
      ctx2d.beginPath();
      ctx2d.moveTo(this.x, this.y - trail);
      ctx2d.lineTo(this.x, this.y);
      ctx2d.stroke();
    }
  }

  class Laser {
    constructor(x, y) { this.x = x; this.y = y; this.radius = 4; this.speed = 940; this.dead = false; }
    update(dt) { this.y -= this.speed * dt; if (this.y < -50) this.dead = true; }
    draw(ctx2d) {
      const gradient = ctx2d.createLinearGradient(this.x, this.y + 18, this.x, this.y - 18);
      gradient.addColorStop(0, 'rgba(0,87,255,0)');
      gradient.addColorStop(.45, '#28aaff');
      gradient.addColorStop(1, '#eaf9ff');
      ctx2d.strokeStyle = gradient;
      ctx2d.lineWidth = 4;
      ctx2d.shadowColor = '#178fff';
      ctx2d.shadowBlur = 13;
      ctx2d.beginPath(); ctx2d.moveTo(this.x, this.y + 18); ctx2d.lineTo(this.x, this.y - 15); ctx2d.stroke();
      ctx2d.shadowBlur = 0;
    }
  }

  class Meteor {
    constructor(type, x, size, speed, rotation) {
      this.type = type;
      this.image = assets[type.image];
      this.x = x;
      this.y = -size * 0.75;
      this.size = size;
      this.radius = size * 0.37;
      this.speed = speed;
      this.rotation = rotation;
      this.spin = random(-0.58, 0.58);
      this.hp = type.hp;
      this.maxHp = type.hp;
      this.dead = false;
      this.hitFlash = 0;
    }
    update(dt, speedScale, height) {
      this.y += this.speed * speedScale * dt;
      this.rotation += this.spin * dt;
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.y - this.size > height + 40) this.dead = true;
    }
    hit() {
      this.hp -= 1;
      this.hitFlash = 0.11;
      if (this.hp <= 0) this.dead = true;
      return this.hp <= 0;
    }
    draw(ctx2d) {
      ctx2d.save();
      ctx2d.translate(this.x, this.y);
      ctx2d.rotate(this.rotation);
      ctx2d.globalAlpha = this.hitFlash > 0 ? 0.62 : 1;
      ctx2d.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
      if (this.hitFlash > 0) {
        ctx2d.globalCompositeOperation = 'screen';
        ctx2d.fillStyle = 'rgba(255,255,255,.72)';
        ctx2d.beginPath(); ctx2d.arc(0, 0, this.radius, 0, Math.PI * 2); ctx2d.fill();
      }
      ctx2d.restore();

      if (this.maxHp > 1 && this.hp < this.maxHp) {
        const width = this.size * .62;
        ctx2d.fillStyle = 'rgba(0,0,0,.55)';
        ctx2d.fillRect(this.x - width / 2, this.y - this.size * .57, width, 4);
        ctx2d.fillStyle = this.hp / this.maxHp > .34 ? '#30b7ff' : '#ff4c48';
        ctx2d.fillRect(this.x - width / 2, this.y - this.size * .57, width * (this.hp / this.maxHp), 4);
      }
    }
  }

  class Particle {
    constructor(x, y, color, force = 1) {
      const angle = random(0, Math.PI * 2);
      const speed = random(60, 220) * force;
      this.x = x; this.y = y;
      this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
      this.life = random(.25, .72); this.maxLife = this.life;
      this.size = random(1.5, 5.5) * force;
      this.color = color;
    }
    update(dt) { this.life -= dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= .985; this.vy *= .985; }
    draw(ctx2d) { ctx2d.globalAlpha = clamp(this.life / this.maxLife, 0, 1); ctx2d.fillStyle = this.color; ctx2d.fillRect(this.x, this.y, this.size, this.size); ctx2d.globalAlpha = 1; }
  }

  class DebrisGame {
    constructor() {
      this.running = false;
      this.finished = false;
      this.lastTime = 0;
      this.timeLeft = CONFIG.duration;
      this.elapsed = 0;
      this.distance = 0;
      this.killScore = 0;
      this.kills = 0;
      this.impacts = 0;
      this.engineOutages = 0;
      this.shieldReady = true;
      this.shieldRecharge = 0;
      this.engineOffline = false;
      this.engineOfflineTimer = 0;
      this.engineSide = 'LEFT';
      this.heat = 0;
      this.overheated = false;
      this.fireCooldown = 0;
      this.spawnTimer = 1;
      this.waveGap = 0;
      this.shake = 0;
      this.stars = [];
      this.meteors = [];
      this.lasers = [];
      this.particles = [];
      this.result = null;
      this.resize();
      for (let i = 0; i < CONFIG.starCount; i += 1) this.stars.push(new Star(this.width, this.height, true));
      this.ship = { x: this.width * .5, y: this.height * .79, width: 108, height: 126 };
    }

    resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      canvas.width = Math.floor(this.width * dpr);
      canvas.height = Math.floor(this.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.playLeft = Math.max(205, this.width * .16);
      this.playRight = Math.min(this.width - 205, this.width * .84);
      this.playTop = Math.max(110, this.height * .13);
      this.playBottom = this.height - Math.max(70, this.height * .10);
      if (this.ship) {
        this.ship.x = clamp(this.ship.x, this.playLeft + this.ship.width / 2, this.playRight - this.ship.width / 2);
        this.ship.y = clamp(this.ship.y, this.playTop + this.ship.height / 2, this.playBottom - this.ship.height / 2);
      }
    }

    start() {
      this.running = true;
      this.finished = false;
      this.lastTime = performance.now();
      this.timeLeft = CONFIG.duration;
      this.elapsed = 0;
      this.distance = 0;
      this.killScore = 0;
      this.kills = 0;
      this.impacts = 0;
      this.engineOutages = 0;
      this.shieldReady = true;
      this.shieldRecharge = 0;
      this.engineOffline = false;
      this.engineOfflineTimer = 0;
      this.heat = 0;
      this.overheated = false;
      this.fireCooldown = 0;
      this.spawnTimer = .71;
      this.waveGap = 0;
      this.meteors.length = 0;
      this.lasers.length = 0;
      this.particles.length = 0;
      this.ship.x = this.width * .5;
      this.ship.y = this.height * .79;
      ui.result.classList.remove('active');
      ui.loading.classList.remove('active');
      startFlightMusic();
      showToast('MANUAL CONTROL ENGAGED');
      requestAnimationFrame((time) => this.frame(time));
    }

    frame(time) {
      if (!this.running) return;
      const dt = Math.min((time - this.lastTime) / 1000, .035);
      this.lastTime = time;
      this.update(dt);
      this.draw();
      if (this.running) requestAnimationFrame((next) => this.frame(next));
    }

    update(dt) {
      this.elapsed += dt;
      this.timeLeft -= dt;
      const speedMultiplier = this.engineOffline ? .45 : 1;
      this.distance = Math.min(CONFIG.targetDistance, this.distance + CONFIG.baseLightYearsPerSecond * speedMultiplier * dt);

      this.updateShip(dt);
      this.updateWeapons(dt);
      this.updateDefence(dt);
      this.updateSpawning(dt);

      const starSpeed = lerp(560, 760, clamp(this.elapsed / CONFIG.duration, 0, 1)) * speedMultiplier;
      for (const star of this.stars) star.update(dt, starSpeed, this.width, this.height);
      for (const laser of this.lasers) laser.update(dt);
      for (const meteor of this.meteors) meteor.update(dt, speedMultiplier, this.height);
      for (const particle of this.particles) particle.update(dt);

      this.resolveLaserHits();
      this.resolveShipHits();
      this.lasers = this.lasers.filter((item) => !item.dead);
      this.meteors = this.meteors.filter((item) => !item.dead);
      this.particles = this.particles.filter((item) => item.life > 0);
      this.shake = Math.max(0, this.shake - dt * 22);
      this.updateHud();

      if (this.distance >= CONFIG.targetDistance || this.timeLeft <= 0) this.finish();
    }

    updateShip(dt) {
      let dx = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
      let dy = (controls.down ? 1 : 0) - (controls.up ? 1 : 0);
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      const moveSpeed = this.engineOffline ? 225 : 420;
      this.ship.x += dx * moveSpeed * dt;
      this.ship.y += dy * moveSpeed * dt;
      this.ship.x = clamp(this.ship.x, this.playLeft + this.ship.width * .38, this.playRight - this.ship.width * .38);
      this.ship.y = clamp(this.ship.y, this.playTop + this.ship.height * .45, this.playBottom - this.ship.height * .45);
    }

    updateWeapons(dt) {
      this.fireCooldown -= dt;
      if (controls.fire && !this.overheated) {
        this.heat = Math.min(100, this.heat + dt * 21);
        if (this.fireCooldown <= 0) {
          this.fireCooldown = .13;
          const offset = this.ship.width * .17;
          this.lasers.push(new Laser(this.ship.x - offset, this.ship.y - this.ship.height * .35));
          this.lasers.push(new Laser(this.ship.x + offset, this.ship.y - this.ship.height * .35));
          this.heat = Math.min(100, this.heat + 1.4);
        }
      } else {
        this.heat = Math.max(0, this.heat - dt * (this.overheated ? 32 : 24));
      }
      if (!this.overheated && this.heat >= 100) {
        this.overheated = true;
        showToast('LASER ARRAY OVERHEATED', true);
      }
      if (this.overheated && this.heat <= 32) {
        this.overheated = false;
        showToast('LASER ARRAY READY');
      }
      ui.fireButton.classList.toggle('overheated', this.overheated);
    }

    updateDefence(dt) {
      if (!this.shieldReady) {
        this.shieldRecharge -= dt;
        if (this.shieldRecharge <= 0 && !this.engineOffline) {
          this.shieldReady = true;
          this.shieldRecharge = 0;
          showToast('DEFENCE FIELD RESTORED');
        }
      }
      if (this.engineOffline) {
        this.engineOfflineTimer -= dt;
        if (this.engineOfflineTimer <= 0) {
          this.engineOffline = false;
          this.engineOfflineTimer = 0;
          this.shieldRecharge = Math.max(this.shieldRecharge, CONFIG.postOutageShieldDelay);
          showToast(`${this.engineSide} ENGINE RESTARTED`);
        }
      }
    }

    updateSpawning(dt) {
      if (this.waveGap > 0) { this.waveGap -= dt; return; }
      this.spawnTimer -= dt;
      if (this.spawnTimer > 0 || this.meteors.length >= CONFIG.maxMeteors) return;

      const progress = clamp(this.elapsed / CONFIG.duration, 0, 1);
      const base = lerp(1.3, .78, progress) / CONFIG.spawnRateMultiplier;
      this.spawnTimer = random(base * .76, base * 1.35);
      if (Math.random() < .06 + progress * .08) this.waveGap = random(1.1, 1.8);
      this.spawnMeteor(progress);
      if (progress > .35 && Math.random() < .12 && this.meteors.length < CONFIG.maxMeteors - 1) {
        setTimeout(() => { if (this.running) this.spawnMeteor(progress); }, 210);
      }
    }

    chooseMeteorType() {
      let roll = Math.random();
      for (const type of CONFIG.meteorTypes) {
        roll -= type.weight;
        if (roll <= 0) return type;
      }
      return CONFIG.meteorTypes[0];
    }

    spawnMeteor(progress) {
      const type = this.chooseMeteorType();
      const scale = clamp(Math.min(this.width / 1366, this.height / 768), .72, 1.32);
      const size = random(type.minSize, type.maxSize) * scale;
      const minX = this.playLeft + size * .5;
      const maxX = this.playRight - size * .5;
      let x = random(minX, maxX);

      // Keep consecutive spawns from forming an unavoidable wall.
      const nearby = this.meteors.filter((m) => m.y < this.height * .24);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (nearby.every((m) => Math.abs(m.x - x) > (m.size + size) * .48)) break;
        x = random(minX, maxX);
      }

      const baseSpeed = lerp(245, 340, progress) * type.speed;
      this.meteors.push(new Meteor(type, x, size, random(baseSpeed * .88, baseSpeed * 1.12), random(0, Math.PI * 2)));
    }

    resolveLaserHits() {
      for (const laser of this.lasers) {
        if (laser.dead) continue;
        for (const meteor of this.meteors) {
          if (meteor.dead) continue;
          const dx = laser.x - meteor.x;
          const dy = laser.y - meteor.y;
          if (dx * dx + dy * dy <= (meteor.radius + laser.radius) ** 2) {
            laser.dead = true;
            const destroyed = meteor.hit();
            this.spark(meteor.x, laser.y, '#55c9ff', destroyed ? 1.2 : .55, destroyed ? 14 : 5);
            if (destroyed) {
              this.kills += 1;
              this.killScore += meteor.type.points;
              this.spark(meteor.x, meteor.y, meteor.type.id === 'large' ? '#46a8ff' : meteor.type.id === 'medium' ? '#ff8b38' : '#f4f0e8', meteor.type.id === 'large' ? 1.45 : 1, meteor.type.id === 'large' ? 28 : 18);
            }
            break;
          }
        }
      }
    }

    resolveShipHits() {
      const shipRadius = Math.min(this.ship.width, this.ship.height) * .29;
      for (const meteor of this.meteors) {
        if (meteor.dead || meteor.y < this.ship.y - this.ship.height) continue;
        const dx = meteor.x - this.ship.x;
        const dy = meteor.y - this.ship.y;
        if (dx * dx + dy * dy <= (meteor.radius + shipRadius) ** 2) {
          meteor.dead = true;
          this.impacts += 1;
          this.shake = Math.max(this.shake, 8);
          this.spark(meteor.x, meteor.y, '#8bdcff', 1.15, 22);
          if (this.shieldReady) {
            this.shieldReady = false;
            this.shieldRecharge = CONFIG.shieldRechargeSeconds;
            showToast('DEFENCE FIELD RECHARGING', true);
          } else if (!this.engineOffline) {
            this.engineOffline = true;
            this.engineOfflineTimer = CONFIG.engineOfflineSeconds;
            this.shieldRecharge = CONFIG.engineOfflineSeconds + CONFIG.postOutageShieldDelay;
            this.engineOutages += 1;
            this.engineSide = Math.random() < .5 ? 'LEFT' : 'RIGHT';
            shell.classList.remove('engine-warning');
            void shell.offsetWidth;
            shell.classList.add('engine-warning');
            showToast(`${this.engineSide} ENGINE OFFLINE`, true, 2100);
          } else {
            this.engineOfflineTimer = Math.min(CONFIG.engineOfflineSeconds + .8, this.engineOfflineTimer + .55);
            this.shieldRecharge = Math.max(this.shieldRecharge, this.engineOfflineTimer + .6);
            showToast('IMPACT / RECOVERY DELAYED', true);
          }
        }
      }
    }

    spark(x, y, color, force, count) {
      for (let i = 0; i < count; i += 1) this.particles.push(new Particle(x, y, color, force));
    }

    updateHud() {
      ui.timer.textContent = formatTime(this.timeLeft);
      ui.distance.textContent = `${this.distance.toFixed(1)} LY`;
      ui.kills.textContent = String(this.kills);
      ui.combatScore.textContent = this.killScore.toLocaleString();
      ui.heatLabel.textContent = `${Math.round(this.heat)}%`;
      setMeter(ui.heatMeter, this.heat / 100, 4);

      if (this.shieldReady) {
        ui.shieldLabel.textContent = 'READY';
        setMeter(ui.shieldMeter, 1, 0);
      } else {
        ui.shieldLabel.textContent = 'RECHARGE';
        const total = this.engineOffline ? CONFIG.engineOfflineSeconds + CONFIG.postOutageShieldDelay : CONFIG.shieldRechargeSeconds;
        setMeter(ui.shieldMeter, 1 - clamp(this.shieldRecharge / total, 0, 1), 0);
      }

      ui.velocity.textContent = `${this.engineOffline ? CONFIG.damagedVelocity : CONFIG.normalVelocity.toLocaleString()} M/S`;
      ui.velocityBars.classList.toggle('damaged', this.engineOffline);
      ui.engineBars.classList.toggle('damaged', this.engineOffline);
      ui.engineState.textContent = this.engineOffline ? `${this.engineSide} OFFLINE` : 'NOMINAL';
    }

    draw() {
      ctx.clearRect(0, 0, this.width, this.height);
      const shakeX = this.shake ? random(-this.shake, this.shake) : 0;
      const shakeY = this.shake ? random(-this.shake, this.shake) : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      this.drawSpace();
      for (const star of this.stars) star.draw(ctx, this.engineOffline ? .45 : 1);
      for (const meteor of this.meteors) meteor.draw(ctx);
      for (const laser of this.lasers) laser.draw(ctx);
      this.drawShip();
      for (const particle of this.particles) particle.draw(ctx);
      ctx.restore();
    }

    drawSpace() {
      const gradient = ctx.createRadialGradient(this.width * .52, this.height * .44, 20, this.width * .52, this.height * .44, this.width * .72);
      gradient.addColorStop(0, 'rgba(8,35,62,.68)');
      gradient.addColorStop(.45, 'rgba(2,11,25,.62)');
      gradient.addColorStop(1, '#00030a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = 'rgba(20,100,160,.05)';
      ctx.lineWidth = 1;
      const cx = this.width / 2;
      for (let i = 0; i < 18; i += 1) {
        const x = (i / 17) * this.width;
        ctx.beginPath(); ctx.moveTo(cx, this.height * .28); ctx.lineTo(x, this.height); ctx.stroke();
      }
    }

    drawShip() {
      const shipImage = assets.IMGA4;
      const ratio = shipImage.width / shipImage.height;
      const height = clamp(this.height * .18, 102, 156);
      const width = height * ratio;
      this.ship.width = width;
      this.ship.height = height;

      if (this.shieldReady) {
        const pulse = 1 + Math.sin(this.elapsed * 4) * .03;
        ctx.save();
        ctx.strokeStyle = 'rgba(65,190,255,.55)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#2db8ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(this.ship.x, this.ship.y, width * .48 * pulse, height * .47 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,141,50,.58)';
        ctx.setLineDash([5, 9]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(this.ship.x, this.ship.y, width * .47, height * .46, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      if (this.engineOffline) {
        const sideX = this.engineSide === 'LEFT' ? this.ship.x - width * .26 : this.ship.x + width * .26;
        ctx.fillStyle = 'rgba(255,48,57,.22)';
        ctx.shadowColor = '#ff3039';
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(sideX, this.ship.y + height * .22, width * .14, 0, Math.PI * 2); ctx.fill();
      }
      ctx.drawImage(shipImage, this.ship.x - width / 2, this.ship.y - height / 2, width, height);
      ctx.restore();
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      this.running = false;
      Object.keys(controls).forEach((key) => { controls[key] = false; });
      document.querySelectorAll('.pressed').forEach((node) => node.classList.remove('pressed'));

      const overallScore = Math.round(this.killScore * this.distance);
      const stars = overallScore >= CONFIG.scoreThresholds.threeStars ? 3 : overallScore >= CONFIG.scoreThresholds.twoStars ? 2 : 1;
      const reachedEndpoint = this.distance >= CONFIG.targetDistance;
      const timeRemaining = Math.max(0, this.timeLeft);
      const narrative = stars === 3
        ? 'Luna tears through the field and reaches the next sector with a tactical advantage.'
        : stars === 2
          ? 'Luna clears the field with manageable delay. The ship remains operational.'
          : 'Luna survives the crossing, but arrives late with systems still recovering.';

      this.result = {
        version: 1,
        stars,
        distance: Number(this.distance.toFixed(2)),
        targetDistance: CONFIG.targetDistance,
        reachedEndpoint,
        timeRemaining: Number(timeRemaining.toFixed(2)),
        meteoritesObliterated: this.kills,
        obliterationScore: this.killScore,
        overallScore,
        impacts: this.impacts,
        engineOutages: this.engineOutages,
        completedAt: new Date().toISOString()
      };

      try {
        sessionStorage.setItem('theVoidDebrisResult', JSON.stringify(this.result));
        localStorage.setItem('theVoidDebrisBest', JSON.stringify(this.bestOf(this.result)));
      } catch (error) { console.warn('Result storage unavailable', error); }

      window.dispatchEvent(new CustomEvent('thevoid:debris-complete', { detail: this.result }));
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'THE_VOID_DEBRIS_COMPLETE', result: this.result }, '*');

      ui.resultTitle.textContent = reachedEndpoint ? 'ENDPOINT REACHED' : 'SECTOR TRANSIT COMPLETE';
      ui.stars.className = 'stars';
      ui.stars.innerHTML = [1, 2, 3].map((index) => `<span class="${index <= stars ? 'earned' : ''}">★</span>`).join(' ');
      ui.stars.setAttribute('aria-label', `${stars} star rating`);
      ui.resultNarrative.textContent = narrative;
      ui.resultDistance.textContent = `${this.distance.toFixed(1)} LY`;
      ui.resultCombat.textContent = this.killScore.toLocaleString();
      ui.resultOverall.textContent = overallScore.toLocaleString();
      ui.resultOutages.textContent = String(this.engineOutages);
      setTimeout(() => ui.result.classList.add('active'), 420);
    }

    bestOf(current) {
      let previous = null;
      try { previous = JSON.parse(localStorage.getItem('theVoidDebrisBest')); } catch (_) { /* ignored */ }
      return previous && previous.overallScore > current.overallScore ? previous : current;
    }
  }

  function bindHoldButton(button, key) {
    const pointers = new Set();
    const activate = (event) => {
      event.preventDefault();
      pointers.add(event.pointerId);
      controls[key] = true;
      button.classList.add('pressed');
      try { button.setPointerCapture(event.pointerId); } catch (_) { /* ignored */ }
    };
    const deactivate = (event) => {
      event.preventDefault();
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        controls[key] = false;
        button.classList.remove('pressed');
      }
    };
    button.addEventListener('pointerdown', activate, { passive: false });
    button.addEventListener('pointerup', deactivate, { passive: false });
    button.addEventListener('pointercancel', deactivate, { passive: false });
    button.addEventListener('lostpointercapture', deactivate, { passive: false });
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  function bindControls() {
    document.querySelectorAll('[data-control]').forEach((button) => bindHoldButton(button, button.dataset.control));
    bindHoldButton(ui.fireButton, 'fire');

    const keyMap = {
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      Space: 'fire'
    };
    window.addEventListener('keydown', (event) => {
      const control = keyMap[event.code];
      if (!control) return;
      event.preventDefault();
      controls[control] = true;
      if (control === 'fire') ui.fireButton.classList.add('pressed');
    }, { passive: false });
    window.addEventListener('keyup', (event) => {
      const control = keyMap[event.code];
      if (!control) return;
      event.preventDefault();
      controls[control] = false;
      if (control === 'fire') ui.fireButton.classList.remove('pressed');
    }, { passive: false });

    window.addEventListener('blur', () => {
      Object.keys(controls).forEach((key) => { controls[key] = false; });
      document.querySelectorAll('.pressed').forEach((node) => node.classList.remove('pressed'));
    });

    document.addEventListener('dragstart', (event) => event.preventDefault());
    document.addEventListener('selectstart', (event) => event.preventDefault());
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('touchmove', (event) => {
      if (event.target.closest('#game-shell')) event.preventDefault();
    }, { passive: false });

    document.addEventListener('pointerdown', () => { startFlightMusic(); }, { capture: true, passive: true });
    document.addEventListener('keydown', () => { startFlightMusic(); }, { capture: true });
  }

  function setupUi() {
    buildMeter(ui.shieldMeter);
    buildMeter(ui.heatMeter);
    setMeter(ui.shieldMeter, 1, 0);
    setMeter(ui.heatMeter, 0, 4);
    ui.restart.addEventListener('click', () => game.start());
    ui.continue.addEventListener('click', () => {
      if (!game?.result) return;
      window.dispatchEvent(new CustomEvent('thevoid:debris-continue', { detail: game.result }));
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'THE_VOID_DEBRIS_CONTINUE', result: game.result }, '*');
      returnToMainTitle();
    });
  }

  async function initialise() {
    setupUi();
    bindControls();
    try {
      await preload();
      game = new DebrisGame();
      window.addEventListener('resize', () => game?.resize(), { passive: true });
      window.TheVoidDebrisGame = {
        start: () => game.start(),
        restart: () => game.start(),
        getResult: () => game.result,
        getConfig: () => ({ ...CONFIG })
      };
      setTimeout(() => {
        ui.loading.classList.remove('active');
        game.start();
      }, 280);
    } catch (error) {
      console.error(error);
      ui.loadingCopy.textContent = 'Unable to initialise flight assets. Reload the page and try again.';
      ui.loadingCopy.style.color = '#ff7b83';
    }
  }

  initialise();
})();
