import { useState } from 'react';
import {
  CheckCircle2,
  Coins,
  HelpCircle,
  Lightbulb,
  Send,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { audioEngine } from '../game/audio';
import { QuestionProgress, TabungQuestion } from '../types/game';

interface TabungModalProps {
  question: TabungQuestion;
  progress: QuestionProgress;
  onAttemptWrong: (questionId: number, submitted: string) => void;
  onAttemptCorrect: (questionId: number, submitted: string) => void;
  onClose: () => void;
}

export function TabungModal({
  question,
  progress,
  onAttemptWrong,
  onAttemptCorrect,
  onClose,
}: TabungModalProps) {
  const [answerInput, setAnswerInput] = useState(
    progress.solved ? question.answer : '',
  );
  const [feedback, setFeedback] = useState<{
    type: 'empty' | 'wrong' | 'correct';
    message: string;
    encouragement?: string;
    progressiveHint?: string;
  } | null>(
    progress.solved
      ? {
          type: 'correct',
          message: question.explanation,
        }
      : null,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.unlock();
    if (progress.solved) {
      onClose();
      return;
    }

    const cleaned = answerInput.trim().toUpperCase();
    if (!cleaned) {
      audioEngine.playWrong();
      setFeedback({
        type: 'empty',
        message: 'Sila masukkan jawapan sebelum menghantar.',
      });
      return;
    }

    if (cleaned === question.answer.toUpperCase()) {
      audioEngine.playCorrect();
      audioEngine.playCoin();
      setFeedback({
        type: 'correct',
        message: question.explanation,
      });
      onAttemptCorrect(question.id, cleaned);
    } else {
      audioEngine.playWrong();
      const nextWrongCount = progress.attempts + 1;
      const nearMiss = question.nearMissHints[cleaned];
      const progressiveHint =
        nextWrongCount >= 3
          ? question.progressiveHints[1]
          : nextWrongCount >= 2
            ? question.progressiveHints[0]
            : undefined;

      setFeedback({
        type: 'wrong',
        message: nearMiss || question.wrongHint,
        encouragement:
          'Jangan berputus asa, Raja Mustafar! Setiap cabaran memerlukan ketelitian. Cuba teliti semula maksud ayat dan taip kata adjektif yang paling sesuai.',
        progressiveHint,
      });
      onAttemptWrong(question.id, cleaned);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/55 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl bg-[#16271d] border-2 border-amber-500/60 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#451a03] border-b border-amber-500/40 px-5 py-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-300">
              TABUNG PITIS {question.id} · {question.locationName} · ARAS:{' '}
              {question.difficulty}
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-amber-50 mt-0.5">
              {question.storyTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Tabung Pitis"
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto nusantara-scroll space-y-5">
          {/* Story Passage */}
          <div className="bg-[#0e1b13] border border-amber-500/25 rounded-xl p-5 text-base sm:text-lg leading-relaxed text-amber-50">
            <span>{question.passageBefore}</span>
            <span className="inline-block min-w-[110px] mx-1 px-3 py-0.5 rounded bg-amber-500/20 border-b-2 border-amber-400 text-center font-extrabold tracking-wider text-amber-300 font-mono-num">
              {progress.solved
                ? question.answer
                : answerInput.trim()
                  ? answerInput.trim().toUpperCase()
                  : '________'}
            </span>
            <span>{question.passageAfter}</span>
          </div>

          {/* 3 Pilihan Jawapan untuk dipilih & ditaip */}
          {!progress.solved && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Pilihan Jawapan (Pilih satu dan taip ke dalam ruangan jawapan):
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {question.choices.map((choice, idx) => {
                  const isSelected =
                    answerInput.trim().toUpperCase() === choice.toUpperCase();
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setAnswerInput(choice)}
                      className={`py-2.5 px-3 rounded-lg border-2 font-extrabold text-sm tracking-wide transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-200'
                          : 'bg-[#0e1b13] hover:bg-[#193022] text-amber-100 border-amber-500/35'
                      }`}
                    >
                      <span className="text-xs opacity-70 mr-1.5 font-mono-num">
                        {idx + 1}.
                      </span>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Form (if not yet solved) */}
          {!progress.solved && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label
                htmlFor="kata-adjektif-input"
                className="block text-xs font-bold uppercase tracking-wider text-amber-300"
              >
                Taip Kata Adjektif Pilihan Anda Di Sini
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="kata-adjektif-input"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="TAIP JAWAPAN ANDA DI SINI"
                  className="flex-1 px-4 py-3.5 rounded-lg bg-[#09120c] border-2 border-amber-500/50 text-amber-50 placeholder-amber-200/35 text-base sm:text-lg font-bold tracking-wide uppercase focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>HANTAR JAWAPAN</span>
                </button>
              </div>
            </form>
          )}

          {/* Feedback Area */}
          {feedback?.type === 'empty' && (
            <div
              role="alert"
              className="bg-amber-950/70 border border-amber-500/50 rounded-lg p-3.5 flex items-center gap-3 text-amber-100 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-semibold">{feedback.message}</span>
            </div>
          )}

          {feedback?.type === 'wrong' && (
            <div
              role="alert"
              className="bg-red-950/65 border border-red-500/50 rounded-xl p-4 space-y-2.5 text-sm"
            >
              <div className="flex items-center gap-2 font-extrabold text-red-300 text-base">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span>JAWAPAN KURANG TEPAT!</span>
              </div>
              <p className="text-red-50 leading-relaxed">{feedback.message}</p>
              {feedback.encouragement && (
                <p className="text-xs text-amber-200/90 italic">
                  Awang Kenit: &ldquo;{feedback.encouragement}&rdquo;
                </p>
              )}
              {feedback.progressiveHint && (
                <div className="mt-2 bg-amber-950/60 border border-amber-500/40 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-200">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{feedback.progressiveHint}</span>
                </div>
              )}
            </div>
          )}

          {feedback?.type === 'correct' && (
            <div className="bg-emerald-950/75 border-2 border-emerald-400/60 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-emerald-300 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>JAWAPAN BETUL!</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/50 px-3 py-1 rounded-lg text-amber-300 font-mono-num font-bold text-sm">
                  <Coins className="w-4 h-4" />
                  <span>+{question.rewardKupang} Kupang</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-amber-200">
                Syabas, Raja Mustafar! Jawapan anda tepat ({question.answer}).
              </p>

              <div className="bg-[#0b1a11] border border-emerald-600/30 rounded-lg p-3.5 space-y-1 text-sm">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Jenis Kata Adjektif: {question.adjectiveType}</span>
                </p>
                <p className="text-emerald-50/90 leading-relaxed">
                  {feedback.message}
                </p>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer transition-colors"
                >
                  TERUSKAN PENGEMBARAAN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
