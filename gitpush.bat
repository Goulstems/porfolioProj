@echo off
set /p msg=Enter commit message: 

:: Use NirCmd to get the current mouse position and move the window there
for /f "tokens=1,2 delims=," %%a in ('nircmd.exe getcursorpos') do set mouseX=%%a & set mouseY=%%b

:: Define the window size (for example, 600x400)
set width=600
set height=400

:: Move the command prompt window to the mouse's location and set the size
nircmd.exe win move ititle "Command Prompt" %mouseX% %mouseY% %width% %height%

git add . 
git commit -m "%msg%" 
git push 

echo.
echo ✅ Push complete. Closing in 3 seconds... 
timeout /t 3 >nul
