# ZicoAI - ponte do PC (Windows PowerShell 5.1, sem instalar nada)
# Escuta só em 127.0.0.1 (o Tailscale Funnel leva até aqui, com caminho secreto).
# Regras: só pastas liberadas no config.json; NUNCA apaga; NUNCA sobrescreve (cria "nome (2)");
# comandos só da lista segura. Cada pedido fica anotado em ponte-log.txt.

$ErrorActionPreference = 'Stop'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CfgArq = Join-Path $Dir 'config.json'
$LogArq = Join-Path $Dir 'ponte-log.txt'
$Versao = '1.1'
$cfg = Get-Content -Raw -Encoding UTF8 $CfgArq | ConvertFrom-Json
$Porta = [int]$cfg.porta
if (-not $Porta) { $Porta = 8790 }

# só uma ponte por vez: se a porta já estiver em uso (outra ponte rodando), esta sai sozinha

function Log($t) { try { Add-Content -Path $LogArq -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $t) -Encoding UTF8 } catch {} }

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
    # caminho relativo: dentro da primeira pasta que pode escrever (a pasta ZicoAI)
    $base = ($raizes | Where-Object { $_.escrever } | Select-Object -First 1)
    if (-not $base) { $base = $raizes[0] }
    $caminho = Join-Path $base.caminho $caminho
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
    if ($f.Length -gt 8MB) { throw 'Imagem grande demais (máx. 8 MB)' }
    return @{ ok = $true; arquivo = $f.FullName; mime = $Imagem[$ext]; base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName)) }
  }
  if ($Texto -contains $ext) {
    if ($f.Length -gt 2MB) { throw 'Arquivo de texto grande demais (máx. 2 MB)' }
    return @{ ok = $true; arquivo = $f.FullName; texto = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8) }
  }
  throw ('Tipo de arquivo que eu não leio: ' + $ext + ' (' + [math]::Ceiling($f.Length / 1KB) + ' KB)')
}

function Escrever($p) {
  $l = Liberado ([string]$p.arquivo) $true
  $conteudo = [string]$p.conteudo
  if ($conteudo.Length -gt 2000000) { throw 'Conteúdo grande demais' }
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
    default          { throw 'Comando fora da lista segura: espaco_disco, processos, gpu, ip, sistema, ollama_modelos' }
  }
  return @{ ok = $true; saida = (($s | Out-String).Trim()) }
}

function Responder($stream, [int]$cod, [string]$json) {
  $corpo = [Text.Encoding]::UTF8.GetBytes($json)
  $txtCod = 'OK'
  if ($cod -eq 401) { $txtCod = 'Unauthorized' } elseif ($cod -eq 400) { $txtCod = 'Bad Request' } elseif ($cod -ne 200) { $txtCod = 'Error' }
  $cab = 'HTTP/1.1 ' + $cod + ' ' + $txtCod + "`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: " + $corpo.Length + "`r`nConnection: close`r`n`r`n"
  $b = [Text.Encoding]::ASCII.GetBytes($cab)
  $stream.Write($b, 0, $b.Length); $stream.Write($corpo, 0, $corpo.Length); $stream.Flush()
}

function LerPedido($stream) {
  # cabeçalho até a linha em branco (máx. 32 KB)
  $buf = New-Object System.Collections.Generic.List[byte]
  $um = New-Object byte[] 1
  while ($buf.Count -lt 32768) {
    $n = $stream.Read($um, 0, 1)
    if ($n -le 0) { break }
    $buf.Add($um[0])
    $c = $buf.Count
    if ($c -ge 4 -and $buf[$c - 4] -eq 13 -and $buf[$c - 3] -eq 10 -and $buf[$c - 2] -eq 13 -and $buf[$c - 1] -eq 10) { break }
  }
  $cab = [Text.Encoding]::ASCII.GetString($buf.ToArray())
  $linhas = $cab -split "`r`n"
  $h = @{}
  foreach ($l in ($linhas | Select-Object -Skip 1)) { $i = $l.IndexOf(':'); if ($i -gt 0) { $h[$l.Substring(0, $i).Trim().ToLower()] = $l.Substring($i + 1).Trim() } }
  # o Tailscale às vezes manda o corpo "em pedaços" (Transfer-Encoding: chunked) em vez de Content-Length
  if ($h.ContainsKey('transfer-encoding') -and $h['transfer-encoding'] -match 'chunked') {
    $ms = New-Object IO.MemoryStream
    while ($true) {
      $tamTxt = (LerLinha $stream).Split(';')[0].Trim()
      if (-not $tamTxt) { break }
      $pedaco = [Convert]::ToInt32($tamTxt, 16)
      if ($pedaco -le 0) { LerLinha $stream | Out-Null; break }
      if ($ms.Length + $pedaco -gt 30MB) { throw 'Pedido grande demais' }
      $b = LerBytes $stream $pedaco
      $ms.Write($b, 0, $b.Length)
      LerLinha $stream | Out-Null
    }
    $arr = $ms.ToArray()
    return @{ linha = $linhas[0]; cab = $h; corpo = [Text.Encoding]::UTF8.GetString($arr, 0, $arr.Length) }
  }
  $tam = 0
  if ($h.ContainsKey('content-length')) { $tam = [int]$h['content-length'] }
  if ($tam -gt 30MB) { throw 'Pedido grande demais' }
  $corpo = LerBytes $stream $tam
  return @{ linha = $linhas[0]; cab = $h; corpo = [Text.Encoding]::UTF8.GetString($corpo, 0, $corpo.Length) }
}

