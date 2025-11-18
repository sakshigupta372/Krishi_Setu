const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

const inMemoryStore = [];
let pool = null;
let mode = 'memory';

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
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        soil_moisture INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp)`);
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
  const base = new Date();
  for (let i = 0; i < 48; i++) {
    const dt = new Date(base.getTime() - (48 - i) * 30 * 60 * 1000);
    const t = 24 + Math.sin(i / 6) * 2 + Math.random() * 1.5;
    const h = 55 + Math.cos(i / 7) * 5 + Math.random() * 3;
    const s = 40 - Math.floor(i / 12) + Math.round(Math.random() * 2);
    inMemoryStore.push({
      id: i + 1,
      temperature: Number(t.toFixed(2)),
      humidity: Number(h.toFixed(2)),
      soil_moisture: Math.max(20, Math.min(70, s)),
      timestamp: dt,
    });
  }
}

function validatePayload(body) {
  const errors = [];
  const temp = Number(body.temperature);
  const hum = Number(body.humidity);
  const soil = Number(body.soil_moisture);
  if (!Number.isFinite(temp)) errors.push('temperature must be a number');
  if (!Number.isFinite(hum)) errors.push('humidity must be a number');
  if (!Number.isInteger(soil)) errors.push('soil_moisture must be an integer');
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    values: { temperature: temp, humidity: hum, soil_moisture: soil },
  };
}

function rowToResponse(row) {
  return {
    id: row.id,
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
        `INSERT INTO sensor_data (temperature, humidity, soil_moisture) VALUES ($1, $2, $3)
         RETURNING id, temperature, humidity, soil_moisture, timestamp`,
        [values.temperature, values.humidity, values.soil_moisture]
      );
      return res.status(201).json({ success: true, data: rowToResponse(result.rows[0]) });
    } else {
      const obj = {
        id: inMemoryStore.length ? inMemoryStore[inMemoryStore.length - 1].id + 1 : 1,
        temperature: values.temperature,
        humidity: values.humidity,
        soil_moisture: values.soil_moisture,
        timestamp: new Date(),
      };
      inMemoryStore.push(obj);
      return res.status(201).json({ success: true, data: rowToResponse(obj) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'internal_error' });
  }
});

app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT id, temperature, humidity, soil_moisture, timestamp
         FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
      );
      if (!result.rows.length) return res.status(404).json({ error: 'no_data' });
      return res.json(rowToResponse(result.rows[0]));
    } else {
      if (!inMemoryStore.length) return res.status(404).json({ error: 'no_data' });
      return res.json(rowToResponse(inMemoryStore[inMemoryStore.length - 1]));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/sensor-data/history', async (req, res) => {
  const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 720);
  try {
    if (mode === 'postgres') {
      const result = await pool.query(
        `SELECT id, temperature, humidity, soil_moisture, timestamp
         FROM sensor_data
         WHERE timestamp >= NOW() - (INTERVAL '1 hour' * $1)
         ORDER BY timestamp ASC`,
        [hours]
      );
      return res.json({ count: result.rows.length, data: result.rows.map(rowToResponse) });
    } else {
      const cutoff = Date.now() - hours * 3600 * 1000;
      const data = inMemoryStore.filter((r) => r.timestamp.getTime() >= cutoff).map(rowToResponse);
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

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
