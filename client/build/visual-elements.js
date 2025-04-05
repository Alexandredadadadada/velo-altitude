// Create SVG logo for Grand Est Cyclisme
const createLogo = () => {
  // Create SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "200");
  svg.setAttribute("height", "50");
  svg.setAttribute("viewBox", "0 0 200 50");
  svg.classList.add("logo-svg");

  // Create background
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", "200");
  background.setAttribute("height", "50");
  background.setAttribute("rx", "8");
  background.setAttribute("fill", "#1F497D");
  svg.appendChild(background);

  // Create mountain silhouette
  const mountain = document.createElementNS("http://www.w3.org/2000/svg", "path");
  mountain.setAttribute("d", "M0,50 L40,20 L60,35 L80,15 L120,40 L140,25 L160,35 L200,10 L200,50 Z");
  mountain.setAttribute("fill", "#3A6EA5");
  svg.appendChild(mountain);

  // Create sun
  const sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  sun.setAttribute("cx", "160");
  sun.setAttribute("cy", "15");
  sun.setAttribute("r", "8");
  sun.setAttribute("fill", "#FF6B35");
  svg.appendChild(sun);

  // Create bicycle
  const bicycle = document.createElementNS("http://www.w3.org/2000/svg", "g");
  bicycle.setAttribute("transform", "translate(30, 30) scale(0.5)");
  
  // Wheel 1
  const wheel1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  wheel1.setAttribute("cx", "15");
  wheel1.setAttribute("cy", "15");
  wheel1.setAttribute("r", "10");
  wheel1.setAttribute("stroke", "white");
  wheel1.setAttribute("stroke-width", "2");
  wheel1.setAttribute("fill", "none");
  bicycle.appendChild(wheel1);
  
  // Wheel 2
  const wheel2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  wheel2.setAttribute("cx", "45");
  wheel2.setAttribute("cy", "15");
  wheel2.setAttribute("r", "10");
  wheel2.setAttribute("stroke", "white");
  wheel2.setAttribute("stroke-width", "2");
  wheel2.setAttribute("fill", "none");
  bicycle.appendChild(wheel2);
  
  // Frame
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "path");
  frame.setAttribute("d", "M15,15 L30,0 L45,15 L30,15 Z");
  frame.setAttribute("stroke", "white");
  frame.setAttribute("stroke-width", "2");
  frame.setAttribute("fill", "none");
  bicycle.appendChild(frame);
  
  svg.appendChild(bicycle);

  // Create text
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", "70");
  text.setAttribute("y", "30");
  text.setAttribute("font-family", "Arial, sans-serif");
  text.setAttribute("font-size", "16");
  text.setAttribute("font-weight", "bold");
  text.setAttribute("fill", "white");
  text.textContent = "Grand Est Cyclisme";
  svg.appendChild(text);

  return svg;
};

// Create feature icons
const createFeatureIcons = () => {
  // Mountain icon
  const mountainIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  mountainIcon.setAttribute("width", "40");
  mountainIcon.setAttribute("height", "40");
  mountainIcon.setAttribute("viewBox", "0 0 40 40");
  
  const mountainPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  mountainPath.setAttribute("d", "M5,30 L15,10 L20,15 L25,5 L35,30 Z");
  mountainPath.setAttribute("fill", "#1F497D");
  mountainPath.setAttribute("stroke", "#3A6EA5");
  mountainPath.setAttribute("stroke-width", "2");
  
  mountainIcon.appendChild(mountainPath);
  
  // Weather icon
  const weatherIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  weatherIcon.setAttribute("width", "40");
  weatherIcon.setAttribute("height", "40");
  weatherIcon.setAttribute("viewBox", "0 0 40 40");
  
  const sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  sun.setAttribute("cx", "20");
  sun.setAttribute("cy", "15");
  sun.setAttribute("r", "7");
  sun.setAttribute("fill", "#FF6B35");
  
  const cloud = document.createElementNS("http://www.w3.org/2000/svg", "path");
  cloud.setAttribute("d", "M10,25 C7,25 5,23 5,20 C5,17 7,15 10,15 C10,12 12,10 15,10 C18,10 20,12 20,15 C23,15 25,17 25,20 C25,23 23,25 20,25 Z");
  cloud.setAttribute("fill", "#E4E7EB");
  cloud.setAttribute("stroke", "#A0AEC0");
  cloud.setAttribute("stroke-width", "1");
  
  weatherIcon.appendChild(sun);
  weatherIcon.appendChild(cloud);
  
  // Training icon
  const trainingIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  trainingIcon.setAttribute("width", "40");
  trainingIcon.setAttribute("height", "40");
  trainingIcon.setAttribute("viewBox", "0 0 40 40");
  
  const chart = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chart.setAttribute("d", "M5,30 L5,10 L35,10 M10,25 L15,15 L20,20 L25,10 L30,15");
  chart.setAttribute("fill", "none");
  chart.setAttribute("stroke", "#4CAF50");
  chart.setAttribute("stroke-width", "2");
  
  trainingIcon.appendChild(chart);
  
  // Community icon
  const communityIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  communityIcon.setAttribute("width", "40");
  communityIcon.setAttribute("height", "40");
  communityIcon.setAttribute("viewBox", "0 0 40 40");
  
  const person1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  person1.setAttribute("cx", "15");
  person1.setAttribute("cy", "15");
  person1.setAttribute("r", "5");
  person1.setAttribute("fill", "#9C27B0");
  
  const person2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  person2.setAttribute("cx", "25");
  person2.setAttribute("cy", "15");
  person2.setAttribute("r", "5");
  person2.setAttribute("fill", "#9C27B0");
  
  const person3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  person3.setAttribute("cx", "20");
  person3.setAttribute("cy", "25");
  person3.setAttribute("r", "5");
  person3.setAttribute("fill", "#9C27B0");
  
  communityIcon.appendChild(person1);
  communityIcon.appendChild(person2);
  communityIcon.appendChild(person3);
  
  return {
    mountain: mountainIcon,
    weather: weatherIcon,
    training: trainingIcon,
    community: communityIcon
  };
};

