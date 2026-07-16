FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# نسخ ملفات المشروع أولاً وعمل الـ Restore
COPY ["ISPSystem.csproj", "./"]
RUN dotnet restore "ISPSystem.csproj"

# 🛠️ التأكيد على نسخ كل المجلدات الفرعية (بما فيها مجلد backend)
COPY . .

# عمل الـ Publish للمشروع الرئيسي
RUN dotnet publish "ISPSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

# مرحلة التشغيل (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ISPSystem.dll"]