// Simula Google Apps Script (planilha, UrlFetch, cache...) pra testar o Codigo.gs no Node, sem internet.
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8');
function makeSheet(name, rows){ 
  const s = { name, rows: rows || [] };
  const disp = v => { v = String(v); return v.startsWith("'") ? v.slice(1) : v; };
  s.appendRow = r => s.rows.push(r.slice());
  s.getLastRow = () => s.rows.length;
  s.setFrozenRows = () => {};
  s.deleteRow = r => s.rows.splice(r-1, 1);
  s.deleteRows = (r, n) => s.rows.splice(r-1, n);
  s.getRange = (r, c, nr, nc) => {
    if (typeof r === 'string') return { createTextFinder: t => ({ matchEntireCell: () => ({ findNext: () => { const i = s.rows.findIndex(x => disp(x[0]) === t); return i < 0 ? null : { getRow: () => i+1 }; } }) }) };
    nr = nr || 1; nc = nc || 1;
    return {
      getDisplayValues: () => { const out=[]; for(let i=0;i<nr;i++){ const row=s.rows[r-1+i]||[]; const o=[]; for(let j=0;j<nc;j++) o.push(row[c-1+j]==null?'':disp(row[c-1+j])); out.push(o);} return out; },
      setValue: v => { while (s.rows.length < r) s.rows.push([]); s.rows[r-1][c-1] = v; },
      setValues: vv => { vv.forEach((row, i) => { while (s.rows.length < r + i) s.rows.push([]); row.forEach((v, j) => { s.rows[r-1+i][c-1+j] = v; }); }); },
      setFontWeight(){ return this; }, setBackground(){ return this; }, setFontColor(){ return this; }
    };
  };
  return s;
}
const perfil = JSON.parse(fs.readFileSync(path.join(__dirname, 'perfil_exemplo.json'),'utf8'));
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'base_exemplo.json'),'utf8'));
const sheets = {
  memoria: makeSheet('memoria', [['Data','Lembrança','Origem'], ["'01/10/2026",'O frete da Will agora é 15%','iPhone'], ["'02/10/2026",'Karina folga às quartas','PC']]),
  aprendizados: makeSheet('aprendizados', [['Data','Erro','Certo','Assunto'], ["'01/10/2026",'fundo branco','modo escuro','Programação']]),
  perfil: makeSheet('perfil', perfil), base: makeSheet('base', base),
};
const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)), copy: nome => ({ getId: () => 'COPIA_' + nome }) };
let fetchLog = []; const EVENTOS = []; const RASCUNHOS = []; let OFFSET = 0; const TRIGGERS = [];
const SHIFT = new Date(2026, 9, 30, 12, 0, 0).getTime() - Date.now(); // relógio fixo em 30/10/2026 12h (testes não quebram à meia-noite)
class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(Date.now() + OFFSET + SHIFT); } static now() { return Date.now() + OFFSET + SHIFT; } }
let fetchImpl = (url, opt) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Resposta teste [[MEMORIA: Thiago gosta de café]] fim' } }] }) });
const EXTRAS = {}; let SEQ = 0; const PROPS = { PIN: '1234', GROQ_KEY: 'g', GEMINI_KEY: 'm' }; const CACHE = {};
const ctx = {
  SpreadsheetApp: { openById: id => (id && EXTRAS[id]) || ss, create: nome => { const id = 'PL_' + nome.replace(/\W+/g, '_'); const sh = {}; EXTRAS[id] = { nome, sheets: sh, getId: () => id, getSheetByName: n => sh[n] || null, insertSheet: n => (sh[n] = makeSheet(n)), getSheets: () => Object.values(sh), deleteSheet: () => {} }; EXTRAS[id].insertSheet('Página1'); return EXTRAS[id]; } },
  UrlFetchApp: { fetch: (u, o) => {
    o = o || {};
    // embeddings: só contam se o teste devolver embeddings de verdade; senão 500 e o código segue por palavra
    if (/batchEmbedContents/.test(u)) { try { const r = fetchImpl(u, o); const j = JSON.parse(r.getContentText()); if (r.getResponseCode() === 200 && j.embeddings) return r; } catch (e) {} return { getResponseCode: () => 500, getContentText: () => 'sem embedding no teste' }; }
    if (/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/apps$/.test(u)) return fetchImpl(u, o);   // listagem de apps (leitura) não entra no log dos testes
    fetchLog.push({ u, body: typeof o.payload === 'string' ? JSON.parse(o.payload) : (o.payload || null), h: o.headers }); return fetchImpl(u, o); } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k], setProperty: (k, v) => { PROPS[k] = v; }, deleteProperty: k => { delete PROPS[k]; } }) },
  CacheService: { getScriptCache: () => ({ get: k => CACHE[k] || null, put: (k, v) => { CACHE[k] = v; }, remove: k => { delete CACHE[k]; }, getAll: ks => { const o = {}; ks.forEach(k => { if (CACHE[k] != null) o[k] = CACHE[k]; }); return o; }, putAll: o => { Object.assign(CACHE, o); }, removeAll: ks => ks.forEach(k => { delete CACHE[k]; }) }) },
  XmlService: { parse: txt => { const itens = [...txt.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]); const it = x => ({ getChildText: n => (x.match(new RegExp('<' + n + '>([^<]*)<')) || [])[1] || '' }); return { getRootElement: () => ({ getChild: () => ({ getChildren: () => itens.map(it) }) }) }; } },
  Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (alg, t) => [...require('crypto').createHash(alg).update(String(t)).digest()].map(b => b > 127 ? b - 256 : b), sleep: ms => { OFFSET += ms; }, newBlob: (bytes, mime, nome) => ({ getBytes: () => (typeof bytes === 'string' ? Buffer.from(bytes) : bytes), getContentType: () => mime, getDataAsString: () => Buffer.from(typeof bytes === 'string' ? Buffer.from(bytes) : bytes).toString('utf8'), getName: () => nome, setName(){ return this; } }), base64Decode: s => Buffer.from(s, 'base64'), base64Encode: (x) => Buffer.from(typeof x === 'string' ? x : x).toString('base64'), base64EncodeWebSafe: s => Buffer.from(s).toString('base64url'), Charset: { UTF_8: 'utf8' }, getUuid: () => 'abcdef1234567890', formatDate: (d, tz, f) => f.includes('yyyy-MM-dd HH') ? '2026-10-30 11:30:' + String(++SEQ).padStart(2,'0') : f === 'yyyy-MM-dd' ? (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')) : f === 'yyyyMMdd' ? '20261030' : f.includes('yyyyMMdd') ? '20261030-113000' : f.includes('HH:mm') ? '02/11 14:00' : f.includes('dd/MM/yyyy') ? (f.includes('EEEE') ? 'sexta-feira, 30/10/2026' : '30/10/2026') : '30/10' },
  ContentService: { createTextOutput: t => ({ t, setMimeType(){ return this; } }), MimeType: { JSON: 'json' } },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  ScriptApp: { getScriptId: () => 'SCRIPT1', getOAuthToken: () => 'tok-oauth', getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/X/exec' }), WeekDay: { MONDAY: 'MONDAY', SUNDAY: 'SUNDAY' }, getProjectTriggers: () => TRIGGERS.map(f => ({ getHandlerFunction: () => f })), deleteTrigger: t => { const i = TRIGGERS.indexOf(t.getHandlerFunction()); if (i >= 0) TRIGGERS.splice(i, 1); }, newTrigger: fn => ({ timeBased: () => ({ after: () => ({ create: () => { TRIGGERS.push(fn); } }), everyMinutes: () => ({ create: () => {} }), everyHours: () => ({ create: () => {} }), everyDays: () => ({ atHour: () => ({ create: () => {} }) }), onWeekDay: () => ({ atHour: () => ({ create: () => {} }) }) }) }) },
  CalendarApp: { getDefaultCalendar: () => ({
      getEvents: () => [{ getStartTime: () => new Date(2026, 10, 2, 14, 0), isAllDayEvent: () => false, getTitle: () => 'Entregar iPhone do João', getLocation: () => 'Loja' }],
      createEvent: (t, i, f) => { EVENTOS.push({ t, i, f }); return { addPopupReminder: () => {} }; } }) },
  GmailApp: { search: () => [{ getMessages: () => [{ getFrom: () => 'Will <will@x.com>', getDate: () => new Date(2026, 9, 30, 9, 0), getPlainBody: () => 'Segue a lista de preços atualizada do iPhone 17.' }], getFirstMessageSubject: () => 'Lista de preços' }],
      createDraft: (p, a, c) => { RASCUNHOS.push({ p, a, c }); } },
  DriveApp: { searchFiles: () => { let i = 0; const fs = [{ getName: () => 'Nota fiscal Devia set.pdf', getMimeType: () => 'application/pdf', getLastUpdated: () => new Date(2026, 8, 3), getUrl: () => 'https://drive.google.com/file/d/abc' }]; return { hasNext: () => i < fs.length, next: () => fs[i++] }; },
      getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({ createFile: b => ({ setSharing: () => {}, getId: () => 'IMGID' }) }), getRootFolder: () => ({ getName: () => 'root' }), getFileById: id => ({ moveTo: () => {} }), Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 } },
  Logger: { log: x => console.log('LOG:', x) }, console, JSON, Math, Date: FakeDate, String, Object, Array, RegExp, Error
};
vm.createContext(ctx); vm.runInContext(code, ctx);
const post = b => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(b) } }).t);
module.exports = { EXTRAS, PROPS, CACHE, ctx, post, sheets, fetchLog, EVENTOS, RASCUNHOS, TRIGGERS, setFetch: f => fetchImpl = f };
