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
  const [devices, setDevices] = useState([]);
  const [waterUsage, setWaterUsage] = useState(null);
  const [cropRecommendations, setCropRecommendations] = useState(null);
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
      const [l, h, s, d, w, c] = await Promise.all([
        fetchJson(`${API_BASE}/sensor-data/latest`),
        fetchJson(`${API_BASE}/sensor-data/history?hours=24`),
        fetchJson(`${API_BASE}/stats?hours=24`),
        fetchJson(`${API_BASE}/devices`),
        fetchJson(`${API_BASE}/water-usage/total?days=7`),
        fetchJson(`${API_BASE}/ai/crop-recommendation`),
      ]);
      setLatest(l.ok && l.data && l.data.timestamp ? l.data : null);
      setHistory(Array.isArray(h.data?.data) ? h.data.data : []);
      setStats(s.data || null);
      setDevices(Array.isArray(d.data?.devices) ? d.data.devices : []);
      setWaterUsage(w.data || null);
      setCropRecommendations(c.data || null);
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

  return { latest, history, stats, devices, waterUsage, cropRecommendations, loading, error, refresh: fetchAll };
}

function formatTimeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Header({ onRefresh, loading, user, onLogout }) {
  return (
    <div className="header">
      <div className="header-left">
        <h1>🌱 Krishi Setu</h1>
        <span className="header-subtitle">Smart Farming Dashboard</span>
      </div>
      <div className="header-right">
        {user && (
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-name">{user.name}</span>
          </div>
        )}
        <button className="btn" onClick={onRefresh} disabled={loading}>
          🔄 Refresh
        </button>
        {onLogout && (
          <button className="btn btn-logout" onClick={onLogout}>
            🚪 Logout
          </button>
        )}
      </div>
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

function DevicePanel({ devices, onDeviceClick }) {
  const [irrigatingDevices, setIrrigatingDevices] = useState({});
  
  if (!devices || devices.length === 0) return null;
  
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const totalDevices = devices.length;
  
  const handleStartIrrigation = async (e, deviceId) => {
    e.stopPropagation();
    setIrrigatingDevices(prev => ({ ...prev, [deviceId]: true }));
    
    try {
      const response = await fetch(`${API_BASE}/irrigation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, duration_minutes: 10 })
      });
      
      if (response.ok) {
        alert(`Irrigation started for ${deviceId}! Duration: 10 minutes`);
      } else {
        alert('Failed to start irrigation');
      }
    } catch (error) {
      console.error('Irrigation error:', error);
      alert('Failed to start irrigation');
    } finally {
      setTimeout(() => {
        setIrrigatingDevices(prev => ({ ...prev, [deviceId]: false }));
      }, 2000);
    }
  };
  
  return (
    <div className="device-panel">
      <div className="panel-title">
        📡 Connected Sensors: {activeDevices}/{totalDevices}
      </div>
      <div className="device-grid">
        {devices.map(device => {
          const isActive = device.status === 'active';
          const lastSeen = new Date(device.last_seen);
          const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
          const isIrrigating = irrigatingDevices[device.device_id];
          
          return (
            <div 
              key={device.device_id}
              className={`device-card ${isActive ? 'active' : 'inactive'}`}
            >
              <div onClick={() => onDeviceClick(device)} style={{cursor: 'pointer'}}>
                <div className="device-header">
                  <div className="device-icon">
                    {isActive ? '🟢' : '🔴'}
                  </div>
                  <div className="device-status">
                    {isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="device-name">{device.device_name}</div>
                <div className="device-location">📍 {device.location}</div>
                <div className="device-last-seen">
                  {isActive ? `Updated ${minutesAgo}m ago` : 'Offline'}
                </div>
              </div>
              <button 
                className="irrigation-btn"
                onClick={(e) => handleStartIrrigation(e, device.device_id)}
                disabled={!isActive || isIrrigating}
              >
                {isIrrigating ? '⏳ Starting...' : '💧 Start Irrigation'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeviceModal({ device, onClose }) {
  const [deviceData, setDeviceData] = useState(null);
  const [irrigationHistory, setIrrigationHistory] = useState([]);
  const [irrigationStatus, setIrrigationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingIrrigation, setStartingIrrigation] = useState(false);
  
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const [latest, history, irrHistory, irrStatus] = await Promise.all([
          fetch(`${API_BASE}/sensor-data/latest?device_id=${device.device_id}`).then(r => r.json()),
          fetch(`${API_BASE}/sensor-data/history?device_id=${device.device_id}&hours=24`).then(r => r.json()),
          fetch(`${API_BASE}/irrigation/history?device_id=${device.device_id}&limit=5`).then(r => r.json()),
          fetch(`${API_BASE}/irrigation/status/${device.device_id}`).then(r => r.json()),
        ]);
        setDeviceData({ latest, history: history.data || [] });
        setIrrigationHistory(irrHistory.history || []);
        setIrrigationStatus(irrStatus);
      } catch (e) {
        console.error('Failed to fetch device data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceData();
  }, [device.device_id]);
  
  const handleStartIrrigation = async () => {
    setStartingIrrigation(true);
    try {
      const response = await fetch(`${API_BASE}/irrigation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: device.device_id, duration_minutes: 10 })
      });
      
      if (response.ok) {
        alert(`Irrigation started! Duration: 10 minutes`);
        // Refresh status
        const irrStatus = await fetch(`${API_BASE}/irrigation/status/${device.device_id}`).then(r => r.json());
        setIrrigationStatus(irrStatus);
      } else {
        alert('Failed to start irrigation');
      }
    } catch (error) {
      console.error('Irrigation error:', error);
      alert('Failed to start irrigation');
    } finally {
      setStartingIrrigation(false);
    }
  };
  
  if (!device) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{device.device_name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        {loading ? (
          <div className="modal-body">Loading device data...</div>
        ) : (
          <div className="modal-body">
            <div className="device-info">
              <div><strong>Device ID:</strong> {device.device_id}</div>
              <div><strong>Location:</strong> {device.location}</div>
              <div><strong>Status:</strong> <span className={device.status === 'active' ? 'status-active' : 'status-inactive'}>{device.status}</span></div>
              <div><strong>Last Seen:</strong> {new Date(device.last_seen).toLocaleString()}</div>
            </div>
            
            {deviceData?.latest && (
              <div className="device-readings">
                <h3>Latest Readings</h3>
                <div className="grid grid-3">
                  <div className="card small">
                    <div className="card-title">🌡️ Temperature</div>
                    <div className="card-value">{deviceData.latest.temperature}°C</div>
                  </div>
                  <div className="card small">
                    <div className="card-title">💧 Humidity</div>
                    <div className="card-value">{deviceData.latest.humidity}%</div>
                  </div>
                  <div className="card small">
                    <div className="card-title">🌿 Soil</div>
                    <div className="card-value">{deviceData.latest.soil_moisture}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {deviceData?.history?.length > 0 && (
              <div className="device-chart">
                <h3>24-Hour Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={deviceData.history.map(d => ({
                    time: formatTimeLabel(d.timestamp),
                    temperature: Number(d.temperature),
                    soil_moisture: Number(d.soil_moisture),
                  }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#ef4444" dot={false} />
                    <Line type="monotone" dataKey="soil_moisture" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="irrigation-control">
              <h3>Irrigation Control</h3>
              <div className="irrigation-status">
                <strong>Status:</strong> 
                <span className={`status-badge ${irrigationStatus?.status || 'idle'}`}>
                  {irrigationStatus?.status === 'pending' && '⏳ Pending'}
                  {irrigationStatus?.status === 'executing' && '💧 Running'}
                  {irrigationStatus?.status === 'completed' && '✅ Completed'}
                  {(!irrigationStatus?.status || irrigationStatus?.status === 'idle') && '⭕ Idle'}
                </span>
              </div>
              <button 
                className="btn irrigation-start-btn"
                onClick={handleStartIrrigation}
                disabled={startingIrrigation || irrigationStatus?.status === 'pending' || irrigationStatus?.status === 'executing'}
              >
                {startingIrrigation ? 'Starting...' : '💧 Start Manual Irrigation (10 min)'}
              </button>
            </div>
            
            {irrigationHistory.length > 0 && (
              <div className="irrigation-history-section">
                <h3>Recent Irrigation History</h3>
                <div className="irrigation-history-list">
                  {irrigationHistory.map((item, idx) => (
                    <div key={idx} className="irrigation-history-item">
                      <div className="irrigation-history-icon">💧</div>
                      <div className="irrigation-history-details">
                        <div><strong>{item.duration_minutes} minutes</strong></div>
                        <div className="irrigation-history-meta">
                          {item.water_used_liters > 0 && `${item.water_used_liters}L used • `}
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WaterUsageWidget({ waterUsage }) {
  if (!waterUsage) return null;
  
  return (
    <div className="water-widget">
      <div className="panel-title">💦 Water Usage (7 Days)</div>
      <div className="water-amount">{waterUsage.total_liters}L</div>
      <div className="water-sub">Total water consumed</div>
    </div>
  );
}

function CropRecommendations({ recommendations }) {
  if (!recommendations || !recommendations.recommendations?.length) {
    return (
      <div className="panel">
        <div className="panel-title">🌾 AI Crop Recommendations</div>
        <div className="recommendations-empty">
          {recommendations?.message || 'No recommendations available'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="panel">
      <div className="panel-title">🌾 AI Crop Recommendations</div>
      
      {recommendations.irrigation_advice && (
        <div className="irrigation-advice">
          <strong>💧 Irrigation Advice:</strong> {recommendations.irrigation_advice}
        </div>
      )}
      
      <div className="crop-list">
        {recommendations.recommendations.map((rec, idx) => (
          <div key={idx} className="crop-item">
            <div className="crop-header">
              <div className="crop-name">{rec.crop}</div>
              <div className={`crop-badge ${rec.suitability.toLowerCase()}`}>
                {rec.suitability}
              </div>
            </div>
            <div className="crop-details">
              <div><strong>Reason:</strong> {rec.reason}</div>
              <div><strong>Season:</strong> {rec.season}</div>
              <div><strong>Yield Potential:</strong> {rec.yield_potential}</div>
            </div>
          </div>
        ))}
      </div>
      
      {recommendations.current_conditions && (
        <div className="current-conditions">
          <strong>Current Conditions:</strong> {recommendations.current_conditions.temperature}°C, 
          {recommendations.current_conditions.humidity}% humidity, 
          {recommendations.current_conditions.soil_moisture}% soil moisture
        </div>
      )}
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

// Impact Metrics Component (inspired by AgriSense)
function ImpactMetrics({ devices, waterUsage }) {
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const waterSaved = waterUsage?.total_usage ? Math.round(waterUsage.total_usage * 0.4) : 0;
  
  return (
    <div className="impact-metrics">
      <div className="impact-card">
        <div className="impact-icon">📈</div>
        <div className="impact-content">
          <div className="impact-value">25-35%</div>
          <div className="impact-label">Yield Increase</div>
          <div className="impact-desc">Using AI recommendations</div>
        </div>
      </div>
      <div className="impact-card">
        <div className="impact-icon">💧</div>
        <div className="impact-content">
          <div className="impact-value">{waterSaved}L</div>
          <div className="impact-label">Water Saved</div>
          <div className="impact-desc">Smart irrigation optimization</div>
        </div>
      </div>
      <div className="impact-card">
        <div className="impact-icon">🎯</div>
        <div className="impact-content">
          <div className="impact-value">{activeDevices}/{devices.length}</div>
          <div className="impact-label">Active Sensors</div>
          <div className="impact-desc">Real-time monitoring</div>
        </div>
      </div>
      <div className="impact-card">
        <div className="impact-icon">💰</div>
        <div className="impact-content">
          <div className="impact-value">30-40%</div>
          <div className="impact-label">Cost Reduction</div>
          <div className="impact-desc">Resource optimization</div>
        </div>
      </div>
    </div>
  );
}

export default function App({ user, onLogout }) {
  const { latest, history, stats, devices, waterUsage, cropRecommendations, loading, error, refresh } = useDashboardData();
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  return (
    <div className="container">
      <Header onRefresh={refresh} loading={loading} user={user} onLogout={onLogout} />
      {error && <div className="alert red">{error}</div>}
      
      <ImpactMetrics devices={devices} waterUsage={waterUsage} />
      
      <DevicePanel devices={devices} onDeviceClick={setSelectedDevice} />
      
      <div className="grid grid-widgets">
        <Cards latest={latest} />
        <WaterUsageWidget waterUsage={waterUsage} />
      </div>
      
      <Alerts latest={latest} />
      <CropRecommendations recommendations={cropRecommendations} />
      <StatsPanel stats={stats} />
      <TempHumidityChart data={history} />
      <SoilChart data={history} />
      
      {selectedDevice && (
        <DeviceModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      )}
    </div>
  );
}
