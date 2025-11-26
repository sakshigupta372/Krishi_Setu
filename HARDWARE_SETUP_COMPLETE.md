# 🔌 Complete Hardware Connection Guide

## ✅ System Ready for Real Hardware!

Your IoT Agricultural System is now **FULLY CONFIGURED** to receive **REAL SENSOR DATA** from ESP32! 🚀

---

## 📋 What's Been Set Up

### ✅ Hardware Code:
- ESP32 firmware (`esp32_no_wifi.ino`)
- Soil moisture sensor reading
- Relay control for pump
- Serial communication (115200 baud)

### ✅ Backend Integration:
- Serial port handler (`serialHandler.js`)
- Auto-detects ESP32 on USB
- Processes sensor data in real-time
- Controls irrigation via serial commands
- Stores data in memory/database

### ✅ Frontend Dashboard:
- Displays real-time sensor readings
- Shows irrigation controls
- Water usage tracking
- History & alerts

---

## 🔧 Hardware You Need

### Required Components:

1. **ESP32 Development Board**
   - Any ESP32 board (DevKit, NodeMCU, etc.)
   - USB cable

2. **Soil Moisture Sensor**
   - Capacitive or resistive type
   - Connected to GPIO34 (ADC1 channel)

3. **Relay Module** (Optional - for pump control)
   - 5V relay module
   - Connected to GPIO5

4. **Water Pump** (Optional)
   - 12V DC pump
   - Connected via relay

### Wiring Diagram:

```
ESP32                Soil Moisture Sensor
━━━━━                ━━━━━━━━━━━━━━━━━━
GPIO34 (ADC) ──────► Signal (Analog Out)
3.3V         ──────► VCC
GND          ──────► GND

ESP32                Relay Module
━━━━━                ━━━━━━━━━━
GPIO5        ──────► IN (Control)
5V           ──────► VCC
GND          ──────► GND

Relay Module         Water Pump
━━━━━━━━━━━         ━━━━━━━━━━
COM          ──────► 12V Power Supply (+)
NO           ──────► Pump (+)
                     Pump (-) ──► Power Supply (-)
```

---

## 📥 Step 1: Upload ESP32 Code

### A. Open Arduino IDE

