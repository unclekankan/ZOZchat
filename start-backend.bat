@echo off
chcp 65001
echo ======================================
echo     启动聊天应用后端服务
echo ======================================
echo.

cd /d "%~dp0\backend"

echo 检查 node_modules...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 安装依赖失败！
        pause
        exit /b 1
    )
)

echo.
echo 启动后端服务器...
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause