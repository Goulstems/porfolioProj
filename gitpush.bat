@echo off
setlocal

set /p msg=Enter commit message: 

git add .
git commit -m "%msg%"
git push

echo.
echo ✅ Push complete. Closing in 3 seconds...
timeout /t 3 >nul
