function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  clock.textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();