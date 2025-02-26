FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 7114
EXPOSE 5114

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ChatCore.WebApi.csproj", "./"]
RUN dotnet restore "ChatCore.WebApi.csproj"
COPY . .
RUN dotnet build "ChatCore.WebApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ChatCore.WebApi.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ChatCore.WebApi.dll"] 