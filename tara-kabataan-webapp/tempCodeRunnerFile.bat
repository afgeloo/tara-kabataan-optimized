@echo off
echo Installing dependencies...

call npm install @vitejs/plugin-react
call npm install react-fast-marquee --save
call npm install react-router-dom
call npm install react-scroll-parallax
call npm install framer-motion
call npm install react-player
call npm install @emailjs/browser

echo Installation complete!
pause