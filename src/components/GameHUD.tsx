import { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Crown,
  Gamepad2,
  Hand,
  Heart,
  Menu,
  Package,
  ShieldCheck,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getRankForXp, MONSTERS, TABUNG_QUESTIONS } from '../data/questions';
import { WorldTelemetry } from '../game/WorldEngine';
import { PlayerSaveData } from '../types/game';

interface GameHUDProps {
  save: PlayerSaveData;
  telemetry: WorldTelemetry;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onInteract: () => void;
  onJump: () => void;
  onToggleRun: (running: boolean) => void;
  onJoystickMove: (x: number, y: number) => void;
  onOpenInventory: () => void;
  onOpenPauseMenu: () => void;
  onOpenFinalExam: () => void;
}

export function GameHUD({
  save,
  telemetry,
  musicEnabled,
  onToggleMusic,
  onInteract,
  onJump,
  onToggleRun,
  onJoystickMove,
  onOpenInventory,
  onOpenPauseMenu,
  onOpenFinalExam,
}: GameHUDProps) {
  const [missionOpen, setMissionOpen] = useState(true);
  const [touchRunning, setTouchRunning] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(() =>
    typeof window !== 'undefined'
      ? 'ontouchstart' in window || window.innerWidth < 960
      : false,
  );
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);

  const rank = getRankForXp(save.xp);
  const solvedCount = TABUNG_QUESTIONS.filter(
    (q) => save.tabungStatus[q.id]?.solved,
  ).length;

  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    onJoystickMove(dx / maxR, dy / maxR);
  };

  const resetJoystick = () => {
    joyPointerId.current = null;
    setJoyKnob({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP BAR: Top-Left Avatar/Stats & Top-Right Kupang/Tabung/Controls */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Raja Mustafar Identity, Rank, Tenaga & Location */}
        <div className="pointer-events-auto bg-[#112118]/92 border border-amber-500/45 rounded-xl px-3.5 py-2.5 shadow-lg max-w-[270px] sm:max-w-xs space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#7f1d1d] border border-amber-400/60 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-amber-100 truncate">
                {save.playerName}
              </p>
              <p className="text-[11px] font-bold text-emerald-300 truncate">
                {rank.title}
              </p>
            </div>
          </div>

          {/* Tenaga Bar */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-mono-num">
              <span className="text-emerald-200 flex items-center gap-1">
                <Heart className="w-3 h-3 text-emerald-400" />
                <span>Tenaga</span>
              </span>
              <span className="text-emerald-300 font-bold">
                {save.hp}/{save.maxHp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/50 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{ width: `${(save.hp / save.maxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Location */}
          <p className="text-[11px] text-amber-200/85 truncate pt-0.5">
            Lokasi: <strong className="text-amber-300">{telemetry.locationName}</strong>
          </p>
        </div>

        {/* Top-Right: Kupang, Tabung Counter, Minimap, Audio, Menu */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            <div className="bg-[#112118]/92 border border-amber-500/45 rounded-xl px-3.5 py-2 flex items-center gap-3 text-xs sm:text-sm shadow-lg">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-mono-num font-extrabold text-amber-300">
                  {save.kupang}
                </span>
              </div>
              <span aria-hidden="true" className="text-amber-500/40">
                |
              </span>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="font-mono-num font-extrabold text-emerald-300">
                  {solvedCount}/5
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTouchPad((v) => !v)}
              title="Togol Kawalan Sentuh"
              className="h-10 px-2.5 rounded-xl bg-[#112118]/92 border border-amber-500/40 text-amber-200 hover:bg-[#1a3325] flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden md:inline">Sentuh</span>
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              aria-label="Kawalan Muzik"
              className="h-10 w-10 rounded-xl bg-[#112118]/92 border border-amber-500/40 text-amber-200 hover:bg-[#1a3325] flex items-center justify-center cursor-pointer"
            >
              {musicEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPauseMenu}
              aria-label="Menu Permainan"
              className="h-10 px-3 rounded-xl bg-[#112118]/92 border border-amber-500/40 text-amber-100 hover:bg-[#1a3325] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Menu (ESC)</span>
            </button>
          </div>

          {/* Collapsible Misi Tabung Pitis Tracker + Mini Radar */}
          <div className="pointer-events-auto bg-[#112118]/90 border border-amber-500/35 rounded-xl p-2.5 w-52 sm:w-56 shadow-lg">
            <button
              type="button"
              onClick={() => setMissionOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-extrabold text-amber-300 cursor-pointer"
            >
              <span>MISI TABUNG PITIS ({solvedCount}/5)</span>
              {missionOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {missionOpen && (
              <div className="mt-2 space-y-2">
                {/* Compact Radar Map */}
                <div className="relative w-full h-24 rounded-lg bg-[#09140e] border border-emerald-700/40 overflow-hidden">
                  {/* Tabung Dots */}
                  {TABUNG_QUESTIONS.map((q) => {
                    const solved = save.tabungStatus[q.id]?.solved;
                    const px = ((q.position[0] + 105) / 210) * 100;
                    const pz = ((q.position[1] + 105) / 210) * 100;
                    return (
                      <div
                        key={q.id}
                        title={`Tabung ${q.id}: ${q.locationName}`}
                        className={`absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-sm ${
                          solved ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ left: `${px}%`, top: `${pz}%` }}
                      />
                    );
                  })}
                  {/* Raksasa Dots */}
                  {MONSTERS.map((m) => {
                    if (save.defeatedMonsters.includes(m.id)) return null;
                    const mx = ((m.position[0] + 105) / 210) * 100;
                    const mz = ((m.position[1] + 105) / 210) * 100;
                    return (
                      <div
                        key={m.id}
                        title={m.name}
                        className="absolute w-2 h-2 -ml-1 -mt-1 rotate-45 bg-red-500 border border-amber-200/70"
                        style={{ left: `${mx}%`, top: `${mz}%` }}
                      />
                    );
                  })}
                  {/* Player Dot */}
                  <div
                    className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border-2 border-sky-400"
                    style={{
                      left: `${((telemetry.x + 105) / 210) * 100}%`,
                      top: `${((telemetry.z + 105) / 210) * 100}%`,
                    }}
                  />
                  <span className="absolute bottom-1 left-1.5 text-[9px] text-amber-200/70">
                    Kuning: Tabung · Merah: Raksasa
                  </span>
                </div>

                <ul className="space-y-1 text-[11px]">
                  {TABUNG_QUESTIONS.map((q) => {
                    const solved = save.tabungStatus[q.id]?.solved;
                    return (
                      <li
                        key={q.id}
                        className="flex items-center justify-between gap-1"
                      >
                        <span className="text-amber-50/85 truncate">
                          Tabung {q.id}: {q.locationName}
                        </span>
                        <span
                          className={`font-mono-num font-bold shrink-0 ${
                            solved ? 'text-emerald-400' : 'text-amber-300/70'
                          }`}
                        >
                          {solved ? 'SELESAI' : 'Belum'}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {solvedCount === 5 && (
                  <button
                    type="button"
                    onClick={onOpenFinalExam}
                    className="w-full py-2 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>UJIAN TERAKHIR</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER-BOTTOM PROMPT & BOTTOM CONTROLS */}
      <div className="space-y-3">
        {/* Nearby Interactive Prompt */}
        {telemetry.nearby && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onInteract}
              className="pointer-events-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-2xl border-2 border-amber-200 flex items-center gap-2 cursor-pointer"
            >
              <Hand className="w-4 h-4" />
              <span>{telemetry.nearby.promptText}</span>
            </button>
          </div>
        )}

        {/* Bottom Controls Row */}
        <div className="flex items-end justify-between gap-3">
          {/* Bottom-Left: Virtual Joystick (on touch/mobile or toggled) */}
          <div>
            {showTouchPad ? (
              <div
                ref={joyRef}
                onPointerDown={(e) => {
                  joyPointerId.current = e.pointerId;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updateJoystickFromEvent(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (joyPointerId.current === e.pointerId) {
                    updateJoystickFromEvent(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={resetJoystick}
                onPointerCancel={resetJoystick}
                className="pointer-events-auto relative w-28 h-28 rounded-full bg-[#112118]/80 border-2 border-amber-500/50 touch-none flex items-center justify-center"
              >
                <div
                  className="w-11 h-11 rounded-full bg-amber-500 border-2 border-amber-200 shadow-md"
                  style={{
                    transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
                  }}
                />
              </div>
            ) : (
              <div className="hidden sm:block bg-[#112118]/85 border border-amber-500/30 rounded-lg px-3 py-1.5 text-[11px] font-mono-num text-amber-100/80">
                WASD Gerak · SPACE Lompat · SHIFT Lari · E Interaksi · Seret Skrin Kamera
              </div>
            )}
          </div>

          {/* Bottom-Right: Inventory + Touch Action Buttons */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            {showTouchPad && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const next = !touchRunning;
                    setTouchRunning(next);
                    onToggleRun(next);
                  }}
                  className={`h-12 px-3.5 rounded-xl border font-bold text-xs cursor-pointer ${
                    touchRunning
                      ? 'bg-amber-500 text-slate-950 border-amber-200'
                      : 'bg-[#112118]/90 text-amber-100 border-amber-500/45'
                  }`}
                >
                  LARI
                </button>
                <button
                  type="button"
                  onClick={onJump}
                  className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/50 text-white font-extrabold text-xs cursor-pointer"
                >
                  LOMPAT
                </button>
                <button
                  type="button"
                  onClick={onInteract}
                  disabled={!telemetry.nearby}
                  className={`h-12 px-4 rounded-xl border font-extrabold text-xs cursor-pointer ${
                    telemetry.nearby
                      ? 'bg-amber-500 text-slate-950 border-amber-200'
                      : 'bg-[#112118]/60 text-amber-200/40 border-amber-500/20'
                  }`}
                >
                  INTERAKSI
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenInventory}
              className="h-12 px-4 rounded-xl bg-[#112118]/92 hover:bg-[#1a3325] border border-amber-500/50 text-amber-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Package className="w-4 h-4 text-sky-300" />
              <span>INVENTORI (I)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
