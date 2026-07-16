(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const TAU = Math.PI * 2;

  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const huntShell = $("#huntShell");
  const hud = $("#hud");
  const objectivePanel = $("#objectivePanel");
  const objectiveText = $("#objectiveText");
  const objectiveHint = $("#objectiveHint");
  const timerText = $("#timerText");
  const timerBar = $("#timerBar");
  const timerWrap = $(".timer-wrap");
  const suitPips = $$("#suitPips i");
  const ammoText = $("#ammoText");
  const ammoPips = $("#ammoPips");
  const tracker = $("#tracker");
  const trackerDistance = $("#trackerDistance");
  const trackerBlip = $("#trackerBlip");
  const interactionPrompt = $("#interactionPrompt");
  const interactionLabel = $("#interactionLabel");
  const interactionProgress = $("#interactionProgress");
  const interactionKey = $("#interactionKey");
  const messageFlash = $("#messageFlash");
  const roomTitle = $("#roomTitle");
  const roomTitleText = $("#roomTitleText");
  const damageFlash = $("#damageFlash");
  const chargeFlash = $("#chargeFlash");
  const touchControls = $("#touchControls");
  const moveZone = $("#moveZone");
  const aimZone = $("#aimZone");
  const moveKnob = $("#moveKnob");
  const aimKnob = $("#aimKnob");
  const interactButton = $("#interactButton");
  const scannerButton = $("#scannerButton");
  const introScreen = $("#introScreen");
  const pauseScreen = $("#pauseScreen");
  const failScreen = $("#failScreen");
  const failTitle = $("#failTitle");
  const failCopy = $("#failCopy");
  const cinematicScreen = $("#cinematicScreen");
  const successScreen = $("#successScreen");
  const startButton = $("#startButton");
  const pauseButton = $("#pauseButton");
  const resumeButton = $("#resumeButton");
  const retryButton = $("#retryButton");
  const replayButton = $("#replayButton");
  const pauseRestartButton = $("#pauseRestartButton");
  const muteButton = $("#muteButton");
  const resultTime = $("#resultTime");
  const resultShots = $("#resultShots");
  const resultThruster = $("#resultThruster");

  const WORLD = { width: 2400, height: 1800 };
  const MISSION_SECONDS = 300;
  const MAX_AMMO = 12;
  const PLAYER_RADIUS = 20;
  const ALIEN_RADIUS = 30;
  const isCoarsePointer = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const returnUrl = new URLSearchParams(location.search).get("return") || "../index.html";

  for (let i = 0; i < MAX_AMMO; i += 1) ammoPips.append(document.createElement("i"));

  const walkRects = [
    { x: 120, y: 120, w: 650, h: 230, room: "CONTROL CORRIDOR" },
    { x: 750, y: 185, w: 95, h: 105 },
    { x: 805, y: 110, w: 330, h: 300, room: "EMERGENCY JUNCTION" },
    { x: 1120, y: 185, w: 80, h: 105 },
    { x: 1180, y: 120, w: 610, h: 230, room: "MAINTENANCE HALL" },
    { x: 1780, y: 185, w: 80, h: 105 },
    { x: 1830, y: 100, w: 450, h: 330, room: "POWER RELAY ROOM" },
    { x: 275, y: 330, w: 110, h: 140 },
    { x: 100, y: 450, w: 500, h: 300, room: "COOLANT ACCESS" },
    { x: 580, y: 540, w: 95, h: 115 },
    { x: 650, y: 440, w: 420, h: 300, room: "STORAGE ROOM" },
    { x: 720, y: 330, w: 125, h: 130 },
    { x: 930, y: 380, w: 110, h: 90 },
    { x: 970, y: 410, w: 300, h: 500, room: "MAINTENANCE TUNNEL" },
    { x: 1020, y: 875, w: 200, h: 110 },
    { x: 970, y: 900, w: 300, h: 70 },
    { x: 970, y: 940, w: 300, h: 420, room: "ENGINE ROOM" },
    { x: 585, y: 1095, w: 400, h: 210, room: "PORT ENGINE ACCESS" },
    { x: 1255, y: 1095, w: 400, h: 210, room: "STARBOARD ENGINE ACCESS" },
    { x: 930, y: 1110, w: 90, h: 190 },
    { x: 1220, y: 1110, w: 90, h: 190 },
    { x: 550, y: 1110, w: 100, h: 190 },
    { x: 1590, y: 1110, w: 100, h: 190 },
    { x: 145, y: 965, w: 470, h: 680, room: "PORT THRUSTER CHAMBER" },
    { x: 1625, y: 965, w: 470, h: 680, room: "STARBOARD THRUSTER CHAMBER" }
  ];

  const doors = {
    engine: { x: 985, y: 900, w: 270, h: 44, open: false, label: "ENGINE DECK BULKHEAD" },
    port: { x: 930, y: 1120, w: 55, h: 165, open: false, label: "PORT ACCESS BULKHEAD" },
    starboard: { x: 1255, y: 1120, w: 55, h: 165, open: false, label: "STARBOARD ACCESS BULKHEAD" }
  };

  const objects = {
    relay: { id: "relay", x: 2140, y: 265, radius: 74, duration: 1.8, label: "RESTORE ENGINE-DECK POWER", sprite: [1, 5] },
    recharge: { id: "recharge", x: 860, y: 610, radius: 80, duration: 2.65, label: "RECHARGE PLASMA CELLS", sprite: [0, 4] },
    engine: { id: "engine", x: 1120, y: 1285, radius: 76, duration: 2.0, label: "PRIME MANUAL THRUSTER IGNITION", sprite: [1, 2] },
    portSwitch: { id: "portSwitch", x: 535, y: 1130, radius: 74, duration: 0.8, label: "IGNITE PORT THRUSTER", sprite: [3, 4] },
    starboardSwitch: { id: "starboardSwitch", x: 1665, y: 1130, radius: 74, duration: 0.8, label: "IGNITE STARBOARD THRUSTER", sprite: [3, 4] }
  };

  const killZones = {
    port: { x: 255, y: 1370, w: 250, h: 205 },
    starboard: { x: 1735, y: 1370, w: 250, h: 205 }
  };

  const ambientLights = [
    [165, 150, "red"], [720, 150, "red"], [845, 170, "amber"], [1085, 340, "red"],
    [1220, 150, "red"], [1740, 310, "amber"], [1880, 145, "red"], [2210, 390, "blue"],
    [1010, 450, "red"], [1230, 860, "amber"], [1010, 1000, "red"], [1228, 1305, "amber"],
    [205, 1015, "red"], [2035, 1015, "red"], [310, 1530, "amber"], [1930, 1530, "amber"]
  ];

  const assets = {};
  const imageSources = {
    map: "assets/map/hunt01-map.svg",
    walk: "assets/sprites/luna-walk.png",
    aim: "assets/sprites/luna-aim.png",
    damage: "assets/sprites/luna-damage.png",
    alien: "assets/sprites/alien.png",
    interactables: "assets/images/interactables-source.png"
  };

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${url}`));
      image.src = url;
    });
  }

  class AudioManager {
    constructor() {
      this.muted = false;
      this.started = false;
      this.music = new Audio("assets/music/hunt01-theme.mp3");
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.volume = 0.48;
      this.alarm = new Audio("assets/sound-effects/emergency-alarm-loop.wav");
      this.alarm.loop = true;
      this.alarm.preload = "auto";
      this.alarm.volume = 0.055;
      this.sources = new Map();
      const names = [
        "ship-shutdown", "plasma-shot", "plasma-impact", "plasma-empty", "plasma-recharge-loop",
        "plasma-recharge-complete", "alien-stalk", "alien-charge", "alien-attack", "alien-hurt",
        "luna-hit", "door-open", "terminal-activate", "thruster-prime", "thruster-blast",
        "mission-success", "mission-fail", "footstep"
      ];
      names.forEach((name) => {
        const audio = new Audio(`assets/sound-effects/${name}.wav`);
        audio.preload = "auto";
        this.sources.set(name, audio);
      });
    }
    async start() {
      this.started = true;
      this.music.currentTime = 0;
      this.alarm.currentTime = 0;
      if (!this.muted) {
        await this.music.play().catch(() => {});
        await this.alarm.play().catch(() => {});
      }
    }
    play(name, volume = 1, rate = 1) {
      if (this.muted) return null;
      const base = this.sources.get(name);
      if (!base) return null;
      const sound = base.cloneNode();
      sound.volume = clamp(volume, 0, 1);
      sound.playbackRate = rate;
      sound.play().catch(() => {});
      return sound;
    }
    pause() {
      this.music.pause();
      this.alarm.pause();
    }
    resume() {
      if (!this.started || this.muted) return;
      this.music.play().catch(() => {});
      this.alarm.play().catch(() => {});
    }
    stop() {
      this.music.pause();
      this.alarm.pause();
      this.music.currentTime = 0;
      this.alarm.currentTime = 0;
    }
    setCinematic(active) {
      this.music.volume = active ? 0.12 : 0.48;
      this.alarm.volume = active ? 0 : 0.055;
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.muted) this.pause();
      else this.resume();
      muteButton.textContent = this.muted ? "AUDIO OFF" : "AUDIO ON";
    }
  }

  const audio = new AudioManager();

  let cssWidth = innerWidth;
  let cssHeight = innerHeight;
  let dpr = 1;
  let zoom = 1;
  const camera = { x: 390, y: 245, shake: 0 };
  const keys = new Set();
  const input = {
    moveX: 0, moveY: 0,
    aimX: 1, aimY: 0,
    mouseX: innerWidth * 0.65, mouseY: innerHeight * 0.5,
    mouseActive: false, fireHeld: false,
    movePointer: null, aimPointer: null,
    moveOrigin: null, aimOrigin: null,
    aimMagnitude: 0, aimFireSince: 0
  };

  let mode = "intro";
  let phase = 0;
  let missionTime = MISSION_SECONDS;
  let missionEndAt = 0;
  let pauseStartedAt = 0;
  let cinematicTimeout = 0;
  let elapsed = 0;
  let lastFrame = performance.now();
  let animationClock = 0;
  let objectivePulse = 0;
  let interaction = null;
  let nearestInteraction = null;
  let flashTimer = 0;
  let scannerPulse = 0;
  let scannerCooldown = 0;
  let footstepCooldown = 0;
  let alienVocalCooldown = 5;
  let shotsFired = 0;
  let usedThruster = "PORT";
  let currentRoom = "";
  let roomTitleTimer = 0;
  let roomTitleHideTimer = 0;
  let pendingCinematic = 0;
  let pathRefresh = 0;

  const player = {
    x: 390, y: 245, vx: 0, vy: 0,
    health: 3, ammo: MAX_AMMO, speed: 205,
    aimAngle: 0, direction: 3,
    fireCooldown: 0, emptyCooldown: 0,
    invulnerable: 0, damageAnim: 0,
    rechargeCooldown: 0
  };

  const alien = {
    x: 1510, y: 235, vx: 0, vy: 0,
    state: "stalking", awake: false,
    stun: 0, slow: 0, attackCooldown: 0,
    chargeCooldown: 4.2, chargeTime: 0,
    chargeX: 0, chargeY: 0,
    path: [], pathIndex: 0,
    killZoneTime: 0,
    alignedSide: null
  };

  const projectiles = [];
  const particles = [];
  const pulses = [];

  function resize() {
    cssWidth = innerWidth;
    cssHeight = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    zoom = clamp(Math.min(cssWidth / 1080, cssHeight / 720), 0.72, 1.15);
  }

  function pointInRect(x, y, rect, margin = 0) {
    return x >= rect.x + margin && x <= rect.x + rect.w - margin && y >= rect.y + margin && y <= rect.y + rect.h - margin;
  }

  function isDoorBlocking(x, y) {
    return Object.values(doors).some((door) => !door.open && pointInRect(x, y, door, 0));
  }

  function isInsideWalkUnion(x, y) {
    return walkRects.some((rect) => pointInRect(x, y, rect, 0));
  }

  function isWalkable(x, y, radius = 0) {
    if (x < radius || y < radius || x > WORLD.width - radius || y > WORLD.height - radius) return false;
    const samples = radius > 0
      ? [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.7,radius*.7],[-radius*.7,radius*.7],[radius*.7,-radius*.7],[-radius*.7,-radius*.7]]
      : [[0,0]];
    return samples.every(([ox, oy]) => isInsideWalkUnion(x + ox, y + oy) && !isDoorBlocking(x + ox, y + oy));
  }

  function moveCircle(entity, dx, dy, radius) {
    if (isWalkable(entity.x + dx, entity.y, radius)) entity.x += dx;
    else entity.vx = 0;
    if (isWalkable(entity.x, entity.y + dy, radius)) entity.y += dy;
    else entity.vy = 0;
  }

  function screenToWorld(x, y) {
    return {
      x: (x - cssWidth / 2) / zoom + camera.x,
      y: (y - cssHeight / 2) / zoom + camera.y
    };
  }

  function worldToScreen(x, y) {
    return {
      x: (x - camera.x) * zoom + cssWidth / 2,
      y: (y - camera.y) * zoom + cssHeight / 2
    };
  }

  function resetMission() {
    phase = 0;
    missionTime = MISSION_SECONDS;
    missionEndAt = 0;
    pauseStartedAt = 0;
    if (cinematicTimeout) clearTimeout(cinematicTimeout);
    cinematicTimeout = 0;
    elapsed = 0;
    animationClock = 0;
    objectivePulse = 0;
    interaction = null;
    nearestInteraction = null;
    scannerPulse = 0;
    scannerCooldown = 0;
    footstepCooldown = 0;
    alienVocalCooldown = 5;
    shotsFired = 0;
    usedThruster = "PORT";
    currentRoom = "";
    if (roomTitleTimer) clearTimeout(roomTitleTimer);
    if (roomTitleHideTimer) clearTimeout(roomTitleHideTimer);
    roomTitleTimer = 0;
    roomTitleHideTimer = 0;
    roomTitle.classList.remove("is-visible");
    roomTitle.hidden = true;
    pendingCinematic = 0;
    pathRefresh = 0;
    Object.assign(player, {
      x: 390, y: 245, vx: 0, vy: 0, health: 3, ammo: MAX_AMMO,
      aimAngle: 0, direction: 3, fireCooldown: 0, emptyCooldown: 0,
      invulnerable: 0, damageAnim: 0, rechargeCooldown: 0
    });
    Object.assign(alien, {
      x: 1510, y: 235, vx: 0, vy: 0, state: "stalking", awake: false,
      stun: 0, slow: 0, recover: 0, attackCooldown: 0, chargeCooldown: 5.8,
      chargeTime: 0, chargeX: 0, chargeY: 0, path: [], pathIndex: 0,
      killZoneTime: 0, alignedSide: null
    });
    doors.engine.open = false;
    doors.port.open = false;
    doors.starboard.open = false;
    projectiles.length = 0;
    particles.length = 0;
    pulses.length = 0;
    camera.x = player.x;
    camera.y = player.y;
    camera.shake = 0;
    updateObjective();
    updateHud();
    clearInput();
  }

  async function startMission() {
    resetMission();
    mode = "playing";
    missionEndAt = performance.now() + MISSION_SECONDS * 1000;
    introScreen.hidden = true;
    pauseScreen.hidden = true;
    failScreen.hidden = true;
    cinematicScreen.hidden = true;
    successScreen.hidden = true;
    hud.hidden = false;
    objectivePanel.hidden = false;
    tracker.hidden = false;
    touchControls.hidden = !isCoarsePointer;
    interactionKey.textContent = isCoarsePointer ? "◎" : "E";
    await audio.start();
    audio.play("ship-shutdown", 0.74);
    flashMessage("MAIN ENGINES OFFLINE // INTERNAL SHUTDOWN DETECTED", 3.2);
    currentRoom = getRoomName(player.x, player.y) || "CONTROL CORRIDOR";
    showRoomTitle(currentRoom, 1.9);
  }

  function pauseMission() {
    if (mode !== "playing") return;
    mode = "paused";
    pauseStartedAt = performance.now();
    pauseScreen.hidden = false;
    audio.pause();
    clearInput();
  }

  function resumeMission() {
    if (mode !== "paused") return;
    mode = "playing";
    if (pauseStartedAt) missionEndAt += performance.now() - pauseStartedAt;
    pauseStartedAt = 0;
    pauseScreen.hidden = true;
    audio.resume();
  }

  function failMission(reason) {
    if (mode !== "playing") return;
    mode = "failed";
    clearInput();
    interaction = null;
    audio.pause();
    audio.play("mission-fail", 0.7);
    failTitle.textContent = reason === "damage" ? "SUIT SIGNAL LOST" : "MISSION WINDOW EXPIRED";
    failCopy.textContent = reason === "damage"
      ? "The organism breached Luna’s suit before the engines could be restored."
      : "The engines remain offline. The organism vanishes deeper into the vessel.";
    failScreen.hidden = false;
    touchControls.hidden = true;
  }

  function beginSuccess(side) {
    if (mode !== "playing") return;
    mode = "cinematic";
    usedThruster = side.toUpperCase();
    clearInput();
    interaction = null;
    pendingCinematic = 5.0;
    if (cinematicTimeout) clearTimeout(cinematicTimeout);
    cinematicTimeout = window.setTimeout(() => {
      if (mode === "cinematic") finishSuccess();
    }, 5000);
    cinematicScreen.hidden = false;
    touchControls.hidden = true;
    hud.hidden = true;
    objectivePanel.hidden = true;
    tracker.hidden = true;
    audio.setCinematic(true);
    audio.play("thruster-blast", 0.88);
    camera.shake = 42;
  }

  function finishSuccess() {
    mode = "success";
    if (cinematicTimeout) clearTimeout(cinematicTimeout);
    cinematicTimeout = 0;
    cinematicScreen.hidden = true;
    successScreen.hidden = false;
    audio.stop();
    audio.play("mission-success", 0.75);
    resultTime.textContent = formatTime(missionTime);
    resultShots.textContent = String(shotsFired);
    resultThruster.textContent = usedThruster;
    try {
      const best = Number(localStorage.getItem("theVoidHunt01Best") || 0);
      if (missionTime > best) localStorage.setItem("theVoidHunt01Best", String(missionTime));
    } catch {}
  }

  function updateObjective() {
    const directives = [
      ["Reach the Power Relay Room", "Restore engine-deck power before the organism closes in."],
      ["Prime the thrusters in the Engine Room", "The central bulkhead is open. Reach the manual ignition terminal."],
      ["Lure the organism into either thruster chamber", "Use plasma to control its charge, then ignite the aligned thruster."],
      ["Target incinerated", "Main propulsion restored."]
    ];
    const [title, hint] = directives[Math.min(phase, directives.length - 1)];
    objectiveText.textContent = title;
    objectiveHint.textContent = hint;
    objectivePulse = 1;
  }

  function updateHud() {
    timerText.textContent = formatTime(missionTime);
    timerBar.style.transform = `scaleX(${clamp(missionTime / MISSION_SECONDS, 0, 1)})`;
    timerWrap.classList.toggle("is-critical", missionTime <= 60);
    ammoText.textContent = `${player.ammo} / ${MAX_AMMO}`;
    [...ammoPips.children].forEach((pip, index) => pip.classList.toggle("is-empty", index >= player.ammo));
    suitPips.forEach((pip, index) => pip.classList.toggle("is-lost", index >= player.health));
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function flashMessage(text, duration = 2) {
    messageFlash.textContent = text;
    messageFlash.hidden = false;
    flashTimer = duration;
  }

  function showRoomTitle(name, duration = 1.7) {
    if (!name) return;
    if (roomTitleTimer) clearTimeout(roomTitleTimer);
    if (roomTitleHideTimer) clearTimeout(roomTitleHideTimer);
    roomTitleText.textContent = name;
    roomTitle.hidden = false;
    roomTitle.classList.remove("is-visible");
    requestAnimationFrame(() => roomTitle.classList.add("is-visible"));
    roomTitleTimer = window.setTimeout(() => {
      roomTitle.classList.remove("is-visible");
      roomTitleHideTimer = window.setTimeout(() => { roomTitle.hidden = true; }, 360);
    }, duration * 1000);
  }

  function clearInput() {
    input.moveX = 0;
    input.moveY = 0;
    input.fireHeld = false;
    input.movePointer = null;
    input.aimPointer = null;
    input.moveOrigin = null;
    input.aimOrigin = null;
    moveKnob.style.transform = "translate(0px, 0px)";
    aimKnob.style.transform = "translate(0px, 0px)";
    keys.clear();
  }

  function getRoomName(x, y) {
    const matches = walkRects.filter((rect) => rect.room && pointInRect(x, y, rect, 4));
    return matches.length ? matches[matches.length - 1].room : null;
  }

  function openDoor(door) {
    if (door.open) return;
    door.open = true;
    audio.play("door-open", 0.6);
    addBurst(door.x + door.w / 2, door.y + door.h / 2, "spark", 18);
    pathRefresh = 0;
  }

  function getAvailableInteractions() {
    const list = [];
    if (phase === 0) list.push(objects.relay);
    if (player.ammo < MAX_AMMO && player.rechargeCooldown <= 0) list.push(objects.recharge);
    if (phase === 1) list.push(objects.engine);
    if (phase === 2) {
      list.push(objects.portSwitch, objects.starboardSwitch);
    }
    return list;
  }

  function isAlienInZone(side) {
    return pointInRect(alien.x, alien.y, killZones[side], ALIEN_RADIUS * 0.4);
  }

  function interactionDisplayLabel(object) {
    if (object.id === "portSwitch" && !isAlienInZone("port")) return "TARGET NOT ALIGNED // PORT";
    if (object.id === "starboardSwitch" && !isAlienInZone("starboard")) return "TARGET NOT ALIGNED // STARBOARD";
    return object.label;
  }

  function findNearestInteraction() {
    let nearest = null;
    let best = Infinity;
    for (const object of getAvailableInteractions()) {
      const d = Math.hypot(player.x - object.x, player.y - object.y);
      if (d <= object.radius && d < best) {
        nearest = object;
        best = d;
      }
    }
    nearestInteraction = nearest;
  }

  function tryInteract() {
    if (mode !== "playing" || interaction || !nearestInteraction) return;
    const object = nearestInteraction;
    if ((object.id === "portSwitch" && !isAlienInZone("port")) || (object.id === "starboardSwitch" && !isAlienInZone("starboard"))) {
      flashMessage("THRUSTER INTERLOCK // BIOLOGICAL TARGET NOT ALIGNED", 1.4);
      audio.play("plasma-empty", 0.35, 0.7);
      return;
    }
    interaction = { object, elapsed: 0, startX: player.x, startY: player.y, loopSound: null };
    if (object.id === "recharge") interaction.loopSound = audio.play("plasma-recharge-loop", 0.42);
  }

  function cancelInteraction(message = "") {
    if (!interaction) return;
    if (interaction.loopSound) {
      interaction.loopSound.pause();
      interaction.loopSound.currentTime = 0;
    }
    interaction = null;
    interactionProgress.style.width = "0%";
    if (message) flashMessage(message, 1.1);
  }

  function completeInteraction(object) {
    if (object.id === "relay") {
      phase = 1;
      openDoor(doors.engine);
      audio.play("terminal-activate", 0.6);
      flashMessage("ENGINE-DECK POWER RESTORED // CENTRAL BULKHEAD OPEN", 2.2);
      updateObjective();
    } else if (object.id === "recharge") {
      player.ammo = MAX_AMMO;
      player.rechargeCooldown = 1.2;
      audio.play("plasma-recharge-complete", 0.58);
      addBurst(object.x, object.y, "plasma", 24);
      flashMessage("PLASMA CELLS FULLY CHARGED", 1.4);
    } else if (object.id === "engine") {
      phase = 2;
      openDoor(doors.port);
      openDoor(doors.starboard);
      audio.play("thruster-prime", 0.72);
      flashMessage("BOTH THRUSTERS ARMED // LURE TARGET INTO EITHER CHAMBER", 2.7);
      updateObjective();
    } else if (object.id === "portSwitch") {
      if (isAlienInZone("port")) beginSuccess("port");
      else flashMessage("PORT TARGET ALIGNMENT LOST", 1.3);
    } else if (object.id === "starboardSwitch") {
      if (isAlienInZone("starboard")) beginSuccess("starboard");
      else flashMessage("STARBOARD TARGET ALIGNMENT LOST", 1.3);
    }
  }

  function updateInteraction(dt, moveMagnitude) {
    if (!interaction) return;
    const object = interaction.object;
    const d = Math.hypot(player.x - object.x, player.y - object.y);
    if (d > object.radius + 10 || moveMagnitude > 0.24) {
      cancelInteraction("INTERACTION INTERRUPTED");
      return;
    }
    if ((object.id === "portSwitch" && !isAlienInZone("port")) || (object.id === "starboardSwitch" && !isAlienInZone("starboard"))) {
      cancelInteraction("TARGET ALIGNMENT LOST");
      return;
    }
    interaction.elapsed += dt;
    const progress = clamp(interaction.elapsed / object.duration, 0, 1);
    interactionProgress.style.width = `${progress * 100}%`;
    if (progress >= 1) {
      if (interaction.loopSound) interaction.loopSound.pause();
      interaction = null;
      interactionProgress.style.width = "0%";
      completeInteraction(object);
    }
  }

  function pulseScanner() {
    if (mode !== "playing" || scannerCooldown > 0) return;
    scannerCooldown = 4.5;
    scannerPulse = 1.2;
    pulses.push({ x: player.x, y: player.y, radius: 0, life: 1.2, max: 1.2 });
    chargeFlash.classList.remove("is-active");
    void chargeFlash.offsetWidth;
    chargeFlash.classList.add("is-active");
    flashMessage(`BIOLOGICAL CONTACT // ${Math.round(distance(player, alien) / 5)} M`, 1.1);
  }

  function updateInputAim() {
    if (input.mouseActive && !isCoarsePointer) {
      const point = screenToWorld(input.mouseX, input.mouseY);
      const dx = point.x - player.x;
      const dy = point.y - player.y;
      const length = Math.hypot(dx, dy) || 1;
      input.aimX = dx / length;
      input.aimY = dy / length;
    }
    player.aimAngle = Math.atan2(input.aimY, input.aimX);
    if (Math.abs(input.aimX) > Math.abs(input.aimY)) player.direction = input.aimX < 0 ? 1 : 3;
    else player.direction = input.aimY < 0 ? 2 : 0;
  }

  function tryFire() {
    if (mode !== "playing" || player.fireCooldown > 0 || interaction) return;
    if (player.ammo <= 0) {
      if (player.emptyCooldown <= 0) {
        audio.play("plasma-empty", 0.52);
        player.emptyCooldown = 0.5;
        flashMessage("PLASMA CELLS DEPLETED // RECHARGE IN STORAGE", 1.25);
      }
      return;
    }
    player.ammo -= 1;
    shotsFired += 1;
    player.fireCooldown = 0.235;
    alien.awake = true;
    const dx = Math.cos(player.aimAngle);
    const dy = Math.sin(player.aimAngle);
    projectiles.push({
      x: player.x + dx * 32,
      y: player.y + dy * 32,
      vx: dx * 820,
      vy: dy * 820,
      life: 0.92,
      radius: 7
    });
    audio.play("plasma-shot", 0.54, 0.96 + Math.random() * 0.08);
    addBurst(player.x + dx * 34, player.y + dy * 34, "plasma", 7);
  }

  function addBurst(x, y, type, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = type === "slime" ? 18 + Math.random() * 55 : 40 + Math.random() * 155;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (type === "slime" ? 1.6 : 0.35) + Math.random() * (type === "slime" ? 1.8 : 0.6),
        maxLife: 1,
        size: type === "slime" ? 5 + Math.random() * 12 : 2 + Math.random() * 5,
        type
      });
    }
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const shot = projectiles[i];
      shot.life -= dt;
      const oldX = shot.x;
      const oldY = shot.y;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (Math.random() < 0.8) particles.push({ x: oldX, y: oldY, vx: 0, vy: 0, life: 0.22, maxLife: 0.22, size: 3, type: "plasma" });
      if (!isWalkable(shot.x, shot.y, 2) || shot.life <= 0) {
        addBurst(shot.x, shot.y, "spark", 5);
        audio.play("plasma-impact", 0.18, 1.2);
        projectiles.splice(i, 1);
        continue;
      }
      if (alien.awake && Math.hypot(shot.x - alien.x, shot.y - alien.y) < ALIEN_RADIUS + shot.radius) {
        alien.stun = Math.max(alien.stun, 1.65);
        alien.slow = Math.max(alien.slow, 3.4);
        alien.recover = Math.max(alien.recover, 0.45);
        alien.chargeTime = 0;
        alien.state = "stunned";
        const length = Math.hypot(shot.vx, shot.vy) || 1;
        moveCircle(alien, (shot.vx / length) * 52, (shot.vy / length) * 52, ALIEN_RADIUS);
        addBurst(alien.x, alien.y, "plasma", 18);
        addBurst(alien.x, alien.y, "slime", 8);
        audio.play("alien-hurt", 0.52, 0.9 + Math.random() * 0.18);
        projectiles.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.08, dt);
      particle.vy *= Math.pow(0.08, dt);
      if (particle.life <= 0) particles.splice(i, 1);
    }
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const pulse = pulses[i];
      pulse.life -= dt;
      pulse.radius += dt * 700;
      if (pulse.life <= 0) pulses.splice(i, 1);
    }
  }

  function lineWalkable(ax, ay, bx, by, radius = 12) {
    const dist = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(2, Math.ceil(dist / 28));
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (!isWalkable(lerp(ax, bx, t), lerp(ay, by, t), radius)) return false;
    }
    return true;
  }

  const GRID = 50;
  const GRID_COLS = Math.ceil(WORLD.width / GRID);
  const GRID_ROWS = Math.ceil(WORLD.height / GRID);
  const nodeKey = (x, y) => y * GRID_COLS + x;

  class MinHeap {
    constructor() { this.data = []; }
    push(item) {
      const data = this.data;
      data.push(item);
      let index = data.length - 1;
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (data[parent].f <= item.f) break;
        data[index] = data[parent];
        index = parent;
      }
      data[index] = item;
    }
    pop() {
      const data = this.data;
      if (!data.length) return null;
      const root = data[0];
      const last = data.pop();
      if (data.length && last) {
        let index = 0;
        while (true) {
          let left = index * 2 + 1;
          let right = left + 1;
          if (left >= data.length) break;
          let child = right < data.length && data[right].f < data[left].f ? right : left;
          if (data[child].f >= last.f) break;
          data[index] = data[child];
          index = child;
        }
        data[index] = last;
      }
      return root;
    }
    get length() { return this.data.length; }
  }

  function nearestPassableCell(x, y) {
    const startX = clamp(Math.floor(x / GRID), 0, GRID_COLS - 1);
    const startY = clamp(Math.floor(y / GRID), 0, GRID_ROWS - 1);
    if (isWalkable(startX * GRID + GRID / 2, startY * GRID + GRID / 2, 20)) return [startX, startY];
    for (let radius = 1; radius < 8; radius += 1) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          const gx = startX + ox;
          const gy = startY + oy;
          if (gx < 0 || gy < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) continue;
          if (isWalkable(gx * GRID + GRID / 2, gy * GRID + GRID / 2, 20)) return [gx, gy];
        }
      }
    }
    return [startX, startY];
  }

  function findPath(startX, startY, endX, endY) {
    const [sx, sy] = nearestPassableCell(startX, startY);
    const [ex, ey] = nearestPassableCell(endX, endY);
    const startKey = nodeKey(sx, sy);
    const endKey = nodeKey(ex, ey);
    const open = new MinHeap();
    const g = new Map([[startKey, 0]]);
    const came = new Map();
    open.push({ x: sx, y: sy, f: 0 });
    const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    let iterations = 0;
    while (open.length && iterations < 3000) {
      iterations += 1;
      const current = open.pop();
      const currentKey = nodeKey(current.x, current.y);
      if (currentKey === endKey) {
        const path = [];
        let key = endKey;
        while (key !== startKey && came.has(key)) {
          const x = key % GRID_COLS;
          const y = Math.floor(key / GRID_COLS);
          path.push({ x: x * GRID + GRID / 2, y: y * GRID + GRID / 2 });
          key = came.get(key);
        }
        path.reverse();
        return path;
      }
      const baseG = g.get(currentKey) ?? Infinity;
      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue;
        const wx = nx * GRID + GRID / 2;
        const wy = ny * GRID + GRID / 2;
        if (!isWalkable(wx, wy, 20)) continue;
        if (dx && dy) {
          const ax = (current.x + dx) * GRID + GRID / 2;
          const ay = current.y * GRID + GRID / 2;
          const bx = current.x * GRID + GRID / 2;
          const by = (current.y + dy) * GRID + GRID / 2;
          if (!isWalkable(ax, ay, 20) || !isWalkable(bx, by, 20)) continue;
        }
        const nextKey = nodeKey(nx, ny);
        const tentative = baseG + (dx && dy ? 1.414 : 1);
        if (tentative >= (g.get(nextKey) ?? Infinity)) continue;
        came.set(nextKey, currentKey);
        g.set(nextKey, tentative);
        const heuristic = Math.hypot(ex - nx, ey - ny);
        open.push({ x: nx, y: ny, f: tentative + heuristic });
      }
    }
    return [];
  }

  function damagePlayer() {
    if (player.invulnerable > 0 || mode !== "playing") return;
    player.health -= 1;
    player.invulnerable = 1.25;
    player.damageAnim = 0.7;
    camera.shake = 18;
    cancelInteraction();
    damageFlash.classList.remove("is-active");
    void damageFlash.offsetWidth;
    damageFlash.classList.add("is-active");
    audio.play("luna-hit", 0.7);
    const dx = player.x - alien.x;
    const dy = player.y - alien.y;
    const len = Math.hypot(dx, dy) || 1;
    moveCircle(player, (dx / len) * 68, (dy / len) * 68, PLAYER_RADIUS);
    moveCircle(alien, (-dx / len) * 40, (-dy / len) * 40, ALIEN_RADIUS);
    alien.attackCooldown = 1.85;
    alien.recover = Math.max(alien.recover, 1.05);
    if (player.health <= 0) failMission("damage");
  }

  function updateAlien(dt) {
    if (!alien.awake && elapsed > 6.5) {
      alien.awake = true;
      audio.play("alien-stalk", 0.55);
      flashMessage("BIOLOGICAL CONTACT MOVING THROUGH MAINTENANCE", 1.8);
    }
    if (!alien.awake) return;

    alien.stun = Math.max(0, alien.stun - dt);
    alien.slow = Math.max(0, alien.slow - dt);
    alien.attackCooldown = Math.max(0, alien.attackCooldown - dt);
    alien.chargeCooldown = Math.max(0, alien.chargeCooldown - dt);
    alien.recover = Math.max(0, alien.recover - dt);
    alienVocalCooldown -= dt;
    if (alienVocalCooldown <= 0) {
      audio.play("alien-stalk", 0.22 + Math.min(0.24, 180 / Math.max(180, distance(player, alien))));
      alienVocalCooldown = 5 + Math.random() * 5;
    }

    if (alien.stun > 0) {
      alien.state = "stunned";
      alien.vx *= Math.pow(0.03, dt);
      alien.vy *= Math.pow(0.03, dt);
      return;
    }
    if (alien.recover > 0) {
      alien.state = "stalking";
      alien.vx *= Math.pow(0.12, dt);
      alien.vy *= Math.pow(0.12, dt);
      return;
    }

    const dxToPlayer = player.x - alien.x;
    const dyToPlayer = player.y - alien.y;
    const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer) || 1;

    if (alien.chargeTime > 0) {
      alien.state = "charging";
      alien.chargeTime -= dt;
      alien.vx = alien.chargeX * 275;
      alien.vy = alien.chargeY * 275;
      moveCircle(alien, alien.vx * dt, alien.vy * dt, ALIEN_RADIUS);
      if (Math.random() < dt * 20) particles.push({ x: alien.x, y: alien.y + 20, vx: -alien.vx * .05, vy: -alien.vy * .05, life: 1.1, maxLife: 1.1, size: 9 + Math.random() * 8, type: "slime" });
      if (Math.hypot(player.x - alien.x, player.y - alien.y) < 58) {
        alien.state = "attacking";
        audio.play("alien-attack", 0.65);
        damagePlayer();
        alien.chargeTime = 0;
      } else if (alien.chargeTime <= 0) {
        alien.recover = 0.95;
      }
      return;
    }

    const canCharge = (phase > 0 || elapsed > 24) && alien.chargeCooldown <= 0 && distToPlayer > 165 && distToPlayer < 510 && lineWalkable(alien.x, alien.y, player.x, player.y, 18);
    if (canCharge) {
      alien.chargeTime = 0.72;
      alien.chargeCooldown = 6.4 + Math.random() * 3.2;
      alien.chargeX = dxToPlayer / distToPlayer;
      alien.chargeY = dyToPlayer / distToPlayer;
      alien.state = "charging";
      audio.play("alien-charge", 0.68);
      chargeFlash.classList.remove("is-active");
      void chargeFlash.offsetWidth;
      chargeFlash.classList.add("is-active");
      return;
    }

    if (distToPlayer < 58 && alien.attackCooldown <= 0) {
      alien.state = "attacking";
      alien.attackCooldown = 1.65;
      alien.recover = 0.72;
      audio.play("alien-attack", 0.65);
      damagePlayer();
      return;
    }

    alien.state = "stalking";
    pathRefresh -= dt;
    if (lineWalkable(alien.x, alien.y, player.x, player.y, 18)) {
      alien.path = [{ x: player.x, y: player.y }];
      alien.pathIndex = 0;
    } else if (pathRefresh <= 0 || alien.pathIndex >= alien.path.length) {
      alien.path = findPath(alien.x, alien.y, player.x, player.y);
      alien.pathIndex = 0;
      pathRefresh = 0.38;
    }

    let target = alien.path[alien.pathIndex] || player;
    let tx = target.x - alien.x;
    let ty = target.y - alien.y;
    let tlen = Math.hypot(tx, ty) || 1;
    if (tlen < 42 && alien.pathIndex < alien.path.length - 1) {
      alien.pathIndex += 1;
      target = alien.path[alien.pathIndex];
      tx = target.x - alien.x;
      ty = target.y - alien.y;
      tlen = Math.hypot(tx, ty) || 1;
    }
    let speed = phase === 0 ? 74 : phase === 1 ? 96 : 118;
    if (!lineWalkable(alien.x, alien.y, player.x, player.y, 18)) speed *= 0.78;
    if (alien.slow > 0) speed *= 0.34;
    if (phase === 2 && alien.alignedSide && alien.killZoneTime < 2.45) speed *= 0.16;
    alien.vx = (tx / tlen) * speed;
    alien.vy = (ty / tlen) * speed;
    moveCircle(alien, alien.vx * dt, alien.vy * dt, ALIEN_RADIUS);
    if (Math.random() < dt * 5) particles.push({ x: alien.x, y: alien.y + 24, vx: (Math.random() - .5) * 18, vy: (Math.random() - .5) * 18, life: 1.6, maxLife: 1.6, size: 8 + Math.random() * 11, type: "slime" });

    const inPort = isAlienInZone("port");
    const inStarboard = isAlienInZone("starboard");
    const newSide = inPort ? "port" : inStarboard ? "starboard" : null;
    if (newSide && newSide !== alien.alignedSide && phase === 2) {
      alien.killZoneTime = 0;
      flashMessage(`TARGET ALIGNED // ${newSide.toUpperCase()} IGNITION SWITCH LIVE`, 1.45);
    }
    alien.alignedSide = newSide;
    alien.killZoneTime = newSide ? alien.killZoneTime + dt : 0;
  }

  function updatePlayer(dt) {
    let moveX = input.moveX;
    let moveY = input.moveY;
    if (!isCoarsePointer) {
      moveX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      moveY = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    }
    const moveLength = Math.hypot(moveX, moveY);
    if (moveLength > 1) { moveX /= moveLength; moveY /= moveLength; }
    const speed = player.speed * (interaction ? 0 : 1);
    player.vx = moveX * speed;
    player.vy = moveY * speed;
    moveCircle(player, player.vx * dt, player.vy * dt, PLAYER_RADIUS);

    if (moveLength > 0.08) {
      footstepCooldown -= dt;
      if (footstepCooldown <= 0) {
        audio.play("footstep", 0.12, 0.92 + Math.random() * .16);
        footstepCooldown = 0.38;
      }
    } else footstepCooldown = 0;

    updateInputAim();
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.emptyCooldown = Math.max(0, player.emptyCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.damageAnim = Math.max(0, player.damageAnim - dt);
    player.rechargeCooldown = Math.max(0, player.rechargeCooldown - dt);
    if (input.fireHeld) tryFire();
    return moveLength;
  }

  function updateTracker() {
    const dx = alien.x - player.x;
    const dy = alien.y - player.y;
    const dist = Math.hypot(dx, dy);
    trackerDistance.textContent = `${Math.round(dist / 5)} M`;
    const angle = Math.atan2(dy, dx) - player.aimAngle;
    const radius = Math.min(15, dist / 45);
    trackerBlip.style.left = `${50 + Math.cos(angle) * radius}%`;
    trackerBlip.style.top = `${50 + Math.sin(angle) * radius}%`;
    trackerBlip.style.opacity = alien.awake ? "1" : ".15";
  }

  function updateInteractionPrompt() {
    findNearestInteraction();
    if (interaction) {
      interactionPrompt.hidden = false;
      interactionLabel.textContent = interaction.object.label;
      return;
    }
    if (nearestInteraction) {
      interactionPrompt.hidden = false;
      interactionLabel.textContent = interactionDisplayLabel(nearestInteraction);
      interactionProgress.style.width = "0%";
    } else {
      interactionPrompt.hidden = true;
      interactionProgress.style.width = "0%";
    }
  }

  function update(dt) {
    animationClock += dt;
    if (mode === "cinematic") {
      pendingCinematic -= dt;
      if (pendingCinematic <= 0) finishSuccess();
      return;
    }
    if (mode !== "playing") return;

    elapsed += dt;
    missionTime = Math.max(0, (missionEndAt - performance.now()) / 1000);
    if (missionTime <= 0) {
      missionTime = 0;
      updateHud();
      failMission("time");
      return;
    }
    scannerCooldown = Math.max(0, scannerCooldown - dt);
    scannerPulse = Math.max(0, scannerPulse - dt);
    objectivePulse = Math.max(0, objectivePulse - dt * 2);
    if (flashTimer > 0) {
      flashTimer -= dt;
      if (flashTimer <= 0) messageFlash.hidden = true;
    }

    const moveMagnitude = updatePlayer(dt);
    updateAlien(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateInteractionPrompt();
    updateInteraction(dt, moveMagnitude);
    updateTracker();
    updateHud();

    const room = getRoomName(player.x, player.y);
    if (room && room !== currentRoom) {
      currentRoom = room;
      showRoomTitle(room);
    }

    const cameraEase = 1 - Math.pow(0.0008, dt);
    camera.x = lerp(camera.x, player.x + input.aimX * 70, cameraEase);
    camera.y = lerp(camera.y, player.y + input.aimY * 45, cameraEase);
    const viewHalfW = cssWidth / (2 * zoom);
    const viewHalfH = cssHeight / (2 * zoom);
    camera.x = clamp(camera.x, viewHalfW, WORLD.width - viewHalfW);
    camera.y = clamp(camera.y, viewHalfH, WORLD.height - viewHalfH);
    camera.shake = Math.max(0, camera.shake - dt * 42);
  }

  function drawDoor(door) {
    ctx.save();
    if (door.open) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#68d7ff";
      ctx.lineWidth = 5;
      ctx.strokeRect(door.x, door.y, door.w, door.h);
    } else {
      ctx.fillStyle = "#0c1014";
      ctx.strokeStyle = "#a74a31";
      ctx.lineWidth = 8;
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = "rgba(255,70,43,.65)";
      const horizontal = door.w > door.h;
      if (horizontal) {
        for (let x = door.x + 20; x < door.x + door.w - 12; x += 42) ctx.fillRect(x, door.y + door.h / 2 - 3, 22, 6);
      } else {
        for (let y = door.y + 16; y < door.y + door.h - 12; y += 34) ctx.fillRect(door.x + door.w / 2 - 3, y, 6, 18);
      }
    }
    ctx.restore();
  }

  function drawInteractableSprite(object, active = true) {
    const image = assets.interactables;
    const size = object.id === "recharge" ? 78 : object.id.includes("Switch") ? 66 : 76;
    if (image) {
      const [row, col] = object.sprite;
      const sourceW = image.width / 8;
      const sourceH = image.height / 4;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = active ? 0.88 : 0.42;
      ctx.drawImage(image, col * sourceW, row * sourceH, sourceW, sourceH, object.x - size / 2, object.y - size / 2, size, size);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = active ? "#1588a8" : "#30383d";
      ctx.strokeStyle = "#8eeaff";
      ctx.lineWidth = 4;
      ctx.fillRect(object.x - 28, object.y - 28, 56, 56);
      ctx.strokeRect(object.x - 28, object.y - 28, 56, 56);
      ctx.restore();
    }
    const pulse = 0.5 + Math.sin(animationClock * 4 + object.x) * 0.25;
    ctx.save();
    ctx.strokeStyle = active ? `rgba(74,213,255,${pulse})` : "rgba(120,130,135,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.radius * .58, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const nearby = distance(player, object) < 250;
    if (active && nearby) {
      const currentObjective = (object.id === "relay" && phase === 0) || (object.id === "engine" && phase === 1) || (object.id.includes("Switch") && phase === 2);
      const label = object.id === "recharge" ? "PLASMA RECHARGE" : object.id === "relay" ? "POWER RELAY" : object.id === "engine" ? "THRUSTER CONTROL" : object.id === "portSwitch" ? "PORT IGNITION" : "STARBOARD IGNITION";
      const accent = currentObjective ? "255,174,57" : "87,207,255";
      ctx.save();
      ctx.font = "700 15px system-ui";
      ctx.textAlign = "center";
      const width = ctx.measureText(label).width + 30;
      const y = object.y - size * .72 - 18;
      ctx.fillStyle = "rgba(3,10,14,.82)";
      ctx.strokeStyle = `rgba(${accent},.72)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(object.x - width / 2, y - 20, width, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = currentObjective ? "#ffe4b8" : "#c9f2ff";
      ctx.fillText(label, object.x, y);
      ctx.restore();
    }
  }

  function drawKillZone(zone, side) {
    if (phase < 2) return;
    const aligned = isAlienInZone(side);
    const pulse = 0.4 + 0.3 * Math.sin(animationClock * 6);
    ctx.save();
    ctx.fillStyle = aligned ? `rgba(255,67,33,${0.18 + pulse * .2})` : `rgba(255,161,43,${0.05 + pulse * .05})`;
    ctx.strokeStyle = aligned ? "rgba(255,86,48,.95)" : "rgba(255,166,55,.48)";
    ctx.lineWidth = aligned ? 8 : 4;
    ctx.setLineDash([22, 14]);
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);
    ctx.fillStyle = aligned ? "#ffebce" : "#d9a76a";
    ctx.font = "700 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(aligned ? "TARGET ALIGNED" : "THRUSTER KILL ZONE", zone.x + zone.w / 2, zone.y + 34);
    ctx.restore();
  }

  function drawProjectile(shot) {
    ctx.save();
    const glow = ctx.createRadialGradient(shot.x, shot.y, 0, shot.x, shot.y, 18);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(.25, "rgba(58,219,255,.95)");
    glow.addColorStop(1, "rgba(25,128,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 18, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    let image = assets.aim;
    let cellW = 180;
    let cellH = 180;
    let frames = 3;
    let row = player.direction;
    let frame = Math.floor(animationClock * 5) % frames;
    const moving = Math.hypot(player.vx, player.vy) > 8;
    if (player.damageAnim > 0) {
      image = assets.damage;
      frame = Math.min(2, Math.floor((0.7 - player.damageAnim) * 7));
    } else if (moving) {
      image = assets.walk;
      cellW = 144;
      cellH = 180;
      frames = 4;
      frame = Math.floor(animationClock * 8) % frames;
    }
    if (!image) return;
    const width = 78;
    const height = 98;
    ctx.save();
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) ctx.globalAlpha = .35;
    ctx.drawImage(image, frame * cellW, row * cellH, cellW, cellH, player.x - width / 2, player.y - height * .76, width, height);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(70,210,255,.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(player.aimAngle) * 26, player.y + Math.sin(player.aimAngle) * 26);
    ctx.lineTo(player.x + Math.cos(player.aimAngle) * 70, player.y + Math.sin(player.aimAngle) * 70);
    ctx.stroke();
    ctx.restore();
  }

  function drawAlien() {
    if (!alien.awake || !assets.alien) return;
    const stateRows = { stalking: 0, charging: 1, attacking: 2, stunned: 3 };
    const row = stateRows[alien.state] ?? 0;
    const frameRate = alien.state === "charging" ? 12 : alien.state === "attacking" ? 10 : 7;
    const frame = Math.floor(animationClock * frameRate) % 6;
    const cellW = 190;
    const cellH = 150;
    const width = alien.state === "charging" ? 126 : 112;
    const height = alien.state === "charging" ? 88 : 98;

    ctx.save();
    const sludge = ctx.createRadialGradient(alien.x, alien.y + 22, 5, alien.x, alien.y + 22, 70);
    sludge.addColorStop(0, "rgba(4,5,5,.9)");
    sludge.addColorStop(.45, "rgba(3,3,4,.58)");
    sludge.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sludge;
    ctx.beginPath();
    ctx.ellipse(alien.x, alien.y + 25, 72 + Math.sin(animationClock * 5) * 8, 38, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(3,3,4,.84)";
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i += 1) {
      const angle = animationClock * .7 + i * TAU / 4;
      ctx.beginPath();
      ctx.moveTo(alien.x, alien.y + 18);
      ctx.quadraticCurveTo(alien.x + Math.cos(angle) * 45, alien.y + 20 + Math.sin(angle) * 25, alien.x + Math.cos(angle + .5) * 76, alien.y + 28 + Math.sin(angle + .5) * 38);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    if (alien.vx < -8) {
      ctx.translate(alien.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-alien.x, 0);
    }
    ctx.drawImage(assets.alien, frame * cellW, row * cellH, cellW, cellH, alien.x - width / 2, alien.y - height * .68, width, height);
    ctx.restore();

    if (scannerPulse > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,75,50,${scannerPulse / 1.2})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(alien.x, alien.y, 58 + (1.2 - scannerPulse) * 35, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = clamp(particle.life / (particle.maxLife || 1), 0, 1);
      ctx.save();
      if (particle.type === "plasma") {
        ctx.fillStyle = `rgba(74,221,255,${alpha})`;
        ctx.shadowColor = "#3bdcff";
        ctx.shadowBlur = 12;
      } else if (particle.type === "spark") {
        ctx.fillStyle = `rgba(255,165,55,${alpha})`;
        ctx.shadowColor = "#ff6b2e";
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = `rgba(2,3,3,${Math.min(.78, alpha)})`;
      }
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * Math.max(.2, alpha), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (const pulse of pulses) {
      const alpha = clamp(pulse.life / pulse.max, 0, 1);
      ctx.save();
      ctx.strokeStyle = `rgba(74,218,255,${alpha * .65})`;
      ctx.lineWidth = 5 * alpha;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawAmbient() {
    const redPulse = .45 + .38 * Math.sin(animationClock * 2.7);
    for (const [x, y, color] of ambientLights) {
      const rgb = color === "red" ? "255,55,36" : color === "amber" ? "255,169,50" : "65,205,255";
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 88);
      gradient.addColorStop(0, `rgba(${rgb},${redPulse * .42})`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 90, y - 90, 180, 180);
    }
    if (Math.random() < .08) {
      const sources = [[2100, 260], [1110, 1180], [1210, 630], [350, 580]];
      const [x, y] = sources[Math.floor(Math.random() * sources.length)];
      addBurst(x, y, "spark", 2);
    }
  }

  function drawDarkness() {
    const playerScreen = worldToScreen(player.x, player.y);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const radius = Math.min(cssWidth, cssHeight) * .50;
    const gradient = ctx.createRadialGradient(playerScreen.x, playerScreen.y, radius * .16, playerScreen.x, playerScreen.y, radius);
    gradient.addColorStop(0, "rgba(0,0,0,.02)");
    gradient.addColorStop(.45, "rgba(0,0,0,.09)");
    gradient.addColorStop(1, "rgba(0,0,0,.56)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const coneLength = 330 * zoom;
    const coneWidth = .58;
    const angle = player.aimAngle;
    const cone = ctx.createRadialGradient(playerScreen.x, playerScreen.y, 0, playerScreen.x, playerScreen.y, coneLength);
    cone.addColorStop(0, "rgba(90,195,226,.08)");
    cone.addColorStop(1, "rgba(90,195,226,0)");
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(playerScreen.x, playerScreen.y);
    ctx.arc(playerScreen.x, playerScreen.y, coneLength, angle - coneWidth, angle + coneWidth);
    ctx.closePath();
    ctx.fill();

    const alertWash = .035 + Math.max(0, Math.sin(animationClock * 2.7)) * .035;
    ctx.fillStyle = `rgba(255,35,20,${alertWash})`;
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.restore();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#010204";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const shakeX = camera.shake ? (Math.random() - .5) * camera.shake : 0;
    const shakeY = camera.shake ? (Math.random() - .5) * camera.shake : 0;
    ctx.save();
    ctx.translate(cssWidth / 2 + shakeX, cssHeight / 2 + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    if (assets.map) ctx.drawImage(assets.map, 0, 0, WORLD.width, WORLD.height);
    else {
      ctx.fillStyle = "#11181d";
      for (const rect of walkRects) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    drawAmbient();
    drawKillZone(killZones.port, "port");
    drawKillZone(killZones.starboard, "starboard");
    drawDoor(doors.engine);
    drawDoor(doors.port);
    drawDoor(doors.starboard);

    drawInteractableSprite(objects.recharge, player.ammo < MAX_AMMO);
    drawInteractableSprite(objects.relay, phase === 0);
    drawInteractableSprite(objects.engine, phase === 1);
    drawInteractableSprite(objects.portSwitch, phase === 2);
    drawInteractableSprite(objects.starboardSwitch, phase === 2);

    for (const shot of projectiles) drawProjectile(shot);
    drawParticles();
    drawAlien();
    drawPlayer();
    ctx.restore();

    if (mode === "playing" || mode === "paused") drawDarkness();
  }

  function loop(now) {
    const dt = Math.min(0.033, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function setStick(zone, knob, kind, event) {
    const rect = zone.getBoundingClientRect();
    const origin = kind === "move" ? input.moveOrigin : input.aimOrigin;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    const max = Math.min(rect.width, rect.height) * .28;
    const length = Math.hypot(dx, dy) || 1;
    const scale = length > max ? max / length : 1;
    const px = dx * scale;
    const py = dy * scale;
    knob.style.transform = `translate(${px}px, ${py}px)`;
    const nx = px / max;
    const ny = py / max;
    if (kind === "move") {
      input.moveX = nx;
      input.moveY = ny;
    } else {
      const mag = Math.hypot(nx, ny);
      input.aimMagnitude = mag;
      if (mag > .14) {
        input.aimX = nx / mag;
        input.aimY = ny / mag;
      }
      const now = performance.now();
      if (mag >= .82) {
        if (!input.aimFireSince) input.aimFireSince = now;
        input.fireHeld = now - input.aimFireSince >= 160;
      } else if (mag <= .72) {
        input.aimFireSince = 0;
        input.fireHeld = false;
      }
    }
  }

  function bindStick(zone, knob, kind) {
    zone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const pointerKey = kind === "move" ? "movePointer" : "aimPointer";
      if (input[pointerKey] !== null) return;
      input[pointerKey] = event.pointerId;
      input[kind === "move" ? "moveOrigin" : "aimOrigin"] = { x: event.clientX, y: event.clientY };
      zone.setPointerCapture?.(event.pointerId);
      setStick(zone, knob, kind, event);
    });
    zone.addEventListener("pointermove", (event) => {
      const pointerKey = kind === "move" ? "movePointer" : "aimPointer";
      if (input[pointerKey] !== event.pointerId) return;
      event.preventDefault();
      setStick(zone, knob, kind, event);
    });
    const release = (event) => {
      const pointerKey = kind === "move" ? "movePointer" : "aimPointer";
      if (input[pointerKey] !== event.pointerId) return;
      input[pointerKey] = null;
      input[kind === "move" ? "moveOrigin" : "aimOrigin"] = null;
      knob.style.transform = "translate(0px, 0px)";
      if (kind === "move") { input.moveX = 0; input.moveY = 0; }
      else { input.aimMagnitude = 0; input.aimFireSince = 0; input.fireHeld = false; }
      try { zone.releasePointerCapture?.(event.pointerId); } catch {}
    };
    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);
    zone.addEventListener("lostpointercapture", release);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "Escape") {
      if (mode === "playing") pauseMission();
      else if (mode === "paused") resumeMission();
    }
    if (event.code === "KeyE" || event.code === "Enter") tryInteract();
    if (event.code === "KeyQ") pulseScanner();
    if (event.code === "Space") input.fireHeld = true;
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
    if (event.code === "Space") input.fireHeld = false;
  });
  window.addEventListener("blur", () => { clearInput(); if (mode === "playing") pauseMission(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && mode === "playing") pauseMission(); });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      input.mouseActive = true;
      input.mouseX = event.clientX;
      input.mouseY = event.clientY;
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button === 0) {
      input.fireHeld = true;
      input.mouseActive = true;
      input.mouseX = event.clientX;
      input.mouseY = event.clientY;
      tryFire();
    }
  });
  window.addEventListener("pointerup", (event) => { if (event.pointerType === "mouse") input.fireHeld = false; });
  window.addEventListener("pointercancel", () => { input.fireHeld = false; });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  ["contextmenu", "selectstart", "dragstart"].forEach((type) => {
    document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
  });
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });

  bindStick(moveZone, moveKnob, "move");
  bindStick(aimZone, aimKnob, "aim");

  interactButton.addEventListener("pointerdown", (event) => { event.preventDefault(); tryInteract(); });
  scannerButton.addEventListener("pointerdown", (event) => { event.preventDefault(); pulseScanner(); });

  startButton.addEventListener("click", startMission);
  pauseButton.addEventListener("click", pauseMission);
  resumeButton.addEventListener("click", resumeMission);
  retryButton.addEventListener("click", startMission);
  replayButton.addEventListener("click", startMission);
  pauseRestartButton.addEventListener("click", startMission);
  muteButton.addEventListener("click", () => audio.toggleMute());
  $$(".menu-return").forEach((button) => button.addEventListener("click", () => {
    audio.stop();
    location.href = returnUrl;
  }));

  async function initialise() {
    resize();
    startButton.disabled = true;
    startButton.textContent = "LOADING ENGINE DECK…";
    try {
      await Promise.all(Object.entries(imageSources).map(async ([key, url]) => { assets[key] = await loadImage(url); }));
      startButton.disabled = false;
      startButton.textContent = "ENTER HUNT MODE";
    } catch (error) {
      console.warn("[Hunt 01] Some artwork could not be loaded; using fallback rendering.", error);
      startButton.disabled = false;
      startButton.textContent = "ENTER HUNT MODE";
    }
    resetMission();
    if (new URLSearchParams(location.search).get("debug") === "1" || window.__HUNT01_TEST__) {
      window.__hunt01Debug = {
        player,
        alien,
        doors,
        objects,
        get phase() { return phase; },
        get mode() { return mode; },
        get missionTime() { return missionTime; },
        teleportPlayer(x, y) { player.x = x; player.y = y; camera.x = x; camera.y = y; },
        teleportAlien(x, y) { alien.x = x; alien.y = y; alien.awake = true; },
        setPhase(value) {
          phase = value;
          if (phase >= 1) doors.engine.open = true;
          if (phase >= 2) { doors.port.open = true; doors.starboard.open = true; }
          updateObjective();
        },
        complete(id) { const object = objects[id]; if (object) completeInteraction(object); },
        beginSuccess
      };
    }
    if (new URLSearchParams(location.search).get("autostart") === "1") introScreen.classList.add("is-visible");
    requestAnimationFrame(loop);
  }

  initialise();
})();
