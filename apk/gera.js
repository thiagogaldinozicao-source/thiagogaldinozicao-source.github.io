// Gera o projeto Android (TWA) da Cinemoteca a partir do manifest do site.
const { TwaManifest, TwaGenerator, ConsoleLog } = require("@bubblewrap/core");
(async () => {
  const m = await TwaManifest.fromWebManifest("https://thiagogaldinozicao-source.github.io/cinemoteca/manifest.webmanifest");
  m.packageId = "io.github.thiagogaldinozicao_source.cinemoteca";
  m.name = "Cinemoteca"; m.launcherName = "Cinemoteca";
  m.signingKey = { path: "k.jks", alias: "cinemoteca" };
  m.appVersionCode = Number(process.env.VC); m.appVersionName = String(process.env.VC);
  m.fallbackType = "webview";
  await new TwaGenerator().createTwaProject("./twa", m, new ConsoleLog("gera"));
})().catch(e => { console.error(e); process.exit(1); });
