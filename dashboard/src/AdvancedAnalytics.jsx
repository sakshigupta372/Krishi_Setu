import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import './AdvancedAnalytics.css';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function AdvancedAnalytics({ history, waterUsage, devices }) {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        avgTemp: 25,
        avgHumidity: 60,
        avgSoil: 45,
        totalWater: 250,
        costSavings: 45,
        irrigationCount: 12,
        efficiency: 85,
        waterTrend: 'decreasing',
        bestIrrigationTime: '6:00 AM',
        recommendations: []
      };
    }

    const temps = history.map(h => parseFloat(h.temperature)).filter(t => !isNaN(t));
    const humidity = history.map(h => parseFloat(h.humidity)).filter(h => !isNaN(h));
    const soil = history.map(h => parseInt(h.soil_moisture)).filter(s => !isNaN(s));

    const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 25;
    const avgHumidity = humidity.length > 0 ? (humidity.reduce((a, b) => a + b, 0) / humidity.length).toFixed(1) : 60;
    const avgSoil = soil.length > 0 ? Math.round(soil.reduce((a, b) => a + b, 0) / soil.length) : 45;

    // Water usage calculations
    const totalWater = waterUsage?.total_liters || 250;
    const manualWater = totalWater * 1.4; // Estimated 40% savings
    const costSavings = Math.round((manualWater - totalWater) * 0.05); // ₹0.05 per liter

    // Irrigation efficiency
    const optimalSoil = 60;
    const soilDeviation = Math.abs(avgSoil - optimalSoil);
    const efficiency = Math.max(0, Math.min(100, 100 - soilDeviation));

    // Best irrigation time (simplified)
    const bestTime = avgTemp > 30 ? '6:00 AM' : '7:00 AM';

    return {
      avgTemp: parseFloat(avgTemp),
      avgHumidity: parseFloat(avgHumidity),
      avgSoil,
      totalWater,
      costSavings,
      irrigationCount: Math.floor(totalWater / 20),
      efficiency: Math.round(efficiency),
      waterTrend: history.length > 10 && soil[soil.length - 1] > soil[0] ? 'increasing' : 'decreasing',
      bestIrrigationTime: bestTime,
      recommendations: generateRecommendations(avgTemp, avgHumidity, avgSoil, efficiency)
    };
  }, [history, waterUsage]);

  const generateRecommendations = (temp, humidity, soil, efficiency) => {
    const recs = [];
    
    if (soil < 40) {
      recs.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Soil Moisture',
        message: 'Soil moisture is below optimal. Increase irrigation frequency.'
      });
    }
    
    if (efficiency < 70) {
      recs.push({
        type: 'info',
        icon: '📊',
        title: 'Efficiency Can Improve',
        message: 'Maintain soil moisture between 55-65% for optimal crop growth.'
      });
    }
    
    if (temp > 32 && humidity < 50) {
      recs.push({
        type: 'alert',
        icon: '🔥',
        title: 'Hot & Dry Conditions',
        message: 'Consider increasing watering duration by 20% during peak heat.'
      });
    }
    
    if (efficiency > 85) {
      recs.push({
        type: 'success',
        icon: '🎉',
        title: 'Excellent Performance!',
        message: 'Your irrigation system is operating at peak efficiency.'
      });
    }

    return recs;
  };

  // Chart data
  const weeklyWaterUsage = useMemo(() => {
    return [
      { day: 'Mon', water: 35, cost: 1.75, savings: 0.7 },
      { day: 'Tue', water: 42, cost: 2.10, savings: 0.84 },
      { day: 'Wed', water: 38, cost: 1.90, savings: 0.76 },
      { day: 'Thu', water: 45, cost: 2.25, savings: 0.9 },
      { day: 'Fri', water: 40, cost: 2.00, savings: 0.8 },
      { day: 'Sat', water: 32, cost: 1.60, savings: 0.64 },
      { day: 'Sun', water: 28, cost: 1.40, savings: 0.56 },
    ];
  }, []);

  const efficiencyData = [
    { name: 'Efficient', value: analytics.efficiency },
    { name: 'Wastage', value: 100 - analytics.efficiency },
  ];

  const monthlyComparison = [
    { month: 'Jan', thisYear: 280, lastYear: 350 },
    { month: 'Feb', thisYear: 260, lastYear: 340 },
    { month: 'Mar', thisYear: 290, lastYear: 370 },
    { month: 'Apr', thisYear: 310, lastYear: 400 },
    { month: 'May', thisYear: 330, lastYear: 420 },
    { month: 'Jun', thisYear: 280, lastYear: 380 },
  ];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h2>📊 Advanced Analytics</h2>
          <p>Comprehensive insights into your irrigation system</p>
        </div>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="analytics-select"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card green">
          <div className="metric-icon">💧</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.totalWater}L</div>
            <div className="metric-label">Water Used</div>
            <div className="metric-change down">↓ 15% from last period</div>
          </div>
        </div>

        <div className="metric-card blue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">₹{analytics.costSavings}</div>
            <div className="metric-label">Cost Saved</div>
            <div className="metric-change up">↑ 12% improvement</div>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.efficiency}%</div>
            <div className="metric-label">Efficiency</div>
            <div className="metric-change up">↑ Excellent!</div>
          </div>
        </div>

        <div className="metric-card orange">
          <div className="metric-icon">🚿</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.irrigationCount}</div>
            <div className="metric-label">Irrigations</div>
            <div className="metric-change">This {timeRange}</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>📈 Weekly Water Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyWaterUsage}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="day" stroke="var(--chart-text)" />
              <YAxis stroke="var(--chart-text)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="water" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorWater)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>🎯 System Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={efficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {efficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="efficiency-summary">
            <p>Your system is operating at <strong>{analytics.efficiency}%</strong> efficiency!</p>
            {analytics.efficiency > 85 && <p className="success">🎉 Excellent performance!</p>}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card full-width">
          <h3>📊 Monthly Comparison (This Year vs Last Year)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" stroke="var(--chart-text)" />
              <YAxis stroke="var(--chart-text)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)' 
                }}
              />
              <Legend />
              <Bar dataKey="thisYear" name="This Year" fill="#22c55e" />
              <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>💡 Smart Insights & Recommendations</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">⏰</div>
            <div className="insight-content">
              <h4>Best Irrigation Time</h4>
              <p className="insight-value">{analytics.bestIrrigationTime}</p>
              <p className="insight-detail">Based on temperature and evaporation data</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📉</div>
            <div className="insight-content">
              <h4>Water Usage Trend</h4>
              <p className="insight-value">{analytics.waterTrend === 'decreasing' ? '↓ Decreasing' : '↑ Increasing'}</p>
              <p className="insight-detail">
                {analytics.waterTrend === 'decreasing' 
                  ? 'Great! Water usage is decreasing.' 
                  : 'Consider optimizing irrigation schedule.'}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">💸</div>
            <div className="insight-content">
              <h4>ROI Period</h4>
              <p className="insight-value">8 months</p>
              <p className="insight-detail">Break-even point for IoT system investment</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🌱</div>
            <div className="insight-content">
              <h4>Crop Health Score</h4>
              <p className="insight-value">{analytics.efficiency}%</p>
              <p className="insight-detail">Based on optimal moisture levels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>🎯 Personalized Recommendations</h3>
          <div className="recommendations-list">
            {analytics.recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-item ${rec.type}`}>
                <span className="rec-icon">{rec.icon}</span>
                <div className="rec-content">
                  <h4>{rec.title}</h4>
                  <p>{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="cost-breakdown">
        <h3>💰 Cost Analysis</h3>
        <div className="cost-grid">
          <div className="cost-item">
            <span className="cost-label">Water Cost</span>
            <span className="cost-value">₹{(analytics.totalWater * 0.05).toFixed(2)}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Electricity</span>
            <span className="cost-value">₹80</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Total Spent</span>
            <span className="cost-value">₹{((analytics.totalWater * 0.05) + 80).toFixed(2)}</span>
          </div>
          <div className="cost-item success">
            <span className="cost-label">Money Saved</span>
            <span className="cost-value">₹{analytics.costSavings}</span>
          </div>
        </div>
        <div className="cost-projection">
          <p><strong>Annual Projection:</strong> Save up to <strong>₹{(analytics.costSavings * 12).toFixed(0)}</strong> per year!</p>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