// Create weather icons
const createWeatherIcons = () => {
  // Sunny icon
  const sunnyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  sunnyIcon.setAttribute("width", "50");
  sunnyIcon.setAttribute("height", "50");
  sunnyIcon.setAttribute("viewBox", "0 0 50 50");
  
  const sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  sun.setAttribute("cx", "25");
  sun.setAttribute("cy", "25");
  sun.setAttribute("r", "12");
  sun.setAttribute("fill", "#FF6B35");
  
  // Sun rays
  for (let i = 0; i < 8; i++) {
    const ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const angle = i * Math.PI / 4;
    const x1 = 25 + 15 * Math.cos(angle);
    const y1 = 25 + 15 * Math.sin(angle);
    const x2 = 25 + 20 * Math.cos(angle);
    const y2 = 25 + 20 * Math.sin(angle);
    
    ray.setAttribute("x1", x1.toString());
    ray.setAttribute("y1", y1.toString());
    ray.setAttribute("x2", x2.toString());
    ray.setAttribute("y2", y2.toString());
    ray.setAttribute("stroke", "#FF6B35");
    ray.setAttribute("stroke-width", "2");
    
    sunnyIcon.appendChild(ray);
  }
  
  sunnyIcon.appendChild(sun);
  
  // Cloudy icon
  const cloudyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  cloudyIcon.setAttribute("width", "50");
  cloudyIcon.setAttribute("height", "50");
  cloudyIcon.setAttribute("viewBox", "0 0 50 50");
  
  const cloud1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  cloud1.setAttribute("d", "M15,35 C10,35 5,30 5,25 C5,20 10,15 15,15 C15,10 20,5 25,5 C30,5 35,10 35,15 C40,15 45,20 45,25 C45,30 40,35 35,35 Z");
  cloud1.setAttribute("fill", "#E4E7EB");
  cloud1.setAttribute("stroke", "#A0AEC0");
  cloud1.setAttribute("stroke-width", "1");
  
  cloudyIcon.appendChild(cloud1);
  
  // Rainy icon
  const rainyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  rainyIcon.setAttribute("width", "50");
  rainyIcon.setAttribute("height", "50");
  rainyIcon.setAttribute("viewBox", "0 0 50 50");
  
  const cloud2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  cloud2.setAttribute("d", "M15,25 C10,25 5,20 5,15 C5,10 10,5 15,5 C15,0 20,-5 25,-5 C30,-5 35,0 35,5 C40,5 45,10 45,15 C45,20 40,25 35,25 Z");
  cloud2.setAttribute("fill", "#E4E7EB");
  cloud2.setAttribute("stroke", "#A0AEC0");
  cloud2.setAttribute("stroke-width", "1");
  
  // Rain drops
  for (let i = 0; i < 5; i++) {
    const drop = document.createElementNS("http://www.w3.org/2000/svg", "path");
    drop.setAttribute("d", `M${10 + i*8},30 L${13 + i*8},40`);
    drop.setAttribute("stroke", "#3A6EA5");
    drop.setAttribute("stroke-width", "2");
    drop.setAttribute("stroke-linecap", "round");
    
    rainyIcon.appendChild(drop);
  }
  
  rainyIcon.appendChild(cloud2);
  
  // Snowy icon
  const snowyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  snowyIcon.setAttribute("width", "50");
  snowyIcon.setAttribute("height", "50");
  snowyIcon.setAttribute("viewBox", "0 0 50 50");
  
  const cloud3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  cloud3.setAttribute("d", "M15,25 C10,25 5,20 5,15 C5,10 10,5 15,5 C15,0 20,-5 25,-5 C30,-5 35,0 35,5 C40,5 45,10 45,15 C45,20 40,25 35,25 Z");
  cloud3.setAttribute("fill", "#E4E7EB");
  cloud3.setAttribute("stroke", "#A0AEC0");
  cloud3.setAttribute("stroke-width", "1");
  
  // Snowflakes
  for (let i = 0; i < 5; i++) {
    const flake = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    flake.setAttribute("cx", (10 + i*8).toString());
    flake.setAttribute("cy", "35");
    flake.setAttribute("r", "2");
    flake.setAttribute("fill", "white");
    flake.setAttribute("stroke", "#A0AEC0");
    flake.setAttribute("stroke-width", "0.5");
    
    snowyIcon.appendChild(flake);
  }
  
  snowyIcon.appendChild(cloud3);
  
  return {
    sunny: sunnyIcon,
    cloudy: cloudyIcon,
    rainy: rainyIcon,
    snowy: snowyIcon
  };
};

