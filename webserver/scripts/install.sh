#!/bin/bash
# Install .NET Runtime if not already installed
if ! command -v dotnet &> /dev/null; then
    echo "Installing .NET Runtime..."
    wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    sudo apt-get update
    sudo apt-get install -y aspnetcore-runtime-9.0
    rm packages-microsoft-prod.deb
else
    echo ".NET Runtime is already installed"
fi

# Make start script executable
chmod +x start.sh
echo "Installation complete. Run ./start.sh to start the application."
