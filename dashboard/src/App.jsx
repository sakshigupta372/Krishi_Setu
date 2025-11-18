import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = '/api';

function useDashboardData() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJson = async (url) => {
    const res = await fetch(url);
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    return { ok: res.ok, data };
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, h, s] = await Promise.all([
        fetchJson(`${API_BASE}/sensor-data/latest`),
        fetchJson(`${API_BASE}/sensor-data/history?hours=24`),
        fetchJson(`${API_BASE}/stats?hours=24`),
      ]);
      setLatest(l.ok && l.data && l.data.timestamp ? l.data : null);
      setHistory(Array.isArray(h.data?.data) ? h.data.data : []);
      setStats(s.data || null);
    } catch (e) {
      setError('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, []);

  return { latest, history, stats, loading, error, refresh: fetchAll };
}

function formatTimeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Header({ onRefresh, loading }) {
  return (
    <div className="header">
      <h1>🌱 Krishi Setu</h1>
      <button className="btn" onClick={onRefresh} disabled={loading}>
        🔄 Refresh
      </button>
    </div>
  );
}

function Cards({ latest }) {
  if (!latest) return null;
  const when = new Date(latest.timestamp).toLocaleString();
  return (
    <div className="grid grid-3">
      <div className="card">
        <div className="card-title">🌡️ Temperature</div>
        <div className="card-value">{latest.temperature}°C</div>
        <div className="card-sub">{when}</div>
      </div>
      <div className="card">
        <div className="card-title">💧 Humidity</div>
        <div className="card-value">{latest.humidity}%</div>
        <div className="card-sub">{when}</div>
      </div>
      <div className="card">
        <div className="card-title">🌿 Soil Moisture</div>
        <div className="card-value">{latest.soil_moisture}%</div>
        <div className="card-sub">{when}</div>
      </div>
    </div>
  );
}

function StatsPanel({ stats }) {
  if (!stats) return null;
  return (
    <div className="panel">
      <div className="panel-title">📊 24-Hour Statistics</div>
      <div className="stats">
        <div>
          <div>Avg Temp: {stats.avg_temp ?? '-'}°C</div>
          <div>Min/Max: {stats.min_temp ?? '-'}°C / {stats.max_temp ?? '-'}°C</div>
        </div>
        <div>
          <div>Avg Humidity: {stats.avg_humidity ?? '-'}%</div>
          <div>Avg Soil: {stats.avg_soil ?? '-'}%</div>
        </div>
      </div>
    </div>
  );
}

function TempHumidityChart({ data }) {
  if (!data?.length) return null;
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: formatTimeLabel(d.timestamp),
        temperature: Number(d.temperature),
        humidity: Number(d.humidity),
      })),
    [data]
  );
  return (
    <div className="panel">
      <div className="panel-title">📈 Temperature & Humidity (Last 24 Hours)</div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={24} />
            <YAxis yAxisId="left" label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: '%', angle: -90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" dot={false} name="Temperature" />
            <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#3b82f6" dot={false} name="Humidity" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SoilChart({ data }) {
  if (!data?.length) return null;
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: formatTimeLabel(d.timestamp),
        soil_moisture: Number(d.soil_moisture),
      })),
    [data]
  );
  return (
    <div className="panel">
      <div className="panel-title">💧 Soil Moisture (Last 24 Hours)</div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={24} />
            <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="soil_moisture" stroke="#10b981" dot={false} name="Soil Moisture" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Alerts({ latest }) {
  if (!latest) return null;
  const soil = Number(latest.soil_moisture);
  const temp = Number(latest.temperature);
  const hum = Number(latest.humidity);

  let status = '🟢 Normal: All conditions good';
  let cls = 'alert green';
  if (soil < 30) {
    status = '🚨 Low Soil Moisture! Watering needed.';
    cls = 'alert red';
  } else if (temp > 35) {
    status = '🟠 High Temperature! Provide shade.';
    cls = 'alert orange';
  } else if (hum > 80) {
    status = '🟡 High Humidity! Disease risk.';
    cls = 'alert yellow';
  }

  return (
    <div className={cls}>
      <div className="panel-title">⚠️ Alerts</div>
      <div>{status}</div>
    </div>
  );
}

export default function App() {
  const { latest, history, stats, loading, error, refresh } = useDashboardData();
  return (
    <div className="container">
      <Header onRefresh={refresh} loading={loading} />
      {error && <div className="alert red">{error}</div>}
      <Cards latest={latest} />
      <StatsPanel stats={stats} />
      <TempHumidityChart data={history} />
      <SoilChart data={history} />
      <Alerts latest={latest} />
    </div>
  );
}
