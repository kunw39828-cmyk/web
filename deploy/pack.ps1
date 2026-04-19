# 在本机 PowerShell 运行：生成 web-mainpei-deploy.tar.gz 到上一级目录（与项目同级）
$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Out = Join-Path (Split-Path $ProjectRoot -Parent) "web-mainpei-deploy.tar.gz"
Write-Host "项目: $ProjectRoot"
Write-Host "输出: $Out"
if (Test-Path $Out) { Remove-Item $Out -Force }
Push-Location $ProjectRoot
try {
  tar -czvf $Out `
    --exclude=node_modules `
    --exclude=dist `
    --exclude=.git `
    --exclude=server-java/target `
    --exclude=server/data/*.db `
    .
} finally {
  Pop-Location
}
Get-Item $Out | Format-List FullName, Length
Write-Host "上传: scp `"$Out`" root@你的服务器IP:/root/"
