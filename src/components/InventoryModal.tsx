import { CheckCircle2, Package, Shield, Sparkles, Sword, FlaskConical, X } from 'lucide-react';
import { EQUIPMENT_CATALOG } from '../data/questions';
import { EquipmentId, PlayerSaveData } from '../types/game';

interface InventoryModalProps {
  save: PlayerSaveData;
  onUseOrEquip: (itemId: EquipmentId) => void;
  onClose: () => void;
}

function ItemArt({ id }: { id: EquipmentId }) {
  if (id === 'keris_diraja') {
    return (
      <div className="w-14 h-14 rounded-lg bg-amber-950/70 border border-amber-400/40 flex items-center justify-center shrink-0">
        <Sword className="w-8 h-8 text-amber-300" />
      </div>
    );
  }
  if (id === 'perisai_warisan') {
    return (
      <div className="w-14 h-14 rounded-lg bg-orange-950/70 border border-orange-400/40 flex items-center justify-center shrink-0">
        <Shield className="w-8 h-8 text-orange-300" />
      </div>
    );
  }
  if (id === 'ramuan_pemulih') {
    return (
      <div className="w-14 h-14 rounded-lg bg-emerald-950/70 border border-emerald-400/40 flex items-center justify-center shrink-0">
        <FlaskConical className="w-8 h-8 text-emerald-300" />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-lg bg-yellow-950/70 border border-yellow-400/40 flex items-center justify-center shrink-0">
      <Sparkles className="w-8 h-8 text-yellow-300" />
    </div>
  );
}

export function InventoryModal({
  save,
  onUseOrEquip,
  onClose,
}: InventoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#14261c] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#3f1907] border-b border-amber-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-amber-100">
                INVENTORI PERALATAN
              </h2>
              <p className="text-xs text-amber-200/75">
                Tenaga Semasa: {save.hp}/{save.maxHp} · Perisai Aktif:{' '}
                {save.equippedShield ? 'Ya' : 'Tidak'} · Pelindung Ajaib:{' '}
                {save.shieldTurnsLeft} pusingan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Inventori"
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto nusantara-scroll grid grid-cols-1 md:grid-cols-2 gap-4">
          {EQUIPMENT_CATALOG.map((item) => {
            const count = save.inventory[item.id] ?? 0;
            const owned = count > 0;
            const isEquipped =
              (item.id === 'keris_diraja' && save.equippedWeapon === 'keris_diraja') ||
              (item.id === 'perisai_warisan' && save.equippedShield);

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                  owned
                    ? 'bg-[#0e1b13] border-amber-500/35'
                    : 'bg-[#0a140e]/70 border-slate-700/40 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <ItemArt id={item.id} />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-amber-100 text-sm">
                        {item.name}
                      </h3>
                      <span
                        className={`text-[11px] font-mono-num font-bold ${
                          owned ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {owned
                          ? item.consumable
                            ? `Dimiliki (x${count})`
                            : 'Dimiliki'
                          : 'Belum Dimiliki'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-100/75 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1 border-t border-amber-500/15">
                  <div className="flex items-center justify-between text-xs font-mono-num text-amber-300">
                    <span>
                      Kuasa: +{item.powerBonus} · Pertahanan: +{item.defenseBonus}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90">{item.effectText}</p>

                  {owned ? (
                    <button
                      type="button"
                      onClick={() => onUseOrEquip(item.id)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        isEquipped
                          ? 'bg-emerald-700/60 text-emerald-100 border border-emerald-400/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isEquipped && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>
                        {item.consumable
                          ? 'Gunakan Sekarang'
                          : isEquipped
                            ? 'Sedang Dipakai'
                            : 'Pakai Peralatan'}
                      </span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-amber-200/60">
                      Tewaskan raksasa penjaga kawasan untuk memperoleh peralatan ini.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-amber-500/20 px-6 py-3.5 bg-[#0e1b13] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#1c3828] hover:bg-[#244a35] text-amber-100 text-sm font-semibold cursor-pointer"
          >
            Tutup (I)
          </button>
        </div>
      </div>
    </div>
  );
}
