// Gera o projeto Android (TWA: o app abre no Chrome do celular, em tela cheia, igual app instalado) da ZicoAI a partir do manifest.
const { TwaManifest, TwaGenerator, ConsoleLog } = require("@bubblewrap/core");
(async () => {
  const m = await TwaManifest.fromWebManifest("https://thiagogaldinozicao-source.github.io/zicoai/manifest.json");
  m.packageId = "io.github.thiagogaldinozicao_source.zicoai";
  m.name = "ZicoAI"; m.launcherName = "ZicoAI";
  m.themeColor = m.navigationColor = m.backgroundColor = "#0a0a0a";
  m.signingKey = { path: "k.jks", alias: "zicoai" };
  m.appVersionCode = Number(process.env.VC); m.appVersionName = "1." + String(process.env.VC);
  m.fallbackType = "webview";
  m.enableNotifications = false;
  await new TwaGenerator().createTwaProject("./twa", m, new ConsoleLog("gera"));
})().catch(e => { console.error(e); process.exit(1); });
