export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getTime() {
  return new Date().toLocaleTimeString("ar-EG", { hour12: false });
}