# 🔌 No WiFi Testing Guide - Direct USB Connection

## 🎯 Overview

Test your entire system using just a **USB cable** - No WiFi needed!

**How it works:**
```
ESP32 (USB) → Computer → Python Script → Backend → Dashboard
```

- ESP32 sends data over USB serial
- Python script reads serial data
- Script forwards data to backend
- Dashboard shows real-time readings!

---

## 📦 What You Need

### Hardware:
- ✅ ESP32 board
- ✅ Soil moisture sensor
- ✅ Relay module
- ✅ Water pump
- ✅ USB cable (ESP32 to computer)
- ✅ Jumper wires

### Software:
- ✅ Arduino IDE (for uploading code)
- ✅ Python 3.x (for serial bridge)
- ✅ Backend running (Node.js server)

---

## 🚀 STEP-BY-STEP SETUP

### ✅ STEP 1: Install Python (if not installed)

#### Check if Python is installed:
```bash
python --version
```

#### If not installed:
1. Download: https://www.python.org/downloads/
2. Download **Python 3.11** or newer
3. During installation: **Check "Add Python to PATH"**
4. Install with default settings

#### Install required packages:
```bash
pip install pyserial requests
```

---

### ✅ STEP 2: Hardware Wiring

**Same as WiFi version:**
```
SOIL SENSOR → ESP32:
  VCC  → 3.3V
  OUT  → GPIO 34
  GND  → GND

RELAY → ESP32:
  VCC  → VIN (5V)
  IN   → GPIO 5
  GND  → GND

PUMP → RELAY:
  Pump (+) → NO
  Pump (-) → Power (-)
  Relay COM → Power (-)

ESP32 → Computer:
  USB cable connected
```

---

### ✅ STEP 3: Upload NO-WIFI Code to ESP32

#### 3.1 Open Arduino IDE
1. Go to your project folder
2. Open: `hardware/esp32_no_wifi.ino`

#### 3.2 Configure Device (Optional)
```cpp
// Lines 5-7 (change if you want):
const char* DEVICE_ID   = "sensor-001";
const char* DEVICE_NAME = "Field A - North";
const char* LOCATION    = "North Field";

// Lines 14-15 (calibrate after testing):
int SOIL_DRY = 3300;  // Adjust after testing
int SOIL_WET = 1200;  // Adjust after testing
```

#### 3.3 Select Board and Port
- **Tools → Board** → ESP32 Dev Module
- **Tools → Port** → COM3 (or available port)

#### 3.4 Upload
- Click **Upload** button (→)
- Wait for "Done uploading"

#### 3.5 Test Serial Output
1. Open **Serial Monitor** (Ctrl+Shift+M)
2. Set baud rate: **115200**
3. Should see:
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

---

### ✅ STEP 4: Start Backend Server

#### Open Terminal 1:
```bash
cd backend
npm start
```

**Should see:**
```
Server running on http://localhost:5000
```

**Keep this terminal open!**

---

### ✅ STEP 5: Start Dashboard

#### Open Terminal 2:
```bash
cd dashboard
npm start
```

**Should see:**
```
Local:   http://localhost:3001
```

**Keep this terminal open!**

---

### ✅ STEP 6: Run Serial Bridge Script

#### Open Terminal 3 (PowerShell):
```bash
cd IOT_based_agriculture
python serial_bridge.py
```

#### What You'll See:
```
============================================================
  🌱 Krishi Setu - Serial Bridge (No WiFi Mode)
============================================================

🔍 Checking backend connection...
✅ Backend is running: http://localhost:5000

📡 Available COM Ports:
==================================================
1. COM3 - USB-SERIAL CH340 (COM3)
2. COM5 - Intel(R) Active Management Technology
==================================================

Select port (1-2): 1

✅ Connected to COM3 at 115200 baud

============================================================
  ✅ CONNECTED - Reading data from ESP32...
============================================================
Commands you can type:
  START:10  - Start pump for 10 minutes
  STOP      - Stop pump
  STATUS    - Get system status
  QUIT      - Exit this program
============================================================

✅ Device registered: sensor-001 => 201
📊 Soil: 55% (raw: 2450) | Pump: idle | Backend: 201
📊 Soil: 56% (raw: 2420) | Pump: idle | Backend: 201
📊 Soil: 54% (raw: 2480) | Pump: idle | Backend: 201
```

