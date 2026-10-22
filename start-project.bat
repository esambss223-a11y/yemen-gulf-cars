@echo off
chcp 65001 >nul
title Yemen Gulf Cars - تشغيل المشروع
cd /d "%~dp0"

echo ======================================================
echo       🚗 مشروع سيارات الخليج واليمن (Yemen Gulf Cars)
echo ======================================================
echo.
echo  [1/2] جاري فتح الموقع في المتصفح...
start http://localhost:3000

echo  [2/2] جاري بدء تشغيل السيرفر (Next.js)...
echo.
echo  ----------------------------------------------------
echo  🌐 رابط الموقع:      http://localhost:3000
echo  ⚙️ لوحة التحكم:       http://localhost:3000/admin
echo  🛑 لإيقاف السيرفر:   اضغط على Ctrl + C في أي وقت
echo  ----------------------------------------------------
echo.

call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo ⚠️ حدث خطأ أثناء تشغيل السيرفر!
    pause
)
