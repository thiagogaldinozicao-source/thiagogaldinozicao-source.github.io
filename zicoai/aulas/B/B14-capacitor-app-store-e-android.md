# B14: Virar app nativo (Capacitor): App Store e APK Android

**Regra:** Mantenha o app web como fonte. Script `build.mjs` copia só os arquivos do app pra `www/`, e o Capacitor empacota. iOS: `npm run ios` abre o Xcode (precisa de Mac). Android: o GitHub Actions gera o APK sozinho. Detecte o app nativo com `Capacitor.isNativePlatform()`.
**Palavras-chave:** capacitor, app store, publicar app, xcode, apk, android, converter site em app, ios, bundle id, ícone e splash, vibração nativa, política de privacidade, apple developer, github actions
**Projeto(s):** Calculadora-do-zicao

## Exemplo real
O Thiago quis a calculadora na App Store e no Android. O repo ficou preparado (Capacitor, vibração nativa, ícone, tela de abertura) e o `APP-STORE.md` lista o passo a passo pro Mac. No Android, cada push na `main` gera o APK e publica no GitHub Releases.

## Como foi feito
`capacitor.config.json` (resumido; no arquivo real o bloco `ios` também tem `backgroundColor`, e há ainda os blocos `android` e `plugins.SystemBars`):
```json
{ "appId": "br.com.zicaostore.calculadora", "appName": "Calculadora do Zicão",
  "webDir": "www", "backgroundColor": "#0e0e0e",
  "ios": { "contentInset": "never", "scrollEnabled": false } }
```
`scripts/build.mjs` copia `index.html`, `manifest.webmanifest`, `privacidade.html`, `icons`, `fonts` pra `www/`. Arquivo novo no app? Inclua nessa lista.
Scripts do `package.json`:
```
"icones": "npx @capacitor/assets generate --ios --iconBackgroundColor '#0e0e0e' --splashBackgroundColor '#0e0e0e' ..."
"ios": "npm run build && npx cap sync ios && npx cap open ios"
```
Passos iOS (APP-STORE.md): conta Apple Developer (US$ 99/ano), Xcode, Node LTS; `npm install`, `npx cap add ios`, `npm run icones`, `npm run ios`; no Xcode escolher Team, testar no iPhone, Product, Archive, Distribute App. Depois, no App Store Connect: Bundle ID, URL da política de privacidade (`privacidade.html`), privacidade "Não coletamos dados". Atualizar: mexeu no `index.html`, rode `npm run ios`, Archive e suba o número da versão.
No código, vibração e botão voltar mudam no nativo:
```js
var NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
if(NATIVE){ ... window.Capacitor.Plugins.Haptics.impact({style:'LIGHT'}) ... }
```
Android (`.github/workflows/android.yml`): `build`, `cap add android`, gera ícones, `cap sync`, sobe `versionCode`/`versionName` pelo `GITHUB_RUN_NUMBER` com `sed`, `./gradlew assembleDebug`, publica `calculadora-zicao.apk` no Release. A chave de assinatura fica na pasta `android-keystore/` do repo (conteúdo: `<segredo>`; está no repo, então trate como segredo e não copie).

## Erros que já aconteceram
- APP-STORE.md: a Apple costuma recusar calculadora "comum" (diretriz 4.3). A saída é destacar as ferramentas de loja.
- 610607f e 47c3bbe: o APK saiu com o ícone padrão do Capacitor. Corrigido com ícone adaptativo (`icon-foreground.png` + `icon-background.png`).
- ec8976a: ajuste do CI Android: passou a usar o SDK que já vem no runner e as actions v5 (a mensagem do commit não detalha o erro).
- 2c8b920: o botão voltar do Android foi tratado: fecha painéis primeiro (`backButton`) e só no fim `exitApp()` (resumido do commit e do código).
- O service worker não é registrado dentro do app nativo (`!NATIVE`).
- Aviso: neste repo o keystore está commitado (`android-keystore/zicao.keystore`, e o workflow copia ele pra `~/.android/debug.keystore`). Isso é inseguro. O certo é guardar a chave nos Secrets do GitHub, como ensinam B24 e B32.

## Lições
1. Use sempre a mesma chave de assinatura no Android, senão não atualiza por cima.
2. Respeite áreas seguras (`env(safe-area-inset-*)`) no app nativo.
3. Teste no aparelho antes do Archive.
4. Nunca coloque senha de chave, token ou conta Apple no chat ou no repo público.
5. Não commite o keystore (como está neste repo). Guarde a chave nos Secrets do GitHub (B24, B32).

Fontes: APP-STORE.md, capacitor.config.json, package.json, scripts/build.mjs, .github/workflows/android.yml, index.html; commits 2b7742e, 2c8b920, ec8976a, 610607f, 47c3bbe.