---

### ✅ STEP 7: Open Dashboard

1. Open browser: **http://localhost:3001**
2. You should see:
   - **sensor-001** Active 🟢
   - Real soil moisture percentage
   - Updates every 5 seconds (faster than WiFi mode!)

---

## 🎮 TESTING THE SYSTEM

### Test 1: Verify Sensor Readings

**In Dashboard:**
- See soil percentage updating every 5 seconds
- Click **sensor-001** card
- Modal opens with real-time data

**Test Sensor:**
1. Touch soil sensor with wet finger
2. Watch percentage increase
3. Remove finger
4. Watch percentage decrease

---

### Test 2: Test Pump Control

#### Method A: From Arduino Serial Monitor
1. Open **Arduino Serial Monitor** (separate from Python script)
2. Type: `START:1` (run pump for 1 minute)
3. Press **Send**
4. Watch:
```
💧========================================
  IRRIGATION STARTED
========================================
Duration: 1 minutes
✅ Pump ON
========================================

⏱️  Pump running... 55s remaining
⏱️  Pump running... 50s remaining
...
🛑========================================
  IRRIGATION STOPPED
========================================
Total time: 60 seconds
Water used: 5.0 liters
✅ Pump OFF
========================================
```

#### Method B: Check Dashboard
1. Data still updates during irrigation
2. Pump status shows in serial bridge
3. Completion is logged to backend

---

### Test 3: Check Backend Logging

#### View Devices:
```bash
# In browser or Postman:
http://localhost:5000/api/devices
```

**Should return:**
```json
[
  {
    "device_id": "sensor-001",
    "device_name": "Field A - North",
    "location": "North Field",
    "status": "active",
    "last_seen": "2025-11-25T10:35:20.000Z"
  }
]
```

#### View Recent Data:
```bash
http://localhost:5000/api/sensor-data
```

**Should show recent readings**

---

## 🎯 SERIAL COMMANDS (Type in Serial Monitor)

### Available Commands:

#### START Pump:
```
START:10    → Run pump for 10 minutes
START:5     → Run pump for 5 minutes
START:1     → Run pump for 1 minute (good for testing)
```

#### STOP Pump:
```
STOP        → Stop pump immediately
```

#### Check STATUS:
```
STATUS      → Show current readings and pump state
```

**Example STATUS output:**
```
📊========================================
  SYSTEM STATUS
========================================
Device ID: sensor-001
Device Name: Field A - North
Location: North Field
----------------------------------------
Soil Moisture: 55%
Soil Raw: 2450
Pump Status: IDLE
========================================
```

#### HELP:
```
HELP        → Show available commands
```

---

## 📊 DATA FLOW

### From ESP32 to Dashboard:

```
1. ESP32 reads soil sensor
   ↓
2. ESP32 sends JSON over USB serial
   DATA:{"device_id":"sensor-001","soil_moisture":55,...}
   ↓
3. Python script (serial_bridge.py) reads serial
   ↓
4. Python script POST to backend API
   ↓
5. Backend saves to database
   ↓
6. Dashboard fetches from backend
   ↓
7. You see real-time data! 🎉
```

---

## 🔧 TROUBLESHOOTING

### Problem 1: "No COM ports found"
**Solution:**
- Unplug ESP32 and plug back in
- Try different USB port
- Install CH340 driver
- Check Device Manager for unknown devices

### Problem 2: "Backend is NOT running"
**Solution:**
```bash
# Terminal 1:
cd backend
npm start

# Wait for: "Server running on http://localhost:5000"
```

### Problem 3: Python script errors
**Solution:**
```bash
# Install/reinstall packages:
pip install --upgrade pyserial requests
```

### Problem 4: Serial Monitor shows garbled text
**Solution:**
- Check baud rate is **115200** (both Arduino IDE and script)
- Close Arduino Serial Monitor when running Python script
- Only one program can read serial at a time

