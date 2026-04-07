import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FloorPlanProps {
  open: boolean;
  onClose: () => void;
  onSelectTable: (n: number) => void;
  selectedTable: number | null;
  bookedTables: number[];       // hard blocked (exact time or all-day if no time)
  softBookedTables?: number[];  // booked at other times (orange, still selectable)
  date?: string;
  time?: string;
}

const TABLE_POSITIONS: Record<number, { x: number; y: number }> = {
  1:  { x: 150, y: 445 },
  2:  { x: 195, y: 395 },
  3:  { x: 228, y: 350 },
  4:  { x: 240, y: 430 },
  5:  { x: 280, y: 365 },
  6:  { x: 305, y: 290 },
  7:  { x: 365, y: 310 },
  8:  { x: 400, y: 250 },
  9:  { x: 450, y: 330 },
  10: { x: 485, y: 260 },
  11: { x: 425, y: 420 },
  15: { x: 475, y: 420 },
  12: { x: 590, y: 270 },
  13: { x: 700, y: 265 },
  14: { x: 830, y: 270 },
  16: { x: 505, y: 502 },
  17: { x: 650, y: 502 },
};

function getTableFill(num: number, bookedTables: number[], softBookedTables: number[], selectedTable: number | null) {
  if (selectedTable === num) return '#22C55E';
  if (bookedTables.includes(num)) return '#EF4444';
  if (softBookedTables.includes(num)) return '#F97316';
  return '#2D2D2D';
}

