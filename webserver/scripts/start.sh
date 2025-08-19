#!/bin/bash
cd "$( dirname "${BASH_SOURCE[0]}" )/app"
export ASPNETCORE_ENVIRONMENT=Production
export ASPNETCORE_URLS=http://0.0.0.0:5000
dotnet rongke.fmea.dll
