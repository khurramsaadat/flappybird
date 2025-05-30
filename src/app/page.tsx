"use client";
import { useEffect, useRef, useState } from "react";

const GAME_GUIDE = `Play flappy bird here online for free. Click on the screen, or use your spacebar to get started. Fly the bird as far as you can without hitting a pipe.`;

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [showTap, setShowTap] = useState(true);

  // Game constants
  const width = 400;
  const height = 600;
  const gravity = 0.35;
  const jump = -6;
  const birdSize = 40;
  const pipeWidth = 60;
  const pipeGap = 200;
  const groundHeight = 60;

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
  const startBg = useRef<HTMLImageElement | null>(null);
  const baseImg = useRef<HTMLImageElement | null>(null);
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
    const bg = new window.Image();
    bg.src = "/images/screenshot.png";
    startBg.current = bg;
    const base = new window.Image();
    base.src = "/images/base.png";
    baseImg.current = base;
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
      // Sky background
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, width, height);
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
      // Score (big, white, centered)
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.strokeText(score.toString(), width / 2, 80);
      ctx.fillText(score.toString(), width / 2, 80);
      // TAP indicator
      if (!started && !gameOver && showTap) {
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "#ff5722";
        ctx.fillText("TAP", width / 2 + 40, height / 2);
        ctx.font = "32px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText("🖱️", width / 2, height / 2 + 40);
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
  const handleJump = () => {
    if (!startedRef.current) return;
    birdV.current = jump;
    if (wingSound.current) {
      wingSound.current.currentTime = 0;
      wingSound.current.play();
    }
  };

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
  }, [gameOver]);

  // Responsive canvas scaling
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const scale = Math.min(
        parent.offsetWidth / width,
        window.innerHeight * 0.7 / height,
        1
      );
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 px-2 py-4">
      <div className="flex flex-col items-center w-full" style={{ maxWidth: width }}>
        <div className="relative w-full flex justify-center">
          {/* Show start background image overlay if not started and not gameOver */}
          {!started && !gameOver && startBg.current?.complete && (
            <img
              src="/images/screenshot.png"
              alt="Start Screen"
              className="absolute left-0 top-0 w-full h-full object-cover z-10 rounded-lg"
              style={{ maxWidth: width, maxHeight: height }}
            />
          )}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            tabIndex={0}
            className="border-4 border-blue-500 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-700"
            onClick={() => (started ? handleJump() : handleStart())}
            style={{ width: "100%", height: "auto", maxWidth: width, background: "#87ceeb" }}
          />
          {!started && !gameOver && (
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-3 bg-green-500 text-white rounded shadow hover:bg-green-600 text-lg font-bold z-20"
              onClick={handleStart}
              style={{ minWidth: 120 }}
            >
              Start
            </button>
          )}
        </div>
        <div className="mt-2 text-gray-700 text-sm text-center">Controls: <b>Space/Click</b> to jump, <b>R</b> to restart</div>
      </div>
      {gameOver && (
        <div className="mt-6 flex flex-col items-center">
          <div className="text-2xl font-bold text-red-600 mb-2">Game Over!</div>
          <button
            className="px-6 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
            onClick={handleStart}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
