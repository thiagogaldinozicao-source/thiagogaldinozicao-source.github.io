# ZicoAI - ponte do PC (Windows PowerShell 5.1, sem instalar nada) - versão 2
# O PC é que BUSCA os pedidos na ZicoAI (nada fica aberto no PC, não precisa de Funnel).
# Regras: só pastas liberadas no config.json; NUNCA apaga; NUNCA sobrescreve (cria "nome (2)");
# comandos só da lista segura. Cada pedido fica anotado em ponte-log.txt.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Dir) { $Dir = Join-Path $HOME 'ZicoAI-Ponte' }
$CfgArq = Join-Path $Dir 'config.json'
$LogArq = Join-Path $Dir 'ponte-log.txt'
$Versao = '2.3'

function Log($t) {
  $linha = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $t
  try { [IO.File]::AppendAllText($LogArq, $linha + "`r`n", (New-Object Text.UTF8Encoding($false))) }
  catch { try { [IO.File]::AppendAllText((Join-Path $env:TEMP 'zicoai-ponte-log.txt'), $linha + "`r`n") } catch {} }
}

try { $cfg = [IO.File]::ReadAllText($CfgArq, [Text.Encoding]::UTF8) | ConvertFrom-Json }
catch { Log ('não li o config.json: ' + $_.Exception.Message); exit }
if (-not $cfg.exec -or -not $cfg.segredo) { Log 'config.json sem exec ou segredo'; exit }

