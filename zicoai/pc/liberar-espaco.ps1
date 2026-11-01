# ZicoAI - libera espaço no C: pro cérebro do PC (qwen3.5:35b-a3b precisa de ~24 GB livres).
# Rodar no PowerShell COMO ADMINISTRADOR:
#   irm https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/liberar-espaco.ps1 | iex
# 1) AVALIA: mede cada item e mostra quanto libera (não apaga nada ainda).
# 2) Pergunta antes de apagar. Só lixo que o Windows/drivers recriam sozinhos.
# NUNCA mexe: projeto ZOMBIES, Unreal (projetos e cache), Ollama/modelos, ZicoAI, ponte, Documentos, Downloads, Área de Trabalho, jogos.

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
function Livre { [math]::Round((Get-PSDrive C).Free / 1GB, 1) }
function TamGB($p) { if (-not (Test-Path $p)) { return 0 }; $s = (Get-ChildItem $p -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum; [math]::Round(($s / 1GB), 2) }
function Esvazia($p) { if (Test-Path $p) { Get-ChildItem $p -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue } }

Write-Host ''
Write-Host '== ZicoAI: avaliando o espaço do C: ==' -ForegroundColor Yellow
Write-Host ('Livre agora: ' + (Livre) + ' GB  (o cérebro grande precisa de ~24 GB livres)')
Write-Host 'Antes de apagar: feche o Unreal e os jogos (arquivo em uso fica, não dá erro).'
if (-not $admin) { Write-Host '[aviso] Não está como Administrador: os itens do Windows (marcados ADM) vão ser pulados. Feche e abra o PowerShell com "Executar como administrador".' -ForegroundColor Red }

$L = $env:LOCALAPPDATA
$itens = @(
  @{ n = 'Temporários do usuário';                p = $env:TEMP;                                   adm = $false },
  @{ n = 'Temporários do Windows (ADM)';          p = 'C:\Windows\Temp';                           adm = $true },
  @{ n = 'Downloads do Windows Update (ADM)';     p = 'C:\Windows\SoftwareDistribution\Download'; adm = $true },
  @{ n = 'Cache de shader da NVIDIA (DX)';        p = "$L\NVIDIA\DXCache";                         adm = $false },
  @{ n = 'Cache de shader da NVIDIA (GL)';        p = "$L\NVIDIA\GLCache";                         adm = $false },
  @{ n = 'Cache de shader do DirectX';            p = "$L\D3DSCache";                              adm = $false },
  @{ n = 'Relatórios de erro do Windows';         p = "$L\Microsoft\Windows\WER";                  adm = $false },
  @{ n = 'Relatórios de erro (sistema) (ADM)';    p = 'C:\ProgramData\Microsoft\Windows\WER';      adm = $true },
  @{ n = 'Despejos de travamento (CrashDumps)';   p = "$L\CrashDumps";                             adm = $false },
  @{ n = 'Despejos de travamento (Minidump) (ADM)'; p = 'C:\Windows\Minidump';                     adm = $true }
)
$total = 0
Write-Host ''
foreach ($i in $itens) {
  $i.gb = TamGB $i.p; $total += $i.gb
  Write-Host ('  {0,-42} {1,7} GB' -f $i.n, $i.gb)
}
$dmp = 0; if (Test-Path 'C:\Windows\MEMORY.DMP') { $dmp = [math]::Round((Get-Item 'C:\Windows\MEMORY.DMP' -Force).Length / 1GB, 2) }
Write-Host ('  {0,-42} {1,7} GB' -f 'Despejo grande de memória (ADM)', $dmp); $total += $dmp
$lixeira = TamGB 'C:\$Recycle.Bin'
Write-Host ('  {0,-42} {1,7} GB' -f 'Lixeira', $lixeira); $total += $lixeira
$hib = 0; if (Test-Path 'C:\hiberfil.sys') { $hib = [math]::Round((Get-Item 'C:\hiberfil.sys' -Force).Length / 1GB, 1) }
Write-Host ''
Write-Host ('Lixo seguro (recria sozinho): ~' + [math]::Round($total, 1) + ' GB') -ForegroundColor Cyan
if ($hib -gt 0) { Write-Host ('Hibernação (hiberfil.sys): ' + $hib + ' GB  → opcional, pergunto depois') -ForegroundColor Cyan }
Write-Host 'Também dá pra limpar versões velhas do Windows Update (DISM, ADM): o tamanho só aparece no fim.' -ForegroundColor Cyan
Write-Host ''
$r = Read-Host 'Apagar o lixo seguro agora? (S/N)'
if ($r -match '^[sS]') {
  foreach ($i in $itens) { if ($i.adm -and -not $admin) { continue }; if ($i.n -like '*Windows Update*') { Stop-Service wuauserv -Force; Stop-Service bits -Force }; Esvazia $i.p; if ($i.n -like '*Windows Update*') { Start-Service bits; Start-Service wuauserv } }
  if ($admin -and $dmp -gt 0) { Remove-Item 'C:\Windows\MEMORY.DMP' -Force }
  Clear-RecycleBin -Force -ErrorAction SilentlyContinue
  if ($admin) { try { Delete-DeliveryOptimizationCache -Force -ErrorAction Stop } catch {} }
  Write-Host ('[ok] lixo apagado. Livre agora: ' + (Livre) + ' GB') -ForegroundColor Green
  if ($admin) {
    $r2 = Read-Host 'Limpar versões velhas do Windows Update com o DISM? Demora 5 a 15 min, é seguro (S/N)'
    if ($r2 -match '^[sS]') { & Dism.exe /Online /Cleanup-Image /StartComponentCleanup; Write-Host ('[ok] DISM pronto. Livre agora: ' + (Livre) + ' GB') -ForegroundColor Green }
  }
}
if ($hib -gt 0 -and $admin) {
  Write-Host ''
  Write-Host ('Desligar a HIBERNAÇÃO libera ' + $hib + ' GB. O PC continua com "Suspender" e desligar normal; só some o "Hibernar" e a inicialização rápida (liga uns segundos mais devagar).') -ForegroundColor Yellow
  $r3 = Read-Host 'Desligar a hibernação? (S/N)'
  if ($r3 -match '^[sS]') { & powercfg.exe /hibernate off; Write-Host ('[ok] hibernação desligada. Livre agora: ' + (Livre) + ' GB  (pra voltar: powercfg /hibernate on)') -ForegroundColor Green }
}

# Só MOSTRA (não apaga): compactados grandes pra vc decidir no WizTree
Write-Host ''
Write-Host 'Pra vc olhar (NÃO apaguei): os 10 maiores .7z/.rar/.zip/.iso nas pastas do usuário' -ForegroundColor Yellow
Get-ChildItem $HOME -Recurse -Force -File -Include *.7z, *.rar, *.zip, *.iso -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object { Write-Host ('  {0,7} GB  {1}' -f ([math]::Round($_.Length / 1GB, 1)), $_.FullName) }

Write-Host ''
$livre = Livre
if ($livre -ge 25) {
  Write-Host ('Livre: ' + $livre + ' GB → dá pro cérebro grande.') -ForegroundColor Green
  $r4 = Read-Host 'Baixar o qwen3.5:35b-a3b agora? (S/N)'
  if ($r4 -match '^[sS]') { & ollama pull qwen3.5:35b-a3b }
} else {
  Write-Host ('Livre: ' + $livre + ' GB → ainda falta ' + [math]::Round(25 - $livre, 1) + ' GB pro cérebro grande. Olhe os compactados acima ou o cache do Unreal (só quando quiser: ele recompila na próxima abertura).') -ForegroundColor Red
}
Write-Host 'Pronto. Nada do ZOMBIES, do Unreal, do Ollama ou da ZicoAI foi tocado.' -ForegroundColor Yellow
