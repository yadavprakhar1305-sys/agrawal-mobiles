@echo off
echo Starting Agrawal Mobiles E-Commerce Platform...
echo.

echo Starting Backend Server...
start "Backend" cmd /c "cd /d "%~dp0backend" && node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server...
start "Frontend" cmd /c "cd /d "%~dp0frontend" && npx react-scripts start"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Admin Login: admin@agrawalmobiles.com / admin123
echo.
