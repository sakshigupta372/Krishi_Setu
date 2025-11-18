const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/sensor-data';
const COUNT = Number(process.argv.find((a) => a.startsWith('--count='))?.split('=')[1] || 1);
const INTERVAL = Number(process.argv.find((a) => a.startsWith('--interval='))?.split('=')[1] || 2000);

function randomReading() {
  const temperature = Number((24 + Math.random() * 6).toFixed(2));
  const humidity = Number((50 + Math.random() * 20).toFixed(2));
  const soil_moisture = Math.floor(35 + Math.random() * 20);
  return { temperature, humidity, soil_moisture };
}

async function sendOnce() {
  const payload = randomReading();
  try {
    const { data } = await axios.post(API_URL, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log('Created:', data.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

(async () => {
  if (COUNT <= 1) {
    await sendOnce();
    return;
  }
  let sent = 0;
  const timer = setInterval(async () => {
    await sendOnce();
    sent++;
    if (sent >= COUNT) {
      clearInterval(timer);
    }
  }, INTERVAL);
})();