// Create favicon
const createFavicon = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1F497D';
  ctx.fillRect(0, 0, 32, 32);
  
  // Mountain
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(8, 16);
  ctx.lineTo(16, 24);
  ctx.lineTo(24, 12);
  ctx.lineTo(32, 20);
  ctx.lineTo(32, 32);
  ctx.closePath();
  ctx.fillStyle = '#3A6EA5';
  ctx.fill();
  
  // Sun
  ctx.beginPath();
  ctx.arc(24, 8, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B35';
  ctx.fill();
  
  // Text
  ctx.font = 'bold 10px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GE', 16, 20);
  
  return canvas.toDataURL();
};

// Create social media icons
const createSocialIcons = () => {
  // Facebook icon
  const facebookIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  facebookIcon.setAttribute("width", "24");
  facebookIcon.setAttribute("height", "24");
  facebookIcon.setAttribute("viewBox", "0 0 24 24");
  
  const facebookPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  facebookPath.setAttribute("d", "M18,2 L15,2 C13.3431,2 12,3.3431 12,5 L12,8 L9,8 L9,12 L12,12 L12,22 L16,22 L16,12 L19,12 L20,8 L16,8 L16,6 C16,5.4477 16.4477,5 17,5 L20,5 L20,2 Z");
  facebookPath.setAttribute("fill", "currentColor");
  
  facebookIcon.appendChild(facebookPath);
  
  // Twitter/X icon
  const twitterIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  twitterIcon.setAttribute("width", "24");
  twitterIcon.setAttribute("height", "24");
  twitterIcon.setAttribute("viewBox", "0 0 24 24");
  
  const twitterPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  twitterPath.setAttribute("d", "M22,4.01 C21.2,4.34 20.34,4.56 19.45,4.66 C20.35,4.13 21.04,3.28 21.35,2.27 C20.49,2.77 19.54,3.12 18.52,3.32 C17.71,2.48 16.53,1.96 15.23,1.96 C12.74,1.96 10.73,3.97 10.73,6.46 C10.73,6.77 10.77,7.07 10.83,7.36 C7.08,7.19 3.75,5.39 1.53,2.68 C1.14,3.26 0.93,3.94 0.93,4.67 C0.93,6.04 1.63,7.26 2.72,7.97 C2.03,7.95 1.38,7.77 0.82,7.47 L0.82,7.52 C0.82,9.71 2.35,11.54 4.41,11.91 C4.03,12 3.63,12.05 3.22,12.05 C2.93,12.05 2.66,12.02 2.39,11.97 C2.94,13.77 4.58,15.07 6.54,15.1 C5.01,16.31 3.11,17.04 1.05,17.04 C0.69,17.04 0.34,17.02 0,16.98 C1.98,18.26 4.33,19 6.85,19 C15.23,19 19.76,12.11 19.76,6.15 C19.76,5.98 19.76,5.8 19.75,5.63 C20.62,5.02 21.36,4.26 22,3.39 L22,4.01 Z");
  twitterPath.setAttribute("fill", "currentColor");
  
  twitterIcon.appendChild(twitterPath);
  
  // Instagram icon
  const instagramIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  instagramIcon.setAttribute("width", "24");
  instagramIcon.setAttribute("height", "24");
  instagramIcon.setAttribute("viewBox", "0 0 24 24");
  
  const instagramPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  instagramPath.setAttribute("d", "M12,2 C14.7158,2 15.0566,2.01 16.1221,2.06 C17.1876,2.11 17.9135,2.28 18.55,2.53 C19.2079,2.78 19.7659,3.12 20.3216,3.68 C20.8772,4.23 21.2222,4.79 21.47,5.45 C21.72,6.08 21.89,6.81 21.94,7.88 C21.99,8.94 22,9.28 22,12 C22,14.72 21.99,15.06 21.94,16.12 C21.89,17.19 21.72,17.91 21.47,18.55 C21.2222,19.21 20.8772,19.77 20.3216,20.32 C19.7659,20.88 19.2079,21.22 18.55,21.47 C17.9135,21.72 17.1876,21.89 16.1221,21.94 C15.0566,21.99 14.7158,22 12,22 C9.2842,22 8.9434,21.99 7.8779,21.94 C6.8124,21.89 6.0865,21.72 5.45,21.47 C4.7921,21.22 4.2341,20.88 3.6784,20.32 C3.1228,19.77 2.7778,19.21 2.53,18.55 C2.28,17.91 2.11,17.19 2.06,16.12 C2.01,15.06 2,14.72 2,12 C2,9.28 2.01,8.94 2.06,7.88 C2.11,6.81 2.28,6.08 2.53,5.45 C2.7778,4.79 3.1228,4.23 3.6784,3.68 C4.2341,3.12 4.7921,2.78 5.45,2.53 C6.0865,2.28 6.8124,2.11 7.8779,2.06 C8.9434,2.01 9.2842,2 12,2 Z M12,4 C9.3275,4 9.0144,4.01 7.9625,4.06 C6.9107,4.11 6.3578,4.28 5.9856,4.42 C5.4858,4.61 5.1233,4.84 4.7427,5.23 C4.3621,5.61 4.1318,5.97 3.9419,6.47 C3.8019,6.84 3.6322,7.4 3.5823,8.45 C3.5323,9.5 3.5223,9.81 3.5223,12.48 C3.5223,15.15 3.5323,15.46 3.5823,16.51 C3.6322,17.56 3.8019,18.11 3.9419,18.49 C4.1318,18.99 4.3621,19.35 4.7427,19.73 C5.1233,20.11 5.4858,20.35 5.9856,20.54 C6.3578,20.68 6.9107,20.85 7.9625,20.9 C9.0144,20.95 9.3275,20.96 12,20.96 C14.6725,20.96 14.9856,20.95 16.0375,20.9 C17.0893,20.85 17.6422,20.68 18.0144,20.54 C18.5142,20.35 18.8767,20.11 19.2573,19.73 C19.6379,19.35 19.8682,18.99 20.0581,18.49 C20.1981,18.11 20.3678,17.56 20.4177,16.51 C20.4677,15.46 20.4777,15.15 20.4777,12.48 C20.4777,9.81 20.4677,9.5 20.4177,8.45 C20.3678,7.4 20.1981,6.84 20.0581,6.47 C19.8682,5.97 19.6379,5.61 19.2573,5.23 C18.8767,4.84 18.5142,4.61 18.0144,4.42 C17.6422,4.28 17.0893,4.11 16.0375,4.06 C14.9856,4.01 14.6725,4 12,4 Z M12,7 C14.7614,7 17,9.2386 17,12 C17,14.7614 14.7614,17 12,17 C9.2386,17 7,14.7614 7,12 C7,9.2386 9.2386,7 12,7 Z M12,9 C10.3431,9 9,10.3431 9,12 C9,13.6569 10.3431,15 12,15 C13.6569,15 15,13.6569 15,12 C15,10.3431 13.6569,9 12,9 Z M17.5,6.75 C17.5,7.4404 16.9404,8 16.25,8 C15.5596,8 15,7.4404 15,6.75 C15,6.0596 15.5596,5.5 16.25,5.5 C16.9404,5.5 17.5,6.0596 17.5,6.75 Z");
  instagramPath.setAttribute("fill", "currentColor");
  
  instagramIcon.appendChild(instagramPath);
  
  // YouTube icon
  const youtubeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  youtubeIcon.setAttribute("width", "24");
  youtubeIcon.setAttribute("height", "24");
  youtubeIcon.setAttribute("viewBox", "0 0 24 24");
  
  const youtubePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  youtubePath.setAttribute("d", "M22.5401,6.4195 C22.3751,5.8195 22.0531,5.2745 21.6071,4.8345 C21.1611,4.3945 20.6111,4.0795 20.0101,3.9195 C18.4401,3.5195 12.0001,3.5195 12.0001,3.5195 C12.0001,3.5195 5.5601,3.5195 3.9901,3.9195 C3.3891,4.0795 2.8391,4.3945 2.3931,4.8345 C1.9471,5.2745 1.6251,5.8195 1.4601,6.4195 C1.1401,7.9895 1.1401,11.9995 1.1401,11.9995 C1.1401,11.9995 1.1401,16.0095 1.4601,17.5795 C1.6251,18.1795 1.9471,18.7245 2.3931,19.1645 C2.8391,19.6045 3.3891,19.9195 3.9901,20.0795 C5.5601,20.4795 12.0001,20.4795 12.0001,20.4795 C12.0001,20.4795 18.4401,20.4795 20.0101,20.0795 C20.6111,19.9195 21.1611,19.6045 21.6071,19.1645 C22.0531,18.7245 22.3751,18.1795 22.5401,17.5795 C22.8601,16.0095 22.8601,11.9995 22.8601,11.9995 C22.8601,11.9995 22.8601,7.9895 22.5401,6.4195 Z M9.7501,15.4995 L9.7501,8.4995 L15.7501,11.9995 L9.7501,15.4995 Z");
  youtubePath.setAttribute("fill", "currentColor");
  
  youtubeIcon.appendChild(youtubePath);
  
  // Strava icon
  const stravaIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  stravaIcon.setAttribute("width", "24");
  stravaIcon.setAttribute("height", "24");
  stravaIcon.setAttribute("viewBox", "0 0 24 24");
  
  const stravaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  stravaPath.setAttribute("d", "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169");
  stravaPath.setAttribute("fill", "currentColor");
  
  stravaIcon.appendChild(stravaPath);
  
  return {
    facebook: facebookIcon,
    twitter: twitterIcon,
    instagram: instagramIcon,
    youtube: youtubeIcon,
    strava: stravaIcon
  };
};

