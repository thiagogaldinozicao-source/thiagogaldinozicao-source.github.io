# B32: Site (PWA) que vira APK com Capacitor + GitHub Actions

**Regra:** Faça o app como site em `www/`, publique no GitHub Pages e use Capacitor para empacotar o mesmo `www/` num APK. O GitHub Actions gera o APK assinado e põe em Releases a cada push na `main`. A chave de assinatura fica só nos Secrets.
**Palavras-chave:** apk, android, capacitor, app de verdade, instalar no celular, github pages, github actions, releases, assinatura, keystore, aab, google play, pwa, iphone xcode
**Projeto(s):** leva-ou-nao

## Exemplo real
O Thiago queria o "Leva ou não?" como app instalável. Entregue: o mesmo `www/` vira site (Pages) e APK (Releases) sozinho. Cada push na `main` publica os dois. No iPhone, o site funciona; app nativo exige Mac com Xcode.

## Como foi feito
1. `capacitor.config.json` (resumido): `appId: br.com.zicao.levaounao`, `appName`, `webDir: "www"`, fundo preto. Dependências: `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`.
2. Scripts do `package.json`: `"sync": "cap sync"`, `"android": "cap sync android && cap open android"`, `"web": "npx serve www"`.
3. Site: `.github/workflows/site.yml` publica a pasta `www` no Pages (`paths: ["www/**"]`).
4. APK: `.github/workflows/android.yml` roda só quando muda `www/**`, `android/**`, deps ou o próprio workflow:
```
npm ci  ->  npx cap sync android  ->  ./gradlew assembleRelease bundleRelease
```
5. Assinatura: o `build.gradle` lê 4 variáveis de ambiente (`LEVA_KEYSTORE_PATH`, `..._PASSWORD`, `..._KEY_ALIAS`, `..._KEY_PASSWORD`). Sem elas o build release falha. Os Secrets do GitHub guardam o keystore em base64.
6. `versionCode` = `GITHUB_RUN_NUMBER`; a mesma chave em toda versão faz o app novo instalar por cima do antigo.
7. Release: `softprops/action-gh-release` com tag `v0.1.<run_number>` e anexa `.apk` (celular) e `.aab` (Play Store).
8. No app nativo, detecte com `Capacitor.isNativePlatform()` e trate o botão Voltar do Android (fecha leitor, depois resultado, depois sai). Permissões no manifest: INTERNET, CAMERA, VIBRATE; tela em retrato.

## Erros que já aconteceram
- Keystore de teste com senha pública dentro do repo: qualquer um poderia assinar update falso. Correção: assinar só com a chave dos Secrets, CI falha sem ela, actions travadas por SHA e permissões mínimas (aeb565f, 74bd466).
- Faltar a chave deixava a `main` vermelha. Correção: o workflow só avisa e pula o APK; o site continua (a907e89).
- Gerar APK a cada mudança de docs: limitado por `paths` (fad9bf6).
- Câmera ficava ligada em segundo plano e o Voltar saía do app: tratado em 5b2e138.
- Quem tinha APK de teste antigo precisa desinstalar uma vez (chave mudou).

## Lições
1. Um só `www/` serve site e app: não duplique código.
2. Nunca commite keystore nem senha; use Secrets e falhe cedo sem eles.
3. `paths` no workflow evita build à toa.
4. Prefira o plugin nativo quando o navegador é fraco (ML Kit para ler texto no Android).
5. iPhone nativo precisa de Mac/Xcode (`npx cap add ios`).

Fontes: leva-ou-nao README.md, capacitor.config.json, package.json, android/app/build.gradle, .github/workflows/android.yml e site.yml, commits aeb565f, 74bd466, a907e89, fad9bf6, 5b2e138.
