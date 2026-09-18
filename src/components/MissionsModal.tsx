import React from 'react';
import { Mission, PlayerProfile } from '../types';
import { audioManager } from '../audio/AudioManager';
import {
  X,
  Target,
  Coins,
  CheckCircle2,
  Award,
  Flame,
  Gauge,
  Timer,
} from 'lucide-react';

interface MissionsModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const handleClaim = (mission: Mission) => {
    audioManager.playUnlock();
    const updatedMissions = profile.missions.map((m) =>
      m.id === mission.id ? { ...m, claimed: true } : m
    );
    const updatedProfile = {
      ...profile,
      coins: profile.coins + mission.rewardCoins,
      missions: updatedMissions,
    };
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-xl bg-neutral-950/95 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-chakra font-bold text-2xl text-white tracking-wider">
                MISSION OBJECTIVES
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Complete milestones on the highway for bounty rewards
              </p>
            </div>
          </div>

          <button
            id="missions-close-btn"
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Items List */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {profile.missions.map((mission) => {
            const progressRatio = Math.min(1.0, mission.current / mission.target);
            const percent = Math.floor(progressRatio * 100);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  mission.claimed
                    ? 'bg-neutral-900/40 border-neutral-800 opacity-60'
                    : mission.completed
                    ? 'bg-gradient-to-r from-amber-950/40 to-neutral-900/80 border-amber-500/50 shadow-[0_0_15px_rgba(255,183,0,0.15)]'
                    : 'bg-neutral-900/60 border-neutral-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-chakra font-bold text-sm sm:text-base text-white">
                      {mission.title}
                    </h4>
                    {mission.claimed && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        CLAIMED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">
                    {mission.description}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        mission.completed
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                    <span>PROGRESS: {percent}%</span>
                    <span>
                      {mission.current.toLocaleString()} / {mission.target.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Claim / Reward Button */}
                <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-chakra font-bold text-sm sm:text-base">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>+{mission.rewardCoins}</span>
                  </div>

                  {mission.completed && !mission.claimed ? (
                    <button
                      onClick={() => handleClaim(mission)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-chakra font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(255,183,0,0.4)] animate-pulse transition-all cursor-pointer"
                    >
                      CLAIM REWARD
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