function Raizes {
  $out = @()
  foreach ($p in $cfg.pastas) {
    $c = [Environment]::ExpandEnvironmentVariables([string]$p.caminho)
    try { $c = [IO.Path]::GetFullPath($c).TrimEnd('\') } catch { continue }
    $out += New-Object PSObject -Property @{ caminho = $c; escrever = [bool]$p.escrever }
  }
  return $out
}

# Caminho de dentro de uma pasta liberada? Devolve @{ caminho; raiz } ou dá erro.
function Liberado([string]$caminho, [bool]$paraEscrever) {
  if (-not $caminho) { throw 'Faltou o caminho' }
  $caminho = [Environment]::ExpandEnvironmentVariables($caminho)
  $raizes = @(Raizes)
  if (-not [IO.Path]::IsPathRooted($caminho)) {
    # "ZicoAI", "Downloads", "Documentos\notas.txt": começa com o nome de uma pasta liberada? usa ela
    $apelidos = @{ 'documentos' = 'documents'; 'area de trabalho' = 'desktop'; 'área de trabalho' = 'desktop'; 'imagens' = 'pictures'; 'baixados' = 'downloads' }
    $partes = $caminho -split '[\\/]', 2
    $primeiro = $partes[0].Trim().ToLower()
    if ($apelidos.ContainsKey($primeiro)) { $primeiro = $apelidos[$primeiro] }
    $raizNome = $raizes | Where-Object { (Split-Path -Leaf $_.caminho).ToLower() -eq $primeiro } | Select-Object -First 1
    if ($raizNome) {
      if ($partes.Length -gt 1 -and $partes[1]) { $caminho = Join-Path $raizNome.caminho $partes[1] } else { $caminho = $raizNome.caminho }
    } else {
      # senão: dentro da primeira pasta que pode escrever (a pasta ZicoAI)
      $base = ($raizes | Where-Object { $_.escrever } | Select-Object -First 1)
      if (-not $base) { $base = $raizes[0] }
      $caminho = Join-Path $base.caminho $caminho
    }
  }
  $full = [IO.Path]::GetFullPath($caminho).TrimEnd('\')
  foreach ($r in $raizes) {
    if ($full.Equals($r.caminho, [StringComparison]::OrdinalIgnoreCase) -or $full.StartsWith($r.caminho + '\', [StringComparison]::OrdinalIgnoreCase)) {
      if ($paraEscrever -and -not $r.escrever) { throw ('A pasta ' + $r.caminho + ' é só de leitura') }
      return @{ caminho = $full; raiz = $r.caminho }
    }
  }
  throw ('Pasta não liberada: ' + $full)
}

$Texto = @('.txt','.md','.csv','.json','.html','.htm','.js','.css','.ps1','.py','.log','.xml','.gs','.ini','.yaml','.yml','.tsv','.bat','.sql')
$Imagem = @{ '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.gif' = 'image/gif' }
$AbrirOk = @('.txt','.md','.csv','.pdf','.png','.jpg','.jpeg','.webp','.gif','.xlsx','.xls','.docx','.doc','.pptx','.mp4','.mp3','.html','.htm')

function Status {
  $disco = ''
  try { $d = Get-PSDrive -Name C; $disco = ('C: ' + [math]::Round($d.Free / 1GB, 1) + ' GB livres de ' + [math]::Round(($d.Used + $d.Free) / 1GB, 0) + ' GB') } catch {}
  $ps = @(); foreach ($r in @(Raizes)) { $ps += @{ caminho = $r.caminho; escrever = $r.escrever } }
  return @{ ok = $true; nome = $env:COMPUTERNAME; versao = $Versao; hora = (Get-Date -Format 'dd/MM/yyyy HH:mm'); pastas = $ps; disco = $disco }
}

function Listar($p) {
  if (-not $p.pasta) { $l = Liberado (@(Raizes)[0].caminho) $false } else { $l = Liberado ([string]$p.pasta) $false }
  if (-not (Test-Path -LiteralPath $l.caminho -PathType Container)) { throw 'Pasta não existe' }
  $itens = @()
  Get-ChildItem -LiteralPath $l.caminho -Force -ErrorAction SilentlyContinue | Sort-Object -Property @{ Expression = { -not $_.PSIsContainer } }, Name | Select-Object -First 300 | ForEach-Object {
    if ($_.Attributes -band [IO.FileAttributes]::Hidden) { return }
    if ($_.PSIsContainer) { $itens += @{ nome = $_.Name; tipo = 'pasta' } }
    else { $itens += @{ nome = $_.Name; tipo = 'arquivo'; tamanho = $_.Length; modificado = $_.LastWriteTime.ToString('dd/MM/yyyy HH:mm') } }
  }
  return @{ ok = $true; pasta = $l.caminho; itens = $itens }
}

function Ler($p) {
  $l = Liberado ([string]$p.arquivo) $false
  if (-not (Test-Path -LiteralPath $l.caminho -PathType Leaf)) { throw 'Arquivo não existe' }
  $f = Get-Item -LiteralPath $l.caminho
  $ext = $f.Extension.ToLower()
  if ($Imagem.ContainsKey($ext)) {
    if ($f.Length -gt 1MB) { throw 'Imagem grande demais (máx. 1 MB)' }
    return @{ ok = $true; arquivo = $f.FullName; mime = $Imagem[$ext]; base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName)) }
  }
  if ($Texto -contains $ext) {
    if ($f.Length -gt 1MB) { throw 'Arquivo de texto grande demais (máx. 1 MB)' }
    return @{ ok = $true; arquivo = $f.FullName; texto = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8) }
  }
  throw ('Tipo de arquivo que eu não leio: ' + $ext + ' (' + [math]::Ceiling($f.Length / 1KB) + ' KB)')
}

function Escrever($p) {
  $l = Liberado ([string]$p.arquivo) $true
  $conteudo = [string]$p.conteudo
  if ($conteudo.Length -gt 1000000) { throw 'Conteúdo grande demais' }
  $alvo = $l.caminho
  $pasta = Split-Path -Parent $alvo
  if (-not (Test-Path -LiteralPath $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
  if (Test-Path -LiteralPath $alvo) {
    $nome = [IO.Path]::GetFileNameWithoutExtension($alvo); $ext = [IO.Path]::GetExtension($alvo); $n = 2
    do { $alvo = Join-Path $pasta ($nome + ' (' + $n + ')' + $ext); $n++ } while (Test-Path -LiteralPath $alvo)
  }
  [IO.File]::WriteAllText($alvo, $conteudo, (New-Object Text.UTF8Encoding($false)))
  return @{ ok = $true; arquivo = $alvo }
}

function TirarPrint {
  Add-Type -AssemblyName System.Windows.Forms, System.Drawing
  $b = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.Left, $b.Top, 0, 0, $bmp.Size)
  $g.Dispose()
  $larg = [math]::Min(1600, $b.Width); $alt = [int]($b.Height * $larg / $b.Width)
  $peq = New-Object System.Drawing.Bitmap($bmp, $larg, $alt)
  $bmp.Dispose()
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $par = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $par.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]72)
  $ms = New-Object IO.MemoryStream
  $peq.Save($ms, $codec, $par)
  $peq.Dispose()
  return @{ ok = $true; mime = 'image/jpeg'; base64 = [Convert]::ToBase64String($ms.ToArray()); largura = $larg; altura = $alt }
}

