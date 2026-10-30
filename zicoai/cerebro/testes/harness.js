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
      setValue: v => { s.rows[r-1][c-1] = v; },
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
const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) };
let fetchLog = [];
let fetchImpl = (url, opt) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Resposta teste [[MEMORIA: Thiago gosta de café]] fim' } }] }) });
let SEQ = 0; const PROPS = { PIN: '1234', GROQ_KEY: 'g', GEMINI_KEY: 'm' }; const CACHE = {};
const ctx = {
  SpreadsheetApp: { openById: () => ss },
  UrlFetchApp: { fetch: (u, o) => { fetchLog.push({ u, body: JSON.parse(o.payload), h: o.headers }); return fetchImpl(u, o); } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k], setProperty: (k, v) => { PROPS[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ get: k => CACHE[k] || null, put: (k, v) => { CACHE[k] = v; }, remove: k => { delete CACHE[k]; } }) },
  Utilities: { getUuid: () => 'abcdef1234567890', formatDate: (d, tz, f) => f.includes('yyyy-MM-dd HH') ? '2026-10-30 11:30:' + String(++SEQ).padStart(2,'0') : '30/10/2026' },
  ContentService: { createTextOutput: t => ({ t, setMimeType(){ return this; } }), MimeType: { JSON: 'json' } },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  ScriptApp: { getProjectTriggers: () => [], deleteTrigger: () => {}, newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create: () => {} }) }) }) },
  Logger: { log: x => console.log('LOG:', x) }, console, JSON, Math, Date, String, Object, Array, RegExp, Error
};
vm.createContext(ctx); vm.runInContext(code, ctx);
const post = b => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(b) } }).t);
module.exports = { PROPS, CACHE, ctx, post, sheets, fetchLog, setFetch: f => fetchImpl = f };
