// ============================================================
// ZABKA AUTOMATYZACJA ZAMOWIEN - content.js v1.0
// ============================================================
// Edytuj RULES zeby zmienic zachowanie wtyczki

const RULES = {
    horizonDays: 1.0,       // Na ile dni zamawiasz
        safetyBuffer: 1.2,      // Bufor bezpieczenstwa (+20%)
        blockInOut: true,       // Zakaz zamawiania IN-OUT
        requirePlanogramowy: true, // Tylko PLANOGRAMOWY
        promoBuffer: 1.3,       // Bufor dla produktow w akcji/gazetce (+30%)
        subtractInTransit: true,// Odejmij juz zamowione (ciężarówka)
        zeroExpiredStock: true, // Zeruj przeterminowany stan
        nowoscDefaultQty: 0,    // Ile zamawiac dla NOWOSC bez historii (0 = nie zamawiaj)
      };

// ============================================================
// UI - Panel sterowania
// ============================================================
const PANEL_ID = 'zabka-auto-panel';

function createUI() {
    if (document.getElementById(PANEL_ID)) return;
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
        <div id="zabka-header">
          <span>Zabka Auto-Order</span>
          <span id="zabka-toggle" title="Zwij/Rozwin">v</span>
        </div>
        <div id="zabka-body">
          <div class="zrow">
            <label>Horyzont (dni):</label>
            <input type="number" id="z-horizon" value="${RULES.horizonDays}" step="0.5" min="0.5" max="7">
          </div>
          <div class="zrow">
            <label>Bufor bezp.:</label>
            <input type="number" id="z-buffer" value="${RULES.safetyBuffer}" step="0.05" min="1.0" max="2.0">
          </div>
          <div class="zrow"><label><input type="checkbox" id="z-inout" checked> Blokuj IN-OUT</label></div>
          <div class="zrow"><label><input type="checkbox" id="z-plano" checked> Tylko PLANOGRAMOWY</label></div>
          <div class="zrow"><label><input type="checkbox" id="z-promo" checked> Bufor na promocje (+30%)</label></div>
      <div class="zrow"><label><input type="checkbox" id="z-transit" checked> Odejmij w transporcie</label></div>
      <div class="zrow"><label><input type="checkbox" id="z-expired" checked> Zeruj przeterminowane</label></div>
      <div class="zrow">
            <button id="z-run">Oblicz i Ustaw Zamowienie</button>
          </div>
          <div class="zrow">
            <button id="z-reset" class="zbtn2">Resetuj do 0</button>
          </div>
          <div id="z-status">Gotowy</div>
          <div id="z-log"></div>
        </div>
      `;
  document.body.appendChild(panel);
  addStyles();

  document.getElementById('zabka-toggle').addEventListener('click', () => {
        const body = document.getElementById('zabka-body');
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    document.getElementById('zabka-toggle').textContent = isHidden ? 'v' : '>';
});
  document.getElementById('z-run').addEventListener('click', runAutoOrder);
  document.getElementById('z-reset').addEventListener('click', resetAll);

  makeDraggable(panel);
}

function addStyles() {
  if (document.getElementById('zabka-styles')) return;
  const s = document.createElement('style');
  s.id = 'zabka-styles';
  s.textContent = `
    #zabka-auto-panel{position:fixed;top:80px;right:10px;width:270px;background:#fff;border:2px solid #00b140;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:99999;font-family:Arial,sans-serif;font-size:13px}
    #zabka-header{background:#00b140;color:#fff;padding:9px 14px;border-radius:8px 8px 0 0;font-weight:700;cursor:move;display:flex;justify-content:space-between}
    #zabka-toggle{cursor:pointer;font-size:16px;user-select:none}
    #zabka-body{padding:12px}
    .zrow{margin-bottom:7px;display:flex;align-items:center;gap:8px}
    .zrow label{flex:1;color:#333}
    .zrow input[type=number]{width:65px;padding:3px 6px;border:1px solid #ccc;border-radius:4px}
    #z-run{width:100%;padding:10px;background:#00b140;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700}
    #z-run:hover{background:#009933}
    #z-run:disabled{background:#aaa;cursor:not-allowed}
    .zbtn2{width:100%;padding:8px;background:#f0f0f0;color:#555;border:1px solid #ccc;border-radius:6px;cursor:pointer}
        .zbtn2:hover{background:#e0e0e0}
              #z-status{margin-top:6px;padding:5px 9px;background:#f5f5f5;border-radius:4px;color:#555;font-size:12px;min-height:22px}
              #z-log{max-height:140px;overflow-y:auto;font-size:11px;color:#888;margin-top:5px;line-height:1.6}
              .zok{color:#00b140} .zskip{color:#f60} .zerr{color:#c00}
        `;
  document.head.appendChild(s);
          }

function makeDraggable(el) {
    const header = el.querySelector('#zabka-header');
  let ox=0,oy=0,sx=0,sy=0;
  header.addEventListener('mousedown', e => {
        sx=e.clientX; sy=e.clientY;
    ox=el.offsetLeft; oy=el.offsetTop;
    const move = e2 => { el.style.right='auto'; el.style.left=(ox+e2.clientX-sx)+'px'; el.style.top=(oy+e2.clientY-sy)+'px'; };
    const up = () => { document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove',move);
    document.addEventListener('mouseup',up);
               });
}

// ============================================================
// USTAWIENIA Z UI
// ============================================================
function getSettings() {
    return {
          horizonDays: parseFloat(document.getElementById('z-horizon')?.value) || RULES.horizonDays,
          safetyBuffer: parseFloat(document.getElementById('z-buffer')?.value) || RULES.safetyBuffer,
          blockInOut: document.getElementById('z-inout')?.checked ?? true,
          requirePlanogramowy: document.getElementById('z-plano')?.checked ?? true,
          promoBuffer: document.getElementById('z-promo')?.checked ? 1.3 : 1.0,
          subtractInTransit: document.getElementById('z-transit')?.checked ?? true,
          zeroExpiredStock: document.getElementById('z-expired')?.checked ?? true,
      };
}

function setStatus(msg, c='#555') {
    const el = document.getElementById('z-status');
  if(el){ el.textContent=msg; el.style.color=c; }
}

function addLog(msg, cls='') {
  const log = document.getElementById('z-log');
  if(!log) return;
  const d = document.createElement('div');
  if(cls) d.className=cls;
  d.textContent = msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

// ============================================================
// PARSOWANIE WIERSZA PRODUKTU
// ============================================================
function parseRow(row) {
    const cells = row.querySelectorAll('[role="cell"]');
  if (!cells.length) return null;
  const firstCell = cells[0];
  const name = firstCell.innerText.split('\n')[0].trim();
  if (!name || name.length < 3) return null;

  const input = row.querySelector('input[type="text"]');
  if (!input) return null;

  const rowText = row.innerText.replace(/\n/g, '|');
  const allText = firstCell.innerText.toUpperCase();

  // Flagi produktu
  const isInOut = allText.includes('IN-OUT');
  const isPlanogramowy = allText.includes('PLANOGRAMOWY');
  const isNowość = allText.includes('NOWOŚĆ');
  const hasPromo = rowText.includes('AKCJA ZŁOTA') || rowText.includes('AKCJA SPECJALNA') || rowText.includes('GAZETKA');

  // Tempo (liczba z kropką, np. 1.71)
  const tempoMatches = rowText.match(/\b(\d+\.\d{1,2})\b/g) || [];
  const tempo = tempoMatches.length > 0 ? parseFloat(tempoMatches[0]) : 0;

  // Stan (pierwsza liczba całkowita w komórkach po nazwie)
  let stan = 0;
  for (let i = 1; i < cells.length; i++) {
    const t = cells[i].innerText.trim();
    if (/^-?\d+$/.test(t)) { stan = parseInt(t); break; }
}

  // Ciężarówka (in transit) - szukaj ikony truck
  let inTransit = 0;
  const truckEl = row.querySelector('[aria-label*="ruck"], [class*="truck"], [class*="transit"]');
  if (truckEl) {
    const truckText = truckEl.closest('[role="cell"]')?.innerText || '';
    const m = truckText.match(/(\d+)/);
    if (m) inTransit = parseInt(m[1]);
}
  // Też szukaj pattern "🚛 N" lub podobny w tekście
  const truckMatch = rowText.match(/(?:🚛|truck|transport)\D{0,5}(\d+)/i);
  if (truckMatch) inTransit = Math.max(inTransit, parseInt(truckMatch[1]));

  // Min/Opa (format "12 / 12" lub "1 / 1")
  const minOpaMatches = rowText.match(/(\d+)\s*\/\s*(\d+)/g) || [];
  let minQty = 1, opa = 1;
  if (minOpaMatches.length > 0) {
    const last = minOpaMatches[minOpaMatches.length - 1].split('/').map(s => parseInt(s.trim()));
    if (last.length === 2) { minQty = last[0] || 1; opa = last[1] || 1; }
  }

  return { name, input, stan: Math.max(0, stan), inTransit, tempo, minQty, opa, hasPromo, isInOut, isPlanogramowy, isNowość };
  }

// ============================================================
// OBLICZANIE ILOSCI
// ============================================================
function calcQty(p, s) {
  // Filtrowanie
  if (s.blockInOut && p.isInOut) return { qty: 0, reason: 'IN-OUT - pomijam' };
  if (s.requirePlanogramowy && !p.isPlanogramowy) return { qty: 0, reason: 'Brak PLANOGRAMOWY - pomijam' };
  if (p.tempo <= 0) return { qty: 0, reason: p.isNowość ? 'NOWOSC bez historii' : 'Brak tempa' };

  const effectiveStock = (s.zeroExpiredStock ? Math.max(0, p.stan) : p.stan) + (s.subtractInTransit ? p.inTransit : 0);
  const promoMult = (s.promoBuffer > 1 && p.hasPromo) ? s.promoBuffer : 1.0;
  const need = Math.ceil(p.tempo * s.horizonDays * s.safetyBuffer * promoMult);
  let lacking = need - effectiveStock;

  if (lacking <= 0) return { qty: 0, reason: `Stan wystarczajacy (${effectiveStock}/${need})` };
  if (p.opa > 1) lacking = Math.ceil(lacking / p.opa) * p.opa;
  if (lacking < p.minQty) lacking = p.minQty;
  return { qty: lacking, reason: `stan=${effectiveStock}, potrzeba=${need}` };
}

// ============================================================
// USTAWIANIE WARTOSCI PRZEZ PRZYCISKI
// ============================================================
async function setInputValue(input, targetQty) {
  const row = input.closest('[role="row"]');
  if (!row) return false;
  const btns = row.querySelectorAll('button');
  const plus = Array.from(btns).find(b => b.getAttribute('aria-label') === 'Zwieksz wartość' || b.getAttribute('aria-label') === 'Zwiększ wartość');
  const minus = Array.from(btns).find(b => b.getAttribute('aria-label') === 'Zmniejsz wartość');
  if (!plus || !minus) return false;
  let cur = parseInt(input.value) || 0;
  const diff = targetQty - cur;
  if (diff === 0) return true;
  const btn = diff > 0 ? plus : minus;
  for (let i = 0; i < Math.abs(diff); i++) { btn.click(); await sleep(25); }
  return true;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getScrollDiv() {
  return Array.from(document.querySelectorAll('*')).find(el => {
    const s = window.getComputedStyle(el);
    return (s.overflowY==='auto'||s.overflowY==='scroll') && el.scrollHeight > 800;
});
}

// ============================================================
// GLOWNA FUNKCJA - AUTO ORDER
// ============================================================
async function runAutoOrder() {
  const btn = document.getElementById('z-run');
  if (btn) btn.disabled = true;
  document.getElementById('z-log').innerHTML = '';
  setStatus('Skanowanie...', '#f60');

  const settings = getSettings();
  const scrollDiv = getScrollDiv();
  if (!scrollDiv) { setStatus('Blad: nie znaleziono listy', '#c00'); if(btn) btn.disabled=false; return; }

  // Zbierz dane przez observer + scrollowanie
  const processed = new Set();
  const observer = new MutationObserver(() => {
    document.querySelectorAll('[role="row"]').forEach(r => {
      const p = parseRow(r);
      if (p) processed.add(p.name);
});
});
  observer.observe(document.body, {childList:true, subtree:true});

  // Przewin + aktualizuj
  let updated=0, zeroed=0, skipped=0;
  const maxScroll = scrollDiv.scrollHeight;

  for (let pos = 0; pos <= maxScroll + 500; pos += 400) {
    scrollDiv.scrollTop = pos;
    await sleep(250);

    for (const row of document.querySelectorAll('[role="row"]')) {
      const p = parseRow(row);
      if (!p) continue;
      const key = p.name + '|' + pos;
      if (processed.has(key)) continue;
      processed.add(key);

      const {qty, reason} = calcQty(p, settings);
      const cur = parseInt(p.input.value) || 0;
      if (cur !== qty) {
        await setInputValue(p.input, qty);
        if (qty === 0 && cur > 0) { zeroed++; addLog('0 '+p.name.substring(0,30)+' ('+reason+')', 'zskip'); }
        else if (qty > 0) { updated++; addLog(qty+' '+p.name.substring(0,30)+' ('+reason+')', 'zok'); }
} else { skipped++; }
}
}

  observer.disconnect();
  scrollDiv.scrollTop = 0;
  await sleep(300);

  const kwota = document.body.innerText.match(/Zamówienie brutto\s+([\d\s,\.]+zł)/)?.[1] || '?';
  setStatus(`Gotowe! ${updated} zamow, ${zeroed} wyzer | ${kwota}`, '#00b140');
  if(btn) btn.disabled=false;
}

// ============================================================
// RESET
// ============================================================
async function resetAll() {
  if (!confirm('Na pewno zerowac wszystkie ilosci?')) return;
  setStatus('Zerowanie...', '#f60');
  const sd = getScrollDiv();
  if (!sd) return;
  for (let pos=0; pos<=sd.scrollHeight+500; pos+=400) {
    sd.scrollTop = pos;
    await sleep(200);
    for (const inp of document.querySelectorAll('[role="row"] input[type="text"]')) {
      if ((parseInt(inp.value)||0) > 0) await setInputValue(inp, 0);
      }
    }
  setStatus('Wyzerowano', '#00b140');
  }

// ============================================================
// START
// ============================================================
function init() {
    const check = setInterval(() => {
    if (document.querySelector('[role="row"]')) {
      clearInterval(check);
      createUI();
    }
    }, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
