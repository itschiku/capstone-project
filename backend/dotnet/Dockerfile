FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY DotnetAPI.csproj .
RUN dotnet restore

# Copy and build
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published files
COPY --from=build /app/publish .

# Create non-root user
RUN adduser --disabled-password --gecos '' --uid 1001 dotnet && \
    chown -R dotnet:dotnet /app
USER dotnet

EXPOSE 7000

ENTRYPOINT ["dotnet", "DotnetAPI.dll"]
