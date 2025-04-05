@echo off
echo Installation des dependances du serveur...
cd server
call npm install
cd ..

echo Installation des dependances du client...
cd client
call npm install
cd ..

echo Installation terminee!
pause
