import { useState } from 'react';
import { Award, Check, Copy, Shield, Swords, Trophy, User, X } from 'lucide-react';
import { encodeTransferCode } from '../data/continuity';
import { getRankForXp, MONSTERS, RANKS, TABUNG_QUESTIONS } from '../data/questions';
import { PlayerSaveData } from '../types/game';

interface ProfileModalProps {
  save: PlayerSaveData;
  onClose: () => void;
}

export function ProfileModal({ save, onClose }: ProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const rank = getRankForXp(save.xp);
  const nextRank = RANKS.find((r) => r.level === rank.level + 1);
  const solvedCount = TABUNG_QUESTIONS.filter(
    (q) => save.tabungStatus[q.id]?.solved,
  ).length;

  const exportCode = encodeTransferCode({
    game: 'MEDAN_PENDEKAR_BAHASA',
    playerName: save.playerName,
    kupang: save.kupang,
    stagesCompleted: solvedCount,
    ownedAvatars: save.ownedAvatars,
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(exportCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#14261c] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#3f1907] border-b border-amber-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-100">PROFIL PENDEKAR</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Profil"
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto nusantara-scroll space-y-5">
          {/* Identity & Rank */}
          <div className="bg-[#0e1b13] border border-amber-500/25 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-amber-300/80 font-semibold">
                AVATAR UTAMA · DARI {save.originGame}
              </p>
              <h3 className="text-2xl font-extrabold text-amber-100">
                {save.playerName}
              </h3>
              <p className="text-sm font-bold text-emerald-300">{rank.title}</p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              {save.panglimaAgungEarned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs">
                  <Award className="w-4 h-4" />
                  <span>PANGLIMA AGUNG</span>
                </div>
              ) : (
                <p className="text-xs text-amber-200/75">
                  Gelaran Akhir: Belum Dicapai
                </p>
              )}
              <p className="text-xs font-mono-num text-amber-300">
                Pengalaman (XP): {save.xp}
                {nextRank ? ` / ${nextRank.minXp} ke ${nextRank.title}` : ' (Maksimum)'}
              </p>
            </div>
          </div>

          {/* Numeric Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0e1b13] border border-emerald-700/30 rounded-lg p-3">
              <p className="text-xs text-amber-200/70">Kupang</p>
              <p className="text-xl font-bold font-mono-num text-amber-300 mt-1">
                {save.kupang}
              </p>
            </div>
            <div className="bg-[#0e1b13] border border-emerald-700/30 rounded-lg p-3">
              <p className="text-xs text-amber-200/70">Tenaga</p>
              <p className="text-xl font-bold font-mono-num text-emerald-300 mt-1">
                {save.hp}/{save.maxHp}
              </p>
            </div>
            <div className="bg-[#0e1b13] border border-emerald-700/30 rounded-lg p-3">
              <p className="text-xs text-amber-200/70">Tabung Selesai</p>
              <p className="text-xl font-bold font-mono-num text-amber-300 mt-1">
                {solvedCount}/5
              </p>
            </div>
            <div className="bg-[#0e1b13] border border-emerald-700/30 rounded-lg p-3">
              <p className="text-xs text-amber-200/70">Raksasa Tewas</p>
              <p className="text-xl font-bold font-mono-num text-sky-300 mt-1">
                {save.defeatedMonsters.length}/{MONSTERS.length}
              </p>
            </div>
          </div>

          {/* Rank Ladder */}
          <div className="bg-[#0e1b13] border border-amber-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
              <Swords className="w-4 h-4" />
              <span>Tangga Kekuatan Pendekar</span>
            </div>
            <div className="space-y-1.5">
              {RANKS.map((r) => {
                const unlocked = save.xp >= r.minXp;
                return (
                  <div
                    key={r.level}
                    className={`flex items-center justify-between text-xs px-3 py-2 rounded ${
                      unlocked
                        ? 'bg-emerald-900/40 text-emerald-100 border border-emerald-600/30'
                        : 'bg-black/20 text-amber-100/45'
                    }`}
                  >
                    <span className="font-semibold">{r.title}</span>
                    <span className="font-mono-num">
                      {r.minXp} XP · +{r.attackBonus} Kuasa
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mastered Kata Adjektif */}
          <div className="bg-[#0e1b13] border border-amber-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
              <Trophy className="w-4 h-4" />
              <span>Rekod Tabung Pitis &amp; Kata Adjektif</span>
            </div>
            <div className="space-y-1.5">
              {TABUNG_QUESTIONS.map((q) => {
                const st = save.tabungStatus[q.id];
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between text-xs px-3 py-2 rounded bg-black/25"
                  >
                    <div>
                      <span className="font-semibold text-amber-100">
                        Tabung {q.id}: {q.locationName}
                      </span>
                      <span className="text-amber-200/60 ml-2">
                        ({q.adjectiveType})
                      </span>
                    </div>
                    <span
                      className={`font-mono-num font-bold ${
                        st?.solved ? 'text-emerald-400' : 'text-amber-300/60'
                      }`}
                    >
                      {st?.solved ? `SELESAI · ${q.answer}` : 'BELUM SELESAI'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Code */}
          <div className="bg-[#0e1b13] border border-amber-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Shield className="w-4 h-4" />
              <span>Kod Eksport Kemajuan Semasa</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={exportCode}
                className="flex-1 px-3 py-2 rounded bg-black/50 border border-amber-500/30 text-xs font-mono-num text-amber-200"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
