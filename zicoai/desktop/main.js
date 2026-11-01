// ZicoAI no computador: uma janela própria (Windows e Mac) que abre o app da ZicoAI, igual o app do Claude.
// O app é o mesmo do site (atualiza sozinho quando o site muda); aqui só tem a janela, microfone, links e "sem internet".
const { app, BrowserWindow, shell, session, Menu, nativeTheme } = require('electron');
const path = require('path'), fs = require('fs');
const ENDERECO = 'https://thiagogaldinozicao-source.github.io/zicoai/';
const DO_APP = u => u.startsWith('https://thiagogaldinozicao-source.github.io/') || u.startsWith('https://script.google.com/') || u.startsWith('https://script.googleusercontent.com/');
let janela = null;
const arqJanela = () => path.join(app.getPath('userData'), 'janela.json');
function lerJanela() { try { return JSON.parse(fs.readFileSync(arqJanela(), 'utf8')); } catch (e) { return { width: 1200, height: 820 }; } }
function guardarJanela() { try { if (janela && !janela.isMinimized()) fs.writeFileSync(arqJanela(), JSON.stringify(Object.assign(janela.getBounds(), { max: janela.isMaximized() }))); } catch (e) { /* ok */ } }

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });

function criar() {
  const j = lerJanela();
  nativeTheme.themeSource = 'dark';
  janela = new BrowserWindow({
    x: j.x, y: j.y, width: j.width || 1200, height: j.height || 820, minWidth: 380, minHeight: 560,
    title: 'ZicoAI', backgroundColor: '#0a0a0a', autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true }
  });
  if (j.max) janela.maximize();
  janela.once('ready-to-show', () => janela.show());
  ['resize', 'move', 'close'].forEach(ev => janela.on(ev, guardarJanela));
  janela.loadURL(ENDERECO);
  // link de fora (site, WhatsApp, YouTube) abre no navegador normal; o app fica na janela
  janela.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith(ENDERECO)) return { action: 'allow' }; shell.openExternal(url); return { action: 'deny' }; });
  janela.webContents.on('will-navigate', (e, url) => { if (!DO_APP(url) && !url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  // sem internet: mostra a tela de "sem internet" e tenta de novo sozinho
  janela.webContents.on('did-fail-load', (e, codigo, desc, url, principal) => { if (principal && codigo !== -3) janela.loadFile(path.join(__dirname, 'offline.html'), { query: { volta: ENDERECO } }); });
}

app.whenReady().then(() => {
  // microfone (falar com ela), copiar/colar e tela cheia: liberados só pro app da ZicoAI
  session.defaultSession.setPermissionRequestHandler((wc, perm, ok, det) => ok(DO_APP(String((det && det.requestingUrl) || wc.getURL())) && ['media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'notifications'].includes(perm)));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'Editar', submenu: [{ role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' }, { type: 'separator' }, { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }, { role: 'selectAll', label: 'Selecionar tudo' }] },
    { label: 'Ver', submenu: [{ role: 'reload', label: 'Recarregar' }, { role: 'zoomIn', label: 'Aumentar' }, { role: 'zoomOut', label: 'Diminuir' }, { role: 'resetZoom', label: 'Tamanho normal' }, { role: 'togglefullscreen', label: 'Tela cheia' }] },
    { role: 'windowMenu', label: 'Janela' }
  ]));
  criar();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) criar(); });
