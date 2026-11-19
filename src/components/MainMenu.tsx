import {
  BookOpen,
  Coins,
  LogOut,
  Package,
  Play,
  Shield,
  Trophy,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { EQUIPMENT_CATALOG, getRankForXp, TABUNG_QUESTIONS } from '../data/questions';
import { PlayerSaveData } from '../types/game';
import { MenuDiorama3D } from './MenuDiorama3D';

interface MainMenuProps {
  save: PlayerSaveData;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onStartAdventure: () => void;
  onOpenGuide: () => void;
  onOpenProfile: () => void;
  onOpenInventory: () => void;
  onReturnToGate: () => void;
}

export function MainMenu({
  save,
  musicEnabled,
  onToggleMusic,
  onStartAdventure,
  onOpenGuide,
  onOpenProfile,
  onOpenInventory,
  onReturnToGate,
}: MainMenuProps) {
  const rank = getRankForXp(save.xp);
  const solvedCount = TABUNG_QUESTIONS.filter(
    (q) => save.tabungStatus[q.id]?.solved,
  ).length;
  const ownedEquipmentNames = EQUIPMENT_CATALOG.filter(
    (item) => (save.inventory[item.id] ?? 0) > 0,
  ).map((i) => i.name);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0c1912]">
      {/* Live 3D Istana, Raja Mustafar & Awang Kenit Diorama */}
      <MenuDiorama3D />

      {/* Top Gradient Scrim for legibility */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10, 22, 15, 0.88) 0%, rgba(10, 22, 15, 0.45) 60%, transparent 100%)',
        }}
      />
      {/* Bottom Gradient Scrim */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
        style={{
          background:
            'linear-gradient(to top, rgba(10, 22, 15, 0.94) 0%, rgba(10, 22, 15, 0.65) 55%, transparent 100%)',
        }}
      />

      {/* Top Title & Stats Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-amber-300">
            PENGEMBARAAN 3D NUSANTARA · KATA ADJEKTIF
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-amber-50 tracking-tight drop-shadow-md">
            MEDAN PENDEKAR BAHASA
          </h1>
          <p className="text-sm sm:text-base font-medium text-amber-200">
            &ldquo;Terokai Medan, Cari Tabung, Kuasai Bahasa!&rdquo;
          </p>
        </div>

        {/* Player Summary Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#12261b]/95 border border-amber-500/40 rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-100/80">Kupang:</span>
              <span className="font-mono-num font-bold text-amber-300">
                {save.kupang}
              </span>
            </div>
            <span aria-hidden="true" className="text-amber-500/40">
              |
            </span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-emerald-200">
                {rank.title}
              </span>
            </div>
            <span aria-hidden="true" className="text-amber-500/40">
              |
            </span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-100/80">Tabung:</span>
              <span className="font-mono-num font-bold text-amber-300">
                {solvedCount}/5
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={musicEnabled ? 'Senyapkan Muzik' : 'Hidupkan Muzik'}
            className="h-11 px-3.5 rounded-lg bg-[#12261b]/95 border border-amber-500/40 hover:bg-[#1c3828] text-amber-200 flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            {musicEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {musicEnabled ? 'Muzik Hidup' : 'Muzik Senyap'}
            </span>
          </button>
        </div>
      </header>

      {/* Awang Kenit Speech Callout (Left side, non-obstructive) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 mt-4 hidden md:block">
        <div className="max-w-sm bg-[#12261b]/90 border border-emerald-500/40 rounded-lg p-3.5 text-xs text-emerald-50 leading-relaxed shadow-lg">
          <p className="font-bold text-amber-300 mb-1">
            Awang Kenit (Pemandu Pengembaraan):
          </p>
          <p>
            &ldquo;Selamat datang, {save.playerName}! Lima Tabung Pitis sedang
            menanti anda di sekitar hutan, gua, kampung, lembah dan istana.
            Peralatan aktif: {ownedEquipmentNames.join(', ') || 'Tiada'}.&rdquo;
          </p>
        </div>
      </div>

      {/* Bottom Action Dock with the 5 Required Buttons */}
      <footer className="absolute inset-x-0 bottom-0 z-10 px-4 md:px-8 pb-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
          <div className="w-full bg-[#12261b]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onStartAdventure}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm sm:text-base whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>MULAKAN PENGEMBARAAN</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1c3828] hover:bg-[#244a35] border border-emerald-500/30 text-amber-50 font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>PANDUAN PERMAINAN</span>
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1c3828] hover:bg-[#244a35] border border-emerald-500/30 text-amber-50 font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-amber-300" />
              <span>PROFIL PENDEKAR</span>
            </button>

            <button
              type="button"
              onClick={onOpenInventory}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1c3828] hover:bg-[#244a35] border border-emerald-500/30 text-amber-50 font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-sky-300" />
              <span>INVENTORI</span>
            </button>

            <button
              type="button"
              onClick={onReturnToGate}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3b1515] hover:bg-[#521e1e] border border-red-400/30 text-red-100 font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-300" />
              <span>KEMBALI KE MENU UTAMA</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
