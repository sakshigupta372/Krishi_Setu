# ⚡ Code Quick Reference - At a Glance

## 📊 What You Need to Change

### 1. WiFi Credentials (Lines 9-10)
```cpp
const char* WIFI_SSID = "YourActualWiFiName";      // ← CHANGE
const char* WIFI_PASS = "YourActualPassword";      // ← CHANGE
```

### 2. Your Computer's IP (Lines 12-15)
```bash
# Get IP: Open CMD and type: ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.50)
```
```cpp
const char* API_URL = "http://192.168.1.50:5000/api/sensor-data";          // ← CHANGE IP
const char* REGISTER_URL = "http://192.168.1.50:5000/api/devices/register"; // ← CHANGE IP
const char* POLL_URL = "http://192.168.1.50:5000/api/irrigation/poll/";     // ← CHANGE IP
const char* COMPLETE_URL = "http://192.168.1.50:5000/api/irrigation/complete"; // ← CHANGE IP
```

### 3. (Optional) Calibrate Soil Sensor (Lines 25-26)
```cpp
int SOIL_DRY = 3300;  // ← Update after testing in air
int SOIL_WET = 1200;  // ← Update after testing in water
```

---

## 🔌 Hardware Connections

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
```

---

## ⏱️ Timing Summary

| Action | Interval | What Happens |
|--------|----------|--------------|
| **Soil Reading** | Every 30s | Reads sensor, sends to backend |
| **Command Check** | Every 10s | Asks backend for irrigation commands |
| **WiFi Check** | Every loop | Reconnects if disconnected |
| **Irrigation** | On demand | Runs pump for specified minutes |

---

## 📊 Data Flow

### Outgoing (ESP32 → Backend):
```
Every 30s: POST /api/sensor-data
{
  "device_id": "sensor-001",
  "temperature": 25.0,        // Dummy
  "humidity": 60.0,           // Dummy
  "soil_moisture": 55         // REAL
}
```

### Incoming (Backend → ESP32):
```
Every 10s: GET /api/irrigation/poll/sensor-001

Response if command pending:
{
  "id": 123,
  "device_id": "sensor-001",
  "duration_minutes": 10,
  "status": "pending"
}

Response if no command:
{}
```

### Completion Report (ESP32 → Backend):
```
After irrigation: POST /api/irrigation/complete
{
  "device_id": "sensor-001",
  "command_id": 123,
  "water_used_liters": 50.0
}
```

---

## 🎯 Function Summary

| Function | Purpose | When Called |
|----------|---------|-------------|
| `setup()` | Initialize everything | Once at startup |
| `loop()` | Main control | Forever |
| `connectWiFi()` | Connect to WiFi | Startup + reconnects |
| `registerDevice()` | Tell backend "I exist" | Once at startup |
| `checkIrrigationCommand()` | Check for commands | Every 10s |
| `startIrrigation()` | Run pump | When command received |
| `reportCompletion()` | Log water usage | After irrigation |

---

## 🔧 Key Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `SOIL_PIN = 34` | const int | GPIO for soil sensor |
| `RELAY_PIN = 5` | const int | GPIO for relay |
| `SOIL_DRY` | int | Calibration (dry reading) |
| `SOIL_WET` | int | Calibration (wet reading) |
| `lastPost` | unsigned long | Track last data send |
| `lastPoll` | unsigned long | Track last command check |

---

## 📈 Soil Sensor Math

```
Raw Reading → Percentage Conversion

analogRead(34) → Returns 0-4095
map(raw, DRY, WET, 0, 100) → Returns 0-100%

Example:
  DRY = 3300 (sensor in air)
  WET = 1200 (sensor in water)
  raw = 2250 (actual reading)
  
  Calculation:
  (2250 - 3300) / (1200 - 3300) * 100
  = -1050 / -2100 * 100
  = 0.5 * 100
  = 50%