// Create theme icons
const createThemeIcons = () => {
  // Standard theme icon
  const standardIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  standardIcon.setAttribute("width", "24");
  standardIcon.setAttribute("height", "24");
  standardIcon.setAttribute("viewBox", "0 0 24 24");
  
  const standardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  standardRect.setAttribute("x", "2");
  standardRect.setAttribute("y", "2");
  standardRect.setAttribute("width", "20");
  standardRect.setAttribute("height", "20");
  standardRect.setAttribute("rx", "4");
  standardRect.setAttribute("fill", "#1F497D");
  
  standardIcon.appendChild(standardRect);
  
  // Dark theme icon
  const darkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  darkIcon.setAttribute("width", "24");
  darkIcon.setAttribute("height", "24");
  darkIcon.setAttribute("viewBox", "0 0 24 24");
  
  const darkRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  darkRect.setAttribute("x", "2");
  darkRect.setAttribute("y", "2");
  darkRect.setAttribute("width", "20");
  darkRect.setAttribute("height", "20");
  darkRect.setAttribute("rx", "4");
  darkRect.setAttribute("fill", "#333");
  
  darkIcon.appendChild(darkRect);
  
  // Senior theme icon
  const seniorIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  seniorIcon.setAttribute("width", "24");
  seniorIcon.setAttribute("height", "24");
  seniorIcon.setAttribute("viewBox", "0 0 24 24");
  
  const seniorRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  seniorRect.setAttribute("x", "2");
  seniorRect.setAttribute("y", "2");
  seniorRect.setAttribute("width", "20");
  seniorRect.setAttribute("height", "20");
  seniorRect.setAttribute("rx", "4");
  seniorRect.setAttribute("fill", "#f5f5f5");
  seniorRect.setAttribute("stroke", "#ccc");
  seniorRect.setAttribute("stroke-width", "1");
  
  const seniorText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  seniorText.setAttribute("x", "12");
  seniorText.setAttribute("y", "14");
  seniorText.setAttribute("font-family", "Arial, sans-serif");
  seniorText.setAttribute("font-size", "8");
  seniorText.setAttribute("font-weight", "bold");
  seniorText.setAttribute("fill", "#333");
  seniorText.setAttribute("text-anchor", "middle");
  seniorText.textContent = "A+";
  
  seniorIcon.appendChild(seniorRect);
  seniorIcon.appendChild(seniorText);
  
  // Eco theme icon
  const ecoIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ecoIcon.setAttribute("width", "24");
  ecoIcon.setAttribute("height", "24");
  ecoIcon.setAttribute("viewBox", "0 0 24 24");
  
  const ecoRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  ecoRect.setAttribute("x", "2");
  ecoRect.setAttribute("y", "2");
  ecoRect.setAttribute("width", "20");
  ecoRect.setAttribute("height", "20");
  ecoRect.setAttribute("rx", "4");
  ecoRect.setAttribute("fill", "#e8f5e9");
  
  const ecoLeaf = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ecoLeaf.setAttribute("d", "M17,8 C16,6 14,5 12,5 C10,5 8,6 7,8 C7,12 10,15 12,17 C14,15 17,12 17,8 Z");
  ecoLeaf.setAttribute("fill", "#4CAF50");
  
  ecoIcon.appendChild(ecoRect);
  ecoIcon.appendChild(ecoLeaf);
  
  // Ride theme icon
  const rideIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  rideIcon.setAttribute("width", "24");
  rideIcon.setAttribute("height", "24");
  rideIcon.setAttribute("viewBox", "0 0 24 24");
  
  const rideRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rideRect.setAttribute("x", "2");
  rideRect.setAttribute("y", "2");
  rideRect.setAttribute("width", "20");
  rideRect.setAttribute("height", "20");
  rideRect.setAttribute("rx", "4");
  rideRect.setAttribute("fill", "#ffecb3");
  
  const rideBike = document.createElementNS("http://www.w3.org/2000/svg", "path");
  rideBike.setAttribute("d", "M16,6 L13,6 L13,8 L14.5,8 L12,12 L9.5,8 L11,8 L11,6 L8,6 L8,8 L9,8 L12,13 L12,18 L14,18 L14,13 L17,8 L18,8 L18,6 L16,6 Z");
  rideBike.setAttribute("fill", "#FF6B35");
  
  rideIcon.appendChild(rideRect);
  rideIcon.appendChild(rideBike);
  
  return {
    standard: standardIcon,
    dark: darkIcon,
    senior: seniorIcon,
    eco: ecoIcon,
    ride: rideIcon
  };
};