1. Open `hardware/esp32_no_wifi/esp32_no_wifi.ino`
2. Select your ESP32 board:
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
3. Select COM port:
   - Tools → Port → COM3 (or your ESP32's port)
4. Upload the code:
   - Click Upload button (→)

### B. Verify Upload

Open Serial Monitor (115200 baud):
```
========================================
  Krishi Setu - NO WIFI TEST MODE
========================================
Device ID: sensor-001
Device Name: Field A - North
Location: North Field
========================================

✅ Relay initialized (Pump OFF)

📊 Starting sensor readings...
```

You should see:
```
DATA:{"device_id":"sensor-001","device_name":"Field A - North",...}
DATA:{"device_id":"sensor-001","device_name":"Field A - North",...}
```

---

## 🖥️ Step 2: Start Backend Server

### A. Navigate to Backend:
```bash
cd backend
```

### B. Start Server:
```bash
npm start
```

### C. Watch for Serial Connection:

You'll see:
```
🚀 Server running on http://localhost:5000
📊 Dashboard: http://localhost:3000
💾 Mode: memory

🔌 Initializing Serial Connection...

📡 Available Serial Ports:
1. COM3
   Manufacturer: Silicon Labs
   Product ID: ea60

✅ Found potential ESP32 on: COM3

🔌 Connecting to: COM3
✅ Serial port connected successfully!
📡 Listening for data from ESP32...

📊 Received sensor data: {
  device: sensor-001,
  temp: 25,
  humidity: 60,
  soil: 45
}
```

---

## 💻 Step 3: Start Frontend Dashboard

### A. Open New Terminal:
```bash
cd dashboard
```

### B. Start Dashboard:
```bash
npm start
```

### C. Open Browser:
```
http://localhost:3000
```

---

## 🎯 Step 4: See Real Data!

### What You'll See:

1. **Login Page** - Login with test credentials
2. **Dashboard** - Real-time sensor readings updating every 5 seconds!
3. **Sensor Cards** - Show LIVE data from your ESP32
4. **Charts** - Visualize sensor trends
5. **Irrigation Control** - Start/stop pump remotely!

### Real Data Flow:

```
ESP32 Sensor
    ↓
USB Serial (115200 baud)
    ↓
Backend (serialHandler.js)
    ↓
In-Memory Store
    ↓
REST API
    ↓
React Dashboard
    ↓
YOUR SCREEN! 🎉
```

---

## 🧪 Testing Without Hardware

If you don't have hardware yet:

### The backend will show:
```
⚠️  Serial connection failed
   Using mock data mode for testing
```

**No problem!** The system automatically falls back to generating test data so you can still:
- Test the dashboard
- Try irrigation controls
- View charts and history
- Test all features

---

## 🎮 Control Irrigation

### From Dashboard:

1. Click any sensor card
2. Modal opens with sensor details
3. Find "Irrigation Control" section
4. Enter duration (minutes)
5. Click "Start Irrigation"

### What Happens:

```
Dashboard → API → Backend → Serial → ESP32 → Relay → Pump ON!
```

The ESP32 will:
- Turn on relay (pump starts)
- Run for specified duration
- Turn off automatically
- Send completion data back
- Dashboard updates with water used!

---

## 📊 Calibrate Soil Sensor

### 1. Get Raw Readings:

Open Serial Monitor and check:
```
DATA:{..."soil_raw":3200,...}
```

### 2. Calibrate Dry Value:

- Let sensor dry completely
- Note the `soil_raw` value (e.g., 3300)

### 3. Calibrate Wet Value:

- Submerge sensor in water
- Note the `soil_raw` value (e.g., 1200)

### 4. Update ESP32 Code:

Open `esp32_no_wifi.ino` and update:
```cpp
int SOIL_DRY = 3300; // Your dry reading
int SOIL_WET = 1200; // Your wet reading
```

### 5. Re-upload Code

Now your soil moisture percentage will be accurate!

---

## 🔧 Troubleshooting

### ESP32 Not Detected?

**Check:**
1. USB cable connected?
2. Drivers installed? (CP210x or CH340)
3. Correct COM port in Device Manager?
4. Try different USB port

**Windows:**
```
Device Manager → Ports (COM & LPT) → Look for CH340 or CP210x
```

### No Serial Data?

**Check:**
1. Code uploaded successfully?
2. Serial Monitor shows DATA: messages?
3. Backend connected to correct port?
4. Baud rate = 115200?

### Sensor Reading 0% or 100%?

**Fix:**
1. Check wiring (VCC, GND, Signal)
2. Sensor needs calibration (see above)
3. Try different ADC pin if needed

### Pump Not Working?

**Check:**
1. Relay wiring correct?
2. Relay module has power?
3. Pump has separate 12V supply?
4. Relay LED lights up when command sent?

---

## 📡 Serial Commands

You can also test manually via Serial Monitor:

### Start Pump:
```
START:10
```
(Runs for 10 minutes)

### Stop Pump:
```
STOP
```

### Check Status:
```
STATUS
```

### Help:
```
HELP
```

---

## 🎯 Expected Output

### Backend Console:
```
📊 Received sensor data: { device: sensor-001, temp: 25, humidity: 60, soil: 45 }
📊 Received sensor data: { device: sensor-001, temp: 25.1, humidity: 59, soil: 46 }
📊 Received sensor data: { device: sensor-001, temp: 25.2, humidity: 61, soil: 44 }
...
```

### Dashboard:
```
┌─────────────────────────────────────┐
│  Sensor 1: Field A - North         │
│  🌡️ Temperature: 25.1°C            │
│  💧 Humidity: 59%                   │
│  🌱 Soil Moisture: 46%              │
│  Updated: Just now                  │
└─────────────────────────────────────┘
```

---

## ⚡ Performance

### Update Frequency:
- Sensor readings: **Every 5 seconds**
- Dashboard refresh: **Every 3 seconds** (auto-polling)
- Real-time updates without page refresh!

### Data Retention:
- In-Memory: Last 1000 readings
- Database: Unlimited (if PostgreSQL configured)

---

## 🌟 Advanced Features

### Multiple Sensors:

Edit ESP32 code to add more devices:
```cpp
const char* DEVICE_ID = "sensor-002";
const char* DEVICE_NAME = "Field B - South";
```

Upload to different ESP32s, connect all via USB hubs!

### Database Storage:

Configure `.env` file with PostgreSQL:
```
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=smartfarm
```

Data persists across restarts!

### Remote Access:

Deploy backend to cloud server, ESP32 can connect via WiFi (use `esp32_wifi.ino` instead)!

---

## 📦 Complete File Structure

```
IOT_based_agriculture/
├── hardware/
│   ├── esp32_no_wifi/
│   │   └── esp32_no_wifi.ino    ✅ (Upload this)
│   └── esp32_soil_only.ino
├── backend/
│   ├── server.js                 ✅ (Integrated serial)
│   ├── serialHandler.js          ✅ (New file)
│   └── package.json
├── dashboard/
│   └── src/
│       └── App.jsx               ✅ (Displays real data)
└── HARDWARE_SETUP_COMPLETE.md    ← You are here!
```

---

## ✅ Checklist

Before connecting hardware:

- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] USB drivers installed (CP210x/CH340)
- [ ] Hardware wired correctly
- [ ] Backend running (`npm start` in backend/)
- [ ] Dashboard running (`npm start` in dashboard/)

Connect hardware:

- [ ] ESP32 code uploaded
- [ ] ESP32 connected via USB
- [ ] Serial Monitor shows DATA messages
- [ ] Backend detects serial port
- [ ] Backend receives sensor data
- [ ] Dashboard shows real-time updates!

---

## 🎉 You're All Set!

Your complete IoT agricultural system is ready to:

✅ **Read real sensor data** from ESP32
✅ **Display live updates** on dashboard
✅ **Control irrigation** remotely
✅ **Track water usage** and history
✅ **Generate alerts** based on thresholds
✅ **Visualize trends** with charts
✅ **Store data** for analysis

---

## 📞 Need Help?

### Common Issues:

1. **"No serial port available"**
   - Install USB drivers
   - Check Device Manager
   - Try different USB port

2. **"Permission denied"**
   - Close Arduino Serial Monitor
   - Close other serial programs
   - Only one program can access COM port at a time

3. **"Module not found: serialport"**
   - Run: `npm install` in backend folder
   - Make sure `serialport` is in package.json

---

## 🚀 Next Steps

1. **Connect your hardware** following the wiring diagram
2. **Upload ESP32 code** via Arduino IDE
3. **Start backend** and watch for serial connection
4. **Open dashboard** and see REAL DATA flowing! 🎉

---

**🌾 Your Krishi Setu IoT system is ready for real hardware! 🚜**

**Plug in ESP32 and watch the magic happen! ✨**