### Problem 5: Dashboard shows no data
**Solution:**
1. Check backend is running (Terminal 1)
2. Check Python script is running (Terminal 3)
3. Check Python script shows "Backend: 201"
4. Hard refresh dashboard (Ctrl+Shift+R)

---

## 💡 TESTING TIPS

### Quick Sensor Test:
```
1. Sensor in air → Should show low % (0-30%)
2. Touch with wet finger → Should increase to 60-80%
3. Put in water → Should show high % (90-100%)
```

### Quick Pump Test:
```
1. Serial Monitor: START:1
2. Listen for relay click
3. Pump should run for 1 minute
4. Check serial for "Pump ON" and "Pump OFF"
```

### Calibration Test:
```
1. Sensor in air → Note raw value
2. Update SOIL_DRY = <that value>
3. Sensor in water → Note raw value
4. Update SOIL_WET = <that value>
5. Re-upload code
6. Test again - should be accurate!
```

---

## 📈 ADVANTAGES OF NO-WIFI MODE

### ✅ Pros:
- **No WiFi setup** needed
- **Faster updates** (5 seconds vs 30 seconds)
- **Direct connection** (no network issues)
- **Easier debugging** (see everything in serial)
- **Perfect for testing** hardware before deployment
- **Works anywhere** (no router needed)

### ❌ Cons:
- **USB cable required** (can't place ESP32 far from computer)
- **Computer must be ON** (ESP32 depends on computer)
- **Python script must run** (extra step)
- **Not portable** (tethered to computer)

---

## 🔄 SWITCHING BACK TO WIFI MODE

### When ready for production:
1. Upload `esp32_soil_only.ino` (WiFi version)
2. Configure WiFi credentials
3. Update IP addresses
4. Upload to ESP32
5. Stop Python script
6. ESP32 works independently!

---

## 🎓 LEARNING FLOW

### Day 1: No-WiFi Testing
```
1. Wire hardware
2. Upload esp32_no_wifi.ino
3. Run Python bridge
4. Test readings
5. Test pump control
6. Understand system
```

### Day 2: WiFi Deployment
```
1. Upload esp32_soil_only.ino
2. Configure WiFi
3. Update IP address
4. Test wireless
5. Install in field
6. Monitor remotely
```

---

## 📋 COMPLETE TESTING CHECKLIST

### Hardware:
- [ ] Soil sensor wired correctly
- [ ] Relay wired correctly
- [ ] Pump connected to relay
- [ ] ESP32 connected via USB
- [ ] All connections secure

### Software:
- [ ] Python installed
- [ ] pyserial and requests installed
- [ ] Arduino IDE installed
- [ ] esp32_no_wifi.ino uploaded
- [ ] Backend running (port 5000)
- [ ] Dashboard running (port 3001)
- [ ] Python bridge running

### Testing:
- [ ] Serial Monitor shows data
- [ ] Python script shows "201" codes
- [ ] Dashboard shows sensor active
- [ ] Soil readings update (5s)
- [ ] Can send START command
- [ ] Pump runs when commanded
- [ ] Completion reported
- [ ] Backend logs data

---

## 🎉 SUCCESS INDICATORS

### You'll know it's working when:
1. ✅ Serial Monitor shows JSON data every 5 seconds
2. ✅ Python script shows "Backend: 201"
3. ✅ Dashboard shows sensor Active 🟢
4. ✅ Soil percentage updates in real-time
5. ✅ START command runs pump
6. ✅ STOP command stops pump
7. ✅ STATUS shows accurate readings

---

## 📞 QUICK REFERENCE

### Terminal Setup:
```
Terminal 1: cd backend && npm start
Terminal 2: cd dashboard && npm start
Terminal 3: python serial_bridge.py
```

### URLs:
- **Backend:** http://localhost:5000
- **Dashboard:** http://localhost:3001
- **API Test:** http://localhost:5000/api/devices

### Serial Commands:
- **START:X** - Run pump X minutes
- **STOP** - Stop pump
- **STATUS** - Check system
- **HELP** - Show commands

---

**🌱 Perfect for testing before WiFi deployment! 🔌✨**
