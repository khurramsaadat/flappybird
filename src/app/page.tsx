"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [showTap, setShowTap] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const scoreTimeout = useRef<NodeJS.Timeout | null>(null);

  // Game constants (will be updated based on canvas size)
  let width = canvasSize.width;
  let height = canvasSize.height;
  const gravity = 0.35 * (height / 600);
  const jump = -6 * (height / 600);
  const birdSize = 40 * (height / 600);
  const pipeWidth = 60 * (height / 600);
  const pipeGap = 200 * (height / 600);
  const groundHeight = 60 * (height / 600);

  // Game state
  const birdY = useRef(height / 2);
  const birdV = useRef(0);
  const pipes = useRef<{ x: number; top: number; color: string; passed: boolean }[]>([]);
  const animation = useRef<number | null>(null);
  const startedRef = useRef(false);
  const gameOverRef = useRef(false);
  const graceFrames = useRef(0);

  // Load images
  const birdImg = useRef<HTMLImageElement | null>(null);
  const pipeGreenTop = useRef<HTMLImageElement | null>(null);
  const pipeGreenBottom = useRef<HTMLImageElement | null>(null);
  const pipeRedTop = useRef<HTMLImageElement | null>(null);
  const pipeRedBottom = useRef<HTMLImageElement | null>(null);
  const baseImg = useRef<HTMLImageElement | null>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
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
  }, []);

  // Load sounds
  const wingSound = useRef<HTMLAudioElement | null>(null);
  const swooshSound = useRef<HTMLAudioElement | null>(null);
  const pointSound = useRef<HTMLAudioElement | null>(null);
  const hitSound = useRef<HTMLAudioElement | null>(null);
  const dieSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    wingSound.current = new window.Audio("/audio/sfx_wing.wav");
    swooshSound.current = new window.Audio("/audio/sfx_swooshing.wav");
    pointSound.current = new window.Audio("/audio/sfx_point.wav");
    hitSound.current = new window.Audio("/audio/sfx_hit.wav");
    dieSound.current = new window.Audio("/audio/sfx_die.wav");
  }, []);

  // Game loop
  useEffect(() => {
    if (!started) return;
    setGameOver(false);
    setScore(0);
    birdY.current = height / 2;
    birdV.current = 0;
    let pipeSpeed = 1.5;
    let speedTimer = 0;
    function randomPipeColor() {
      return Math.random() < 0.5 ? "green" : "red";
    }
    pipes.current = [
      { x: width + 100, top: Math.max(60, Math.random() * (height - pipeGap - groundHeight - 100) + 50), color: randomPipeColor(), passed: false },
      { x: width + 100 + 200, top: Math.max(60, Math.random() * (height - pipeGap - groundHeight - 100) + 50), color: randomPipeColor(), passed: false },
    ];
    startedRef.current = true;
    gameOverRef.current = false;
    graceFrames.current = 30;
    setShowTap(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!ctx) return;
      // Always draw background image first
      if (bgImg.current?.complete) {
        ctx.drawImage(bgImg.current, 0, 0, width, height);
        console.log("Drawing background image");
      } else {
        ctx.fillStyle = "#87ceeb";
        ctx.fillRect(0, 0, width, height);
        console.log("Drawing fallback blue background");
      }
      // Draw score only when showScore is true
      if (showScore) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(width/2-40, height*0.07-40, 80, 60); // debug background
        ctx.font = `bold ${Math.round(height * 0.07)}px Arial Black, Arial, 'Geist', sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.strokeText(score.toString(), width / 2, height * 0.12);
        ctx.fillText(score.toString(), width / 2, height * 0.12);
        ctx.restore();
        console.log("Drawing score:", score);
      }
      // Pipes (with images)
      pipes.current.forEach(pipe => {
        const isGreen = pipe.color === "green";
        const topImg = isGreen ? pipeGreenTop.current : pipeRedTop.current;
        const botImg = isGreen ? pipeGreenBottom.current : pipeRedBottom.current;
        // Top pipe
        if (topImg?.complete) {
          ctx.drawImage(topImg, pipe.x, pipe.top - 320, pipeWidth, 320);
        } else {
          ctx.fillStyle = isGreen ? "#4ec04e" : "#d2691e";
          ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        }
        // Bottom pipe
        if (botImg?.complete) {
          ctx.drawImage(botImg, pipe.x, pipe.top + pipeGap, pipeWidth, 320);
        } else {
          ctx.fillStyle = isGreen ? "#4ec04e" : "#d2691e";
          ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, height - pipe.top - pipeGap - groundHeight);
        }
      });
      // Bird
      if (birdImg.current?.complete) {
        ctx.drawImage(birdImg.current, width / 4 - birdSize / 2, birdY.current, birdSize, birdSize);
      } else {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(width / 4, birdY.current + birdSize / 2, birdSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      // Draw base (in front of pipes)
      if (baseImg.current?.complete) {
        ctx.drawImage(baseImg.current, 0, height - groundHeight, width, groundHeight);
      } else {
        ctx.fillStyle = "#ded895";
        ctx.fillRect(0, height - groundHeight, width, groundHeight);
        ctx.fillStyle = "#b0a14f";
        ctx.fillRect(0, height - groundHeight, width, 10);
      }
    }

    function update() {
      birdV.current += gravity;
      birdY.current += birdV.current;
      pipes.current.forEach(pipe => (pipe.x -= pipeSpeed));
      // Gradually speed up every 10s
      speedTimer += 1 / 60;
      if (speedTimer > 10 && pipeSpeed < 3.5) {
        pipeSpeed += 0.2;
        speedTimer = 0;
      }
      // Score: only increment when bird's right edge passes pipe's right edge
      pipes.current.forEach(pipe => {
        if (!pipe.passed && (width / 4 + birdSize / 2 > pipe.x + pipeWidth)) {
          pipe.passed = true;
          setScore(s => s + 1);
          setShowScore(true);
          if (scoreTimeout.current) clearTimeout(scoreTimeout.current);
          scoreTimeout.current = setTimeout(() => setShowScore(false), 1000);
          if (pointSound.current) {
            pointSound.current.currentTime = 0;
            pointSound.current.play();
          }
        }
      });
      if (pipes.current[0].x < -pipeWidth) {
        pipes.current.shift();
        pipes.current.push({
          x: width,
          top: Math.max(60, Math.random() * (height - pipeGap - groundHeight - 100) + 50),
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
          (birdBox.y < pipe.top || birdBox.y + birdBox.h > pipe.top + pipeGap)
        ) {
          gameOverRef.current = true;
          startedRef.current = false;
          setGameOver(true);
          setStarted(false);
          setShowTap(true);
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
        setShowTap(true);
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
    return () => cancelAnimationFrame(animation.current!);
    // eslint-disable-next-line
  }, [started]);

  // Handle jump
  const handleJump = useCallback(() => {
    if (!startedRef.current) return;
    birdV.current = jump;
    if (wingSound.current) {
      wingSound.current.currentTime = 0;
      wingSound.current.play();
    }
  }, []);

  // Start game
  const handleStart = () => {
    setStarted(true);
    setGameOver(false);
    setScore(0);
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
  }, [gameOver, handleJump]);

  // Responsive canvas scaling
  useEffect(() => {
    function handleResize() {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
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
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!started || gameOver) {
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
    // Game Over
    if (gameOver) {
      ctx.font = `bold ${Math.round(height * 0.055)}px Arial Black, Arial, 'Geist', sans-serif`;
      ctx.fillStyle = "#ff3b3b";
      ctx.fillText("Game Over!", width / 2, height * 0.25);
      // Restart button
      const btnW = width * 0.35;
      const btnH = height * 0.08;
      const btnX = width / 2 - btnW / 2;
      const btnY = height * 0.32;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.font = `${Math.round(height * 0.045)}px Arial`;
      ctx.fillStyle = "#fff";
      ctx.fillText("Restart", width / 2, btnY + btnH / 2 + height * 0.015);
      // Double tap to restart
      ctx.font = `${Math.round(height * 0.025)}px Arial`;
      ctx.fillStyle = "#fff";
      ctx.fillText("Double tap to restart", width / 2, btnY + btnH + height * 0.04);
      // Store button bounds for click/tap detection
      (canvas as any)._restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    } else {
      (canvas as any)._restartBtn = null;
    }
    // Start screen controls
    if (!started && !gameOver) {
      ctx.font = `${Math.round(height * 0.045)}px Arial`;
      ctx.fillStyle = "#22c55e";
      ctx.fillText("Tap/Click to Start", width / 2, height * 0.5);
    }
    ctx.restore();
  }, [canvasSize, started, gameOver, isMobile]);

  // Update event handlers for canvas clicks/taps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const btn = (canvas as any)?._restartBtn;
      if (gameOver && btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        setStarted(true); setGameOver(false); setScore(0);
      } else if (!started) {
        setStarted(true); setGameOver(false); setScore(0);
      } else if (started) {
        // Jump
        birdV.current = jump;
      }
    };
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 400) {
        // Double tap
        setStarted(true); setGameOver(false); setScore(0);
      }
      setLastTap(now);
      // Single tap = jump
      if (started) birdV.current = jump;
    };
    canvas.addEventListener("touchstart", handleTouchEnd);
    return () => canvas.removeEventListener("touchstart", handleTouchEnd);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#222" }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        tabIndex={0}
        style={{ display: "block", background: "#000", width: canvasSize.width, height: canvasSize.height }}
        onClick={e => {
          const rect = canvasRef.current?.getBoundingClientRect();
          const x = e.clientX - (rect?.left || 0);
          const y = e.clientY - (rect?.top || 0);
          const btn = (canvasRef.current as any)?._restartBtn;
          if (gameOver && btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            setStarted(true); setGameOver(false); setScore(0);
          } else if (!started) {
            setStarted(true); setGameOver(false); setScore(0);
          } else if (started) {
            // Jump
            birdV.current = jump;
          }
        }}
        onTouchEnd={e => {
          const now = Date.now();
          if (now - lastTap < 400) {
            // Double tap
            setStarted(true); setGameOver(false); setScore(0);
          }
          setLastTap(now);
          // Single tap = jump
          if (started) birdV.current = jump;
        }}
      />
    </div>
  );
}
