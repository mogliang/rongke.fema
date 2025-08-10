# Use the official .NET 9.0 runtime as a base image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["rongke.fema.csproj", "."]
RUN dotnet restore "./rongke.fema.csproj"

# Copy the entire source code
COPY . .

# Build the application
WORKDIR "/src/."
RUN dotnet build "rongke.fema.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "rongke.fema.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app

# Copy the published application
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

# Create directory for database and ensure proper permissions
RUN mkdir -p /app/bin && \
    chmod 755 /app/bin

# Set the entry point
ENTRYPOINT ["dotnet", "rongke.fema.dll"]