// Create language flag icons
const createLanguageFlags = () => {
  // French flag
  const frenchFlag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  frenchFlag.setAttribute("width", "20");
  frenchFlag.setAttribute("height", "15");
  frenchFlag.setAttribute("viewBox", "0 0 20 15");
  
  const frenchBlue = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frenchBlue.setAttribute("x", "0");
  frenchBlue.setAttribute("y", "0");
  frenchBlue.setAttribute("width", "6.67");
  frenchBlue.setAttribute("height", "15");
  frenchBlue.setAttribute("fill", "#0055A4");
  
  const frenchWhite = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frenchWhite.setAttribute("x", "6.67");
  frenchWhite.setAttribute("y", "0");
  frenchWhite.setAttribute("width", "6.67");
  frenchWhite.setAttribute("height", "15");
  frenchWhite.setAttribute("fill", "#FFFFFF");
  
  const frenchRed = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frenchRed.setAttribute("x", "13.33");
  frenchRed.setAttribute("y", "0");
  frenchRed.setAttribute("width", "6.67");
  frenchRed.setAttribute("height", "15");
  frenchRed.setAttribute("fill", "#EF4135");
  
  frenchFlag.appendChild(frenchBlue);
  frenchFlag.appendChild(frenchWhite);
  frenchFlag.appendChild(frenchRed);
  
  // English flag
  const englishFlag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  englishFlag.setAttribute("width", "20");
  englishFlag.setAttribute("height", "15");
  englishFlag.setAttribute("viewBox", "0 0 20 15");
  
  const ukBackground = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  ukBackground.setAttribute("x", "0");
  ukBackground.setAttribute("y", "0");
  ukBackground.setAttribute("width", "20");
  ukBackground.setAttribute("height", "15");
  ukBackground.setAttribute("fill", "#012169");
  
  const ukCross1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ukCross1.setAttribute("d", "M0,0 L20,15 M20,0 L0,15");
  ukCross1.setAttribute("stroke", "#FFFFFF");
  ukCross1.setAttribute("stroke-width", "3");
  
  const ukCross2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ukCross2.setAttribute("d", "M0,0 L20,15 M20,0 L0,15");
  ukCross2.setAttribute("stroke", "#C8102E");
  ukCross2.setAttribute("stroke-width", "1");
  
  const ukCross3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ukCross3.setAttribute("d", "M10,0 L10,15 M0,7.5 L20,7.5");
  ukCross3.setAttribute("stroke", "#FFFFFF");
  ukCross3.setAttribute("stroke-width", "5");
  
  const ukCross4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ukCross4.setAttribute("d", "M10,0 L10,15 M0,7.5 L20,7.5");
  ukCross4.setAttribute("stroke", "#C8102E");
  ukCross4.setAttribute("stroke-width", "3");
  
  englishFlag.appendChild(ukBackground);
  englishFlag.appendChild(ukCross1);
  englishFlag.appendChild(ukCross2);
  englishFlag.appendChild(ukCross3);
  englishFlag.appendChild(ukCross4);
  
  // German flag
  const germanFlag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  germanFlag.setAttribute("width", "20");
  germanFlag.setAttribute("height", "15");
  germanFlag.setAttribute("viewBox", "0 0 20 15");
  
  const germanBlack = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  germanBlack.setAttribute("x", "0");
  germanBlack.setAttribute("y", "0");
  germanBlack.setAttribute("width", "20");
  germanBlack.setAttribute("height", "5");
  germanBlack.setAttribute("fill", "#000000");
  
  const germanRed = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  germanRed.setAttribute("x", "0");
  germanRed.setAttribute("y", "5");
  germanRed.setAttribute("width", "20");
  germanRed.setAttribute("height", "5");
  germanRed.setAttribute("fill", "#DD0000");
  
  const germanYellow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  germanYellow.setAttribute("x", "0");
  germanYellow.setAttribute("y", "10");
  germanYellow.setAttribute("width", "20");
  germanYellow.setAttribute("height", "5");
  germanYellow.setAttribute("fill", "#FFCE00");
  
  germanFlag.appendChild(germanBlack);
  germanFlag.appendChild(germanRed);
  germanFlag.appendChild(germanYellow);
  
  return {
    fr: frenchFlag,
    en: englishFlag,
    de: germanFlag
  };
};