export default function FloorPlan({
  open, onClose, onSelectTable, selectedTable,
  bookedTables, softBookedTables = [], date, time
}: FloorPlanProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-3 md:inset-6 z-50 bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">🗺️ Схема зала</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {date && time
                    ? `${new Date(date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · ${time} · ${bookedTables.length > 0 ? `занято ${bookedTables.length} столов` : 'все столы свободны'}`
                    : date
                    ? `${new Date(date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · выберите время`
                    : 'Выберите дату для отображения занятых столов'
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#2D2D2D', display: 'inline-block' }} />Свободен</span>
                  {softBookedTables.length > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#F97316', display: 'inline-block', opacity: 0.8 }} />Другое время</span>}
                  {bookedTables.length > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#EF4444', display: 'inline-block' }} />Занят</span>}
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#22C55E', display: 'inline-block' }} />Выбран</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* SVG */}
            <div className="flex-1 overflow-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1050 720"
                className="w-full h-full"
                style={{ minWidth: 560, fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif" }}
              >
                <defs>
                  <filter id="venShadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.06"/></filter>
                  <filter id="boxShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/></filter>
                  <filter id="tblShadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.35"/></filter>
                  <pattern id="floor" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="#FAFAFA"/>
                    <rect width="20" height="20" fill="#F5F5F5" opacity="0.5"/>
                    <rect x="20" y="20" width="20" height="20" fill="#F5F5F5" opacity="0.5"/>
                  </pattern>
                  <pattern id="dfloor" width="25" height="25" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="25" height="25" fill="rgba(156,39,176,0.03)"/>
                    <rect width="12.5" height="12.5" fill="rgba(156,39,176,0.06)"/>
                    <rect x="12.5" y="12.5" width="12.5" height="12.5" fill="rgba(156,39,176,0.06)"/>
                  </pattern>
                  <clipPath id="venueClip">
                    <path d="M 100,490 L 310,225 L 890,225 L 890,560 L 435,560 L 435,490 Z"/>
                  </clipPath>
                </defs>

                <rect width="1050" height="720" fill="#FFF"/>
                <rect width="1050" height="85" fill="#1B1B2F"/>
                <text x="525" y="38" textAnchor="middle" fontSize="22" fontWeight="700" fill="#FFF" letterSpacing="5">СОЛЬ · ПЕРЕЦ</text>
                <line x1="435" y1="50" x2="615" y2="50" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round"/>
                <text x="525" y="68" textAnchor="middle" fontSize="11" fill="#777" letterSpacing="2">СХЕМА БРОНИРОВАНИЯ СТОЛОВ</text>

                <path d="M 100,490 L 310,225 L 890,225 L 890,560 L 435,560 L 435,490 Z"
                  fill="url(#floor)" stroke="#BBB" strokeWidth="3" strokeLinejoin="round" filter="url(#venShadow)"/>

                <g clipPath="url(#venueClip)">
                  <path d="M 100,490 L 310,225 L 400,225 L 400,490 Z" fill="#FFF3E0" opacity="0.25"/>
                  <rect x="400" y="225" width="160" height="265" fill="#E8F5E9" opacity="0.2"/>
                  <rect x="560" y="225" width="330" height="265" fill="#E3F2FD" opacity="0.2"/>
                  <rect x="435" y="490" width="455" height="70" fill="#F3E5F5" opacity="0.25"/>
                </g>

                <line x1="400" y1="228" x2="400" y2="487" stroke="#E0E0E0" strokeWidth="1" strokeDasharray="6,4"/>
                <line x1="560" y1="228" x2="560" y2="487" stroke="#E0E0E0" strokeWidth="1" strokeDasharray="6,4"/>
                <line x1="438" y1="490" x2="887" y2="490" stroke="#E0E0E0" strokeWidth="1" strokeDasharray="6,4"/>

                <text x="350" y="243" textAnchor="middle" fontSize="9" fill="#CCC" letterSpacing="2" fontWeight="600">ЗОНА A</text>
                <text x="480" y="243" textAnchor="middle" fontSize="9" fill="#CCC" letterSpacing="2" fontWeight="600">ЗОНА B</text>
                <text x="725" y="243" textAnchor="middle" fontSize="9" fill="#CCC" letterSpacing="2" fontWeight="600">ЗОНА C</text>
                <text x="660" y="553" textAnchor="middle" fontSize="9" fill="#CCC" letterSpacing="2" fontWeight="600">ЗОНА D</text>

                {/* Entrance */}
                <rect x="55" y="473" width="52" height="36" rx="8" fill="#E53935" filter="url(#boxShadow)"/>
                <text x="81" y="496" textAnchor="middle" fontSize="10" fill="#FFF" fontWeight="700" letterSpacing="1">ВХОД</text>
                <polygon points="107,491 120,484 120,498" fill="#E53935"/>

                {/* WC */}
                <rect x="500" y="150" width="158" height="75" rx="12" fill="#388E3C" filter="url(#boxShadow)"/>
                <text x="579" y="182" textAnchor="middle" fontSize="12" fill="#FFF" fontWeight="700">WC / КУРИЛКА</text>
                <text x="579" y="200" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)">Туалет · Зона для курения</text>
                <rect x="540" y="222" width="78" height="6" rx="3" fill="#388E3C" opacity="0.4"/>

                {/* Bar */}
                <rect x="890" y="268" width="78" height="172" rx="12" fill="#1565C0" filter="url(#boxShadow)"/>
                <text transform="rotate(-90,929,354)" x="929" y="358" textAnchor="middle" fontSize="15" fill="#FFF" fontWeight="700" letterSpacing="3">БАР</text>
                {[298,318,338,358,378,398,418].map(cy => (
                  <circle key={cy} cx="896" cy={cy} r="3.5" fill="rgba(255,255,255,0.3)"/>
                ))}

                {/* DJ */}
                <g transform="rotate(-8,885,570)">
                  <rect x="855" y="548" width="60" height="44" rx="10" fill="#F57F17" filter="url(#boxShadow)"/>
                  <text x="885" y="575" textAnchor="middle" fontSize="13" fill="#FFF" fontWeight="700">DJ</text>
                </g>

                {/* Dance floor */}
                <rect x="660" y="345" width="148" height="103" rx="14" fill="rgba(156,39,176,0.04)" stroke="#9C27B0" strokeWidth="2" strokeDasharray="8,4"/>
                <text x="734" y="393" textAnchor="middle" fontSize="12" fill="#7B1FA2" fontWeight="700" letterSpacing="1">ТАНЦПОЛ</text>
                <text x="734" y="412" textAnchor="middle" fontSize="9" fill="#9C27B0" opacity="0.5">DANCE FLOOR</text>

                {/* Tables */}
                {Object.entries(TABLE_POSITIONS).map(([numStr, pos]) => {
                  const num = parseInt(numStr);
                  const isHardBooked = bookedTables.includes(num);
                  const isSoftBooked = softBookedTables.includes(num);
                  const isSelected = selectedTable === num;
                  const fill = getTableFill(num, bookedTables, softBookedTables, selectedTable);
                  const canSelect = !isHardBooked;

                  return (
                    <g
                      key={num}
                      onClick={() => canSelect && onSelectTable(num)}
                      style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
                    >
                      {/* Glow for selected */}
                      {isSelected && (
                        <rect x={pos.x - 5} y={pos.y - 5} width="52" height="52" rx="13"
                          fill="rgba(34,197,94,0.2)" stroke="#22C55E" strokeWidth="2"
                        />
                      )}
                      {/* Glow for hard booked */}
                      {isHardBooked && (
                        <rect x={pos.x - 3} y={pos.y - 3} width="48" height="48" rx="11"
                          fill="rgba(239,68,68,0.15)"
                        />
                      )}
                      <rect
                        x={pos.x} y={pos.y} width="42" height="42" rx="8"
                        fill={fill}
                        filter="url(#tblShadow)"
                        opacity={isHardBooked ? 0.85 : isSoftBooked ? 0.75 : 1}
                      />
                      <text
                        x={pos.x + 21} y={pos.y + 27}
                        textAnchor="middle"
                        fontSize={num >= 10 ? 13 : 15}
                        fill="#FFF"
                        fontWeight="700"
                        style={{ userSelect: 'none' }}
                      >{num}</text>
                      {/* X mark for hard booked */}
                      {isHardBooked && (
                        <text x={pos.x + 21} y={pos.y + 16} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)">⛔</text>
                      )}
                    </g>
                  );
                })}

                {/* Legend at bottom */}
                <rect x="50" y="600" width="950" height="105" rx="12" fill="#FAFAFA" stroke="#EEE" strokeWidth="1"/>
                <text x="525" y="623" textAnchor="middle" fontSize="10" fill="#AAA" letterSpacing="2" fontWeight="600">УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</text>

                <rect x="90" y="640" width="18" height="18" rx="4" fill="#2D2D2D"/>
                <text x="116" y="654" fontSize="11" fill="#555">Свободен</text>

                <rect x="220" y="640" width="18" height="18" rx="4" fill="#F97316" opacity="0.75"/>
                <text x="246" y="654" fontSize="11" fill="#555">Другое время</text>

                <rect x="390" y="640" width="18" height="18" rx="4" fill="#EF4444"/>
                <text x="416" y="654" fontSize="11" fill="#555">Занят</text>

                <rect x="490" y="640" width="18" height="18" rx="4" fill="#22C55E"/>
                <text x="516" y="654" fontSize="11" fill="#555">Выбран вами</text>

                <rect x="650" y="640" width="18" height="18" rx="4" fill="#1565C0"/>
                <text x="676" y="654" fontSize="11" fill="#555">Бар</text>

                <rect x="750" y="640" width="18" height="18" rx="4" fill="none" stroke="#9C27B0" strokeWidth="2"/>
                <text x="776" y="654" fontSize="11" fill="#555">Танцпол</text>

                <text x="525" y="688" textAnchor="middle" fontSize="10" fill="#BBB" letterSpacing="1">ВСЕГО: 17 СТОЛОВ · ЗОНА A: 6 · ЗОНА B: 7 · ЗОНА C: 3 · ЗОНА D: 2</text>
              </svg>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <span className="text-sm text-gray-500">
                {selectedTable
                  ? `✅ Стол №${selectedTable} выбран`
                  : `Нажмите на свободный стол`
                }
              </span>
              <div className="flex gap-3">
                {selectedTable && (
                  <button onClick={() => onSelectTable(0)} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">Сбросить</button>
                )}
                <button onClick={onClose} className="btn-primary text-sm py-2 px-5">
                  {selectedTable ? `Подтвердить стол №${selectedTable}` : 'Закрыть'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
