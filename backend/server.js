const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SerialHandler = require('./serialHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

const inMemoryStore = [];
const inMemoryDevices = [];
const inMemoryWaterUsage = [];
const inMemoryIrrigationCommands = [];
const inMemoryIrrigationHistory = [];
const inMemoryUsers = []; // Store for users
let pool = null;
let mode = 'memory';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize Serial Handler for ESP32 communication
let serialHandler = null;

// Callback when sensor data is received from ESP32
function onSensorDataReceived(data) {
  console.log('📊 Received sensor data:', data);
  
  // Store the data
  const sensorReading = {
    device_id: data.device_id || 'sensor-001',
    device_name: data.device_name || 'Field A - North',
    location: data.location || 'North Field',
    temperature: data.temperature || 25.0,
    humidity: data.humidity || 60.0,
    soil_moisture: data.soil_moisture || 0,
    timestamp: new Date()
  };
  
  // Add to in-memory store
  inMemoryStore.push(sensorReading);
  
  // Keep only last 1000 readings
  if (inMemoryStore.length > 1000) {
    inMemoryStore.shift();
  }
  
  // Update device status
  const deviceIndex = inMemoryDevices.findIndex(d => d.device_id === sensorReading.device_id);
  if (deviceIndex >= 0) {
    inMemoryDevices[deviceIndex].last_seen = new Date();
    inMemoryDevices[deviceIndex].status = 'active';
  } else {
    inMemoryDevices.push({
      device_id: sensorReading.device_id,
      device_name: sensorReading.device_name,
      location: sensorReading.location,
      status: 'active',
      last_seen: new Date(),
      created_at: new Date()
    });
  }
  
  // Store in database if available
  if (mode === 'postgres' && pool) {
    pool.query(
      'INSERT INTO sensor_data (device_id, temperature, humidity, soil_moisture, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [sensorReading.device_id, sensorReading.temperature, sensorReading.humidity, sensorReading.soil_moisture, sensorReading.timestamp]
    ).catch(err => console.error('Error storing sensor data in DB:', err.message));
  }
}

// Callback when irrigation is completed
function onIrrigationComplete(data) {
  console.log('✅ Irrigation completed:', data);
  
  const waterUsage = {
    device_id: data.device_id || 'sensor-001',
    amount_liters: data.water_used_liters || 0,
    duration_minutes: Math.round((data.duration_seconds || 0) / 60),
    timestamp: new Date()
  };
  
  // Add to in-memory store
  inMemoryWaterUsage.push(waterUsage);
  inMemoryIrrigationHistory.push({
    ...waterUsage,
    id: inMemoryIrrigationHistory.length + 1,
    status: 'completed'
  });
  
  // Store in database if available
  if (mode === 'postgres' && pool) {
    pool.query(
      'INSERT INTO water_usage (device_id, amount_liters, duration_minutes, timestamp) VALUES ($1, $2, $3, $4)',
      [waterUsage.device_id, waterUsage.amount_liters, waterUsage.duration_minutes, waterUsage.timestamp]
    ).catch(err => console.error('Error storing water usage in DB:', err.message));
  }
}

// Initialize serial connection
async function initSerial() {
  serialHandler = new SerialHandler(onSensorDataReceived, onIrrigationComplete);
  
  console.log('\n🔌 Initializing Serial Connection...\n');
  
  const connected = await serialHandler.connect();
  
  if (connected) {
    console.log('✅ Serial connection established!');
    console.log('📡 ESP32 is now sending real-time data!\n');
  } else {
    console.log('⚠️  Serial connection failed');
    console.log('   Using mock data mode for testing\n');
  }
}

async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;
  const pgConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'smartfarm',
        port: Number(process.env.PGPORT) || 5432,
      };
  try {
    pool = new Pool(pgConfig);
    await pool.query('SELECT 1');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) DEFAULT 'default',
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        soil_moisture INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_data_device ON sensor_data(device_id)`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id VARCHAR(50) PRIMARY KEY,
        device_name VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        status VARCHAR(20) DEFAULT 'active',
        last_seen TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS water_usage (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50),
        amount_liters DECIMAL(10,2),
        duration_minutes INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS irrigation_commands (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50),
        duration_minutes INTEGER DEFAULT 10,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        executed_at TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS irrigation_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50),
        duration_minutes INTEGER,
        water_used_liters DECIMAL(10,2),
        triggered_by VARCHAR(50) DEFAULT 'manual',
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    
    mode = 'postgres';
    console.log('DB connected: PostgreSQL');
  } catch (err) {
    pool = null;
    mode = 'memory';
    seedInMemory();
    console.log('DB unavailable, using in-memory store');
  }
}

function seedInMemory() {
  if (inMemoryStore.length) return;
  
  // Seed devices
  const devices = [
    { device_id: 'sensor-001', device_name: 'Field A - North', location: 'North Field', status: 'active', last_seen: new Date(), created_at: new Date() },
    { device_id: 'sensor-002', device_name: 'Field B - South', location: 'South Field', status: 'active', last_seen: new Date(Date.now() - 120000), created_at: new Date() },
    { device_id: 'sensor-003', device_name: 'Greenhouse 1', location: 'Greenhouse', status: 'inactive', last_seen: new Date(Date.now() - 3600000), created_at: new Date() },
  ];
  inMemoryDevices.push(...devices);
  
  // Seed sensor data
  const base = new Date();
  const deviceIds = ['sensor-001', 'sensor-002'];
  for (let i = 0; i < 48; i++) {
    const dt = new Date(base.getTime() - (48 - i) * 30 * 60 * 1000);
    const t = 24 + Math.sin(i / 6) * 2 + Math.random() * 1.5;
    const h = 55 + Math.cos(i / 7) * 5 + Math.random() * 3;
    const s = 40 - Math.floor(i / 12) + Math.round(Math.random() * 2);
    inMemoryStore.push({
      id: i + 1,
      device_id: deviceIds[i % 2],
      temperature: Number(t.toFixed(2)),
      humidity: Number(h.toFixed(2)),
      soil_moisture: Math.max(20, Math.min(70, s)),
      timestamp: dt,
    });
  }
  
  // Seed water usage
  for (let i = 0; i < 7; i++) {
    const dt = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    inMemoryWaterUsage.push({
      id: i + 1,
      device_id: 'sensor-001',
      amount_liters: 150 + Math.random() * 100,
      duration_minutes: 30 + Math.floor(Math.random() * 20),
      timestamp: dt,
    });
  }
}

function validatePayload(body) {
  const errors = [];
  const temp = Number(body.temperature);
  const hum = Number(body.humidity);
  const soil = Number(body.soil_moisture);
  const deviceId = body.device_id || 'default';
  if (!Number.isFinite(temp)) errors.push('temperature must be a number');
  if (!Number.isFinite(hum)) errors.push('humidity must be a number');
  if (!Number.isInteger(soil)) errors.push('soil_moisture must be an integer');
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    values: { temperature: temp, humidity: hum, soil_moisture: soil, device_id: deviceId },
  };
}

function rowToResponse(row) {
  return {
    id: row.id,
    device_id: row.device_id || 'default',
    temperature: Number(row.temperature).toFixed(2),
    humidity: Number(row.humidity).toFixed(2),
    soil_moisture: Number(row.soil_moisture),
    timestamp: new Date(row.timestamp).toISOString(),
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode });
});

app.post('/api/sensor-data', async (req, res) => {
  const { ok, errors, values } = validatePayload(req.body || {});
  if (!ok) return res.status(400).json({ success: false, errors });

  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `INSERT INTO sensor_data (device_id, temperature, humidity, soil_moisture) VALUES ($1, $2, $3, $4)
         RETURNING id, device_id, temperature, humidity, soil_moisture, timestamp`,
        [values.device_id, values.temperature, values.humidity, values.soil_moisture]
      );
      // Update device last_seen
      await pool.query(
        `INSERT INTO devices (device_id, device_name, last_seen) VALUES ($1, $1, NOW())
         ON CONFLICT (device_id) DO UPDATE SET last_seen = NOW(), status = 'active'`,
        [values.device_id]
      );
      return res.status(201).json({ success: true, data: rowToResponse(result.rows[0]) });
    } else {
      const obj = {
        id: inMemoryStore.length ? inMemoryStore[inMemoryStore.length - 1].id + 1 : 1,
        device_id: values.device_id,
        temperature: values.temperature,
        humidity: values.humidity,
        soil_moisture: values.soil_moisture,
        timestamp: new Date(),
      };
      inMemoryStore.push(obj);
      // Update device last_seen
      const device = inMemoryDevices.find(d => d.device_id === values.device_id);
      if (device) {
        device.last_seen = new Date();
        device.status = 'active';
      } else {
        inMemoryDevices.push({
          device_id: values.device_id,
          device_name: values.device_id,
          location: 'Unknown',
          status: 'active',
          last_seen: new Date(),
          created_at: new Date(),
        });
      }
      return res.status(201).json({ success: true, data: rowToResponse(obj) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'internal_error' });
  }
});

app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    const deviceId = req.query.device_id;
    if (mode === 'postgres') {
      const query = deviceId
        ? `SELECT id, device_id, temperature, humidity, soil_moisture, timestamp
           FROM sensor_data WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 1`
        : `SELECT id, device_id, temperature, humidity, soil_moisture, timestamp
           FROM sensor_data ORDER BY timestamp DESC LIMIT 1`;
      const params = deviceId ? [deviceId] : [];
      const result = await pool.query(query, params);
      if (!result.rows.length) return res.status(404).json({ error: 'no_data' });
      return res.json(rowToResponse(result.rows[0]));
    } else {
      if (!inMemoryStore.length) return res.status(404).json({ error: 'no_data' });
      const data = deviceId
        ? inMemoryStore.filter(r => r.device_id === deviceId)
        : inMemoryStore;
      if (!data.length) return res.status(404).json({ error: 'no_data' });
      return res.json(rowToResponse(data[data.length - 1]));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/sensor-data/history', async (req, res) => {
  const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 720);
  const deviceId = req.query.device_id;
  try {
    if (mode === 'postgres') {
      const query = deviceId
        ? `SELECT id, device_id, temperature, humidity, soil_moisture, timestamp
           FROM sensor_data
           WHERE timestamp >= NOW() - (INTERVAL '1 hour' * $1) AND device_id = $2
           ORDER BY timestamp ASC`
        : `SELECT id, device_id, temperature, humidity, soil_moisture, timestamp
           FROM sensor_data
           WHERE timestamp >= NOW() - (INTERVAL '1 hour' * $1)
           ORDER BY timestamp ASC`;
      const params = deviceId ? [hours, deviceId] : [hours];
      const result = await pool.query(query, params);
      return res.json({ count: result.rows.length, data: result.rows.map(rowToResponse) });
    } else {
      const cutoff = Date.now() - hours * 3600 * 1000;
      let filtered = inMemoryStore.filter((r) => r.timestamp.getTime() >= cutoff);
      if (deviceId) filtered = filtered.filter(r => r.device_id === deviceId);
      const data = filtered.map(rowToResponse);
      return res.json({ count: data.length, data });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/stats', async (req, res) => {
  const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 720);
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT 
            ROUND(AVG(temperature)::numeric, 2) AS avg_temp,
            ROUND(MIN(temperature)::numeric, 2) AS min_temp,
            ROUND(MAX(temperature)::numeric, 2) AS max_temp,
            ROUND(AVG(humidity)::numeric, 2) AS avg_humidity,
            ROUND(AVG(soil_moisture)::numeric, 2) AS avg_soil
         FROM sensor_data
         WHERE timestamp >= NOW() - (INTERVAL '1 hour' * $1)`,
        [hours]
      );
      const r = result.rows[0] || {};
      return res.json({
        avg_temp: r.avg_temp !== null ? Number(r.avg_temp).toFixed(2) : null,
        min_temp: r.min_temp !== null ? Number(r.min_temp).toFixed(2) : null,
        max_temp: r.max_temp !== null ? Number(r.max_temp).toFixed(2) : null,
        avg_humidity: r.avg_humidity !== null ? Number(r.avg_humidity).toFixed(2) : null,
        avg_soil: r.avg_soil !== null ? Number(r.avg_soil).toFixed(2) : null,
      });
    } else {
      const cutoff = Date.now() - hours * 3600 * 1000;
      const data = inMemoryStore.filter((r) => r.timestamp.getTime() >= cutoff);
      if (!data.length) return res.json({ avg_temp: null, min_temp: null, max_temp: null, avg_humidity: null, avg_soil: null });
      const temps = data.map((d) => d.temperature);
      const hums = data.map((d) => d.humidity);
      const soils = data.map((d) => d.soil_moisture);
      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const min = (arr) => Math.min(...arr);
      const max = (arr) => Math.max(...arr);
      return res.json({
        avg_temp: avg(temps).toFixed(2),
        min_temp: min(temps).toFixed(2),
        max_temp: max(temps).toFixed(2),
        avg_humidity: avg(hums).toFixed(2),
        avg_soil: avg(soils).toFixed(2),
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Device management endpoints
app.get('/api/devices', async (req, res) => {
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT device_id, device_name, location, status, last_seen, created_at
         FROM devices ORDER BY created_at DESC`
      );
      return res.json({ count: result.rows.length, devices: result.rows });
    } else {
      return res.json({ count: inMemoryDevices.length, devices: inMemoryDevices });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/api/devices/register', async (req, res) => {
  const { device_id, device_name, location } = req.body;
  if (!device_id || !device_name) {
    return res.status(400).json({ error: 'device_id and device_name required' });
  }
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `INSERT INTO devices (device_id, device_name, location)
         VALUES ($1, $2, $3)
         ON CONFLICT (device_id) DO UPDATE SET device_name = $2, location = $3
         RETURNING device_id, device_name, location, status, last_seen, created_at`,
        [device_id, device_name, location || 'Unknown']
      );
      return res.status(201).json({ success: true, device: result.rows[0] });
    } else {
      const existing = inMemoryDevices.find(d => d.device_id === device_id);
      if (existing) {
        existing.device_name = device_name;
        existing.location = location || existing.location;
        return res.json({ success: true, device: existing });
      }
      const device = {
        device_id,
        device_name,
        location: location || 'Unknown',
        status: 'active',
        last_seen: new Date(),
        created_at: new Date(),
      };
      inMemoryDevices.push(device);
      return res.status(201).json({ success: true, device });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Water usage endpoints
app.post('/api/water-usage', async (req, res) => {
  const { device_id, amount_liters, duration_minutes } = req.body;
  if (!device_id || !amount_liters) {
    return res.status(400).json({ error: 'device_id and amount_liters required' });
  }
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `INSERT INTO water_usage (device_id, amount_liters, duration_minutes)
         VALUES ($1, $2, $3)
         RETURNING id, device_id, amount_liters, duration_minutes, timestamp`,
        [device_id, amount_liters, duration_minutes || 0]
      );
      return res.status(201).json({ success: true, data: result.rows[0] });
    } else {
      const obj = {
        id: inMemoryWaterUsage.length + 1,
        device_id,
        amount_liters,
        duration_minutes: duration_minutes || 0,
        timestamp: new Date(),
      };
      inMemoryWaterUsage.push(obj);
      return res.status(201).json({ success: true, data: obj });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/water-usage/total', async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 365);
  const deviceId = req.query.device_id;
  try {
    if (mode === 'postgres') {
      const query = deviceId
        ? `SELECT COALESCE(SUM(amount_liters), 0) as total
           FROM water_usage
           WHERE timestamp >= NOW() - (INTERVAL '1 day' * $1) AND device_id = $2`
        : `SELECT COALESCE(SUM(amount_liters), 0) as total
           FROM water_usage
           WHERE timestamp >= NOW() - (INTERVAL '1 day' * $1)`;
      const params = deviceId ? [days, deviceId] : [days];
      const result = await pool.query(query, params);
      return res.json({ days, total_liters: Number(result.rows[0].total).toFixed(2) });
    } else {
      const cutoff = Date.now() - days * 24 * 3600 * 1000;
      let filtered = inMemoryWaterUsage.filter(r => r.timestamp.getTime() >= cutoff);
      if (deviceId) filtered = filtered.filter(r => r.device_id === deviceId);
      const total = filtered.reduce((sum, r) => sum + Number(r.amount_liters), 0);
      return res.json({ days, total_liters: total.toFixed(2) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// AI Crop Recommendations
app.get('/api/ai/crop-recommendation', async (req, res) => {
  try {
    // Get latest sensor data
    let latestData;
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT AVG(temperature) as temp, AVG(humidity) as hum, AVG(soil_moisture) as soil
         FROM sensor_data
         WHERE timestamp >= NOW() - INTERVAL '24 hours'`
      );
      latestData = result.rows[0];
    } else {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      const data = inMemoryStore.filter(r => r.timestamp.getTime() >= cutoff);
      if (data.length) {
        latestData = {
          temp: data.reduce((sum, d) => sum + d.temperature, 0) / data.length,
          hum: data.reduce((sum, d) => sum + d.humidity, 0) / data.length,
          soil: data.reduce((sum, d) => sum + d.soil_moisture, 0) / data.length,
        };
      }
    }
    
    if (!latestData || !latestData.temp) {
      return res.json({
        recommendations: [],
        message: 'Insufficient data for recommendations'
      });
    }
    
    const temp = Number(latestData.temp);
    const humidity = Number(latestData.hum);
    const soilMoisture = Number(latestData.soil);
    
    // Rule-based AI recommendations
    const recommendations = [];
    
    // Temperature-based crops
    if (temp >= 20 && temp <= 30) {
      if (soilMoisture >= 40 && soilMoisture <= 60) {
        recommendations.push({
          crop: 'Tomato',
          suitability: 'High',
          reason: 'Optimal temperature (20-30°C) and soil moisture (40-60%)',
          season: 'Summer/Monsoon',
          yield_potential: '25-30 tons/hectare'
        });
        recommendations.push({
          crop: 'Bell Pepper',
          suitability: 'High',
          reason: 'Ideal conditions for warm-season crop',
          season: 'Summer',
          yield_potential: '15-20 tons/hectare'
        });
      }
    }
    
    if (temp >= 15 && temp <= 25) {
      recommendations.push({
        crop: 'Wheat',
        suitability: 'Medium',
        reason: 'Suitable temperature range for cultivation',
        season: 'Winter (Rabi)',
        yield_potential: '3-4 tons/hectare'
      });
    }
    
    if (temp >= 25 && temp <= 35 && humidity >= 50) {
      recommendations.push({
        crop: 'Rice',
        suitability: 'High',
        reason: 'High temperature and humidity favorable',
        season: 'Monsoon (Kharif)',
        yield_potential: '4-5 tons/hectare'
      });
    }
    
    // Soil moisture based
    if (soilMoisture >= 30 && soilMoisture <= 50) {
      recommendations.push({
        crop: 'Potato',
        suitability: 'Medium',
        reason: 'Moderate soil moisture suitable',
        season: 'Winter',
        yield_potential: '20-25 tons/hectare'
      });
    }
    
    // Drought tolerant
    if (soilMoisture < 30) {
      recommendations.push({
        crop: 'Millet',
        suitability: 'High',
        reason: 'Drought-resistant, low water requirement',
        season: 'Summer/Monsoon',
        yield_potential: '1.5-2 tons/hectare'
      });
    }
    
    // Always include some staples
    recommendations.push({
      crop: 'Onion',
      suitability: 'Medium',
      reason: 'Versatile crop adaptable to various conditions',
      season: 'Year-round',
      yield_potential: '15-20 tons/hectare'
    });
    
    // Irrigation advice
    let irrigationAdvice = '';
    if (soilMoisture < 30) {
      irrigationAdvice = 'URGENT: Soil moisture low. Irrigate within 24 hours.';
    } else if (soilMoisture < 40) {
      irrigationAdvice = 'Moderate irrigation needed in 2-3 days.';
    } else if (soilMoisture >= 40 && soilMoisture <= 60) {
      irrigationAdvice = 'Optimal moisture level. Monitor daily.';
    } else {
      irrigationAdvice = 'Soil moisture high. Avoid overwatering.';
    }
    
    return res.json({
      recommendations: recommendations.slice(0, 5),
      current_conditions: {
        temperature: temp.toFixed(1),
        humidity: humidity.toFixed(1),
        soil_moisture: soilMoisture.toFixed(0)
      },
      irrigation_advice: irrigationAdvice,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Irrigation Control Endpoints
app.post('/api/irrigation/start', async (req, res) => {
  const { device_id, duration_minutes } = req.body;
  if (!device_id) {
    return res.status(400).json({ error: 'device_id required' });
  }
  const duration = duration_minutes || 10;
  
  try {
    // Send command directly to ESP32 via serial if connected
    if (serialHandler && serialHandler.getConnectionStatus().connected) {
      const success = serialHandler.startIrrigation(duration);
      
      if (success) {
        const command = {
          id: inMemoryIrrigationCommands.length + 1,
          device_id,
          duration_minutes: duration,
          status: 'running',
          created_at: new Date(),
          executed_at: new Date(),
        };
        inMemoryIrrigationCommands.push(command);
        
        console.log(`✅ Started irrigation: ${duration} minutes`);
        return res.status(201).json({ 
          success: true, 
          command,
          message: 'Irrigation started via serial connection'
        });
      } else {
        return res.status(500).json({ error: 'Failed to send command to ESP32' });
      }
    }
    
    // Fallback to database/memory mode (for WiFi mode)
    if (mode === 'postgres') {
      const result = await pool.query(
        `INSERT INTO irrigation_commands (device_id, duration_minutes, status)
         VALUES ($1, $2, 'pending')
         RETURNING id, device_id, duration_minutes, status, created_at`,
        [device_id, duration]
      );
      return res.status(201).json({ success: true, command: result.rows[0] });
    } else {
      const command = {
        id: inMemoryIrrigationCommands.length + 1,
        device_id,
        duration_minutes: duration,
        status: 'pending',
        created_at: new Date(),
        executed_at: null,
      };
      inMemoryIrrigationCommands.push(command);
      return res.status(201).json({ success: true, command });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/irrigation/status/:device_id', async (req, res) => {
  const { device_id } = req.params;
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT id, device_id, duration_minutes, status, created_at, executed_at
         FROM irrigation_commands
         WHERE device_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [device_id]
      );
      if (result.rows.length === 0) {
        return res.json({ status: 'idle', command: null });
      }
      const cmd = result.rows[0];
      return res.json({ status: cmd.status, command: cmd });
    } else {
      const commands = inMemoryIrrigationCommands.filter(c => c.device_id === device_id);
      if (commands.length === 0) {
        return res.json({ status: 'idle', command: null });
      }
      const cmd = commands[commands.length - 1];
      return res.json({ status: cmd.status, command: cmd });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ESP32 polls this endpoint to check for pending commands
app.get('/api/irrigation/poll/:device_id', async (req, res) => {
  const { device_id } = req.params;
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT id, device_id, duration_minutes, status
         FROM irrigation_commands
         WHERE device_id = $1 AND status = 'pending'
         ORDER BY created_at ASC
         LIMIT 1`,
        [device_id]
      );
      if (result.rows.length === 0) {
        return res.json({ command: null });
      }
      // Mark as executing
      await pool.query(
        `UPDATE irrigation_commands SET status = 'executing', executed_at = NOW()
         WHERE id = $1`,
        [result.rows[0].id]
      );
      return res.json({ command: result.rows[0] });
    } else {
      const pending = inMemoryIrrigationCommands.find(
        c => c.device_id === device_id && c.status === 'pending'
      );
      if (!pending) {
        return res.json({ command: null });
      }
      pending.status = 'executing';
      pending.executed_at = new Date();
      return res.json({ command: pending });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ESP32 calls this when irrigation is complete
app.post('/api/irrigation/complete', async (req, res) => {
  const { device_id, command_id, water_used_liters } = req.body;
  if (!device_id || !command_id) {
    return res.status(400).json({ error: 'device_id and command_id required' });
  }
  
  try {
    if (mode === 'postgres') {
      // Update command status
      await pool.query(
        `UPDATE irrigation_commands SET status = 'completed' WHERE id = $1`,
        [command_id]
      );
      // Get command details
      const cmd = await pool.query(
        `SELECT duration_minutes FROM irrigation_commands WHERE id = $1`,
        [command_id]
      );
      // Log to history
      await pool.query(
        `INSERT INTO irrigation_history (device_id, duration_minutes, water_used_liters, triggered_by)
         VALUES ($1, $2, $3, 'manual')`,
        [device_id, cmd.rows[0].duration_minutes, water_used_liters || 0]
      );
      // Also log to water_usage
      if (water_used_liters) {
        await pool.query(
          `INSERT INTO water_usage (device_id, amount_liters, duration_minutes)
           VALUES ($1, $2, $3)`,
          [device_id, water_used_liters, cmd.rows[0].duration_minutes]
        );
      }
      return res.json({ success: true });
    } else {
      const command = inMemoryIrrigationCommands.find(c => c.id === command_id);
      if (command) {
        command.status = 'completed';
        // Log to history
        inMemoryIrrigationHistory.push({
          id: inMemoryIrrigationHistory.length + 1,
          device_id,
          duration_minutes: command.duration_minutes,
          water_used_liters: water_used_liters || 0,
          triggered_by: 'manual',
          timestamp: new Date(),
        });
        // Log to water usage
        if (water_used_liters) {
          inMemoryWaterUsage.push({
            id: inMemoryWaterUsage.length + 1,
            device_id,
            amount_liters: water_used_liters,
            duration_minutes: command.duration_minutes,
            timestamp: new Date(),
          });
        }
      }
      return res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/irrigation/history', async (req, res) => {
  const device_id = req.query.device_id;
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  
  try {
    if (mode === 'postgres') {
      const query = device_id
        ? `SELECT * FROM irrigation_history WHERE device_id = $1 ORDER BY timestamp DESC LIMIT $2`
        : `SELECT * FROM irrigation_history ORDER BY timestamp DESC LIMIT $1`;
      const params = device_id ? [device_id, limit] : [limit];
      const result = await pool.query(query, params);
      return res.json({ count: result.rows.length, history: result.rows });
    } else {
      let history = device_id
        ? inMemoryIrrigationHistory.filter(h => h.device_id === device_id)
        : inMemoryIrrigationHistory;
      history = history.slice(-limit).reverse();
      return res.json({ count: history.length, history });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, farmSize, location, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = inMemoryUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now(),
      name,
      email,
      phone: phone || '',
      farmSize: farmSize || '',
      location: location || '',
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    inMemoryUsers.push(user);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = inMemoryUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = inMemoryUsers.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

initDb().then(async () => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:3000`);
    console.log(`💾 Mode: ${mode}\n`);
  });
  
  // Initialize serial connection after server starts
  await initSerial();
});