function Abrir($p) {
  $alvo = ([string]$p.alvo).Trim()
  if ($alvo -match '^https?://[^\s"]+$') { Start-Process $alvo; return @{ ok = $true; aberto = $alvo } }
  $progs = @{ 'bloco de notas' = 'notepad.exe'; 'notepad' = 'notepad.exe'; 'calculadora' = 'calc.exe'; 'calc' = 'calc.exe'; 'chrome' = 'chrome.exe'; 'explorador' = 'explorer.exe'; 'explorer' = 'explorer.exe'; 'pasta zicoai' = 'explorer.exe' }
  $k = $alvo.ToLower()
  if ($k -eq 'comfyui') {
    $c = Join-Path $env:LOCALAPPDATA 'Programs\@comfyorgcomfyui-electron\ComfyUI.exe'
    if (Test-Path $c) { Start-Process $c; return @{ ok = $true; aberto = 'ComfyUI' } }
    throw 'Não achei o ComfyUI instalado no lugar padrão'
  }
  if ($progs.ContainsKey($k)) {
    if ($progs[$k] -eq 'explorer.exe') { Start-Process explorer.exe -ArgumentList ('"' + (@(Raizes) | Where-Object { $_.escrever } | Select-Object -First 1).caminho + '"') }
    else { Start-Process $progs[$k] }
    return @{ ok = $true; aberto = $alvo }
  }
  $l = Liberado $alvo $false
  $ext = [IO.Path]::GetExtension($l.caminho).ToLower()
  if ($AbrirOk -notcontains $ext) { throw ('Por segurança eu não abro arquivos ' + $ext + ' (programa/instalador).') }
  if (-not (Test-Path -LiteralPath $l.caminho)) { throw 'Arquivo não existe' }
  Start-Process -FilePath $l.caminho
  return @{ ok = $true; aberto = $l.caminho }
}

function Comando($p) {
  $n = ([string]$p.nome).ToLower()
  switch ($n) {
    'espaco_disco'   { $s = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null } | ForEach-Object { $_.Name + ': ' + [math]::Round($_.Free / 1GB, 1) + ' GB livres de ' + [math]::Round(($_.Used + $_.Free) / 1GB, 0) + ' GB' } }
    'processos'      { $s = Get-Process | Sort-Object -Property WorkingSet64 -Descending | Select-Object -First 15 | ForEach-Object { $_.ProcessName + ' - ' + [math]::Round($_.WorkingSet64 / 1MB) + ' MB' } }
    'gpu'            { $s = & nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv 2>&1 }
    'ip'             { $s = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | ForEach-Object { $_.InterfaceAlias + ': ' + $_.IPAddress } }
    'sistema'        { $o = Get-CimInstance Win32_OperatingSystem; $s = @($o.Caption, ('Ligado desde ' + $o.LastBootUpTime.ToString('dd/MM HH:mm')), ('RAM livre: ' + [math]::Round($o.FreePhysicalMemory / 1MB, 1) + ' GB de ' + [math]::Round($o.TotalVisibleMemorySize / 1MB, 1) + ' GB')) }
    'ollama_modelos' { $s = & ollama list 2>&1 }
    'testes_zicoai'  {
      # baixa (ou atualiza) a cópia do GitHub na pasta ZicoAI\repo e roda os testes do cérebro
      $ErrorActionPreference = 'Continue'
      $repo = Join-Path $HOME 'ZicoAI\repo'
      if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git não está instalado no PC' }
      if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js não está instalado no PC' }
      if (-not (Test-Path (Join-Path $repo '.git'))) { & git clone --depth 1 https://github.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io $repo 2>&1 | Out-Null }
      else { & git -C $repo pull --ff-only 2>&1 | Out-Null }
      $pasta = Join-Path $repo 'zicoai\cerebro\testes'
      if (-not (Test-Path $pasta)) { throw 'Não achei a pasta de testes' }
      $total = 0; $falhas = @()
      $s = foreach ($f in (Get-ChildItem $pasta -Filter 't*.js' | Sort-Object Name)) {
        $o = & node $f.FullName 2>&1 | ForEach-Object { [string]$_ }
        $ok = @($o | Where-Object { $_ -like 'PASS*' }).Count
        $fa = @($o | Where-Object { $_ -like 'FAIL*' -or $_ -like '*Error*' })
        $total += $ok
        if ($fa.Count) { $falhas += ($f.Name + ': ' + (($fa | Select-Object -First 2) -join ' ; ')) }
        $f.Name + ': ' + $ok + ' ok' + $(if ($fa.Count) { ' | FALHOU' } else { '' })
      }
      $s = @(('TOTAL: ' + $total + ' testes ok, ' + $falhas.Count + ' arquivo(s) com falha')) + $falhas + $s
    }
    'diagnostico'    {
      # Só LÊ: erros do Windows nas últimas 24 h, log do Ollama, disco, memória, mais pesados e placa de vídeo. Pra ela depurar o PC sozinha.
      $p = @()
      $p += '== PC: ' + $env:COMPUTERNAME + ' · ligado desde ' + ((Get-CimInstance Win32_OperatingSystem).LastBootUpTime).ToString('dd/MM HH:mm') + ' · ponte ' + $Versao
      $p += '== Disco: ' + ((Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null } | ForEach-Object { $_.Name + ': ' + [math]::Round($_.Free / 1GB, 1) + ' GB livres' }) -join ' | ')
      $os = Get-CimInstance Win32_OperatingSystem
      $p += '== Memória: ' + [math]::Round($os.FreePhysicalMemory / 1MB, 1) + ' GB livres de ' + [math]::Round($os.TotalVisibleMemorySize / 1MB, 1) + ' GB'
      $p += '== Mais pesados:'
      $p += (Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 | ForEach-Object { $_.ProcessName + ' - ' + [math]::Round($_.WorkingSet64 / 1MB) + ' MB' })
      try { $p += '== Placa de vídeo: ' + ((& nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu --format=csv,noheader) -join ' | ') } catch { $p += '== Placa de vídeo: nvidia-smi indisponível' }
      $p += '== Erros do Windows (24 h):'
      try {
        $p += (Get-WinEvent -FilterHashtable @{ LogName = @('System', 'Application'); Level = @(1, 2); StartTime = (Get-Date).AddDays(-1) } -MaxEvents 15 -ErrorAction Stop | ForEach-Object { $_.TimeCreated.ToString('dd/MM HH:mm') + ' ' + $_.ProviderName + ': ' + (($_.Message -split "`n")[0]).Substring(0, [math]::Min(140, (($_.Message -split "`n")[0]).Length)) })
      } catch { $p += '(nenhum erro ou sem permissão pra ler)' }
      $logO = Join-Path $env:LOCALAPPDATA 'Ollama\server.log'
      if (Test-Path $logO) { $p += '== Últimas linhas do Ollama:'; $p += (Get-Content $logO -Tail 12) } else { $p += '== Log do Ollama: não achei' }
      $s = $p
    }
    default          { throw 'Comando fora da lista segura: espaco_disco, processos, gpu, ip, sistema, ollama_modelos, testes_zicoai, diagnostico' }
  }
  return @{ ok = $true; saida = (($s | Out-String).Trim()) }
}


