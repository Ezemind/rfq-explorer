@echo off
echo Creating GitHub Release v1.1.6...
echo.

REM Check if GH_TOKEN is set
if "%GH_TOKEN%"=="" (
    echo ERROR: GH_TOKEN environment variable is not set!
    echo.
    echo Please set your GitHub token first:
    echo   set GH_TOKEN=your_github_token_here
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo Token is set, creating release...
echo.

REM Build and publish with token
npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

electron-builder --publish=always
if %ERRORLEVEL% neq 0 (
    echo Publish failed!
    pause
    exit /b 1
)

echo.
echo ✅ Release created successfully!
echo Check: https://github.com/Ezemind/rfq-explorer/releases
pause
