# Schedule / run Astranov "one fix per Athens midnight" ship ritual
# Usage:
#   .\scripts\schedule-midnight-athens.ps1 -Register   # Task Scheduler 00:05 Europe/Athens
#   .\scripts\schedule-midnight-athens.ps1 -RunNow     # write packet stub + instructions
#   .\scripts\schedule-midnight-athens.ps1 -Status

param(
  [switch]$Register,
  [switch]$RunNow,
  [switch]$Status
)

$ErrorActionPreference = 'Stop'
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DataDir = Join-Path $Repo 'data'
$Packet = Join-Path $DataDir 'usage-latest.md'
$TaskName = 'Astranov-Midnight-Greek-Ship'

function Get-AthensNow {
  [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'GTB Standard Time')
}

function Write-ShipStub {
  if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir | Out-Null }
  $athens = Get-AthensNow
  $body = @"
# SpaceNet midnight ship packet (stub)
Athens local: $($athens.ToString('yyyy-MM-dd HH:mm'))
Generated: $([DateTime]::UtcNow.ToString('o'))

## How to fill
1. On https://astranov.eu hard-refresh, CLI: ``usage export``
2. Paste clipboard into this file (replace stub)
3. In Grok: ``/workflow midnight-greek-ship`` with args.packet = file contents
   or open chat: ship one fix from data/usage-latest.md

## Law
- One fix only
- js/spacenet/* (+ SPECS/continuity if needed)
- Zero dummy / no NPC seeds
- Probe live then push main
"@
  Set-Content -Path $Packet -Value $body -Encoding UTF8
  Write-Host "Wrote $Packet"
}

if ($Status) {
  Write-Host "Repo: $Repo"
  Write-Host "Athens now: $(Get-AthensNow)"
  Write-Host "Packet: $Packet exists=$(Test-Path $Packet)"
  try {
    Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop | Format-List TaskName, State
  } catch {
    Write-Host "Scheduled task not registered: $TaskName"
  }
  exit 0
}

if ($Register) {
  Write-ShipStub
  $ps = Join-Path $PSScriptRoot 'schedule-midnight-athens.ps1'
  # 00:05 local — user should set machine TZ or use GTB; we register daily 00:05
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ps`" -RunNow"
  $trigger = New-ScheduledTaskTrigger -Daily -At '00:05'
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Force | Out-Null
  Write-Host "Registered daily 00:05 task: $TaskName"
  Write-Host "Prefer Europe/Athens: set Windows timezone to GTB Standard Time (Athens) or adjust trigger."
  exit 0
}

if ($RunNow) {
  Write-ShipStub
  Write-Host ""
  Write-Host "=== Midnight Greek ship ritual ==="
  Write-Host "1) Fill $Packet from site CLI: usage export"
  Write-Host "2) In Grok Build on this repo run workflow: midnight-greek-ship"
  Write-Host "3) Commit + push the ONE fix"
  if (Get-Command git -ErrorAction SilentlyContinue) {
    Push-Location $Repo
    git log -3 --oneline 2>$null
    Pop-Location
  }
  exit 0
}

Write-Host "Usage: -Register | -RunNow | -Status"
exit 1
