@echo off
echo Starting Chrome with CORS disabled for local development...
start chrome.exe --user-data-dir="C:/chrome-dev-session" --disable-web-security --disable-site-isolation-trials "http://localhost:8000/news.html"
echo.
echo WARNING: This is only for LOCAL DEVELOPMENT.
echo Do NOT browse other websites with this Chrome window.
echo.
pause
