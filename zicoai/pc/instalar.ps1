# ZicoAI - instala (ou atualiza) a ponte do PC e a extensão do Chrome.
# Rodar no PowerShell:  irm https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/instalar.ps1 | iex
# Não apaga nada seu. Cria: pasta ZicoAI-Ponte (programa), pasta ZicoAI (onde ela pode escrever)
# e um atalho na Inicialização do Windows (liga sozinha). Nada fica aberto pra internet:
# é o PC que busca os pedidos na ZicoAI.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = 'https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai'
$exec = 'https://script.google.com/macros/s/AKfycbzQXrIM8oV2Gygqm_4DA-_4li3mdicbmfnThdieLvNEvsNYoj6jyVPKWo-6CBSyP-aOow/exec'
$dir = Join-Path $HOME 'ZicoAI-Ponte'
$pastaZ = Join-Path $HOME 'ZicoAI'
New-Item -ItemType Directory -Force -Path $dir, $pastaZ | Out-Null

Write-Host ''
Write-Host '== ZicoAI: instalando a ponte do PC (versão 2) ==' -ForegroundColor Yellow

# 1) programa da ponte
Invoke-WebRequest -UseBasicParsing -Uri ($base + '/pc/ponte.ps1?t=' + [DateTime]::Now.Ticks) -OutFile (Join-Path $dir 'ponte.ps1')
$v = (Select-String -Path (Join-Path $dir 'ponte.ps1') -Pattern "Versao = '([^']+)'").Matches[0].Groups[1].Value
Write-Host ('[ok] ponte baixada (versão ' + $v + ')')

# 2) configuração (mantém o segredo e as pastas; só acrescenta o que faltar)
function Aleatorio([int]$bytes) {
  $b = New-Object byte[] $bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  return (($b | ForEach-Object { $_.ToString('x2') }) -join '')
}
$cfgArq = Join-Path $dir 'config.json'
if (Test-Path $cfgArq) { $cfg = [IO.File]::ReadAllText($cfgArq, [Text.Encoding]::UTF8) | ConvertFrom-Json }
else {
  $cfg = New-Object PSObject -Property @{
    segredo = (Aleatorio 24)
    pastas  = @(
      (New-Object PSObject -Property @{ caminho = $pastaZ; escrever = $true }),
      (New-Object PSObject -Property @{ caminho = (Join-Path $HOME 'Downloads'); escrever = $false }),
      (New-Object PSObject -Property @{ caminho = (Join-Path $HOME 'Documents'); escrever = $false }),
      (New-Object PSObject -Property @{ caminho = (Join-Path $HOME 'Desktop'); escrever = $false })
    )
  }
}
if ($cfg.PSObject.Properties.Name -contains 'exec') { $cfg.exec = $exec } else { $cfg | Add-Member -NotePropertyName exec -NotePropertyValue $exec }
[IO.File]::WriteAllText($cfgArq, ($cfg | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding($false)))
Write-Host '[ok] configuração pronta (pastas: ZicoAI pra escrever; Downloads, Documentos e Área de Trabalho só pra ler)'

# 3) liga sozinha quando o Windows inicia (atalho na pasta Inicializar)
$argsPonte = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $dir 'ponte.ps1') + '"'
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'ZicoAI Ponte.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk); $sc.TargetPath = 'powershell.exe'; $sc.Arguments = $argsPonte; $sc.WindowStyle = 7; $sc.Description = 'ZicoAI - ponte do PC'; $sc.Save()
Write-Host '[ok] liga sozinha com o Windows'

# 4) reinicia a ponte (fecha só a ponte antiga, se tiver)
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*ZicoAI-Ponte*ponte.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500
$log = Join-Path $dir 'ponte-log.txt'
$antes = 0; if (Test-Path $log) { $antes = (Get-Content $log).Count }
Start-Process powershell.exe -ArgumentList $argsPonte -WindowStyle Hidden
Write-Host 'Esperando a ponte conectar na ZicoAI (até 40 s)...'
$ok = $false
for ($i = 0; $i -lt 20 -and -not $ok; $i++) {
  Start-Sleep -Seconds 2
  if (Test-Path $log) { $novas = @(Get-Content $log | Select-Object -Skip $antes); if ($novas -match 'conectado na ZicoAI') { $ok = $true } }
}
if (Test-Path $log) { Write-Host '--- log da ponte ---'; Get-Content $log | Select-Object -Skip $antes | Select-Object -Last 6 | ForEach-Object { Write-Host $_ } }
if ($ok) { Write-Host '[ok] ponte conectada na ZicoAI' -ForegroundColor Green }
else {
  Write-Host '[ERRO] a ponte não conectou. Abrindo ela visível pra mostrar o erro (Ctrl+C fecha):' -ForegroundColor Red
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*ZicoAI-Ponte*ponte.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir 'ponte.ps1')
}

