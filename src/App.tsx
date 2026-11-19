import { useCallback, useEffect, useRef, useState } from 'react';
import { Coins, MessageSquare, Pause, Play, Home, BookOpen, User } from 'lucide-react';
import { CombatModal } from './components/CombatModal';
import { FinalExamModal } from './components/FinalExamModal';
import { GameHUD } from './components/GameHUD';
import { GateScreen } from './components/GateScreen';
import { GuideModal } from './components/GuideModal';
import { InventoryModal } from './components/InventoryModal';
import { MainMenu } from './components/MainMenu';
import { ProfileModal } from './components/ProfileModal';
import { TabungModal } from './components/TabungModal';
import { VictoryScreen } from './components/VictoryScreen';
import {
  createDefaultSave,
  loadSavedGame,
  persistGame,
} from './data/continuity';
import {
  EQUIPMENT_CATALOG,
  getRankForXp,
  MONSTERS,
  NPCS,
  TABUNG_QUESTIONS,
} from './data/questions';
import { audioEngine } from './game/audio';
import { WorldEngine, WorldTelemetry } from './game/WorldEngine';
import {
  EquipmentId,
  MonsterSpec,
  PlayerSaveData,
  ScreenMode,
} from './types/game';

const INITIAL_TELEMETRY: WorldTelemetry = {
  x: 0,
  z: 4,
  yaw: Math.PI,
  locationId: 'dataran_permulaan',
  locationName: 'DATARAN AWANG KENIT',
  difficulty: 'ZON SELAMAT',
  nearby: null,
};

