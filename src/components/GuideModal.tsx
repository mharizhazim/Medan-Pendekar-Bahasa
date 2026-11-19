import { X, Compass, Keyboard, Smartphone } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

const GUIDE_STEPS = [
  'Gunakan kekunci W, A, S, D untuk menggerakkan Raja Mustafar.',
  'Gunakan kekunci SPACE untuk melompat merentasi halangan dan tangga.',
  'Gunakan kekunci SHIFT untuk berlari lebih pantas.',
  'Gunakan kekunci E untuk membuka Tabung Pitis atau berbual apabila berada berdekatan.',
  'Baca petikan cerita rakyat di dalam Tabung Pitis dengan teliti.',
  'Pilih salah satu daripada 3 pilihan jawapan yang diberikan dan taip ke dalam ruang jawapan.',
  'Tekan butang HANTAR JAWAPAN untuk menyemak jawapan anda.',
  'Baca penerangan tatabahasa selepas menghantar jawapan.',
  'Teruskan pengembaraan untuk mencari keempat-empat tabung yang lain.',
  'Hadapi cabaran raksasa penjaga kawasan untuk mendapatkan kupang, XP dan peralatan.',
  'Jawab semula semua soalan yang pernah dijawab salah semasa Ujian Terakhir.',
  'Lengkapkan kesemua misi untuk memperoleh gelaran PANGLIMA AGUNG.',
];

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#14261c] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#3f1907] border-b border-amber-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-100">
              PANDUAN PERMAINAN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan"
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto nusantara-scroll space-y-6">
          {/* 12 Official Steps */}
          <div>
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
              Langkah Pengembaraan Medan Pendekar Bahasa
            </h3>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-amber-50/90">
              {GUIDE_STEPS.map((step, idx) => (
                <li
                  key={idx}
                  className="bg-[#0e1b13] border border-emerald-700/30 rounded-lg p-3 flex items-start gap-3"
                >
                  <span className="font-mono-num font-bold text-amber-400 shrink-0">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Desktop & Mobile Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e1b13] border border-amber-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Keyboard className="w-4 h-4" />
                <span>Kawalan Komputer / Laptop</span>
              </div>
              <ul className="text-xs text-amber-100/85 space-y-1.5 font-mono-num">
                <li>W / A / S / D — Bergerak (Hadapan / Kiri / Belakang / Kanan)</li>
                <li>SPACE — Melompat</li>
                <li>SHIFT — Berlari Pantas</li>
                <li>E — Buka Tabung / Berbual / Cabar Raksasa</li>
                <li>I — Buka Panel Inventori</li>
                <li>ESC — Buka Menu Permainan</li>
                <li>Seret Tetikus — Pusing Sudut Kamera 3D</li>
              </ul>
            </div>

            <div className="bg-[#0e1b13] border border-amber-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Kawalan Telefon Pintar &amp; Tablet</span>
              </div>
              <ul className="text-xs text-amber-100/85 space-y-1.5 leading-relaxed">
                <li>Joystick Maya (Kiri Bawah) — Menggerakkan Raja Mustafar</li>
                <li>Butang LOMPAT, LARI, INTERAKSI &amp; INVENTORI (Kanan Bawah)</li>
                <li>Seret Skrin — Putar pandangan kamera sekeliling medan</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-500/20 px-6 py-4 bg-[#0e1b13] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
          >
            Faham, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
