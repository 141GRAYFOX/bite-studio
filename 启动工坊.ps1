$ErrorActionPreference = 'Stop'
$taskNodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if ($null -eq $taskNodeCommand) {
    Start-Process -FilePath (Join-Path $PSScriptRoot 'BiteStudio.html')
    exit
}
$taskServer = Join-Path $PSScriptRoot 'server.cjs'
Start-Process -FilePath $taskNodeCommand.Source -ArgumentList @(('"' + $taskServer + '"'), '--open') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