# Chama a ZicoAI (Apps Script) e devolve o JSON. Texto sempre em UTF-8 (acentos e o "ã" do Zicão).
function Chamar($obj) {
  $bytes = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -Compress -Depth 8 $obj))
  $r = Invoke-WebRequest -UseBasicParsing -Uri ([string]$cfg.exec) -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 90
  $txt = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
  return ($txt | ConvertFrom-Json)
}

function Executar($p) {
  $acao = [string]$p.acao
  $d = $p.dados
  if (-not $d) { $d = New-Object PSObject }
  Log ('pedido: ' + $acao + ' ' + ([string]$d.pasta) + ([string]$d.arquivo) + ([string]$d.alvo) + ([string]$d.nome))
  try {
    switch ($acao) {
      'status'   { return (Status) }
      'listar'   { return (Listar $d) }
      'ler'      { return (Ler $d) }
      'escrever' { return (Escrever $d) }
      'print'    { return (TirarPrint) }
      'abrir'    { return (Abrir $d) }
      'comando'  { return (Comando $d) }
      default    { return @{ ok = $false; erro = ('Ação desconhecida: ' + $acao) } }
    }
  } catch { return @{ ok = $false; erro = $_.Exception.Message } }
}

Log ('ponte ' + $Versao + ' ligada (busca pedidos na ZicoAI)')
$falhas = 0
$conectou = $false
while ($true) {
  try {
    $r = Chamar @{ acao = 'ponteBuscar'; segredo = [string]$cfg.segredo; nome = $env:COMPUTERNAME; versao = $Versao }
    if (-not $r.ok) { Log ('a ZicoAI recusou: ' + $r.erro); Start-Sleep -Seconds 60; continue }
    if (-not $conectou) { Log 'conectado na ZicoAI'; $conectou = $true }
    $falhas = 0
    foreach ($p in @($r.pedidos)) {
      if (-not $p) { continue }
      $res = Executar $p
      try { Chamar @{ acao = 'ponteResposta'; segredo = [string]$cfg.segredo; id = [string]$p.id; resultado = (ConvertTo-Json -Compress -Depth 6 $res) } | Out-Null }
      catch { Log ('não consegui mandar a resposta: ' + $_.Exception.Message) }
    }
  } catch {
    $falhas++
    $conectou = $false
    Log ('sem conexão com a ZicoAI: ' + $_.Exception.Message)
    Start-Sleep -Seconds ([math]::Min(60, 5 * $falhas))
  }
}
