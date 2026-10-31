# ZicoAI - instala (ou atualiza) a ponte do PC e a extensão do Chrome.
# Rodar no PowerShell:  irm https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/instalar.ps1 | iex
# Não apaga nada seu. Cria: pasta ZicoAI-Ponte (programa), pasta ZicoAI (onde ela pode escrever),
# atalho na Inicialização do Windows (liga sozinha) e um caminho secreto no Tailscale Funnel.

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = 'https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai'
$dir = Join-Path $HOME 'ZicoAI-Ponte'
$pastaZ = Join-Path $HOME 'ZicoAI'
New-Item -ItemType Directory -Force -Path $dir, $pastaZ | Out-Null

Write-Host ''
Write-Host '== ZicoAI: instalando a ponte do PC ==' -ForegroundColor Yellow

# 1) programa da ponte
Invoke-WebRequest -UseBasicParsing -Uri ($base + '/pc/ponte.ps1') -OutFile (Join-Path $dir 'ponte.ps1')
Write-Host '[ok] ponte baixada'

# 2) configuração (só cria na primeira vez; depois mantém o segredo e as pastas)
function Aleatorio([int]$bytes) {
  $b = New-Object byte[] $bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  return (($b | ForEach-Object { $_.ToString('x2') }) -join '')
}
$cfgArq = Join-Path $dir 'config.json'
if (-not (Test-Path $cfgArq)) {
  $cfg = [ordered]@{
    porta    = 8790
    segredo  = (Aleatorio 24)
    caminho  = ('ponte-' + (Aleatorio 8))
    pastas   = @(
      [ordered]@{ caminho = $pastaZ; escrever = $true },
      [ordered]@{ caminho = (Join-Path $HOME 'Downloads'); escrever = $false },
      [ordered]@{ caminho = (Join-Path $HOME 'Documents'); escrever = $false },
      [ordered]@{ caminho = (Join-Path $HOME 'Desktop'); escrever = $false }
    )
  }
  ($cfg | ConvertTo-Json -Depth 5) | Set-Content -Path $cfgArq -Encoding UTF8
  Write-Host '[ok] configuração criada (pastas liberadas: ZicoAI pra escrever; Downloads, Documentos e Área de Trabalho só pra ler)'
} else { Write-Host '[ok] configuração mantida' }
$cfg = Get-Content -Raw -Encoding UTF8 $cfgArq | ConvertFrom-Json

# 3) liga sozinha quando o Windows inicia (atalho na pasta Inicializar)
$argsPonte = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $dir 'ponte.ps1') + '"'
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'ZicoAI Ponte.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk); $sc.TargetPath = 'powershell.exe'; $sc.Arguments = $argsPonte; $sc.WindowStyle = 7; $sc.Description = 'ZicoAI - ponte do PC'; $sc.Save()
Write-Host '[ok] liga sozinha com o Windows'

# 4) reinicia a ponte (se já tinha uma rodando, fecha só ela)
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*ZicoAI-Ponte*ponte.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500
Start-Process powershell.exe -ArgumentList $argsPonte -WindowStyle Hidden
Start-Sleep -Seconds 3
try {
  $t = Invoke-RestMethod -Uri ('http://127.0.0.1:' + $cfg.porta + '/') -Method Post -Body '{"acao":"status"}' -ContentType 'application/json' -Headers @{ 'X-Zico-Ponte' = $cfg.segredo }
  Write-Host ('[ok] ponte respondendo: ' + $t.nome + ' · ' + $t.disco) -ForegroundColor Green
} catch { Write-Host ('[ERRO] a ponte não respondeu: ' + $_.Exception.Message) -ForegroundColor Red }

# 5) caminho secreto no Tailscale Funnel (o mesmo que já leva até o Ollama)
$ts = 'C:\Program Files\Tailscale\tailscale.exe'
$url = ''
try {
  & $ts funnel --bg ('--set-path=/' + $cfg.caminho) ('http://127.0.0.1:' + $cfg.porta) | Out-Host
  $st = (& $ts status --json | Out-String) | ConvertFrom-Json
  $dns = ([string]$st.Self.DNSName).TrimEnd('.')
  $url = 'https://' + $dns + '/' + $cfg.caminho
  Write-Host '[ok] Funnel ligado' -ForegroundColor Green
} catch { Write-Host ('[ERRO] Funnel: ' + $_.Exception.Message) -ForegroundColor Red }

# 6) extensão do Chrome (pasta pra carregar em chrome://extensions)
$ext = Join-Path $pastaZ 'extensao-chrome'
New-Item -ItemType Directory -Force -Path $ext | Out-Null
foreach ($f in @('manifest.json', 'fundo.js', 'painel.html', 'painel.js', 'icone-128.png')) {
  Invoke-WebRequest -UseBasicParsing -Uri ($base + '/extensao/' + $f) -OutFile (Join-Path $ext $f)
}
Write-Host ('[ok] extensão do Chrome em ' + $ext)

# 7) o que o Claude precisa pra ligar na ZicoAI
$final = 'PONTE_URL=' + $url + [Environment]::NewLine + 'PONTE_SEGREDO=' + $cfg.segredo
try { Set-Clipboard -Value $final } catch {}
Write-Host ''
Write-Host '================ PRONTO ================' -ForegroundColor Yellow
Write-Host $final -ForegroundColor Cyan
Write-Host '(também ficou copiado). Deixa esta janela aberta e avisa o Claude.' -ForegroundColor Yellow
Write-Host ''