// Create col images
const createColImages = () => {
  // Create canvas elements for each col
  const cols = [
    { name: "Col de la Schlucht", color: "#4CAF50" },
    { name: "Grand Ballon", color: "#F44336" },
    { name: "Col du Donon", color: "#2196F3" },
    { name: "Col de Grosse Pierre", color: "#FF9800" }
  ];
  
  const colImages = {};
  
  cols.forEach(col => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 400, 300);
    
    // Mountain silhouette
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(150, 100);
    ctx.lineTo(300, 250);
    ctx.lineTo(400, 150);
    ctx.lineTo(400, 300);
    ctx.closePath();
    ctx.fillStyle = col.color;
    ctx.fill();
    
    // Col name
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(col.name, 200, 150);
    
    // Add elevation
    ctx.font = '16px Arial';
    ctx.fillText('Altitude: 1135m', 200, 180);
    
    colImages[col.name.toLowerCase().replace(/\s+/g, '-')] = canvas.toDataURL();
  });
  
  return colImages;
};

// Create banner image
const createBanner = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, '#1F497D');
  gradient.addColorStop(1, '#3A6EA5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 400);
  
  // Mountain silhouette
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(300, 200);
  ctx.lineTo(600, 300);
  ctx.lineTo(900, 150);
  ctx.lineTo(1200, 250);
  ctx.lineTo(1200, 400);
  ctx.closePath();
  ctx.fillStyle = '#3A6EA5';
  ctx.fill();
  
  // Sun
  ctx.beginPath();
  ctx.arc(900, 100, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B35';
  ctx.fill();
  
  // Title
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Grand Est Cyclisme', 600, 200);
  
  // Subtitle
  ctx.font = '24px Arial';
  ctx.fillText('Explorez les plus beaux cols de la région', 600, 250);
  
  return canvas.toDataURL();
};

// Function to inject all visual elements into the page
const injectVisualElements = () => {
  // Create logo and add to header
  const logo = createLogo();
  const logoContainer = document.querySelector('.logo-container');
  if (logoContainer) {
    logoContainer.innerHTML = '';
    logoContainer.appendChild(logo);
  }
  
  // Create favicon and add to head
  const favicon = createFavicon();
  let faviconLink = document.querySelector('link[rel="icon"]');
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = favicon;
  
  // Create feature icons and add to feature sections
  const featureIcons = createFeatureIcons();
  const featureIconContainers = document.querySelectorAll('.feature-icon');
  featureIconContainers.forEach((container, index) => {
    if (index === 0 && container.classList.contains('mountain')) {
      container.innerHTML = '';
      container.appendChild(featureIcons.mountain);
    } else if (index === 1 && container.classList.contains('weather')) {
      container.innerHTML = '';
      container.appendChild(featureIcons.weather);
    } else if (index === 2 && container.classList.contains('training')) {
      container.innerHTML = '';
      container.appendChild(featureIcons.training);
    } else if (index === 3 && container.classList.contains('community')) {
      container.innerHTML = '';
      container.appendChild(featureIcons.community);
    }
  });
  
  // Create weather icons and add to weather section
  const weatherIcons = createWeatherIcons();
  const weatherIconContainer = document.querySelector('.weather-icon');
  if (weatherIconContainer) {
    weatherIconContainer.innerHTML = '';
    weatherIconContainer.appendChild(weatherIcons.sunny);
  }
  
  // Create social icons and add to footer
  const socialIcons = createSocialIcons();
  const socialLinks = document.querySelectorAll('.social-links a');
  socialLinks.forEach((link, index) => {
    if (index === 0) {
      link.innerHTML = '';
      link.appendChild(socialIcons.facebook);
    } else if (index === 1) {
      link.innerHTML = '';
      link.appendChild(socialIcons.twitter);
    } else if (index === 2) {
      link.innerHTML = '';
      link.appendChild(socialIcons.instagram);
    } else if (index === 3) {
      link.innerHTML = '';
      link.appendChild(socialIcons.youtube);
    } else if (index === 4) {
      link.innerHTML = '';
      link.appendChild(socialIcons.strava);
    }
  });
  
  // Create theme icons and add to theme selector
  const themeIcons = createThemeIcons();
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach((option, index) => {
    if (index === 0 && option.classList.contains('standard')) {
      option.innerHTML = '';
      option.appendChild(themeIcons.standard);
    } else if (index === 1 && option.classList.contains('dark')) {
      option.innerHTML = '';
      option.appendChild(themeIcons.dark);
    } else if (index === 2 && option.classList.contains('senior')) {
      option.innerHTML = '';
      option.appendChild(themeIcons.senior);
    } else if (index === 3 && option.classList.contains('eco')) {
      option.innerHTML = '';
      option.appendChild(themeIcons.eco);
    } else if (index === 4 && option.classList.contains('ride')) {
      option.innerHTML = '';
      option.appendChild(themeIcons.ride);
    }
  });
  
  // Create language flags and add to language selector
  const languageFlags = createLanguageFlags();
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach((option, index) => {
    const flagContainer = option.querySelector('.language-flag');
    if (flagContainer) {
      if (index === 0 && option.classList.contains('fr')) {
        flagContainer.innerHTML = '';
        flagContainer.appendChild(languageFlags.fr);
      } else if (index === 1 && option.classList.contains('en')) {
        flagContainer.innerHTML = '';
        flagContainer.appendChild(languageFlags.en);
      } else if (index === 2 && option.classList.contains('de')) {
        flagContainer.innerHTML = '';
        flagContainer.appendChild(languageFlags.de);
      }
    }
  });
  
  // Create col images and add to col cards
  const colImages = createColImages();
  const colImageContainers = document.querySelectorAll('.col-image');
  colImageContainers.forEach((container, index) => {
    const colKeys = Object.keys(colImages);
    if (index < colKeys.length) {
      container.style.backgroundImage = `url(${colImages[colKeys[index]]})`;
    }
  });
  
  // Create banner and add to hero section
  const banner = createBanner();
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    heroSection.style.backgroundImage = `url(${banner})`;
    heroSection.style.backgroundSize = 'cover';
    heroSection.style.backgroundPosition = 'center';
  }
};

// Call the function when the DOM is loaded
document.addEventListener('DOMContentLoaded', injectVisualElements);

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createLogo,
    createFeatureIcons,
    createWeatherIcons,
    createFavicon,
    createSocialIcons,
    createThemeIcons,
    createLanguageFlags,
    createColImages,
    createBanner,
    injectVisualElements
  };
}
