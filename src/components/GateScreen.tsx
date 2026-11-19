import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  Unlock,
} from 'lucide-react';
import {
  checkSharedMjbStorage,
  encodeTransferCode,
  verifyTransferCode,
} from '../data/continuity';
import { audioEngine } from '../game/audio';

interface GateScreenProps {
  onUnlockSuccess: (playerName: string, startingKupang: number) => void;
  existingVerifiedName?: string | null;
}

export function GateScreen({
  onUnlockSuccess,
  existingVerifiedName,
}: GateScreenProps) {
  const [transferCode, setTransferCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{
    playerName: string;
    kupang: number;
  } | null>(null);
  const [sharedDetected, setSharedDetected] = useState<{
    found: boolean;
    hasRajaMustafar: boolean;
    playerName: string;
    kupang: number;
  }>({ found: false, hasRajaMustafar: false, playerName: '', kupang: 0 });
  const [showHelper, setShowHelper] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const sampleValidCode = 'MJB-RM-2026-MUSTAFAR';

  useEffect(() => {
    const shared = checkSharedMjbStorage();
    setSharedDetected(shared);
  }, []);

  const handleCheckSharedData = () => {
    audioEngine.unlock();
    const shared = checkSharedMjbStorage();
    setSharedDetected(shared);
    if (shared.found && shared.hasRajaMustafar) {
      audioEngine.playCorrect();
      setIsUnlocked(true);
      setVerifiedData({
        playerName: shared.playerName,
        kupang: shared.kupang,
      });
      setStatusMessage(
        'Selamat kembali, Raja Mustafar! Anda telah berjaya menguasai dunia budaya. Kini, pengembaraan baharu menanti anda di Medan Pendekar Bahasa.',
      );
    } else {
      audioEngine.playWrong();
      setIsUnlocked(false);
      setStatusMessage(
        'Gerbang masih terkunci! Anda perlu mendapatkan avatar Raja Mustafar dalam Misi Jelajah Budaya terlebih dahulu.',
      );
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.unlock();
    const res = verifyTransferCode(transferCode);
    if (res.valid && res.hasRajaMustafar) {
      audioEngine.playCorrect();
      setIsUnlocked(true);
      setVerifiedData({ playerName: res.playerName, kupang: res.kupang });
      setStatusMessage(res.message);
    } else {
      audioEngine.playWrong();
      setIsUnlocked(false);
      setVerifiedData(null);
      setStatusMessage(res.message);
    }
  };

  const handleEnterGame = () => {
    if (!verifiedData) return;
    audioEngine.playChestOpen();
    onUnlockSuccess(verifiedData.playerName, verifiedData.kupang);
  };

  const handleCopySample = () => {
    navigator.clipboard?.writeText(sampleValidCode).catch(() => {});
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 1800);
  };

  // Generate an example encoded payload from Misi Jelajah Budaya for teachers/testers
  const generatedPayloadCode = encodeTransferCode({
    game: 'MISI_JELAJAH_BUDAYA',
    playerName: 'Raja Mustafar',
    kupang: 65,
    stagesCompleted: 3,
    ownedAvatars: ['AWANG_KENIT', 'RAJA_MUSTAFAR'],
  });

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#0f1f16] text-amber-50 flex items-center justify-center p-4 md:p-8">
      {/* Subtle Nusantara geometric backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #d97706 0%, transparent 45%), radial-gradient(circle at 80% 80%, #15803d 0%, transparent 45%)',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl bg-[#16291e] border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Top Royal Header */}
        <div className="bg-[#451a03] border-b border-amber-500/30 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider text-amber-300">
              SAMBUNGAN RASMI · MISI JELAJAH BUDAYA
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-amber-100 mt-1">
              GERBANG MEDAN PENDEKAR BAHASA
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2a1205] border border-amber-500/30 text-amber-200 self-start sm:self-auto">
            {isUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>GERBANG TERBUKA</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>PENGESAHAN DIPERLUKAN</span>
              </>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Lore / Requirement Notice */}
          <div className="bg-[#102017] border border-emerald-700/40 rounded-lg p-4 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 text-sm text-amber-100/90 leading-relaxed">
              <p className="font-semibold text-amber-200">
                Syarat Memasuki Medan Pendekar Bahasa
              </p>
              <p>
                Hanya pemain yang telah menamatkan{' '}
                <strong className="text-amber-300">Misi Jelajah Budaya</strong>{' '}
                dan memiliki avatar{' '}
                <strong className="text-amber-300">RAJA MUSTAFAR</strong>{' '}
                dibenarkan membuka gerbang pengembaraan ini.
              </p>
            </div>
          </div>

          {existingVerifiedName && !isUnlocked && (
            <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold text-emerald-300">
                  Rekod Kemajuan Tersimpan Dikesan ({existingVerifiedName})
                </p>
                <p className="text-emerald-100/80 text-xs mt-0.5">
                  Anda telah disahkan sebelum ini dalam peranti ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUnlockSuccess(existingVerifiedName, 50)}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Sambung Pengembaraan
              </button>
            </div>
          )}

          {/* Method 1 & Method 2 Grid */}
          {!isUnlocked ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Method 1: Shared Storage */}
              <div className="bg-[#112118] border border-amber-500/20 rounded-lg p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Kaedah 1: Data Kemajuan Kongsi</span>
                  </div>
                  <p className="text-xs text-amber-100/75 leading-relaxed">
                    Semak secara automatik rekod simpanan daripada permainan{' '}
                    <em>Misi Jelajah Budaya</em> pada pelayar ini.
                  </p>
                  <p className="text-xs font-mono-num text-amber-200/80 pt-1">
                    Status:{' '}
                    {sharedDetected.found
                      ? sharedDetected.hasRajaMustafar
                        ? `Dikesan (${sharedDetected.playerName})`
                        : 'Data wujud, tetapi avatar Raja Mustafar belum dimiliki'
                      : 'Tiada rekod Misi Jelajah Budaya pada pelayar'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckSharedData}
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                >
                  Semak Data Kemajuan
                </button>
              </div>

              {/* Method 2: Transfer Code */}
              <form
                onSubmit={handleVerifyCode}
                className="bg-[#112118] border border-amber-500/20 rounded-lg p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="transfer-code-input"
                    className="flex items-center gap-2 text-amber-300 font-semibold text-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Kaedah 2: Kod Pemindahan Kemajuan</span>
                  </label>
                  <p className="text-xs text-amber-100/75 leading-relaxed">
                    Masukkan kod pemindahan yang dieksport daripada{' '}
                    <em>Misi Jelajah Budaya</em> untuk mengesahkan pemilikan
                    Raja Mustafar.
                  </p>
                  <input
                    id="transfer-code-input"
                    type="text"
                    value={transferCode}
                    onChange={(e) => setTransferCode(e.target.value)}
                    placeholder="Contoh: MJB-RM-2026-MUSTAFAR"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg bg-[#0a140e] border border-amber-500/40 text-amber-50 placeholder-amber-200/35 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Sahkan Kod Pemindahan
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked State */
            <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-amber-200">
                  Pengesahan Raja Mustafar Berjaya!
                </h2>
                <p className="text-sm md:text-base text-emerald-50 max-w-xl mx-auto leading-relaxed">
                  {statusMessage}
                </p>
                {verifiedData && (
                  <p className="text-xs font-mono-num text-amber-300 pt-1">
                    Nama Pendekar: {verifiedData.playerName} · Kupang Permulaan:{' '}
                    {verifiedData.kupang}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleEnterGame}
                className="px-7 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base transition-colors cursor-pointer"
              >
                MASUK KE HALAMAN UTAMA
              </button>
            </div>
          )}

          {/* Error / Status Banner */}
          {statusMessage && !isUnlocked && (
            <div
              role="alert"
              className="bg-red-950/75 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-100 text-sm"
            >
              <Lock className="w-5 h-5 text-red-400 shrink-0" />
              <p className="font-medium">{statusMessage}</p>
            </div>
          )}

          {/* Teacher / Evaluator Reference Drawer */}
          <div className="border-t border-amber-500/20 pt-4">
            <button
              type="button"
              onClick={() => setShowHelper((v) => !v)}
              className="text-xs text-amber-300/80 hover:text-amber-200 underline cursor-pointer"
            >
              {showHelper
                ? 'Sembunyikan Rujukan Kod Pemindahan (Guru / Penguji)'
                : 'Rujukan Struktur Kod Pemindahan Misi Jelajah Budaya (Guru / Penguji)'}
            </button>

            {showHelper && (
              <div className="mt-3 bg-[#0c1811] border border-amber-500/20 rounded-lg p-4 space-y-2 text-xs text-amber-100/80">
                <p>
                  Jika kedua-dua permainan dijalankan secara berasingan, murid
                  boleh menyalin kod pemindahan daripada <em>Misi Jelajah Budaya</em>{' '}
                  ke dalam ruangan di atas. Kod sah contoh untuk pengesahan Raja
                  Mustafar:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <code className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-500/30 font-mono-num text-amber-300">
                    {sampleValidCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 font-medium cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedDemo ? 'Disalin!' : 'Salin Kod'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-200/60 pt-1 break-all">
                  Struktur Kod Berenkripsi Penuh: {generatedPayloadCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
