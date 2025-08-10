@echo off
cd /d "%~dp0app"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://0.0.0.0:5000
dotnet rongke.fema.dll
pause
