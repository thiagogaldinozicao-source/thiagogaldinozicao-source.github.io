# ZicoAI - deixa o PC no ponto pra IA (Ollama na RTX 3080) e pro Unreal (ZOMBIES).
# Rodar no PowerShell COMO ADMINISTRADOR:
#   irm https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/otimizar-pc.ps1 | iex
# Cada passo explica o que faz e PERGUNTA (S/N). Não apaga nada. Tudo tem volta (o comando de desfazer aparece no fim).

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Write-Host 'Abra o PowerShell com "Executar como administrador" e rode de novo.' -ForegroundColor Red; return }
function Pergunta($t) { return ((Read-Host ($t + ' (S/N)')) -match '^[sS]') }
$feitos = @(); $desfazer = @()

Write-Host ''
Write-Host '== ZicoAI: deixando o PC no ponto ==' -ForegroundColor Yellow

# 1) Placa de vídeo: mostra o driver e abre o lugar certo pra atualizar (driver de vídeo vc mesmo instala)
$drv = (& nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>$null) -join ''
Write-Host ''
Write-Host ('1) Placa de vídeo: ' + ($(if ($drv) { $drv } else { 'nvidia-smi não respondeu' })))
Write-Host '   Driver novo = Ollama e Unreal mais estáveis e rápidos.'
if (Pergunta '   Abrir o NVIDIA App / página de drivers pra atualizar agora?') {
  $app = @("$env:ProgramFiles\NVIDIA Corporation\NVIDIA App\CEF\NVIDIA App.exe", "$env:ProgramFiles\NVIDIA Corporation\NVIDIA GeForce Experience\NVIDIA GeForce Experience.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($app) { Start-Process $app } else { Start-Process 'https://www.nvidia.com/pt-br/software/nvidia-app/' }
  Write-Host '   Abri. Escolha o "Game Ready" (ou "Studio", mais estável pro Unreal) e instale do jeito normal.' -ForegroundColor Cyan
}

# 2) Programas (Ollama, Git, Node, Python...) atualizados pelo winget
Write-Host ''
Write-Host '2) Atualizar os programas instalados (inclui o Ollama, que precisa estar novo pro qwen3.5).'
if (Get-Command winget -ErrorAction SilentlyContinue) {
  & winget upgrade --include-unknown 2>$null | Select-Object -First 30 | ForEach-Object { Write-Host ('   ' + $_) }
  if (Pergunta '   Atualizar TODOS os da lista acima?') { & winget upgrade --all --silent --accept-source-agreements --accept-package-agreements; $feitos += 'programas atualizados (winget)' }
  elseif (Pergunta '   Atualizar só o Ollama?') { & winget upgrade --id Ollama.Ollama --silent --accept-source-agreements --accept-package-agreements; $feitos += 'Ollama atualizado' }
} else { Write-Host '   winget não encontrado (Microsoft Store → "Instalador de Aplicativo").' -ForegroundColor Red }

# 3) Plano de energia Alto desempenho (desktop: CPU não "dorme" no meio da conta)
Write-Host ''
Write-Host '3) Energia em "Alto desempenho": o i9 não reduz o clock no meio da IA nem da compilação do Unreal. Gasta um pouco mais de luz.'
if (Pergunta '   Ligar?') {
  $atual = ((& powercfg /getactivescheme) -replace '.*:\s*([0-9a-f-]{36}).*', '$1')
  & powercfg /setactive SCHEME_MIN; $feitos += 'energia: alto desempenho'; $desfazer += ('powercfg /setactive ' + $atual)
}

# 4) Agendamento de GPU acelerado por hardware (HAGS): menos latência pra placa
Write-Host ''
Write-Host '4) "Agendamento de GPU acelerado por hardware": a placa organiza o próprio trabalho (bom pra Unreal, jogo e IA). Vale depois de reiniciar.'
$k = 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers'
$hags = (Get-ItemProperty $k -Name HwSchMode -ErrorAction SilentlyContinue).HwSchMode
if ($hags -eq 2) { Write-Host '   Já está ligado.' }
elseif (Pergunta '   Ligar?') { Set-ItemProperty $k -Name HwSchMode -Value 2 -Type DWord; $feitos += 'HAGS ligado (reiniciar)'; $desfazer += "Set-ItemProperty '$k' -Name HwSchMode -Value 1" }

# 5) Caminhos longos (Unreal, Git e Node quebram com pasta muito funda)
Write-Host ''
Write-Host '5) Caminhos longos (mais de 260 letras): evita erro de "caminho muito longo" no Unreal, Git e Node.'
$k2 = 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem'
if ((Get-ItemProperty $k2 -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled -eq 1) { Write-Host '   Já está ligado.' }
elseif (Pergunta '   Ligar?') { Set-ItemProperty $k2 -Name LongPathsEnabled -Value 1 -Type DWord; $feitos += 'caminhos longos ligados'; $desfazer += "Set-ItemProperty '$k2' -Name LongPathsEnabled -Value 0" }
if (Get-Command git -ErrorAction SilentlyContinue) { & git config --global core.longpaths true }

# 6) Antivírus não varrer arquivo por arquivo das pastas pesadas (recomendação da Epic pro Unreal)
Write-Host ''
$pastas = @("$HOME\.ollama\models", 'C:\ZOMBIES', "$env:LOCALAPPDATA\UnrealEngine") | Where-Object { Test-Path $_ }
Write-Host '6) O Windows Defender para de varrer, arquivo por arquivo, SÓ estas pastas (seus modelos de IA e o projeto ZOMBIES):'
$pastas | ForEach-Object { Write-Host ('   - ' + $_) }
Write-Host '   Abrir projeto/compilar no Unreal e carregar o modelo ficam bem mais rápidos. O resto do PC continua protegido.'
if ($pastas.Count -and (Pergunta '   Fazer?')) { foreach ($p in $pastas) { Add-MpPreference -ExclusionPath $p; $desfazer += ("Remove-MpPreference -ExclusionPath '" + $p + "'") }; $feitos += 'Defender: exceção nas pastas da IA e do Unreal' }

# 7) Sensor de Armazenamento (limpa temporários e lixeira sozinho todo mês)
Write-Host ''
Write-Host '7) Sensor de Armazenamento: limpa temporários e a lixeira (itens com mais de 30 dias) sozinho, todo mês. Não mexe em Downloads.'
if (Pergunta '   Ligar?') {
  $k3 = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\StorageSense\Parameters\StoragePolicy'
  New-Item $k3 -Force | Out-Null
  Set-ItemProperty $k3 -Name '01' -Value 1 -Type DWord     # ligado
  Set-ItemProperty $k3 -Name '2048' -Value 30 -Type DWord  # roda todo mês
  Set-ItemProperty $k3 -Name '04' -Value 1 -Type DWord     # temporários
  Set-ItemProperty $k3 -Name '08' -Value 1 -Type DWord     # lixeira
  Set-ItemProperty $k3 -Name '256' -Value 30 -Type DWord   # lixeira: 30 dias
  Set-ItemProperty $k3 -Name '32' -Value 0 -Type DWord     # Downloads: nunca
  $feitos += 'Sensor de Armazenamento ligado'; $desfazer += "Set-ItemProperty '$k3' -Name '01' -Value 0"
}

# 8) Ollama: confere a configuração rápida (flash attention, cache q8, 1 modelo por vez)
Write-Host ''
$ok8 = ([Environment]::GetEnvironmentVariable('OLLAMA_FLASH_ATTENTION', 'User') -eq '1') -and ([Environment]::GetEnvironmentVariable('OLLAMA_KV_CACHE_TYPE', 'User') -eq 'q8_0')
Write-Host ('8) Ollama no modo rápido: ' + $(if ($ok8) { 'já está.' } else { 'ainda não.' }))
if (-not $ok8 -and (Pergunta '   Configurar e reiniciar o Ollama?')) {
  foreach ($v in @(@('OLLAMA_FLASH_ATTENTION', '1'), @('OLLAMA_KV_CACHE_TYPE', 'q8_0'), @('OLLAMA_MAX_LOADED_MODELS', '1'), @('OLLAMA_NUM_PARALLEL', '1'))) { [Environment]::SetEnvironmentVariable($v[0], $v[1], 'User') }
  Get-Process ollama* -ErrorAction SilentlyContinue | Stop-Process -Force
  $o = "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"; if (Test-Path $o) { Start-Process $o }
  $feitos += 'Ollama no modo rápido'
}

Write-Host ''
Write-Host '================ PRONTO ================' -ForegroundColor Yellow
if ($feitos.Count) { $feitos | ForEach-Object { Write-Host ('[ok] ' + $_) -ForegroundColor Green } } else { Write-Host 'Nada mudou.' }
if ($desfazer.Count) { Write-Host ''; Write-Host 'Pra desfazer algum (cole no PowerShell como administrador):' -ForegroundColor Cyan; $desfazer | ForEach-Object { Write-Host ('   ' + $_) } }
if ($feitos -match 'HAGS|driver') { Write-Host ''; Write-Host 'Reinicie o PC quando puder pra valer tudo.' -ForegroundColor Yellow }