function LerBytes($stream, [int]$tam) {
  $buf = New-Object byte[] $tam
  $lido = 0
  while ($lido -lt $tam) { $n = $stream.Read($buf, $lido, $tam - $lido); if ($n -le 0) { break }; $lido += $n }
  if ($lido -lt $tam) { $menor = New-Object byte[] $lido; [Array]::Copy($buf, $menor, $lido); return ,$menor }
  return ,$buf
}

function LerLinha($stream) {
  $l = New-Object System.Collections.Generic.List[byte]
  $um = New-Object byte[] 1
  while ($l.Count -lt 1024) {
    $n = $stream.Read($um, 0, 1)
    if ($n -le 0) { break }
    if ($um[0] -eq 10) { break }
    if ($um[0] -ne 13) { $l.Add($um[0]) }
  }
  return [Text.Encoding]::ASCII.GetString($l.ToArray())
}

$listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Porta)
try { $listener.Start() } catch { Log ('não ligou (porta ' + $Porta + ' em uso?): ' + $_.Exception.Message); exit }
Log ('ponte ligada na porta ' + $Porta)
$errosSegredo = 0
while ($true) {
  $cli = $listener.AcceptTcpClient()
  $st = $null
  try {
    $cli.ReceiveTimeout = 20000; $cli.SendTimeout = 20000
    $st = $cli.GetStream()
    $ped = LerPedido $st
    $seg = ''
    if ($ped.cab.ContainsKey('x-zico-ponte')) { $seg = $ped.cab['x-zico-ponte'] }
    if (-not $cfg.segredo -or $seg -ne [string]$cfg.segredo) {
      $errosSegredo++
      Log ('RECUSADO (segredo errado): ' + $ped.linha)
      if ($errosSegredo -gt 30) { Start-Sleep -Seconds 5 }
      Responder $st 401 '{"ok":false,"erro":"segredo errado"}'
    } elseif ($ped.linha -notmatch '^POST ') {
      Responder $st 200 (ConvertTo-Json -Compress -Depth 6 (Status))
    } else {
      $p = $ped.corpo | ConvertFrom-Json
      $acao = [string]$p.acao
      Log ('pedido: ' + $acao + ' ' + ([string]$p.pasta) + ([string]$p.arquivo) + ([string]$p.alvo) + ([string]$p.nome))
      try {
        switch ($acao) {
          'status'   { $r = Status }
          'listar'   { $r = Listar $p }
          'ler'      { $r = Ler $p }
          'escrever' { $r = Escrever $p }
          'print'    { $r = TirarPrint }
          'abrir'    { $r = Abrir $p }
          'comando'  { $r = Comando $p }
          default    { $r = @{ ok = $false; erro = ('Ação desconhecida: ' + $acao) } }
        }
      } catch { $r = @{ ok = $false; erro = $_.Exception.Message } }
      Responder $st 200 (ConvertTo-Json -Compress -Depth 6 $r)
    }
  } catch {
    Log ('erro: ' + $_.Exception.Message)
    try { if ($st) { Responder $st 400 '{"ok":false,"erro":"pedido inválido"}' } } catch {}
  } finally {
    try { $cli.Client.Shutdown([Net.Sockets.SocketShutdown]::Send) } catch {}
    try { $cli.ReceiveTimeout = 300; $lixo = New-Object byte[] 4096; while ($st -and $st.DataAvailable -and $st.Read($lixo, 0, 4096) -gt 0) {} } catch {}
    try { $cli.Close() } catch {}
  }
}
