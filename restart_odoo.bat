@echo off
echo ========================================================
echo Restarting Odoo 19 Service (odoo-server-19.0)...
echo ========================================================
net stop odoo-server-19.0
net start odoo-server-19.0
echo.
echo Service status:
sc query odoo-server-19.0 | findstr /i "STATE"
echo.
echo ========================================================
echo SUCCESS! Odoo is now ready.
echo Open: http://localhost:8069/web/database/manager
echo ========================================================
pause
