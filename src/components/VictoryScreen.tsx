import { useEffect, useRef, useState } from 'react';
import { Award, Coins, Home, RotateCcw, Swords, Trophy } from 'lucide-react';
import { TABUNG_QUESTIONS } from '../data/questions';
import { PlayerSaveData } from '../types/game';
import { MenuDiorama3D } from './MenuDiorama3D';

interface VictoryScreenProps {
  save: PlayerSaveData;
  onOpenProfile: () => void;
  onReplay: () => void;
  onReturnMenu: () => void;
}

export function VictoryScreen({
  save,
  onOpenProfile,
  onReplay,
  onReturnMenu,
}: VictoryScreenProps) {
  const fireworkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  // Pixel-art fireworks overlay animation
  useEffect(() => {
    const canvas = fireworkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface PixelParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }

    const particles: PixelParticle[] = [];
    const palette = ['#fbbf24', '#ef4444', '#22c55e', '#38bdf8', '#f472b6'];

    const spawnBurst = () => {
      const cx = (0.15 + Math.random() * 0.7) * canvas.width;
      const cy = (0.12 + Math.random() * 0.35) * canvas.height;
      const col = palette[Math.floor(Math.random() * palette.length)];
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const spd = 1.8 + Math.random() * 3.4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 55 + Math.random() * 25,
          color: col,
        });
      }
    };

    let frameCount = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frameCount % 38 === 0) spawnBurst();
      frameCount++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life / 25);
        // Blocky pixel-art square sparks
        ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, 6, 6);
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#161336]">
      {/* Glowing Istana & Raja Mustafar 3D Victory Scene */}
      <MenuDiorama3D victoryMode />

      {/* Pixel Fireworks Canvas */}
      <canvas
        ref={fireworkCanvasRef}
        className="pointer-events-none fixed inset-0 z-10"
      />

      {/* Victory Panel */}
      <div className="relative z-20 w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        {showSummaryCard ? (
          <div className="w-full max-w-2xl bg-[#13221a]/95 border-2 border-amber-400 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs tracking-wider">
              <Award className="w-4 h-4" />
              <span>TAHNIAH! · LENCANA PANGLIMA AGUNG</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-200">
                GELARAN PANGLIMA AGUNG
              </h1>
              <p className="text-sm sm:text-base text-amber-50/90 leading-relaxed">
                &ldquo;Anda telah membuktikan kebijaksanaan, ketelitian dan
                semangat seorang pendekar bahasa. Lima Tabung Pitis berjaya
                ditemukan dan semua cabaran kata adjektif telah diselesaikan
                dengan cemerlang!&rdquo;
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="bg-[#0b1610] border border-amber-500/30 rounded-lg p-3">
                <p className="text-[11px] text-amber-200/75 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kupang Terkumpul</span>
                </p>
                <p className="text-xl font-extrabold font-mono-num text-amber-300 mt-1">
                  {save.kupang}
                </p>
              </div>
              <div className="bg-[#0b1610] border border-amber-500/30 rounded-lg p-3">
                <p className="text-[11px] text-amber-200/75 flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Raksasa Tewas</span>
                </p>
                <p className="text-xl font-extrabold font-mono-num text-emerald-300 mt-1">
                  {save.defeatedMonsters.length}
                </p>
              </div>
              <div className="bg-[#0b1610] border border-amber-500/30 rounded-lg p-3">
                <p className="text-[11px] text-amber-200/75 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Jumlah Percubaan</span>
                </p>
                <p className="text-xl font-extrabold font-mono-num text-sky-300 mt-1">
                  {save.totalAttempts}
                </p>
              </div>
            </div>

            {/* Mastered 5 Kata Adjektif */}
            <div className="bg-[#0b1610] border border-emerald-500/30 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-amber-300 uppercase">
                Lima Kata Adjektif Yang Telah Dikuasai:
              </p>
              <div className="flex flex-wrap gap-2">
                {TABUNG_QUESTIONS.map((q) => (
                  <div
                    key={q.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs"
                  >
                    <span className="font-extrabold text-amber-300 font-mono-num">
                      {q.answer}
                    </span>
                    <span className="text-emerald-200/80 ml-1.5">
                      ({q.adjectiveType})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required 3 Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
              >
                LIHAT PENCAPAIAN
              </button>
              <button
                type="button"
                onClick={onReplay}
                className="px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>MAIN SEMULA</span>
              </button>
              <button
                type="button"
                onClick={onReturnMenu}
                className="px-5 py-3 rounded-lg bg-[#1e3528] hover:bg-[#2a4a38] text-amber-100 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>KEMBALI KE MENU UTAMA</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSummaryCard(false)}
              className="text-xs text-amber-300/75 hover:text-amber-200 underline cursor-pointer"
            >
              Sembunyikan kad untuk melihat animasi istana 3D
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSummaryCard(true)}
            className="mt-auto mb-6 px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
          >
            Papar Semula Kad Gelaran Panglima Agung
          </button>
        )}
      </div>
    </div>
  );
}
