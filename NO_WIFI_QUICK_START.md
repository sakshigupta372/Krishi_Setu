# ⚡ No-WiFi Quick Start - 5 Minutes to Real Data!

## 🎯 What You'll Do

Connect ESP32 via USB cable (no WiFi) and see real sensor data in dashboard!

---

## 📋 Prerequisites (One-Time Setup)

### Install Python:
```bash
# Check if installed:
python --version

# If not: Download from https://python.org/downloads/
# Install with "Add Python to PATH" checked
```

### Install Python Packages:
```bash
pip install pyserial requests
```

---

## 🚀 5-MINUTE SETUP

### STEP 1: Upload No-WiFi Code (2 min)
1. Open Arduino IDE
2. Open: `hardware/esp32_no_wifi.ino`
3. Tools → Board → **ESP32 Dev Module**
4. Tools → Port → **COM3** (or available)
5. Click **Upload** (→)
6. Wait for "Done uploading"

### STEP 2: Start Servers (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard
npm start
```

### STEP 3: Run Bridge Script (1 min)

**Terminal 3 - Serial Bridge:**
```bash
python serial_bridge.py
```
- Select your COM port (e.g., 1)
- Should start showing data every 5 seconds

### STEP 4: Open Dashboard (1 min)
```
http://localhost:3001
```
- See **sensor-001** Active 🟢
- Real soil data updating every 5 seconds!

---

## 🎮 QUICK TESTS

### Test Sensor:
1. Open **Arduino Serial Monitor** (Ctrl+Shift+M)
2. Baud: **115200**
3. See data streaming

### Test Pump:
1. In Serial Monitor, type: `START:1`
2. Press **Send**
3. Pump runs for 1 minute
4. See progress messages

### Check Status:
1. Type: `STATUS`
2. Press **Send**
3. See current readings

---

## 📊 What You Should See

### Serial Monitor:
```
========================================
  Krishi Setu - NO WIFI TEST MODE
========================================
Device ID: sensor-001
✅ Relay initialized (Pump OFF)

DATA:{"device_id":"sensor-001","soil_moisture":55,...}
DATA:{"device_id":"sensor-001","soil_moisture":56,...}
DATA:{"device_id":"sensor-001","soil_moisture":54,...}
```

### Python Bridge:
```
✅ Connected to COM3 at 115200 baud
✅ Device registered: sensor-001 => 201
📊 Soil: 55% (raw: 2450) | Pump: idle | Backend: 201
📊 Soil: 56% (raw: 2420) | Pump: idle | Backend: 201
```

### Dashboard:
```
╔════════════════════════════════╗
║ 📡 Connected Sensors: 1/1     ║
║ ┌──────────────────────────┐  ║
║ │ 🟢 sensor-001            │  ║
║ │ Field A - North          │  ║
║ │ Updated 2s ago           │  ║
║ └──────────────────────────┘  ║
║                                ║
║ Soil Moisture: 55% ← REAL!    ║
║ Updates every 5 seconds        ║
╚════════════════════════════════╝
```

---

## ❌ Quick Fixes

### "No COM ports found"
→ Unplug ESP32, plug back in, try again

### "Backend is NOT running"
→ Terminal 1: `cd backend && npm start`

### Python errors
→ `pip install --upgrade pyserial requests`

### No dashboard data
→ Check all 3 terminals are running
→ Python script should show "Backend: 201"

---

## 📝 Serial Commands

```
START:10   → Run pump 10 minutes
START:1    → Run pump 1 minute (testing)
STOP       → Stop pump now
STATUS     → Show readings
HELP       → Show commands
```

---

## 🎯 Success Checklist

- [ ] Arduino: Shows "NO WIFI TEST MODE"
- [ ] Python: Shows "Backend: 201"
- [ ] Dashboard: Shows sensor Active 🟢
- [ ] Soil % updates every 5s
- [ ] START:1 runs pump

**All checked? 🎉 YOU'RE LIVE!**

---

## 🔄 Terminal Setup (Copy-Paste)

**PowerShell 1:**
```powershell
cd backend; npm start
```

**PowerShell 2:**
```powershell
cd dashboard; npm start
```

**PowerShell 3:**
```powershell
python serial_bridge.py
```

---

## 📞 Need Help?

**Check:**
1. ESP32 connected via USB
2. Soil sensor wired (VCC→3.3V, OUT→GPIO34, GND→GND)
3. Relay wired (VCC→VIN, IN→GPIO5, GND→GND)
4. All 3 terminals running
5. Dashboard open in browser

**Still stuck?** Share:
- Screenshot of Serial Monitor
- Screenshot of Python terminal
- Which step failed

---

**🌱 From hardware to dashboard in 5 minutes - NO WiFi needed! 🔌⚡**