# 5) extensão do Chrome (pasta pra carregar em chrome://extensions)
$ext = Join-Path $pastaZ 'extensao-chrome'
New-Item -ItemType Directory -Force -Path $ext | Out-Null
# lista de arquivos vem do GitHub (extensão nova com arquivo novo não quebra mais); sem internet pra API, usa a lista conhecida
$arqsExt = @()
try { $arqsExt = @((Invoke-RestMethod -UseBasicParsing -Uri 'https://api.github.com/repos/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/contents/zicoai/extensao') | Where-Object { $_.type -eq 'file' } | ForEach-Object { $_.name }) } catch {}
if (-not $arqsExt.Count) { $arqsExt = @('manifest.json', 'fundo.js', 'painel.html', 'painel.js', 'pagina.js', 'seguranca.js', 'vigia.js', 'icone-128.png') }
foreach ($f in $arqsExt) {
  Invoke-WebRequest -UseBasicParsing -Uri ($base + '/extensao/' + $f + '?t=' + [DateTime]::Now.Ticks) -OutFile (Join-Path $ext $f)
}
Write-Host ('[ok] extensão do Chrome em ' + $ext)

# 6) cérebro do PC (orquestra): baixa os modelos que a ZicoAI usa quando o PC está ligado.
#    qwen3.5:35b-a3b (22 GB, o principal: 35B com 3B ativos, roda com parte na RAM) e qwen3.5:9b (6,6 GB, reserva).
#    Não apaga nenhum modelo seu. Pula o que já tem. Precisa de ~30 GB livres no disco do Ollama.
$cerebros = @('qwen3.5:35b-a3b', 'qwen3.5:9b')
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host '[aviso] Ollama não encontrado: instala em https://ollama.com/download e roda este comando de novo.' -ForegroundColor Red
} else {
  $ErrorActionPreference = 'Continue'
  Write-Host ('Ollama: ' + ((& ollama --version 2>&1 | Out-String).Trim()))
  $tem = @(& ollama list 2>$null | Select-Object -Skip 1 | ForEach-Object { ([string]$_ -split '\s+')[0] })
  $pastaModelos = $env:OLLAMA_MODELS; if (-not $pastaModelos) { $pastaModelos = Join-Path $HOME '.ollama\models' }
  $livre = 999
  try { $livre = [math]::Round((Get-PSDrive -Name ($pastaModelos.Substring(0, 1))).Free / 1GB, 1) } catch {}
  foreach ($m in $cerebros) {
    if ($tem -contains $m) { Write-Host ('[ok] ' + $m + ' já está no PC'); continue }
    $precisa = 7; if ($m -like '*35b*') { $precisa = 24 }
    if ($livre -lt $precisa) { Write-Host ('[aviso] sem espaço pro ' + $m + ' (precisa ' + $precisa + ' GB, tem ' + $livre + ' GB livres). Pulei.') -ForegroundColor Red; continue }
    Write-Host ('Baixando ' + $m + ' (pode demorar; dá pra usar o PC enquanto isso)...') -ForegroundColor Yellow
    & ollama pull $m
    if ($LASTEXITCODE -eq 0) { Write-Host ('[ok] ' + $m + ' baixado') -ForegroundColor Green; $livre -= $precisa }
    else { Write-Host ('[ERRO] não baixou o ' + $m + '. Se falar de versão, atualiza o Ollama (https://ollama.com/download) e roda de novo.') -ForegroundColor Red }
  }
  $ErrorActionPreference = 'Stop'
  Write-Host '[ok] a ponte avisa a ZicoAI dos modelos em até 5 min'
}

Write-Host ''
Write-Host '================ PRONTO ================' -ForegroundColor Yellow
Write-Host ('Segredo da ponte: ' + $cfg.segredo) -ForegroundColor Cyan
Write-Host 'Avisa o Claude.' -ForegroundColor Yellow
Write-Host ''
