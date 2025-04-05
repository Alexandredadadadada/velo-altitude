@echo off
echo Building Velo-Altitude application...
call npm run build
echo Build completed!

echo Preparing for deployment...
if not exist "deploy" mkdir deploy
xcopy /E /Y /I "build" "deploy"
copy netlify.toml deploy\

echo Application ready for deployment!
echo You can now deploy the "deploy" folder to Netlify using their drag and drop interface:
echo https://app.netlify.com/drop
