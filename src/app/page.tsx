"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";

type CanvasWithRestartBtn = HTMLCanvasElement & {
  _restartBtn?: { x: number; y: number; w: number; h: number };
};

// ScoreCounter component
function ScoreCounter({ score, canvasSize }: { score: number; canvasSize: { width: number; height: number } }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        textAlign: "center",
        zIndex: 30,
        color: "#ffe066",
        fontWeight: 900,
        fontSize: Math.round(canvasSize.height * 0.07),
        textShadow: "2px 2px 8px #222, 0 0 2px #fff",
        fontFamily: "Arial Black, Arial, 'Geist', sans-serif",
        letterSpacing: 2,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {score}
    </div>
  );
}

// Add keyframes for pulsing animation
const pulseStyle = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
`;
if (typeof window !== 'undefined' && !document.getElementById('pulse-keyframes')) {
  const style = document.createElement('style');
  style.id = 'pulse-keyframes';
  style.innerHTML = pulseStyle;
  document.head.appendChild(style);
}

// Generic Float component for smooth sine wave floating
function Float({
  children,
  amplitude = 16,
  period = 300,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  amplitude?: number;
  period?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    let animId: number;
    let running = true;
    function animate() {
      if (!running) return;
      setFrame(f => (f + 1) % period);
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, [period]);
  const y = Math.sin((frame / period) * 2 * Math.PI) * amplitude;
  return (
    <div style={{ transform: `translateY(${y}px)`, ...style }} className={className}>
      {children}
    </div>
  );
}

// Debug flag for pipe gap overlay
const DEBUG_PIPE_GAP = false;

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [lockedCanvasSize, setLockedCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [idleFrame, setIdleFrame] = useState(0); // for idle floating
  const [bestScore, setBestScore] = useState(0);

  // Game constants (will be updated based on canvas size)
  const width = (lockedCanvasSize ?? canvasSize).width;
  const height = (lockedCanvasSize ?? canvasSize).height;
  const gravity = 0.35 * (height / 600);
  const jump = -6 * (height / 600);
  const birdSize = 40 * (height / 600); // Bird height in px (scales with screen)
  const pipeWidth = 60 * (height / 600);
  const pipeGap = 200 * (height / 600); // Default vertical gap between pipes
  const groundHeight = 60 * (height / 600);

  // --- PIPE GAP LOGIC (Mobile) ---
  // On mobile, enforce minimum horizontal and vertical gap between pipes as bird height x 6
  // These values are easy to tweak for future adjustments
  const minPipeGap = birdSize * 6; // Minimum vertical gap between top and bottom pipes
  const minPipeHorizontalGap = birdSize * 6; // Minimum horizontal distance between pipes

  // Game state
  const birdY = useRef(height / 2);
  const birdV = useRef(0);
  const pipes = useRef<{ x: number; top: number; color: string; passed: boolean }[]>([]);
  const animation = useRef<number | null>(null);
  const startedRef = useRef(false);
  const gameOverRef = useRef(false);
  const graceFrames = useRef(0);
  // For smooth bird rotation
  const birdAngle = useRef(0);

  // Load images
  const birdImg = useRef<HTMLImageElement | null>(null);
  const pipeGreenTop = useRef<HTMLImageElement | null>(null);
  const pipeGreenBottom = useRef<HTMLImageElement | null>(null);
  const pipeRedTop = useRef<HTMLImageElement | null>(null);
  const pipeRedBottom = useRef<HTMLImageElement | null>(null);
  const baseImg = useRef<HTMLImageElement | null>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
  const gameOverImg = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = "/flappy.png";
    birdImg.current = img;
    const gTop = new window.Image();
    gTop.src = "/images/pipe_green_top.png";
    pipeGreenTop.current = gTop;
    const gBot = new window.Image();
    gBot.src = "/images/pipe_green_bottom.png";
    pipeGreenBottom.current = gBot;
    const rTop = new window.Image();
    rTop.src = "/images/pipe_red_top.png";
    pipeRedTop.current = rTop;
    const rBot = new window.Image();
    rBot.src = "/images/pipe_red_bottom.png";
    pipeRedBottom.current = rBot;
    const base = new window.Image();
    base.src = "/images/base.png";
    baseImg.current = base;
    const bg = new window.Image();
    bg.src = "/images/background.jpg";
    bgImg.current = bg;
    const gameOver = new window.Image();
    gameOver.src = "/images/game-over.png";
    gameOverImg.current = gameOver;
  }, []);

  // Load sounds
  const wingSound = useRef<HTMLAudioElement | null>(null);
  const swooshSound = useRef<HTMLAudioElement | null>(null);
  const pointSound = useRef<HTMLAudioElement | null>(null);
  const hitSound = useRef<HTMLAudioElement | null>(null);
  const dieSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    wingSound.current = new window.Audio("/audio/sfx_wing.wav");
    if (wingSound.current) wingSound.current.volume = 0.5;
    swooshSound.current = new window.Audio("/audio/sfx_swooshing.wav");
    if (swooshSound.current) swooshSound.current.volume = 0.5;
    pointSound.current = new window.Audio("/audio/sfx_point.wav");
    if (pointSound.current) pointSound.current.volume = 0.5;
    hitSound.current = new window.Audio("/audio/sfx_hit.wav");
    if (hitSound.current) hitSound.current.volume = 0.5;
    dieSound.current = new window.Audio("/audio/sfx_die.wav");
    if (dieSound.current) dieSound.current.volume = 0.5;
  }, []);

  // Move draw to top-level and wrap in useCallback for stable reference
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // Always draw background image first
    if (bgImg.current?.complete) {
      ctx.drawImage(bgImg.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, width, height);
    }
    // Pipes (with images, flush and scaled)
    pipes.current.forEach(pipe => {
      const isGreen = pipe.color === "green";
      const topImg = isGreen ? pipeGreenTop.current : pipeRedTop.current;
      const botImg = isGreen ? pipeGreenBottom.current : pipeRedBottom.current;
      // Top pipe: from top to gap
      const topPipeHeight = pipe.top;
      if (topImg?.complete) {
        ctx.drawImage(topImg, pipe.x, 0, pipeWidth, topPipeHeight);
      } else {
        ctx.fillStyle = isGreen ? "#4ec04e" : "#d2691e";
        ctx.fillRect(pipe.x, 0, pipeWidth, topPipeHeight);
      }
      // Bottom pipe: from gap to base
      const baseY = height - groundHeight;
      const bottomPipeY = pipe.top + pipeGap;
      const bottomPipeHeight = baseY - bottomPipeY;
      if (botImg?.complete) {
        ctx.drawImage(botImg, pipe.x, bottomPipeY, pipeWidth, bottomPipeHeight);
      } else {
        ctx.fillStyle = isGreen ? "#4ec04e" : "#d2691e";
        ctx.fillRect(pipe.x, bottomPipeY, pipeWidth, bottomPipeHeight);
      }
      // Debug overlay for pipe gap
      if (DEBUG_PIPE_GAP) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#ff00ff";
        ctx.fillRect(pipe.x, pipe.top, pipeWidth, minPipeGap);
        ctx.restore();
      }
    });
    // Bird rotation: 30deg clockwise when falling, 30deg counterclockwise when rising
    const birdCenterX = width / 4;
    let birdCenterY = birdY.current + birdSize / 2;
    let angle = birdAngle.current;
    // Idle floating effect
    if (!started && !gameOver) {
      // 5s loop, amplitude scales with bird size
      birdCenterY = height / 2 + Math.sin((idleFrame / 300) * 2 * Math.PI) * (birdSize * 0.4);
      angle = 0; // No rotation in idle
    }
    ctx.save();
    ctx.translate(birdCenterX, birdCenterY);
    ctx.rotate(angle);
    if (birdImg.current?.complete) {
      ctx.drawImage(birdImg.current, -birdSize / 2, -birdSize / 2, birdSize, birdSize);
    } else {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(0, 0, birdSize / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    // Draw base (in front of pipes)
    if (baseImg.current?.complete) {
      ctx.drawImage(baseImg.current, 0, height - groundHeight, width, groundHeight);
    } else {
      ctx.fillStyle = "#ded895";
      ctx.fillRect(0, height - groundHeight, width, groundHeight);
      ctx.fillStyle = "#b0a14f";
      ctx.fillRect(0, height - groundHeight, width, 10);
    }
  }, [width, height, birdSize, pipeWidth, pipeGap, groundHeight, started, gameOver, idleFrame, minPipeGap]);

  // Game loop
  useEffect(() => {
    if (!started) return;
    setGameOver(false);
    setScore(0);
    birdY.current = height / 2;
    birdV.current = 0;
    let pipeSpeed = 3.0;
    function randomPipeColor() {
      return Math.random() < 0.5 ? "green" : "red";
    }
    // Use min gaps for mobile, otherwise use default scaling
    const verticalGap = isMobile ? minPipeGap : pipeGap;
    const horizontalGap = isMobile ? minPipeHorizontalGap : pipeGap;
    // Strictly enforce horizontal gap between pipes
    pipes.current = [
      { x: width + 100, top: Math.max(60, Math.random() * (height - verticalGap - groundHeight - 100) + 50), color: randomPipeColor(), passed: false },
      { x: width + 100 + horizontalGap, top: Math.max(60, Math.random() * (height - verticalGap - groundHeight - 100) + 50), color: randomPipeColor(), passed: false },
    ];
    startedRef.current = true;
    gameOverRef.current = false;
    graceFrames.current = 30;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let running = true;
    function update() {
      if (!running) return;
      if (score >= 20) {
        pipeSpeed = 5.0;
      } else if (score >= 10) {
        pipeSpeed = 4.0;
      } else {
        pipeSpeed = 3.0;
      }
      birdV.current += gravity;
      birdY.current += birdV.current;
      // Smoothly interpolate bird angle based on velocity
      const maxAngle = Math.PI / 6; // 30 degrees
      const targetAngle = birdV.current > 0 ? maxAngle : -maxAngle;
      // Lerp: angle = angle + (target - angle) * smoothing
      birdAngle.current += (targetAngle - birdAngle.current) * 0.15;
      pipes.current.forEach(pipe => (pipe.x -= pipeSpeed)); // Use current speed
      pipes.current.forEach(pipe => {
        if (!pipe.passed && (width / 4 + birdSize / 2 > pipe.x + pipeWidth)) {
          pipe.passed = true;
          setScore(s => s + 1);
          if (pointSound.current) {
            pointSound.current.currentTime = 0;
            pointSound.current.play();
          }
        }
      });
      if (pipes.current[0].x < -pipeWidth) {
        pipes.current.shift();
        // Enforce horizontal and vertical gap for new pipe
        const lastPipe = pipes.current[pipes.current.length - 1];
        const newX = lastPipe.x + horizontalGap;
        pipes.current.push({
          x: newX,
          top: Math.max(60, Math.random() * (height - verticalGap - groundHeight - 100) + 50),
          color: Math.random() < 0.5 ? "green" : "red",
          passed: false
        });
      }
      if (graceFrames.current > 0) {
        graceFrames.current--;
        return;
      }
      const birdBox = {
        x: width / 4,
        y: birdY.current,
        w: birdSize,
        h: birdSize,
      };
      for (const pipe of pipes.current) {
        if (
          birdBox.x + birdBox.w > pipe.x &&
          birdBox.x < pipe.x + pipeWidth &&
          (birdBox.y < pipe.top || birdBox.y + birdBox.h > pipe.top + verticalGap)
        ) {
          gameOverRef.current = true;
          startedRef.current = false;
          setGameOver(true);
          setStarted(false);
          if (hitSound.current) {
            hitSound.current.currentTime = 0;
            hitSound.current.play();
          }
          setTimeout(() => {
            if (dieSound.current) {
              dieSound.current.currentTime = 0;
              dieSound.current.play();
            }
          }, 200);
          return;
        }
      }
      if (birdY.current < 0 || birdY.current + birdSize > height - groundHeight) {
        gameOverRef.current = true;
        startedRef.current = false;
        setGameOver(true);
        setStarted(false);
        if (hitSound.current) {
          hitSound.current.currentTime = 0;
          hitSound.current.play();
        }
        setTimeout(() => {
          if (dieSound.current) {
            dieSound.current.currentTime = 0;
            dieSound.current.play();
          }
        }, 200);
        return;
      }
    }
    function loop() {
      update();
      draw();
      if (!gameOverRef.current && startedRef.current) {
        animation.current = requestAnimationFrame(loop);
      }
    }
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(animation.current!);
    };
    // eslint-disable-next-line
  }, [started, gameOver, draw]);

  // Handle jump (works for all input types)
  const handleJump = useCallback(() => {
    if (!startedRef.current) return;
    birdV.current = jump;
    // Play wing sound
    if (wingSound.current) {
      try {
        wingSound.current.currentTime = 0;
        wingSound.current.play();
      } catch (err) {
        console.log('Wing sound play error:', err);
      }
    } else {
      console.log('Wing sound not loaded');
    }
  }, [jump]);

  // Start game
  const handleStart = () => {
    setStarted(true);
    setGameOver(false);
    setScore(0);
    setLockedCanvasSize(canvasSize); // Lock the canvas size at game start
    if (swooshSound.current) {
      swooshSound.current.currentTime = 0;
      swooshSound.current.play();
    }
  };

  // Keyboard controls (only jump if started)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && startedRef.current) {
        handleJump();
      } else if (e.code === "KeyR" && gameOver) {
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, handleJump, handleStart]);

  // Responsive canvas scaling
  useEffect(() => {
    function handleResize() {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      if (!lockedCanvasSize) {
        if (isMobileDevice) {
          setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
        } else {
          // Desktop: full viewport height, proportional width
          const aspect = 400 / 600;
          const vh = window.innerHeight;
          const vw = Math.min(window.innerWidth, vh * aspect);
          setCanvasSize({ width: vw, height: vh });
        }
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height, width, lockedCanvasSize]);

  // Draw everything in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw background (always, for all states)
    if (bgImg.current?.complete) {
      ctx.drawImage(bgImg.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, width, height);
    }
    // Dim background for start/game over screens
    if (!started) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;
      ctx.restore();
    }
    // ... draw pipes, bird, base as before ...
    // Draw UI (controls, messages, buttons) inside canvas
    ctx.save();
    ctx.textAlign = "center";
    // Controls (only on start, not on game over)
    if (!started && !gameOver) {
      ctx.font = `${Math.round(height * 0.03)}px Arial`;
      ctx.fillStyle = "#fff";
      ctx.fillText(
        isMobile
          ? "Controls: Tap to jump, double tap to restart"
          : "Controls: Space/Click to jump, R to restart",
        width / 2,
        height * 0.08
      );
    }
    // Start screen controls
    if (!started && !gameOver) {
      ctx.font = `${Math.round(height * 0.045)}px Arial`;
      ctx.fillStyle = "#22c55e";
      ctx.fillText("Tap/Click to Start", width / 2, height * 0.5);
    }
    ctx.restore();
  }, [canvasSize, started, gameOver, isMobile, height, width]);

  // Update event handlers for canvas clicks/taps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = () => {
      const btn = (canvas as CanvasWithRestartBtn)?._restartBtn;
      if (gameOver && btn) {
        setGameOver(false); setStarted(false); setScore(0);
      } else if (!started) {
        setStarted(true); setGameOver(false); setScore(0);
      } else if (started) {
        handleJump(); // Use handleJump for mouse click
      }
    };
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [gameOver, started, jump, handleJump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchEnd = () => {
      const now = Date.now();
      if (now - lastTap < 400) {
        setGameOver(false); setStarted(false); setScore(0);
      }
      setLastTap(now);
      if (started) handleJump(); // Use handleJump for tap
    };
    canvas.addEventListener("touchstart", handleTouchEnd);
    return () => canvas.removeEventListener("touchstart", handleTouchEnd);
  }, [lastTap, started, jump, handleJump]);

  // Fade-in for overlay
  useEffect(() => {
    if (gameOver) {
      setOverlayVisible(true);
    } else {
      setOverlayVisible(false);
    }
  }, [gameOver]);

  // Home/start screen overlay logic
  const showHomeOverlay = !started && !gameOver;

  // Idle animation loop (calls main draw for floating bird)
  useEffect(() => {
    if (started || gameOver) return;
    let frame = 0;
    let animId: number;
    let running = true;
    function animate() {
      if (!running) return;
      // 5s loop: 60fps * 5s = 300 frames
      // Sine wave for smooth up/down, amplitude scales with bird size
      setIdleFrame(frame % 300); // Loop every 5s
      frame++;
      draw(); // Call the main draw function so all logic is in one place
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, [started, gameOver, draw]);

  // Load best score from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bestScore');
      setBestScore(stored ? parseInt(stored, 10) : 0);
    }
  }, []);

  // Update best score in localStorage on game over
  useEffect(() => {
    if (gameOver && typeof window !== 'undefined') {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem('bestScore', String(score));
      }
    }
  }, [gameOver, score, bestScore]);

  // When game is over or reset, unlock the canvas size
  useEffect(() => {
    if (!started && !gameOver) {
      setLockedCanvasSize(null);
    }
  }, [started, gameOver]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#222" }}>
      <div style={{ position: "relative", width: canvasSize.width, height: canvasSize.height }}>
        {/* Score Counter always visible */}
        <ScoreCounter score={score} canvasSize={canvasSize} />
        {/* Canvas for game graphics */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          tabIndex={0}
          style={{ display: "block", background: "#000", width: canvasSize.width, height: canvasSize.height }}
        />
        {/* Home/Start Overlay */}
        {showHomeOverlay && (
          <div
            data-testid="start-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: `url(/images/background.jpg) center/cover no-repeat`,
              pointerEvents: showHomeOverlay ? "auto" : "none",
            }}
            onClick={() => {
              setStarted(true); setGameOver(false); setScore(0);
            }}
            onTouchEnd={() => {
              setStarted(true); setGameOver(false); setScore(0);
            }}
          >
            {/* Flappy Bird Logo above TAP TO START */}
            <Image
              src="/images/Flappy-Bird-Logo.png"
              alt="Flappy Bird Logo"
              width={240}
              height={48}
              style={{ maxWidth: "60%", height: "auto", width: "auto", marginBottom: 24, marginTop: canvasSize.height * 0.08 }}
              priority
            />
            <div
              style={{
                color: "#a259ff",
                fontWeight: 900,
                fontSize: Math.round(canvasSize.height * 0.04 * 0.85),
                textAlign: "center",
                marginTop: canvasSize.height * 0.1,
                textTransform: "uppercase",
                letterSpacing: 1,
                animation: "pulse 1.2s infinite cubic-bezier(0.4,0,0.2,1)",
                willChange: "transform, opacity",
                fontFamily: "var(--font-press-start-2p)",
              }}
            >
              TAP TO START
            </div>
          </div>
        )}
        {/* Game Over Overlay */}
        {gameOver && (
          <div
            data-testid="game-over-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.25)",
              pointerEvents: overlayVisible ? "auto" : "none",
              opacity: overlayVisible ? 1 : 0,
              transition: "opacity 1s cubic-bezier(0,0,0.2,1)",
              transform: overlayVisible ? "scale(1)" : "scale(0.85)",
              transitionProperty: "opacity, transform",
              textAlign: "center",
            }}
            onClick={() => {
              setGameOver(false); setStarted(false); setScore(0); // Go to home, do not start game
            }}
            onTouchEnd={() => {
              setGameOver(false); setStarted(false); setScore(0); // Go to home, do not start game
            }}
          >
            {/* Flappy Bird Logo above game over image, smaller */}
            <Image
              src="/images/Flappy-Bird-Logo.png"
              alt="Flappy Bird Logo"
              width={140}
              height={28}
              style={{ maxWidth: "35%", height: "auto", width: "auto", marginBottom: 30, marginTop: canvasSize.height * 0.0, transition: "transform 1s cubic-bezier(0,0,0.2,1)", transform: overlayVisible ? "scale(1)" : "scale(0.85)" }}
              priority
            />
            <div style={{
              transition: "transform 1s cubic-bezier(0,0,0.2,1)",
              transform: overlayVisible ? "scale(1.08)" : "scale(0.7)",
              willChange: "transform",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}>
              {/* Animated GAME OVER text using Press Start 2P font */}
              <div
                style={{
                  color: "#ffe066",
                  fontFamily: "var(--font-press-start-2p)",
                  fontWeight: 900,
                  fontSize: Math.round(canvasSize.height * 0.06),
                  textAlign: "center",
                  lineHeight: 1.1,
                  marginBottom: 24,
                  textShadow: "2px 2px 8px #222, 0 0 2px #fff",
                  animation: "pulse 1.2s infinite cubic-bezier(0.4,0,0.2,1)",
                  willChange: "transform, opacity",
                  letterSpacing: 2,
                  userSelect: "none",
                }}
              >
                GAME<br />OVER
              </div>
            </div>
            {/* Score and Best on one line, light purple and bold */}
            <div style={{
              color: "#d6b4ff",
              fontWeight: 900,
              fontSize: Math.round(canvasSize.height * 0.045 * 0.55),
              margin: "8px 0 16px 0",
              textAlign: "center",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              gap: 24,
              fontFamily: "var(--font-press-start-2p)",
            }}>
              <span>Score: {score}</span>
              <span>Best: {bestScore}</span>
            </div>
            {/* Copyright at the bottom */}
            <div style={{
              position: "absolute",
              bottom: 12,
              left: 0,
              width: "100%",
              textAlign: "center",
              color: "#fff",
              fontSize: Math.round(canvasSize.height * 0.018),
              letterSpacing: 2,
              fontWeight: 700,
              textTransform: "uppercase",
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}>
              <span>MADE WITH</span>
              <span style={{ color: "#ff3b3b", fontSize: Math.round(canvasSize.height * 0.018) }}>❤️</span>
              <span>KHURRAM</span>
            </div>
            <div
              style={{
                color: "#ffe066",
                fontWeight: 700,
                fontSize: Math.round(canvasSize.height * 0.03 * 0.85),
                animation: "pulse 1.2s infinite cubic-bezier(0.4,0,0.2,1)",
                willChange: "transform, opacity",
                fontFamily: "var(--font-press-start-2p)",
              }}
            >
              TAP TO RESTART
            </div>
          </div>
        )}
        {/* Bird in idle state */}
        {!started && !gameOver && (
          <Float amplitude={birdSize * 0.4} period={300} style={{ position: 'absolute', left: width / 4 - birdSize / 2, top: height / 2 - birdSize / 2, zIndex: 5 }}>
            <img src="/flappy.png" alt="Bird" width={birdSize} height={birdSize} style={{ width: birdSize, height: birdSize }} />
          </Float>
        )}
      </div>
    </div>
  );
}
