import { useState } from 'react';
import { Award, CheckCircle2, HelpCircle, Send, ShieldCheck, X } from 'lucide-react';
import { TABUNG_QUESTIONS } from '../data/questions';
import { audioEngine } from '../game/audio';
import { PlayerSaveData, TabungQuestion } from '../types/game';

interface FinalExamModalProps {
  save: PlayerSaveData;
  onPassReviewQuestion: (questionId: number) => void;
  onClaimPanglimaAgung: () => void;
  onClose: () => void;
}

export function FinalExamModal({
  save,
  onPassReviewQuestion,
  onClaimPanglimaAgung,
  onClose,
}: FinalExamModalProps) {
  const reviewQueue: TabungQuestion[] = TABUNG_QUESTIONS.filter((q) => {
    const st = save.tabungStatus[q.id];
    return st?.everWrong && !st?.finalReviewPassed;
  });

  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<
    Record<number, { ok: boolean; msg: string }>
  >({});

  const allSolved = TABUNG_QUESTIONS.every(
    (q) => save.tabungStatus[q.id]?.solved,
  );
  const readyForTitle = allSolved && reviewQueue.length === 0;

  const handleSubmitReview = (q: TabungQuestion, e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.unlock();
    const val = (inputs[q.id] ?? '').trim().toUpperCase();
    if (!val) {
      audioEngine.playWrong();
      setFeedbacks((prev) => ({
        ...prev,
        [q.id]: {
          ok: false,
          msg: 'Sila masukkan jawapan sebelum menghantar.',
        },
      }));
      return;
    }

    if (val === q.answer.toUpperCase()) {
      audioEngine.playCorrect();
      setFeedbacks((prev) => ({
        ...prev,
        [q.id]: {
          ok: true,
          msg: `Syabas! ${q.explanation}`,
        },
      }));
      onPassReviewQuestion(q.id);
    } else {
      audioEngine.playWrong();
      setFeedbacks((prev) => ({
        ...prev,
        [q.id]: {
          ok: false,
          msg: q.wrongHint,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#14261c] border-2 border-amber-500/60 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#451a03] border-b border-amber-500/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-300">
                MISI AKHIR · PENENTUAN GELARAN
              </p>
              <h2 className="text-xl font-extrabold text-amber-50">
                UJIAN TERAKHIR RAJA MUSTAFAR
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto nusantara-scroll space-y-5">
          {/* 5 Question Record Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Rekod Lima Cabaran Tabung Pitis
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {TABUNG_QUESTIONS.map((q) => {
                const st = save.tabungStatus[q.id];
                const needsRetry = st?.everWrong && !st?.finalReviewPassed;
                return (
                  <div
                    key={q.id}
                    className="bg-[#0e1b13] border border-amber-500/20 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-100">
                        Tabung {q.id}: {q.locationName}
                      </span>
                      <span className="text-amber-200/70 ml-2">
                        ({q.adjectiveType})
                      </span>
                    </div>
                    <div className="font-mono-num font-bold">
                      {!st?.solved ? (
                        <span className="text-amber-300">BELUM DIJUMPAI</span>
                      ) : needsRetry ? (
                        <span className="text-orange-300">
                          PERNAH SALAH · PERLU SEMAKAN SEMULA
                        </span>
                      ) : st?.everWrong ? (
                        <span className="text-emerald-300">
                          SEMAKAN SEMULA LULUS ({q.answer})
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          BETUL TERUS ({q.answer})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retry Section for Questions Ever Answered Wrongly */}
          {reviewQueue.length > 0 && (
            <div className="space-y-4">
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg p-3.5 text-xs sm:text-sm text-amber-100">
                Terdapat <strong>{reviewQueue.length}</strong> soalan yang pernah
                dijawab salah sebelum ini. Lengkapkan semakan semula di bawah
                untuk melayakkan diri menerima gelaran{' '}
                <strong className="text-amber-300">PANGLIMA AGUNG</strong>.
              </div>

              {reviewQueue.map((q) => {
                const fb = feedbacks[q.id];
                return (
                  <form
                    key={q.id}
                    onSubmit={(e) => handleSubmitReview(q, e)}
                    className="bg-[#0e1b13] border border-amber-500/35 rounded-xl p-4 space-y-3"
                  >
                    <p className="text-xs font-bold text-amber-300">
                      Semakan Semula · Tabung {q.id}: {q.storyTitle}
                    </p>
                    <p className="text-sm sm:text-base text-amber-50 leading-relaxed">
                      {q.passageBefore}
                      <span className="inline-block min-w-[90px] mx-1 px-2 py-0.5 bg-amber-500/20 border-b-2 border-amber-400 text-center font-mono-num font-bold text-amber-300">
                        {(inputs[q.id] ?? '').trim().toUpperCase() || '________'}
                      </span>
                      {q.passageAfter}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.choices.map((choice, idx) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() =>
                            setInputs((prev) => ({
                              ...prev,
                              [q.id]: choice,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            (inputs[q.id] ?? '').trim().toUpperCase() === choice
                              ? 'bg-amber-500 text-slate-950 border-amber-200'
                              : 'bg-[#122419] hover:bg-[#1a3324] text-amber-100 border-amber-500/30'
                          }`}
                        >
                          {idx + 1}. {choice}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={inputs[q.id] ?? ''}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="TAIP JAWAPAN ANDA DI SINI"
                        className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#09120c] border border-amber-500/45 text-amber-50 text-sm font-bold uppercase focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>HANTAR JAWAPAN</span>
                      </button>
                    </div>
                    {fb && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                          fb.ok
                            ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/40'
                            : 'bg-red-950/70 text-red-200 border border-red-500/40'
                        }`}
                      >
                        {fb.ok ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <span>{fb.msg}</span>
                      </div>
                    )}
                  </form>
                );
              })}
            </div>
          )}

          {/* Claim Final Title */}
          {readyForTitle && (
            <div className="bg-emerald-950/75 border-2 border-amber-400 rounded-xl p-5 text-center space-y-3">
              <Award className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-xl font-extrabold text-amber-200">
                Semua Syarat Gelaran Panglima Agung Dipenuhi!
              </h3>
              <p className="text-sm text-emerald-50">
                Kelima-lima Tabung Pitis telah ditemukan dan semua semakan kata
                adjektif berjaya diselesaikan dengan tepat.
              </p>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playVictory();
                  onClaimPanglimaAgung();
                }}
                className="px-7 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base cursor-pointer"
              >
                TERIMA GELARAN PANGLIMA AGUNG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
