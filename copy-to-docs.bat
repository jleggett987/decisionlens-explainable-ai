@echo off
REM Batch script to copy all deployable JS/data files to docs/ for GitHub Pages

REM Create target directories if they don't exist
if not exist docs\js mkdir docs\js
if not exist docs\data mkdir docs\data
if not exist docs\ui mkdir docs\ui

REM Copy files

copy /Y src\app\app.js docs\js\
copy /Y src\app\router.js docs\js\
copy /Y src\app\views.js docs\js\
copy /Y src\engine\ai-service.js docs\js\
copy /Y src\engine\data-processor.js docs\js\
copy /Y src\engine\explanation-generator.js docs\js\
copy /Y src\engine\scoring-engine.js docs\js\
copy /Y src\ui\render.js docs\js\
copy /Y src\ui\clipboard.js docs\ui\
copy /Y src\config.js docs\js\
copy /Y src\data\scenarios.js docs\data\
copy /Y src\ui\print.css docs\ui\

echo All deploy files copied to docs/. Ready for GitHub Pages!
