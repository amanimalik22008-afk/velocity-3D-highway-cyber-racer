import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GameMode, GameTelemetry } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';
import { audioManager } from '../audio/AudioManager';
import {
  Pause,
  Zap,
  Shield,
  Magnet,
  Coins,
  Flame,
  ChevronLeft,
  ChevronRight,
  Timer,
  Award,
  HelpCircle,
  X,
  Gauge,
  ArrowUp,
  ArrowDown,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface GameHUDProps {
  telemetry: GameTelemetry;
  mode: GameMode;
  nearMissPopups: { id: number; text: string }[];
  onPause: () => void;
  onSteer: (dir: number) => void;
  onThrottle: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onNitro: (active: boolean) => void;
  onShiftLane: (dir: 'left' | 'right') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  mode,
  nearMissPopups,
  onPause,
  onSteer,
  onThrottle,
  onBrake,
  onNitro,
  onShiftLane,
}) => {
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isNitroPressed, setIsNitroPressed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isAutoCruise, setIsAutoCruise] = useState(false);

  // Keep references to prevent stuck touches
  const gasRef = useRef(isGasPressed);
  const brakeRef = useRef(isBrakePressed);
  const leftRef = useRef(isLeftPressed);
  const rightRef = useRef(isRightPressed);
  const nitroRef = useRef(isNitroPressed);

  gasRef.current = isGasPressed;
  brakeRef.current = isBrakePressed;
  leftRef.current = isLeftPressed;
  rightRef.current = isRightPressed;
  nitroRef.current = isNitroPressed;

  // Global touch cleanup when finger lifts outside button
  useEffect(() => {
    const handleGlobalRelease = () => {
      if (gasRef.current) {
        setIsGasPressed(false);
        onThrottle(false);
      }
      if (brakeRef.current) {
        setIsBrakePressed(false);
        onBrake(false);
      }
      if (leftRef.current) {
        setIsLeftPressed(false);
        onSteer(0);
      }
      if (rightRef.current) {
        setIsRightPressed(false);
        onSteer(0);
      }
      if (nitroRef.current) {
        setIsNitroPressed(false);
        onNitro(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [onThrottle, onBrake, onSteer, onNitro]);

  // Synchronize steering
  useEffect(() => {
    if (isLeftPressed && !isRightPressed) {
      onSteer(-1);
    } else if (isRightPressed && !isLeftPressed) {
      onSteer(1);
    } else {
      onSteer(0);
    }
  }, [isLeftPressed, isRightPressed, onSteer]);

  // Synchronize gas throttle
  useEffect(() => {
    if (isBrakePressed) {
      onThrottle(false);
    } else if (isGasPressed) {
      onThrottle(true);
    } else if (isAutoCruise) {
      onThrottle(true);
    } else {
      onThrottle(false);
    }
  }, [isGasPressed, isBrakePressed, isAutoCruise, onThrottle]);

  // Synchronize brake
  useEffect(() => {
    onBrake(isBrakePressed);
  }, [isBrakePressed, onBrake]);

  // Synchronize nitro
  useEffect(() => {
    onNitro(isNitroPressed);
  }, [isNitroPressed, onNitro]);

  // Calculate dynamic gear from speed
  const currentGear =
    telemetry.speedKmh <= 0
      ? 'N'
      : telemetry.speedKmh < 45
      ? '1'
      : telemetry.speedKmh < 95
      ? '2'
      : telemetry.speedKmh < 155
      ? '3'
      : telemetry.speedKmh < 215
      ? '4'
      : telemetry.speedKmh < 275
      ? '5'
      : '6';

  const speedRatio = Math.min(1.0, telemetry.speedKmh / 320);
  const diffConfig = telemetry.difficulty ? DIFFICULTY_CONFIGS[telemetry.difficulty] : undefined;

  // Touch Handlers for Gas
  const handleGasStart = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsGasPressed(true);
      onThrottle(true);
    },
    [onThrottle]
  );

  const handleGasEnd = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsGasPressed(false);
      if (!isAutoCruise) {
        onThrottle(false);
      }
    },
    [isAutoCruise, onThrottle]
  );

  // Touch Handlers for Brake
  const handleBrakeStart = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsBrakePressed(true);
      onBrake(true);
    },
    [onBrake]
  );

  const handleBrakeEnd = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsBrakePressed(false);
      onBrake(false);
    },
    [onBrake]
  );

  // Touch Handlers for Nitro
  const handleNitroStart = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsNitroPressed(true);
      onNitro(true);
    },
    [onNitro]
  );

  const handleNitroEnd = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsNitroPressed(false);
      onNitro(false);
    },
    [onNitro]
  );

  // Touch Handlers for Left Steer
  const handleLeftStart = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLeftPressed(true);
  }, []);

  const handleLeftEnd = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLeftPressed(false);
  }, []);

  // Touch Handlers for Right Steer
  const handleRightStart = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsRightPressed(true);
  }, []);

  const handleRightEnd = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsRightPressed(false);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6 lg:p-7 z-10 select-none overflow-hidden touch-none">
      {/* 1. TOP HEADER HUD BAR (Score, Multiplier, Distance, Coins, Difficulty, Controls Guide, Pause) */}
      <header className="w-full flex items-center justify-between pointer-events-auto">
        {/* Left Telemetry: Score & Multiplier */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-neutral-950/90 backdrop-blur-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-2xl border border-neutral-800 shadow-xl flex items-center gap-2 sm:gap-3">
            <div>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 font-chakra font-semibold tracking-wider uppercase block">
                SCORE
              </span>
              <span className="font-chakra font-bold text-base sm:text-xl md:text-2xl text-white tracking-wide">
                {telemetry.score.toLocaleString()}
              </span>
            </div>

            {telemetry.currentMultiplier > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-black font-chakra font-black text-[10px] sm:text-xs animate-bounce shadow-md">
                {telemetry.currentMultiplier}X
              </span>
            )}
          </div>

          <div className="bg-neutral-950/90 backdrop-blur-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-2xl border border-neutral-800 shadow-xl hidden sm:block">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 font-chakra font-semibold tracking-wider uppercase block">
              DISTANCE
            </span>
            <span className="font-chakra font-bold text-base sm:text-xl md:text-2xl text-cyan-400 tracking-wide font-mono">
              {telemetry.distanceMeters.toLocaleString()} <span className="text-xs text-neutral-400">m</span>
            </span>
          </div>

          {/* Difficulty Level Tag */}
          {diffConfig && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border backdrop-blur-md ${diffConfig.bgColor} ${diffConfig.borderColor}`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span className={`font-chakra font-black text-xs tracking-wider uppercase ${diffConfig.textColor}`}>
                {diffConfig.label}
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-300 ml-0.5">
                {diffConfig.badge}
              </span>
            </div>
          )}
        </div>

        {/* Center: Time Trial Clock / Target Checkpoint */}
        {mode === 'time_trial' && telemetry.timeRemaining !== undefined && (
          <div className="bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border border-amber-500/50 shadow-[0_0_20px_rgba(255,183,0,0.3)] flex items-center gap-2.5 animate-pulse">
            <Timer className={`w-4 h-4 sm:w-5 sm:h-5 ${telemetry.timeRemaining < 10 ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
            <div className="text-center">
              <span className="text-[9px] text-amber-300 font-mono font-bold tracking-widest block">
                CHECKPOINT IN {Math.max(0, (telemetry.targetDistance || 500) - telemetry.distanceMeters)}m
              </span>
              <span className={`font-mono font-black text-lg sm:text-2xl md:text-3xl ${telemetry.timeRemaining < 10 ? 'text-rose-400' : 'text-amber-300'}`}>
                {telemetry.timeRemaining.toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* Right: Mode Toggle, Coins, Controls Help & Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
          {/* Tablet/Mobile Auto-Cruise vs Manual Gas Mode Quick Switcher */}
          <button
            id="hud-cruise-toggle-btn"
            onClick={() => {
              audioManager.playClick();
              const next = !isAutoCruise;
              setIsAutoCruise(next);
              if (next) {
                onThrottle(true);
              } else if (!isGasPressed) {
                onThrottle(false);
              }
            }}
            title="Toggle between Manual Speed Control & Auto-Cruise"
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl border backdrop-blur-md transition-all flex items-center gap-1.5 text-[10px] sm:text-xs font-chakra font-bold cursor-pointer ${
              isAutoCruise
                ? 'bg-cyan-950/80 border-cyan-400/70 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isAutoCruise ? 'AUTO-CRUISE: ON' : 'MANUAL SPEED: ON'}</span>
            <span className="sm:hidden">{isAutoCruise ? 'CRUISE' : 'MANUAL'}</span>
          </button>

          {/* Controls Instruction Trigger */}
          <button
            id="hud-help-btn"
            onClick={() => {
              audioManager.playClick();
              setShowHelpModal(!showHelpModal);
            }}
            title="Speed & Driving Controls Instructions"
            className="p-2 sm:p-2.5 bg-neutral-950/85 hover:bg-neutral-800 backdrop-blur-md rounded-2xl border border-neutral-800 hover:border-cyan-500 transition-all text-neutral-300 hover:text-white shadow-xl flex items-center gap-1.5 cursor-pointer text-xs font-chakra font-bold"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">CONTROLS</span>
          </button>

          {/* Coins Display */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-950/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-neutral-800 shadow-xl">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="font-chakra font-bold text-sm sm:text-lg md:text-xl text-amber-300">
              {telemetry.coinsEarned.toLocaleString()}
            </span>
          </div>

          <button
            id="hud-pause-btn"
            onClick={() => {
              audioManager.playClick();
              onPause();
            }}
            aria-label="Pause Game"
            className="p-2 sm:p-2.5 md:p-3 bg-neutral-950/90 hover:bg-neutral-800 backdrop-blur-md rounded-2xl border border-neutral-800 hover:border-cyan-500 transition-all text-white active:scale-95 shadow-xl cursor-pointer"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* 2. SIDE PANELS: Power-Ups (Left) and Rewards (Right) - Center Road is 100% Unobstructed */}
      <div className="w-full flex-1 flex justify-between items-start pointer-events-none pt-2 sm:pt-4">
        {/* Left Side: Active Power-Ups Stack */}
        <div className="flex flex-col gap-1.5 sm:gap-2 max-w-[170px] sm:max-w-[210px] pointer-events-auto">
          {telemetry.activePowerUps.map((p) => {
            const progress = (p.remaining / p.duration) * 100;
            const isShield = p.type === 'shield';
            const isBoost = p.type === 'boost';
            const isMagnet = p.type === 'magnet';
            const isMultiplier = p.type === 'multiplier';

            return (
              <div
                key={p.type}
                className={`p-2 sm:p-2.5 rounded-2xl backdrop-blur-md border shadow-xl flex items-center gap-2 sm:gap-2.5 transition-all animate-slideInLeft ${
                  isShield
                    ? 'bg-cyan-950/85 border-cyan-400/80 shadow-[0_0_15px_rgba(0,229,255,0.35)]'
                    : isBoost
                    ? 'bg-rose-950/85 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                    : isMagnet
                    ? 'bg-amber-950/85 border-amber-400/80 shadow-[0_0_15px_rgba(255,183,0,0.35)]'
                    : 'bg-purple-950/85 border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                    isShield
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : isBoost
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : isMagnet
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {isShield && <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />}
                  {isBoost && <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />}
                  {isMagnet && <Magnet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />}
                  {isMultiplier && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-chakra font-black text-[10px] sm:text-xs uppercase tracking-wider text-white">
                      {p.type === 'multiplier' ? '2X SCORE' : p.type}
                    </span>
                    <span className="font-mono font-bold text-[10px] sm:text-xs text-neutral-200">
                      {p.remaining.toFixed(1)}s
                    </span>
                  </div>

                  <div className="w-full h-1 sm:h-1.5 bg-neutral-900/80 rounded-full overflow-hidden mt-0.5 sm:mt-1 border border-neutral-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-100 ${
                        isShield
                          ? 'bg-cyan-400'
                          : isBoost
                          ? 'bg-rose-500'
                          : isMagnet
                          ? 'bg-amber-400'
                          : 'bg-purple-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Near Miss & Bonus Score Popups Stack */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 max-w-[220px] sm:max-w-[260px] pointer-events-none">
          {nearMissPopups.map((popup) => (
            <div
              key={popup.id}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl border border-amber-300/60 shadow-[0_0_20px_rgba(255,183,0,0.6)] text-black font-chakra font-black text-[11px] sm:text-sm tracking-wider flex items-center gap-1.5 sm:gap-2 animate-bounce"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-current" />
              <span>{popup.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Speed Control Instruction Overlay / Tooltip Modal */}
      {showHelpModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-40 pointer-events-auto">
          <div className="w-full max-w-lg bg-neutral-950 border border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 text-white animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-6 h-6 text-cyan-400" />
                <h3 className="font-chakra font-black text-lg sm:text-xl tracking-wider text-white">
                  TABLET & DRIVING CONTROLS
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span className="font-chakra font-bold text-emerald-300 block text-sm">
                    🚀 GAS / SPEED UP (Accelerate)
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Hold the green GAS button to accelerate to top speed.
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                  [GAS] / [W] / [↑]
                </span>
              </div>

              <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-500/40 flex items-center justify-between">
                <div>
                  <span className="font-chakra font-bold text-rose-300 block text-sm">
                    🛑 BRAKE / SLOW DOWN (Decelerate)
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Tap or hold BRAKE to slow down instantly and dodge tight gaps.
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-xl border border-rose-500/40">
                  [BRAKE] / [S] / [↓]
                </span>
              </div>

              <div className="bg-cyan-950/40 p-3 rounded-2xl border border-cyan-500/40 flex items-center justify-between">
                <div>
                  <span className="font-chakra font-bold text-cyan-300 block text-sm">
                    ⚡ NITRO BOOST (Extreme Surge)
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Triggers high-velocity hyperdrive turbo boost.
                  </span>
                </div>
                <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/40">
                  [NITRO] / [SPACE]
                </span>
              </div>

              <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="font-chakra font-bold text-amber-300 block text-sm">
                    ◀ ▶ STEERING & LANE HOP
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Smoothly steer across 3 highway lanes.
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/40">
                  [◀ / ▶] / [A / D]
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-chakra font-black rounded-2xl cursor-pointer shadow-lg tracking-wider"
            >
              RESUME RACE
            </button>
          </div>
        </div>
      )}

      {/* 3. TABLET-OPTIMIZED BOTTOM COCKPIT & SPEED CONTROL DASHBOARD */}
      <footer className="w-full flex flex-col gap-2.5 pointer-events-none pb-1 sm:pb-2">
        {/* Desktop & Tablet Instruction Strip */}
        <div className="hidden lg:flex items-center justify-center pointer-events-auto">
          <div className="bg-neutral-950/85 backdrop-blur-md px-5 py-1.5 rounded-full border border-neutral-800/90 flex items-center gap-5 text-[11px] font-mono text-neutral-300 shadow-xl">
            <span className="flex items-center gap-1.5">
              <strong className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
                W / ↑ / [GAS PEDAL]
              </strong>
              <span className="text-neutral-300 font-sans">Speed Up</span>
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-600/40">
                S / ↓ / [BRAKE PEDAL]
              </strong>
              <span className="text-neutral-300 font-sans">Slow Down</span>
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-600/40">
                SPACE / [NITRO]
              </strong>
              <span className="text-neutral-300 font-sans">Turbo Boost</span>
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                A / D / [◀ ▶]
              </strong>
              <span className="text-neutral-300 font-sans">Steer</span>
            </span>
          </div>
        </div>

        {/* Main Tablet / Mobile Interactive Control Grid */}
        <div className="w-full flex items-end justify-between gap-2 sm:gap-4 md:gap-6">
          {/* ======================================================== */}
          {/* LEFT THUMB POD: STEERING & LANE CONTROL (TABLET OPTIMIZED) */}
          {/* ======================================================== */}
          <div className="flex flex-col items-start gap-1.5 pointer-events-auto">
            {/* Quick Lane Shift Tabs (Tablet / Mobile) */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                id="lane-shift-left-btn"
                onClick={() => {
                  audioManager.playClick();
                  onShiftLane('left');
                }}
                className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-800 active:scale-95 rounded-xl border border-neutral-700/60 text-[10px] font-chakra font-bold text-neutral-300 hover:text-white cursor-pointer shadow-md"
              >
                LANE ◄
              </button>
              <button
                id="lane-shift-right-btn"
                onClick={() => {
                  audioManager.playClick();
                  onShiftLane('right');
                }}
                className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-800 active:scale-95 rounded-xl border border-neutral-700/60 text-[10px] font-chakra font-bold text-neutral-300 hover:text-white cursor-pointer shadow-md"
              >
                ► LANE
              </button>
            </div>

            {/* Steering Left & Right Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Steer Left */}
              <button
                id="touch-left-btn"
                onTouchStart={handleLeftStart}
                onTouchEnd={handleLeftEnd}
                onTouchCancel={handleLeftEnd}
                onMouseDown={handleLeftStart}
                onMouseUp={handleLeftEnd}
                onMouseLeave={handleLeftEnd}
                aria-label="Steer Left"
                className={`w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-2xl md:rounded-3xl backdrop-blur-md border flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 cursor-pointer touch-none select-none ${
                  isLeftPressed
                    ? 'bg-cyan-500/45 border-cyan-400 shadow-[0_0_30px_rgba(0,229,255,0.7)] scale-105 ring-2 ring-cyan-300'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <ChevronLeft className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 text-cyan-400" />
                <span className="text-[9px] sm:text-[10px] md:text-xs font-chakra font-black tracking-wider text-cyan-300">
                  LEFT
                </span>
              </button>

              {/* Steer Right */}
              <button
                id="touch-right-btn"
                onTouchStart={handleRightStart}
                onTouchEnd={handleRightEnd}
                onTouchCancel={handleRightEnd}
                onMouseDown={handleRightStart}
                onMouseUp={handleRightEnd}
                onMouseLeave={handleRightEnd}
                aria-label="Steer Right"
                className={`w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-2xl md:rounded-3xl backdrop-blur-md border flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 cursor-pointer touch-none select-none ${
                  isRightPressed
                    ? 'bg-cyan-500/45 border-cyan-400 shadow-[0_0_30px_rgba(0,229,255,0.7)] scale-105 ring-2 ring-cyan-300'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <ChevronRight className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 text-cyan-400" />
                <span className="text-[9px] sm:text-[10px] md:text-xs font-chakra font-black tracking-wider text-cyan-300">
                  RIGHT
                </span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER CLUSTER: DIGITAL SPEEDOMETER & TELEMETRY RPM POD  */}
          {/* ======================================================== */}
          <div className="flex flex-col items-center bg-neutral-950/90 backdrop-blur-xl px-3.5 sm:px-6 md:px-8 py-2 sm:py-3 rounded-3xl border border-neutral-800 shadow-2xl pointer-events-auto min-w-[130px] sm:min-w-[180px] md:min-w-[220px]">
            {/* Real-Time Driving Status Badge */}
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={`w-2 h-2 rounded-full animate-ping ${
                  isBrakePressed
                    ? 'bg-rose-500'
                    : isNitroPressed || telemetry.isNitroActive
                    ? 'bg-purple-400'
                    : isGasPressed || isAutoCruise
                    ? 'bg-emerald-400'
                    : 'bg-cyan-400'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] font-chakra font-bold tracking-widest uppercase text-neutral-300">
                {isBrakePressed
                  ? 'BRAKING'
                  : isNitroPressed || telemetry.isNitroActive
                  ? 'NITRO BOOST'
                  : isGasPressed
                  ? 'ACCELERATING'
                  : isAutoCruise
                  ? 'CRUISING'
                  : 'COASTING'}
              </span>
            </div>

            {/* Speed Number & Gear Indicator */}
            <div className="flex items-baseline justify-center gap-2">
              <div className="flex items-baseline gap-1">
                <span className="font-chakra font-black text-3xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 tracking-tighter font-mono">
                  {telemetry.speedKmh}
                </span>
                <span className="font-chakra font-bold text-[10px] sm:text-xs md:text-sm text-cyan-400 uppercase tracking-widest">
                  KM/H
                </span>
              </div>

              {/* Dynamic Gear Shift Indicator */}
              <div className="bg-neutral-900/90 px-2 py-0.5 sm:py-1 rounded-xl border border-neutral-700/60 flex items-center gap-1">
                <span className="text-[8px] sm:text-[10px] font-mono text-neutral-400 font-bold">GEAR</span>
                <span className="text-xs sm:text-sm md:text-base font-chakra font-black text-cyan-300">
                  {currentGear}
                </span>
              </div>
            </div>

            {/* RPM / Speed Multi-Stage Arc Bar */}
            <div className="w-28 sm:w-40 md:w-52 h-2 sm:h-2.5 bg-neutral-900 rounded-full overflow-hidden mt-1 sm:mt-1.5 border border-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  telemetry.isNitroActive
                    ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_15px_#bf00ff]'
                    : isGasPressed
                    ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${speedRatio * 100}%` }}
              />
            </div>

            {/* Distance Summary (Mobile/Tablet View) */}
            <div className="text-[9px] sm:text-[10px] font-mono text-neutral-400 mt-1">
              DIST: {telemetry.distanceMeters.toLocaleString()}m
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT THUMB POD: DEDICATED TABLET SPEED CONTROL POD       */}
          {/* ======================================================== */}
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            {/* Speed Control Instruction Chip */}
            <div className="text-[9px] sm:text-[10px] font-chakra font-bold uppercase tracking-wider text-neutral-400 pr-1 hidden sm:block">
              SPEED CONTROLS
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* 1. BRAKE PEDAL (Slow Down / Stop) */}
              <button
                id="touch-brake-btn"
                onTouchStart={handleBrakeStart}
                onTouchEnd={handleBrakeEnd}
                onTouchCancel={handleBrakeEnd}
                onMouseDown={handleBrakeStart}
                onMouseUp={handleBrakeEnd}
                onMouseLeave={handleBrakeEnd}
                title="Brake / Slow Down [Hold S or ↓]"
                aria-label="Brake Pedal"
                className={`w-14 h-16 sm:w-18 sm:h-20 md:w-22 md:h-24 rounded-2xl md:rounded-3xl backdrop-blur-md border flex flex-col items-center justify-between py-2 sm:py-2.5 transition-all shadow-2xl active:scale-95 cursor-pointer touch-none select-none relative overflow-hidden ${
                  isBrakePressed
                    ? 'bg-rose-600/55 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.7)] scale-105 ring-2 ring-rose-300'
                    : 'bg-neutral-950/85 border-neutral-800 hover:border-rose-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-center">
                  <ArrowDown className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isBrakePressed ? 'text-white' : 'text-rose-400'}`} />
                </div>
                <div className="text-center">
                  <span className={`font-chakra font-black text-[10px] sm:text-xs md:text-sm tracking-wider uppercase block ${isBrakePressed ? 'text-white' : 'text-rose-400'}`}>
                    BRAKE
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 block -mt-0.5">
                    SLOW
                  </span>
                </div>
              </button>

              {/* 2. GAS PEDAL (Speed Up / Accelerate - Primary Speed Control) */}
              <button
                id="touch-gas-btn"
                onTouchStart={handleGasStart}
                onTouchEnd={handleGasEnd}
                onTouchCancel={handleGasEnd}
                onMouseDown={handleGasStart}
                onMouseUp={handleGasEnd}
                onMouseLeave={handleGasEnd}
                title="Gas Pedal / Accelerate [Hold W or ↑]"
                aria-label="Gas Pedal"
                className={`w-16 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 rounded-2xl md:rounded-3xl backdrop-blur-md border flex flex-col items-center justify-between py-2 sm:py-3 transition-all shadow-2xl active:scale-95 cursor-pointer touch-none select-none relative overflow-hidden ${
                  isGasPressed
                    ? 'bg-emerald-600/55 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-105 ring-2 ring-emerald-300'
                    : isAutoCruise
                    ? 'bg-emerald-950/50 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-neutral-950/85 border-neutral-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-center">
                  <ArrowUp className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isGasPressed ? 'text-white animate-bounce' : 'text-emerald-400'}`} />
                </div>
                <div className="text-center">
                  <span className={`font-chakra font-black text-xs sm:text-sm md:text-base tracking-wider uppercase block ${isGasPressed ? 'text-white' : 'text-emerald-400'}`}>
                    GAS
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-emerald-300/80 block -mt-0.5">
                    SPEED UP
                  </span>
                </div>
              </button>

              {/* 3. NITRO TURBO BOOST BUTTON */}
              <button
                id="touch-nitro-btn"
                onTouchStart={handleNitroStart}
                onTouchEnd={handleNitroEnd}
                onTouchCancel={handleNitroEnd}
                onMouseDown={handleNitroStart}
                onMouseUp={handleNitroEnd}
                onMouseLeave={handleNitroEnd}
                title="Nitro Boost [Spacebar]"
                aria-label="Nitro Boost Button"
                className={`w-14 h-16 sm:w-18 sm:h-20 md:w-22 md:h-24 rounded-2xl md:rounded-3xl backdrop-blur-md border flex flex-col items-center justify-between py-2 sm:py-2.5 transition-all shadow-2xl active:scale-95 cursor-pointer touch-none select-none relative overflow-hidden ${
                  telemetry.isNitroActive
                    ? 'bg-gradient-to-br from-cyan-400 to-purple-600 border-cyan-300 shadow-[0_0_40px_rgba(0,229,255,0.9)] scale-105 ring-2 ring-cyan-300'
                    : telemetry.nitroPercent > 20
                    ? 'bg-gradient-to-br from-cyan-950/90 to-neutral-900 border-cyan-500/50 hover:border-cyan-400'
                    : 'bg-neutral-900/60 border-neutral-800 opacity-60'
                }`}
              >
                <div className="w-full flex items-center justify-center pt-0.5">
                  <Zap className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${telemetry.isNitroActive ? 'text-white animate-pulse' : 'text-cyan-400'}`} />
                </div>
                <div className="text-center">
                  <span className="font-chakra font-black text-[10px] sm:text-xs md:text-sm text-white uppercase tracking-wider block">
                    NITRO
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-cyan-300 block -mt-0.5">
                    {Math.round(telemetry.nitroPercent)}%
                  </span>
                </div>

                {/* Capacitor Charge Level Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-neutral-900">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    style={{ width: `${telemetry.nitroPercent}%` }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
