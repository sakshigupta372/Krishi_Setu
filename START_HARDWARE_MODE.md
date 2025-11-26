# ⚡ Quick Start - Hardware Mode

## 🚀 3-Step Quick Start

### Step 1: Upload ESP32 Code

```
1. Open Arduino IDE
2. Open: hardware/esp32_no_wifi/esp32_no_wifi.ino
3. Select: Tools → Board → ESP32 Dev Module
4. Select: Tools → Port → COM3 (your ESP32 port)
5. Click: Upload (→) button
6. Wait for "Done uploading"
```

### Step 2: Start Backend

```bash
cd backend
npm start
```

**Look for:**
```
✅ Serial port connected successfully!
📡 Listening for data from ESP32...
📊 Received sensor data: { device: sensor-001... }
```

### Step 3: Start Dashboard

```bash
# Open NEW terminal
cd dashboard
npm start
```

**Open browser:**
```
http://localhost:3000
```

---

## 🎯 What You'll See

### Backend Terminal:
```
📊 Received sensor data: { device: sensor-001, temp: 25, humidity: 60, soil: 45 }
📊 Received sensor data: { device: sensor-001, temp: 25.1, humidity: 59, soil: 46 }
```

### Dashboard:
- **Real-time sensor readings** updating every 5 seconds
- **Live charts** showing trends
- **Irrigation controls** that actually work!
- **Water usage tracking** from real pump operations

---

## 🔌 Wiring (Quick Reference)

```
ESP32 GPIO34 → Soil Sensor (Signal)
ESP32 3.3V   → Soil Sensor (VCC)
ESP32 GND    → Soil Sensor (GND)

ESP32 GPIO5  → Relay (IN)
ESP32 5V     → Relay (VCC)
ESP32 GND    → Relay (GND)
```

---

## ✅ Success Indicators

### ESP32 Serial Monitor (115200 baud):
```
✅ Relay initialized (Pump OFF)
📊 Starting sensor readings...
DATA:{"device_id":"sensor-001",...}
```

### Backend Console:
```
✅ Serial port connected successfully!
📊 Received sensor data: ...
```

### Dashboard:
```
Sensor cards updating with REAL values!
Charts moving!
"Connected" status green!
```

---

## ❌ Troubleshooting

### Backend says "Serial connection failed"?
→ Upload ESP32 code first!
→ Check COM port in Device Manager
→ Install USB drivers (CP210x or CH340)

### No data in dashboard?
→ Check backend terminal for sensor data
→ Backend must be running on :5000
→ Dashboard must be running on :3000

### Pump not working?
→ Check relay wiring
→ Relay needs separate 12V for pump
→ GPIO5 must be wired to Relay IN

---

## 🎮 Test Irrigation

1. Dashboard → Click sensor card
2. Modal opens
3. Irrigation Control section
4. Enter duration: `1` (minute)
5. Click "Start Irrigation"
6. Watch relay activate on ESP32!
7. Pump runs for 1 minute
8. Auto-stops
9. Dashboard shows water used!

---

## 📖 Full Guide

Read: `HARDWARE_SETUP_COMPLETE.md` for:
- Complete wiring diagrams
- Sensor calibration
- Multiple sensors setup
- Advanced features

---

**⚡ That's it! Connect hardware and start! 🚀**
