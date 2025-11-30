import { useState, useEffect } from 'react';
import './IrrigationScheduler.css';

function IrrigationScheduler({ devices }) {
  const [schedules, setSchedules] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    device_id: '',
    type: 'recurring', // recurring, one-time, conditional
    days: [],
    time: '06:00',
    duration: 15,
    soilThreshold: 40,
    enabled: true
  });

  // Load schedules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('irrigation-schedules');
    if (saved) {
      setSchedules(JSON.parse(saved));
    } else {
      // Demo schedules
      setSchedules([
        {
          id: 1,
          name: 'Morning Watering',
          device_id: 'sensor-001',
          device_name: 'Field A - North',
          type: 'recurring',
          days: ['Mon', 'Wed', 'Fri'],
          time: '06:00',
          duration: 15,
          enabled: true,
          lastRun: null,
          nextRun: getNextRunTime(['Mon', 'Wed', 'Fri'], '06:00')
        },
        {
          id: 2,
          name: 'Evening Quick Water',
          device_id: 'sensor-001',
          device_name: 'Field A - North',
          type: 'recurring',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          time: '18:00',
          duration: 10,
          enabled: true,
          lastRun: null,
          nextRun: getNextRunTime(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], '18:00')
        },
        {
          id: 3,
          name: 'Soil-Based Auto Irrigation',
          device_id: 'sensor-001',
          device_name: 'Field A - North',
          type: 'conditional',
          soilThreshold: 35,
          duration: 20,
          enabled: true,
          lastRun: null,
          condition: 'When soil moisture < 35%'
        }
      ]);
    }
  }, []);

  // Save schedules to localStorage
  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem('irrigation-schedules', JSON.stringify(schedules));
    }
  }, [schedules]);

  function getNextRunTime(days, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3,
      'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    
    for (let i = 0; i < 8; i++) {
      const testDate = new Date(now);
      testDate.setDate(testDate.getDate() + i);
      testDate.setHours(hours, minutes, 0, 0);
      
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === testDate.getDay());
      
      if (days.includes(dayName) && testDate > now) {
        return testDate.toLocaleString();
      }
    }
    
    return 'Calculating...';
  }

  const handleAddSchedule = () => {
    if (!newSchedule.name || !newSchedule.device_id) {
      alert('Please fill in all required fields');
      return;
    }

    const device = devices.find(d => d.device_id === newSchedule.device_id);
    
    const schedule = {
      id: Date.now(),
      ...newSchedule,
      device_name: device?.device_name || 'Unknown Device',
      lastRun: null,
      nextRun: newSchedule.type === 'recurring' 
        ? getNextRunTime(newSchedule.days, newSchedule.time)
        : null,
      condition: newSchedule.type === 'conditional'
        ? `When soil moisture < ${newSchedule.soilThreshold}%`
        : null
    };

    setSchedules([...schedules, schedule]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      name: schedule.name,
      device_id: schedule.device_id,
      type: schedule.type,
      days: schedule.days || [],
      time: schedule.time || '06:00',
      duration: schedule.duration,
      soilThreshold: schedule.soilThreshold || 40,
      enabled: schedule.enabled
    });
    setShowAddModal(true);
  };

  const handleUpdateSchedule = () => {
    const device = devices.find(d => d.device_id === newSchedule.device_id);
    
    const updated = schedules.map(s => 
      s.id === editingSchedule.id 
        ? {
            ...s,
            ...newSchedule,
            device_name: device?.device_name || s.device_name,
            nextRun: newSchedule.type === 'recurring' 
              ? getNextRunTime(newSchedule.days, newSchedule.time)
              : s.nextRun,
            condition: newSchedule.type === 'conditional'
              ? `When soil moisture < ${newSchedule.soilThreshold}%`
              : null
          }
        : s
    );

    setSchedules(updated);
    setShowAddModal(false);
    setEditingSchedule(null);
    resetForm();
  };

  const handleDeleteSchedule = (id) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleToggleSchedule = (id) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const resetForm = () => {
    setNewSchedule({
      name: '',
      device_id: '',
      type: 'recurring',
      days: [],
      time: '06:00',
      duration: 15,
      soilThreshold: 40,
      enabled: true
    });
  };

  const toggleDay = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activeSchedules = schedules.filter(s => s.enabled).length;

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <div>
          <h2>🕐 Irrigation Scheduler</h2>
          <p>Automate your irrigation with smart scheduling</p>
        </div>
        <div className="scheduler-stats">
          <div className="stat-badge">
            <span className="badge-value">{activeSchedules}</span>
            <span className="badge-label">Active</span>
          </div>
          <div className="stat-badge">
            <span className="badge-value">{schedules.length}</span>
            <span className="badge-label">Total</span>
          </div>
        </div>
      </div>

      <button className="btn-add-schedule" onClick={() => setShowAddModal(true)}>
        <span className="btn-icon">➕</span>
        Add New Schedule
      </button>

      {/* Schedules List */}
      <div className="schedules-grid">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Schedules Yet</h3>
            <p>Create your first irrigation schedule to automate watering</p>
            <button className="btn-create" onClick={() => setShowAddModal(true)}>
              Create Schedule
            </button>
          </div>
        ) : (
          schedules.map(schedule => (
            <div 
              key={schedule.id} 
              className={`schedule-card ${!schedule.enabled ? 'disabled' : ''}`}
            >
              <div className="schedule-header">
                <div className="schedule-title">
                  <h3>{schedule.name}</h3>
                  <span className="device-tag">📍 {schedule.device_name}</span>
                </div>
                <div className="schedule-actions">
                  <button 
                    className={`toggle-btn ${schedule.enabled ? 'active' : ''}`}
                    onClick={() => handleToggleSchedule(schedule.id)}
                    title={schedule.enabled ? 'Disable' : 'Enable'}
                  >
                    {schedule.enabled ? '✓' : '○'}
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditSchedule(schedule)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="schedule-details">
                {schedule.type === 'recurring' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {schedule.days.join(', ')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">⏰</span>
                      <span className="detail-text">
                        {schedule.time} ({schedule.duration} min)
                      </span>
                    </div>
                    <div className="detail-row next-run">
                      <span className="detail-icon">🔜</span>
                      <span className="detail-text">
                        Next: {schedule.nextRun}
                      </span>
                    </div>
                  </>
                )}

                {schedule.type === 'conditional' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-icon">🎯</span>
                      <span className="detail-text">
                        {schedule.condition}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">⏱️</span>
                      <span className="detail-text">
                        Duration: {schedule.duration} min
                      </span>
                    </div>
                  </>
                )}

                {schedule.lastRun && (
                  <div className="detail-row last-run">
                    <span className="detail-icon">✅</span>
                    <span className="detail-text">
                      Last: {schedule.lastRun}
                    </span>
                  </div>
                )}
              </div>

              <div className="schedule-status">
                {schedule.enabled ? (
                  <span className="status-active">● Active</span>
                ) : (
                  <span className="status-paused">○ Paused</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingSchedule(null);
          resetForm();
        }}>
          <div className="modal-content scheduler-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSchedule ? '✏️ Edit Schedule' : '➕ New Schedule'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Schedule Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Watering"
                  value={newSchedule.name}
                  onChange={e => setNewSchedule({...newSchedule, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Select Device/Sensor *</label>
                <select
                  value={newSchedule.device_id}
                  onChange={e => setNewSchedule({...newSchedule, device_id: e.target.value})}
                >
                  <option value="">Choose a sensor...</option>
                  {devices.map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.device_name} - {device.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Schedule Type *</label>
                <div className="type-selector">
                  <button
                    className={`type-btn ${newSchedule.type === 'recurring' ? 'active' : ''}`}
                    onClick={() => setNewSchedule({...newSchedule, type: 'recurring'})}
                  >
                    <span className="type-icon">📅</span>
                    <span>Recurring</span>
                  </button>
                  <button
                    className={`type-btn ${newSchedule.type === 'conditional' ? 'active' : ''}`}
                    onClick={() => setNewSchedule({...newSchedule, type: 'conditional'})}
                  >
                    <span className="type-icon">🎯</span>
                    <span>Conditional</span>
                  </button>
                </div>
              </div>

              {newSchedule.type === 'recurring' && (
                <>
                  <div className="form-group">
                    <label>Select Days *</label>
                    <div className="days-selector">
                      {allDays.map(day => (
                        <button
                          key={day}
                          className={`day-btn ${newSchedule.days.includes(day) ? 'active' : ''}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={e => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                </>
              )}

              {newSchedule.type === 'conditional' && (
                <div className="form-group">
                  <label>Soil Moisture Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSchedule.soilThreshold}
                    onChange={e => setNewSchedule({...newSchedule, soilThreshold: parseInt(e.target.value)})}
                  />
                  <small>Water when soil moisture drops below this level</small>
                </div>
              )}

              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newSchedule.duration}
                  onChange={e => setNewSchedule({...newSchedule, duration: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save"
                  onClick={editingSchedule ? handleUpdateSchedule : handleAddSchedule}
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IrrigationScheduler;