```

---

## 🚿 Relay Control

```cpp
digitalWrite(RELAY_PIN, HIGH);  // Pump ON  (3.3V)
digitalWrite(RELAY_PIN, LOW);   // Pump OFF (0V)
```

**Physical Process:**
- HIGH → Relay energizes → COM connects to NO → Pump runs
- LOW → Relay off → COM disconnects from NO → Pump stops

---

## 📺 Serial Monitor Codes

| Code | Meaning |
|------|---------|
| **201** | Success! (Created/Updated) |
| **200** | OK (GET request success) |
| **400** | Bad Request (Check JSON) |
| **500** | Server Error (Backend issue) |
| **0** | No response (WiFi/network problem) |

---

## ⚙️ Typical Serial Output

```
--- Krishi Setu Sensor Node ---        ← Startup
Device ID: sensor-001                  ← Identity
Relay initialized (Pump OFF)          ← Safety
.......                                ← WiFi connecting
WiFi connected: 192.168.1.101         ← Success + IP
Device registration => 201             ← Backend knows us

Soil Raw: 2450 | Soil %: 55           ← Every 30s
[sensor-001] Soil:55% => 201          ← Data sent

🚨 Irrigation command received!        ← Command detected
Command ID: 123 | Duration: 10 minutes ← Details
💧 Starting irrigation...              ← Starting pump
✅ Pump ON                             ← Relay activated
⏱️  Running... 10s                     ← Progress updates
⏱️  Running... 20s
...
🛑 Pump OFF                            ← Relay deactivated
✅ Irrigation completed!               ← Finished
📊 Completion reported => 201          ← Backend updated
```

---

## 🐛 Troubleshooting Quick Guide

| Problem | Serial Shows | Solution |
|---------|--------------|----------|
| **WiFi fails** | "WiFi connection failed!" | Check SSID/password, use 2.4GHz |
| **Backend unreachable** | "=> 0" or "=> -1" | Check IP address, backend running? |
| **Wrong readings** | Soil always 0% or 100% | Calibrate sensor (update DRY/WET) |
| **No COM port** | Can't upload | Install CH340 driver, try new cable |
| **Pump won't run** | Command received but pump OFF | Check relay wiring, verify GPIO 5 |

---

## 🎯 Success Indicators

### ✅ Everything Working:
- Serial shows "201" after data posts
- Dashboard shows device Active 🟢
- Soil percentage looks reasonable (0-100%)
- Clicking "Start Irrigation" → Serial shows command
- Pump runs when commanded
- Completion reported "=> 201"

### ❌ Something Wrong:
- "=> 0" repeatedly → Backend not reachable
- WiFi keeps disconnecting → Signal too weak
- Soil always same value → Sensor not connected
- No command received → Backend not sending or wrong device ID

---

## 📐 Pin Reference Quick

```
ESP32 Pinout:
┌────────────────┐
│   3.3V  ───────┼─── Soil VCC
│   GPIO34 ──────┼─── Soil OUT (Analog)
│   GND    ──────┼─── Soil GND
│                │
│   VIN    ──────┼─── Relay VCC (5V)
│   GPIO5  ──────┼─── Relay IN (Control)
│   GND    ──────┼─── Relay GND
└────────────────┘
```

---

## 🔄 State Machine

```
STATE: IDLE
├─ Every 30s → Read soil → Send data
├─ Every 10s → Check commands
│
└─ Command received?
   └─ YES → STATE: IRRIGATING
              ├─ Pump ON
              ├─ Wait duration
              ├─ Pump OFF
              ├─ Report completion
              └─ Return to IDLE
```

---

## 💾 Memory Usage

- **WiFi.h** → ~30KB
- **HTTPClient.h** → ~20KB
- **Your code** → ~5KB
- **Total** → ~55KB (ESP32 has 320KB, plenty of room!)

---

## ⚡ Power Consumption

- **ESP32 active** → ~160mA
- **Relay active** → ~70mA
- **Soil sensor** → ~30mA
- **Total** → ~260mA @ 5V = 1.3W

**Note:** Pump power is separate (12V/5V depending on your pump)

---

**Quick reference complete! For detailed explanations, see Part 1 & Part 2! 📚**
