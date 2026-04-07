import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const TABLE_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

export default function QRCodeSection() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const generate = async (tableNum: number) => {
    setSelectedTable(tableNum);
    const url = `${window.location.origin}/menu?table=${tableNum}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1A1410', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (e) { console.error(e); }
  };

  const generateAll = async () => {
    // Generate all QR codes as a printable page
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write('<html><head><title>QR Меню — Соль и Перец</title><style>body{font-family:sans-serif;background:#fff;} .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:20px;} .card{border:2px solid #E8621A;border-radius:12px;padding:16px;text-align:center;page-break-inside:avoid;} h2{color:#E8621A;margin:0 0 8px;font-size:14px;} img{width:120px;height:120px;} p{margin:4px 0;font-size:11px;color:#666;} @media print{.no-print{display:none}}</style></head><body>');
    win.document.write('<button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 20px;background:#E8621A;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">🖨️ Печать</button>');
    win.document.write('<div class="grid">');
    for (const n of TABLE_NUMBERS) {
      const url = `${window.location.origin}/menu?table=${n}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#1A1410', light: '#FFFFFF' }, errorCorrectionLevel: 'H' });
      win.document.write(`<div class="card"><h2>🍽️ Стол №${n}</h2><img src="${dataUrl}" /><p>Соль и Перец</p><p style="font-size:9px;color:#aaa;">Сканируйте для меню</p></div>`);
    }
    win.document.write('</div></body></html>');
    win.document.close();
  };

  const download = () => {
    if (!qrDataUrl || !selectedTable) return;
    const a = document.createElement('a');
    a.download = `qr-stol-${selectedTable}.png`;
    a.href = qrDataUrl;
    a.click();
  };

  return (
    <div>
      <h2 className="text-sp-cream font-display text-2xl font-bold mb-2">QR-меню</h2>
      <p className="text-sp-cream/40 text-sm mb-6">Гости сканируют QR-код за столом и видят меню без корзины</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Table selector */}
        <div className="bg-sp-dark rounded-2xl p-5 border border-white/8">
          <h3 className="text-sp-cream font-semibold mb-4">Выберите стол</h3>
          <div className="grid grid-cols-6 gap-2 mb-5">
            {TABLE_NUMBERS.map(n => (
              <button
                key={n}
                onClick={() => generate(n)}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  selectedTable === n
                    ? 'bg-sp-orange text-white shadow-lg shadow-sp-orange/30'
                    : 'bg-white/8 text-sp-cream/60 hover:bg-sp-orange/20 hover:text-sp-cream'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button onClick={generateAll} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
            🖨️ Распечатать все QR-коды
          </button>
        </div>

        {/* QR Preview */}
        <div className="bg-sp-dark rounded-2xl p-5 border border-white/8 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <>
              <div className="bg-white rounded-2xl p-4 mb-4">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center mb-4">
                <div className="text-sp-cream font-semibold text-lg">Стол №{selectedTable}</div>
                <div className="text-sp-cream/40 text-xs mt-1 font-mono">{baseUrl}/menu?table={selectedTable}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={download} className="btn-primary text-sm flex items-center gap-2">
                  ⬇️ Скачать PNG
                </button>
                <button onClick={() => window.open(`${baseUrl}/menu?table=${selectedTable}`, '_blank')} className="btn-secondary text-sm">
                  Открыть меню
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-sp-cream/30">
              <div className="text-6xl mb-3">⬛</div>
              <p>Выберите стол для генерации QR-кода</p>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
