$ErrorActionPreference = 'Stop'

$mongoExe = 'C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe'
$root = Join-Path $PSScriptRoot '..\.mongodb'
$dataPath = Join-Path $root 'data'
$logPath = Join-Path $root 'log\mongod.log'

if (-not (Test-Path -LiteralPath $mongoExe)) {
  throw "MongoDB was not found at $mongoExe"
}

New-Item -ItemType Directory -Force -Path $dataPath, (Split-Path -Parent $logPath) | Out-Null

& $mongoExe `
  --dbpath="$dataPath" `
  --logpath="$logPath" `
  --bind_ip=127.0.0.1 `
  --port=27017