export default function App() {
  const [existingSave] = useState<PlayerSaveData | null>(() => loadSavedGame());
  const [save, setSave] = useState<PlayerSaveData>(
    () => existingSave ?? createDefaultSave('Raja Mustafar', 50),
  );
  const [screen, setScreen] = useState<ScreenMode>('gate');
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Sub-modals
  const [showGuide, setShowGuide] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showFinalExam, setShowFinalExam] = useState(false);

  // Active in-world interactions
  const [activeTabungId, setActiveTabungId] = useState<number | null>(null);
  const [activeNpc, setActiveNpc] = useState<{
    name: string;
    role: string;
    lines: string[];
    index: number;
  } | null>(null);
  const [activeMonsterId, setActiveMonsterId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<WorldTelemetry>(INITIAL_TELEMETRY);
  const worldMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WorldEngine | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Persist save automatically whenever state updates (once verified)
  useEffect(() => {
    if (screen !== 'gate' && save.verified) {
      persistGame(save);
    }
  }, [save, screen]);

  // Toggle audio mode by screen
  useEffect(() => {
    if (screen === 'menu') audioEngine.setMode('menu');
    else if (screen === 'victory') audioEngine.setMode('istana');
  }, [screen]);

  const handleToggleMusic = () => {
    audioEngine.unlock();
    const next = !musicEnabled;
    setMusicEnabled(next);
    audioEngine.setMusicEnabled(next);
  };

  // Unlock from GateScreen
  const handleUnlockSuccess = (playerName: string, startingKupang: number) => {
    const existing = loadSavedGame();
    if (existing && existing.playerName === playerName) {
      setSave(existing);
    } else {
      const fresh = createDefaultSave(playerName, startingKupang);
      setSave(fresh);
      persistGame(fresh);
    }
    setScreen('menu');
  };

  // Stable callback refs for WorldEngine so React state never resets 3D canvas
  const callbacksRef = useRef({
    onTelemetry: (t: WorldTelemetry) => setTelemetry(t),
    onOpenTabung: (id: number) => setActiveTabungId(id),
    onTalkNpc: (npcId: string) => {
      const npc = NPCS.find((n) => n.id === npcId);
      if (npc) {
        setActiveNpc({
          name: npc.name,
          role: npc.role,
          lines: npc.dialogues,
          index: 0,
        });
      }
    },
    onTriggerMonster: (monsterId: string) => setActiveMonsterId(monsterId),
    onCollectOrb: (orbId: string, kupang: number, label: string) => {
      setSave((prev) => {
        if (prev.collectedBonusOrbs.includes(orbId)) return prev;
        return {
          ...prev,
          kupang: prev.kupang + kupang,
          collectedBonusOrbs: [...prev.collectedBonusOrbs, orbId],
        };
      });
      showToast(`+${kupang} Kupang! (${label})`);
    },
    onToggleInventory: () => setShowInventory((v) => !v),
    onTogglePause: () => setShowPause((v) => !v),
  });

  // Mount Three.js WorldEngine ONLY while screen === 'playing'
  useEffect(() => {
    if (screen !== 'playing') return;
    const container = worldMountRef.current;
    if (!container) return;

    const engine = new WorldEngine(container, {
      onTelemetry: (t) => callbacksRef.current.onTelemetry(t),
      onOpenTabung: (id) => callbacksRef.current.onOpenTabung(id),
      onTalkNpc: (id) => callbacksRef.current.onTalkNpc(id),
      onTriggerMonster: (id) => callbacksRef.current.onTriggerMonster(id),
      onCollectOrb: (id, k, l) => callbacksRef.current.onCollectOrb(id, k, l),
      onToggleInventory: () => callbacksRef.current.onToggleInventory(),
      onTogglePause: () => callbacksRef.current.onTogglePause(),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [screen]);

  // Sync progress & pause state to WorldEngine without tearing down scene
  const anyOverlayOpen =
    activeTabungId !== null ||
    activeNpc !== null ||
    activeMonsterId !== null ||
    showInventory ||
    showPause ||
    showGuide ||
    showProfile ||
    showFinalExam;

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setPaused(anyOverlayOpen);
    const solvedIds = TABUNG_QUESTIONS.filter(
      (q) => save.tabungStatus[q.id]?.solved,
    ).map((q) => q.id);
    engine.syncProgressState({
      solvedTabungs: solvedIds,
      defeatedMonsters: save.defeatedMonsters,
      collectedOrbs: save.collectedBonusOrbs,
      hasShield: save.equippedShield,
      hasAura: save.shieldTurnsLeft > 0,
    });
  }, [anyOverlayOpen, save, screen]);

  // Tabung answer handlers
  const handleAttemptWrong = (questionId: number, submitted: string) => {
    setSave((prev) => {
      const curr = prev.tabungStatus[questionId];
      return {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        tabungStatus: {
          ...prev.tabungStatus,
          [questionId]: {
            ...curr,
            attempts: (curr?.attempts ?? 0) + 1,
            everWrong: true,
            lastSubmittedAnswer: submitted,
          },
        },
      };
    });
  };

  const handleAttemptCorrect = (questionId: number, submitted: string) => {
    const q = TABUNG_QUESTIONS.find((item) => item.id === questionId);
    if (!q) return;

    setSave((prev) => {
      const curr = prev.tabungStatus[questionId];
      const alreadySolved = Boolean(curr?.solved);
      const nextStatus = {
        ...prev.tabungStatus,
        [questionId]: {
          ...curr,
          solved: true,
          attempts: (curr?.attempts ?? 0) + 1,
          finalReviewPassed: curr?.everWrong ? false : true,
          lastSubmittedAnswer: submitted,
        },
      };
      const nextXp = alreadySolved ? prev.xp : prev.xp + 25;
      const nextRank = getRankForXp(nextXp).level;
      return {
        ...prev,
        kupang: alreadySolved ? prev.kupang : prev.kupang + q.rewardKupang,
        xp: nextXp,
        rankIndex: nextRank,
        totalAttempts: prev.totalAttempts + 1,
        tabungStatus: nextStatus,
      };
    });
  };

  const handleCloseTabung = () => {
    const allSolvedNow = TABUNG_QUESTIONS.every(
      (q) => save.tabungStatus[q.id]?.solved,
    );
    setActiveTabungId(null);
    if (allSolvedNow && !save.panglimaAgungEarned) {
      showToast(
        'Semua 5 Tabung Pitis ditemui! Ujian Terakhir Raja Mustafar kini dibuka.',
      );
      setShowFinalExam(true);
    }
  };

  // Monster Combat handlers
  const handleWinMonster = (monster: MonsterSpec, finalHp: number) => {
    setSave((prev) => {
      const already = prev.defeatedMonsters.includes(monster.id);
      const nextXp = already ? prev.xp : prev.xp + monster.rewardXp;
      const nextInv = { ...prev.inventory };
      if (!already && monster.rewardItem) {
        nextInv[monster.rewardItem] = (nextInv[monster.rewardItem] ?? 0) + 1;
      }
      return {
        ...prev,
        hp: finalHp,
        kupang: already ? prev.kupang : prev.kupang + monster.rewardKupang,
        xp: nextXp,
        rankIndex: getRankForXp(nextXp).level,
        defeatedMonsters: already
          ? prev.defeatedMonsters
          : [...prev.defeatedMonsters, monster.id],
        inventory: nextInv,
        equippedShield:
          nextInv.perisai_warisan > 0 ? true : prev.equippedShield,
      };
    });
    setActiveMonsterId(null);
    engineRef.current?.setCombatCooldown(2500);
    showToast(`Menang! +${monster.rewardKupang} Kupang & +${monster.rewardXp} XP`);
  };

  const handleLoseMonster = (recoveredHp: number) => {
    setSave((prev) => ({
      ...prev,
      hp: recoveredHp,
    }));
    setActiveMonsterId(null);
    engineRef.current?.setCombatCooldown(5000);
    showToast('Tenaga asas dipulihkan. Teruskan pengembaraan anda!');
  };

  const handleConsumeCombatItem = (
    itemId: 'ramuan_pemulih' | 'pelindung_ajaib',
  ) => {
    setSave((prev) => {
      const qty = prev.inventory[itemId] ?? 0;
      if (qty <= 0) return prev;
      return {
        ...prev,
        inventory: { ...prev.inventory, [itemId]: qty - 1 },
        shieldTurnsLeft:
          itemId === 'pelindung_ajaib'
            ? prev.shieldTurnsLeft + 2
            : prev.shieldTurnsLeft,
      };
    });
  };

  // Inventory Equip/Use
  const handleUseOrEquip = (itemId: EquipmentId) => {
    const item = EQUIPMENT_CATALOG.find((e) => e.id === itemId);
    if (!item) return;

    setSave((prev) => {
      const count = prev.inventory[itemId] ?? 0;
      if (count <= 0) return prev;

      if (itemId === 'ramuan_pemulih') {
        audioEngine.playCoin();
        return {
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + 45),
          inventory: { ...prev.inventory, ramuan_pemulih: count - 1 },
        };
      }
      if (itemId === 'pelindung_ajaib') {
        audioEngine.playShield();
        return {
          ...prev,
          shieldTurnsLeft: prev.shieldTurnsLeft + 2,
          inventory: { ...prev.inventory, pelindung_ajaib: count - 1 },
        };
      }
      if (itemId === 'perisai_warisan') {
        audioEngine.playShield();
        return { ...prev, equippedShield: !prev.equippedShield };
      }
      if (itemId === 'keris_diraja') {
        return { ...prev, equippedWeapon: 'keris_diraja' };
      }
      return prev;
    });
    showToast(`${item.name} dikemas kini!`);
  };

  // Final Exam & Panglima Agung
  const handlePassReviewQuestion = (questionId: number) => {
    setSave((prev) => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      tabungStatus: {
        ...prev.tabungStatus,
        [questionId]: {
          ...prev.tabungStatus[questionId],
          finalReviewPassed: true,
        },
      },
    }));
  };

  const handleClaimPanglimaAgung = () => {
    setSave((prev) => ({
      ...prev,
      panglimaAgungEarned: true,
      kupang: prev.kupang + 50,
    }));
    setShowFinalExam(false);
    setScreen('victory');
  };

  const handleReplay = () => {
    const fresh = createDefaultSave(save.playerName, 50);
    setSave(fresh);
    persistGame(fresh);
    setScreen('playing');
  };

  const activeTabung =
    activeTabungId !== null
      ? TABUNG_QUESTIONS.find((q) => q.id === activeTabungId) ?? null
      : null;
  const activeMonster =
    activeMonsterId !== null
      ? MONSTERS.find((m) => m.id === activeMonsterId) ?? null
      : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0c1912]">
      {screen === 'gate' && (
        <GateScreen
          onUnlockSuccess={handleUnlockSuccess}
          existingVerifiedName={existingSave?.playerName ?? null}
        />
      )}

      {screen === 'menu' && (
        <MainMenu
          save={save}
          musicEnabled={musicEnabled}
          onToggleMusic={handleToggleMusic}
          onStartAdventure={() => {
            audioEngine.unlock();
            audioEngine.setMode('adventure');
            setScreen('playing');
          }}
          onOpenGuide={() => setShowGuide(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenInventory={() => setShowInventory(true)}
          onReturnToGate={() => setScreen('gate')}
        />
      )}

      {screen === 'playing' && (
        <div className="relative w-full h-full">
          {/* Isolated WebGL Mount Container */}
          <div ref={worldMountRef} className="w-full h-full" />

          {/* Non-occluding HUD */}
          <GameHUD
            save={save}
            telemetry={telemetry}
            musicEnabled={musicEnabled}
            onToggleMusic={handleToggleMusic}
            onInteract={() => engineRef.current?.triggerInteract()}
            onJump={() => engineRef.current?.triggerJump()}
            onToggleRun={(r) => engineRef.current?.setTouchRun(r)}
            onJoystickMove={(x, y) =>
              engineRef.current?.setVirtualJoystick(x, y)
            }
            onOpenInventory={() => setShowInventory(true)}
            onOpenPauseMenu={() => setShowPause(true)}
            onOpenFinalExam={() => setShowFinalExam(true)}
          />

          {/* Floating Toast Notification */}
          {toast && (
            <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-30 bg-[#14261c] border-2 border-amber-400 text-amber-100 px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toast}</span>
            </div>
          )}
        </div>
      )}

      {screen === 'victory' && (
        <VictoryScreen
          save={save}
          onOpenProfile={() => setShowProfile(true)}
          onReplay={handleReplay}
          onReturnMenu={() => setScreen('menu')}
        />
      )}

      {/* IN-WORLD INTERACTION MODALS */}
      {activeTabung && (
        <TabungModal
          question={activeTabung}
          progress={save.tabungStatus[activeTabung.id]}
          onAttemptWrong={handleAttemptWrong}
          onAttemptCorrect={handleAttemptCorrect}
          onClose={handleCloseTabung}
        />
      )}

      {activeMonster && (
        <CombatModal
          monster={activeMonster}
          save={save}
          onWin={handleWinMonster}
          onLose={handleLoseMonster}
          onConsumeItem={handleConsumeCombatItem}
        />
      )}

      {activeNpc && (
        <div className="fixed inset-0 z-40 bg-black/55 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#14261c] border-2 border-amber-500/60 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-amber-500/25 pb-3">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-amber-100 text-base">
                  {activeNpc.name}
                </h3>
                <p className="text-xs text-emerald-300">{activeNpc.role}</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-amber-50 leading-relaxed">
              &ldquo;{activeNpc.lines[activeNpc.index]}&rdquo;
            </p>
            <div className="flex justify-end gap-2">
              {activeNpc.index < activeNpc.lines.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveNpc((prev) =>
                      prev ? { ...prev, index: prev.index + 1 } : null,
                    )
                  }
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Seterusnya
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveNpc(null)}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Terima Kasih
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU (ESC) */}
      {showPause && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#14261c] border-2 border-amber-500/50 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-200 font-extrabold text-xl justify-center">
              <Pause className="w-5 h-5 text-amber-400" />
              <span>MENU PERMAINAN</span>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowPause(false)}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>SAMBUNG PENGEMBARAAN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPause(false);
                  setShowGuide(true);
                }}
                className="w-full py-2.5 rounded-lg bg-[#1c3828] hover:bg-[#244a35] text-amber-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>PANDUAN PERMAINAN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPause(false);
                  setShowProfile(true);
                }}
                className="w-full py-2.5 rounded-lg bg-[#1c3828] hover:bg-[#244a35] text-amber-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-300" />
                <span>PROFIL PENDEKAR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPause(false);
                  setScreen('menu');
                }}
                className="w-full py-2.5 rounded-lg bg-[#3b1515] hover:bg-[#521e1e] text-red-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-red-300" />
                <span>KEMBALI KE HALAMAN UTAMA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARED MODALS */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showProfile && (
        <ProfileModal save={save} onClose={() => setShowProfile(false)} />
      )}
      {showInventory && (
        <InventoryModal
          save={save}
          onUseOrEquip={handleUseOrEquip}
          onClose={() => setShowInventory(false)}
        />
      )}
      {showFinalExam && (
        <FinalExamModal
          save={save}
          onPassReviewQuestion={handlePassReviewQuestion}
          onClaimPanglimaAgung={handleClaimPanglimaAgung}
          onClose={() => setShowFinalExam(false)}
        />
      )}
    </div>
  );
}
