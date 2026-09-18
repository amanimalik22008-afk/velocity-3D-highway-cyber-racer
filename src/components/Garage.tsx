import React, { useState } from 'react';
import { CarData, PlayerProfile } from '../types';
import { CARS_CATALOG } from '../utils/carsData';
import { audioManager } from '../audio/AudioManager';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gauge,
  Zap,
  Activity,
  Shield,
  Palette,
  Check,
  Lock,
  Flame,
} from 'lucide-react';

interface GarageProps {
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
  onSelectCarInEngine: (car: CarData, customColor?: string) => void;
  onClose: () => void;
}

export const Garage: React.FC<GarageProps> = ({
  profile,
  onUpdateProfile,
  onSelectCarInEngine,
  onClose,
}) => {
  const initialIndex = Math.max(
    0,
    CARS_CATALOG.findIndex((c) => c.id === profile.selectedCarId)
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentCar = CARS_CATALOG[currentIndex];
  const isUnlocked = profile.unlockedCarIds.includes(currentCar.id);
  const isEquipped = profile.selectedCarId === currentCar.id;
  const currentColor =
    profile.customCarColors[currentCar.id] || currentCar.primaryColor;

  const handlePrev = () => {
    audioManager.playClick();
    const nextIdx = (currentIndex - 1 + CARS_CATALOG.length) % CARS_CATALOG.length;
    setCurrentIndex(nextIdx);
    const car = CARS_CATALOG[nextIdx];
    const col = profile.customCarColors[car.id] || car.primaryColor;
    onSelectCarInEngine(car, col);
  };

  const handleNext = () => {
    audioManager.playClick();
    const nextIdx = (currentIndex + 1) % CARS_CATALOG.length;
    setCurrentIndex(nextIdx);
    const car = CARS_CATALOG[nextIdx];
    const col = profile.customCarColors[car.id] || car.primaryColor;
    onSelectCarInEngine(car, col);
  };

  const handleSelectColor = (color: string) => {
    audioManager.playClick();
    const updatedColors = {
      ...profile.customCarColors,
      [currentCar.id]: color,
    };
    const updatedProfile = {
      ...profile,
      customCarColors: updatedColors,
    };
    onUpdateProfile(updatedProfile);
    onSelectCarInEngine(currentCar, color);
  };

  const handleEquip = () => {
    audioManager.playClick();
    const updatedProfile = {
      ...profile,
      selectedCarId: currentCar.id,
    };
    onUpdateProfile(updatedProfile);
  };

  const handleUnlock = () => {
    if (profile.coins < currentCar.price) {
      audioManager.playCrash(); // Fail tone
      return;
    }
    audioManager.playUnlock();
    const updatedProfile = {
      ...profile,
      coins: profile.coins - currentCar.price,
      unlockedCarIds: [...profile.unlockedCarIds, currentCar.id],
      selectedCarId: currentCar.id,
    };
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8 pointer-events-none z-10 select-none">
      {/* Top Bar */}
      <header className="w-full flex items-center justify-between pointer-events-auto">
        <button
          id="garage-back-btn"
          onClick={() => {
            audioManager.playClick();
            // Restore active equipped car
            const equippedCar =
              CARS_CATALOG.find((c) => c.id === profile.selectedCarId) ||
              CARS_CATALOG[0];
            const col =
              profile.customCarColors[equippedCar.id] || equippedCar.primaryColor;
            onSelectCarInEngine(equippedCar, col);
            onClose();
          }}
          className="p-3 sm:px-4 sm:py-2.5 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md rounded-xl border border-neutral-800 hover:border-cyan-500/50 transition-all flex items-center gap-2 text-white"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span className="font-chakra font-semibold text-sm hidden sm:inline">Back to Menu</span>
        </button>

        <h2 className="font-chakra font-bold text-xl sm:text-2xl text-white tracking-widest uppercase">
          GARAGE SHOWROOM
        </h2>

        {/* Currency Display */}
        <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-800 shadow-md">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="font-chakra font-bold text-lg text-amber-300">
            {profile.coins.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Middle Carousel Navigation Arrows */}
      <div className="w-full flex items-center justify-between pointer-events-auto px-2">
        <button
          id="garage-prev-btn"
          onClick={handlePrev}
          aria-label="Previous Car"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all backdrop-blur-md shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          id="garage-next-btn"
          onClick={handleNext}
          aria-label="Next Car"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all backdrop-blur-md shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Vehicle Inspector Card */}
      <footer className="w-full max-w-4xl mx-auto bg-neutral-950/85 backdrop-blur-xl border border-neutral-800 rounded-3xl p-5 sm:p-6 pointer-events-auto shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-chakra font-bold text-xl sm:text-2xl text-white">
                {currentCar.name}
              </h3>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {currentCar.tier}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
              {currentCar.description}
            </p>
          </div>

          {/* Unlock / Equip Action Button */}
          <div>
            {isUnlocked ? (
              <button
                id="garage-equip-btn"
                onClick={handleEquip}
                disabled={isEquipped}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-chakra font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isEquipped
                    ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                }`}
              >
                {isEquipped ? (
                  <>
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>EQUIPPED</span>
                  </>
                ) : (
                  <span>EQUIP CAR</span>
                )}
              </button>
            ) : (
              <button
                id="garage-buy-btn"
                onClick={handleUnlock}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-chakra font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  profile.coins >= currentCar.price
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(255,183,0,0.4)]'
                    : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-80'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>UNLOCK FOR {currentCar.price.toLocaleString()} COINS</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid & Paint Customizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Performance Specs */}
          <div className="flex flex-col gap-2.5">
            {/* Top Speed */}
            <div>
              <div className="flex justify-between text-xs font-chakra font-semibold mb-1">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Top Speed
                </span>
                <span className="text-white font-mono">{currentCar.stats.topSpeed} km/h</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentCar.stats.topSpeed / 340) * 100}%` }}
                />
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <div className="flex justify-between text-xs font-chakra font-semibold mb-1">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Acceleration
                </span>
                <span className="text-white font-mono">{currentCar.stats.acceleration}/10</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${currentCar.stats.acceleration * 10}%` }}
                />
              </div>
            </div>

            {/* Handling */}
            <div>
              <div className="flex justify-between text-xs font-chakra font-semibold mb-1">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Handling
                </span>
                <span className="text-white font-mono">{currentCar.stats.handling}/10</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${currentCar.stats.handling * 10}%` }}
                />
              </div>
            </div>

            {/* Nitro */}
            <div>
              <div className="flex justify-between text-xs font-chakra font-semibold mb-1">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Nitro Capacity
                </span>
                <span className="text-white font-mono">{currentCar.stats.nitroCapacity}/10</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${currentCar.stats.nitroCapacity * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Paint Customizer */}
          <div className="flex flex-col justify-between bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-chakra font-semibold text-neutral-300 mb-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>CUSTOM BODY PAINT FINISH</span>
              </div>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {currentCar.availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleSelectColor(color)}
                    aria-label={`Select paint color ${color}`}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all relative cursor-pointer ${
                      currentColor.toLowerCase() === color.toLowerCase()
                        ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                        : 'border-neutral-700 hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentColor.toLowerCase() === color.toLowerCase() && (
                      <Check className="w-4 h-4 text-black absolute inset-0 m-auto stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 font-mono mt-3">
              * Upgrades and custom finishes apply in all racing game modes.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
