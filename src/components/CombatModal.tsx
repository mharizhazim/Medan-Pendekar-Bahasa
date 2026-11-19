import { useState } from 'react';
import {
  Coins,
  FlaskConical,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { EQUIPMENT_CATALOG, getRankForXp } from '../data/questions';
import { audioEngine } from '../game/audio';
import { MonsterSpec, PlayerSaveData } from '../types/game';

interface CombatModalProps {
  monster: MonsterSpec;
  save: PlayerSaveData;
  onWin: (monster: MonsterSpec, finalHp: number) => void;
  onLose: (recoveredHp: number) => void;
  onConsumeItem: (itemId: 'ramuan_pemulih' | 'pelindung_ajaib') => void;
}

export function CombatModal({
  monster,
  save,
  onWin,
  onLose,
  onConsumeItem,
}: CombatModalProps) {
  const rank = getRankForXp(save.xp);
  const kerisPower =
    save.equippedWeapon === 'keris_diraja' ? 18 : 8;
  const hasShield = save.equippedShield;

  const [playerHp, setPlayerHp] = useState(Math.max(25, save.hp));
  const [monsterHp, setMonsterHp] = useState(monster.maxHp);
  const [magicShieldTurns, setMagicShieldTurns] = useState(save.shieldTurnsLeft);
  const [battleLog, setBattleLog] = useState<string[]>([
    `${monster.name} (${monster.title}) muncul menghalang laluan! Bersedia menggunakan kuasa bahasa dan pertahanan!`,
  ]);
  const [outcome, setOutcome] = useState<'active' | 'won' | 'lost'>('active');

  const pushLog = (msg: string) =>
    setBattleLog((prev) => [msg, ...prev].slice(0, 4));

  const performRound = (action: 'attack' | 'defend' | 'shield') => {
    if (outcome !== 'active') return;
    audioEngine.unlock();

    let nextMonsterHp = monsterHp;
    let damageReduction = hasShield ? 0.45 : 0.75;

    if (action === 'attack') {
      const dmg = 18 + rank.attackBonus + Math.floor(kerisPower * 0.65);
      nextMonsterHp = Math.max(0, monsterHp - dmg);
      audioEngine.playCombatHit();
      pushLog(
        `Raja Mustafar melancarkan Tenaga Pendekar dengan Keris Diraja! (-${dmg} tenaga raksasa)`,
      );
    } else if (action === 'defend') {
      const dmg = 10 + Math.floor(rank.attackBonus * 0.5);
      nextMonsterHp = Math.max(0, monsterHp - dmg);
      damageReduction = hasShield ? 0.25 : 0.45;
      audioEngine.playShield();
      pushLog(
        `Raja Mustafar mengambil kuda-kuda Pertahanan Silat sambil membalas (-${dmg} tenaga raksasa).`,
      );
    } else if (action === 'shield') {
      const dmg = 8;
      nextMonsterHp = Math.max(0, monsterHp - dmg);
      damageReduction = 0.15;
      audioEngine.playShield();
      pushLog(
        `Perisai Warisan diangkat! Gelombang serangan raksasa dipantulkan (-${dmg} tenaga raksasa).`,
      );
    }

    setMonsterHp(nextMonsterHp);

    if (nextMonsterHp <= 0) {
      audioEngine.playVictory();
      setOutcome('won');
      return;
    }

    // Monster counter-wave
    if (magicShieldTurns > 0) {
      setMagicShieldTurns((t) => t - 1);
      pushLog(
        `Cahaya Pelindung Ajaib menangkis sepenuhnya serangan ${monster.name}!`,
      );
      return;
    }

    const incoming = Math.max(
      2,
      Math.round(monster.attackPower * damageReduction),
    );
    const nextPlayerHp = Math.max(0, playerHp - incoming);
    setPlayerHp(nextPlayerHp);

    if (nextPlayerHp <= 0) {
      audioEngine.playWrong();
      setOutcome('lost');
    } else {
      pushLog(
        `${monster.name} melancarkan gelombang tenaga bayangan (-${incoming} tenaga anda).`,
      );
    }
  };

  const handleUseRamuan = () => {
    if (outcome !== 'active' || (save.inventory.ramuan_pemulih ?? 0) <= 0) return;
    audioEngine.playCoin();
    onConsumeItem('ramuan_pemulih');
    const healed = Math.min(save.maxHp, playerHp + 45);
    setPlayerHp(healed);
    pushLog('Anda meminum Ramuan Pemulih Tenaga! (+45 Tenaga)');
  };

  const handleUsePelindung = () => {
    if (outcome !== 'active' || (save.inventory.pelindung_ajaib ?? 0) <= 0) return;
    audioEngine.playShield();
    onConsumeItem('pelindung_ajaib');
    setMagicShieldTurns((t) => t + 2);
    pushLog('Pelindung Ajaib diaktifkan! Kebal selama 2 pusingan.');
  };

  const rewardItemObj = monster.rewardItem
    ? EQUIPMENT_CATALOG.find((e) => e.id === monster.rewardItem)
    : null;

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#16271d] border-2 border-amber-500/60 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#3b1515] border-b border-amber-500/35 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Swords className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-300">
                CABARAN PERTAHANAN FANTASI
              </p>
              <h2 className="text-lg font-extrabold text-amber-50">
                {monster.name}
              </h2>
            </div>
          </div>
          {magicShieldTurns > 0 && (
            <span className="text-xs font-bold text-yellow-300 bg-yellow-950/60 border border-yellow-400/50 px-2.5 py-1 rounded">
              Pelindung Ajaib: {magicShieldTurns}
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Energy Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player */}
            <div className="bg-[#0e1b13] border border-emerald-600/35 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RAJA MUSTAFAR</span>
                </span>
                <span className="font-mono-num text-emerald-200">
                  {playerHp}/{save.maxHp}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${(playerHp / save.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Monster */}
            <div className="bg-[#0e1b13] border border-red-500/35 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-red-300">{monster.name}</span>
                <span className="font-mono-num text-red-200">
                  {monsterHp}/{monster.maxHp}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${(monsterHp / monster.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="bg-[#0a140e] border border-amber-500/20 rounded-lg p-3.5 min-h-[86px] space-y-1.5 text-xs text-amber-100/90">
            {battleLog.map((line, i) => (
              <p key={i} className={i === 0 ? 'font-semibold text-amber-200' : 'opacity-70'}>
                {line}
              </p>
            ))}
          </div>

          {/* Controls or Outcome */}
          {outcome === 'active' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => performRound('attack')}
                  className="py-3 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>TENAGA PENDEKAR</span>
                </button>
                <button
                  type="button"
                  onClick={() => performRound('defend')}
                  className="py-3 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>PERTAHANAN</span>
                </button>
                <button
                  type="button"
                  onClick={() => performRound('shield')}
                  className="py-3 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>GUNAKAN PERISAI</span>
                </button>
              </div>

              {/* Quick Consumables */}
              <div className="flex flex-wrap gap-2">
                {(save.inventory.ramuan_pemulih ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleUseRamuan}
                    className="px-3 py-2 rounded-lg bg-emerald-950/80 border border-emerald-400/40 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>
                      Ramuan Pemulih ({save.inventory.ramuan_pemulih})
                    </span>
                  </button>
                )}
                {(save.inventory.pelindung_ajaib ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleUsePelindung}
                    className="px-3 py-2 rounded-lg bg-yellow-950/80 border border-yellow-400/40 hover:bg-yellow-900 text-yellow-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Pelindung Ajaib ({save.inventory.pelindung_ajaib})
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {outcome === 'won' && (
            <div className="bg-emerald-950/75 border border-emerald-400/50 rounded-xl p-4 space-y-3 text-center">
              <h3 className="text-lg font-extrabold text-emerald-300">
                TAHNIAH, RAJA MUSTAFAR!
              </h3>
              <p className="text-sm text-emerald-50">
                Anda berjaya mengatasi cabaran {monster.title.toLowerCase()}!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono-num font-bold text-amber-300">
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4" /> +{monster.rewardKupang} Kupang
                </span>
                <span>·</span>
                <span>+{monster.rewardXp} XP Kekuatan</span>
                {rewardItemObj && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-300">
                      Perolehan: {rewardItemObj.name}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => onWin(monster, Math.max(30, playerHp))}
                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                TERUSKAN PENGEMBARAAN
              </button>
            </div>
          )}

          {outcome === 'lost' && (
            <div className="bg-amber-950/75 border border-amber-500/50 rounded-xl p-4 space-y-3 text-center">
              <h3 className="text-base font-extrabold text-amber-300">
                BANGKIT SEMULA, PENDEKAR!
              </h3>
              <p className="text-sm text-amber-50 leading-relaxed">
                Jangan berputus asa, Raja Mustafar! Seorang pendekar sejati
                tidak mudah mengalah. Kuatkan semangat dan teruskan pengembaraan
                anda. Tabung Pitis masih menanti untuk ditemukan!
              </p>
              <button
                type="button"
                onClick={() => onLose(65)}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                BANGKIT SEMULA &amp; PULIH TENAGA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
