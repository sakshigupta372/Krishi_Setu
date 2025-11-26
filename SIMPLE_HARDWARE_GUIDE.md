# 🌱 Simple Hardware Setup - Soil Sensor + Pump Control

## 📦 Your Hardware List
- ✅ ESP32 Development Board
- ✅ Soil Moisture Sensor
- ✅ Relay Module (1 channel)
- ✅ Water Pump (12V or 5V)
- ✅ Breadboard
- ✅ Jumper Wires (Male-to-Female)
- ✅ USB Cable (for ESP32)
- ✅ Power Supply (for pump - if 12V pump)

---

## 🔌 STEP 1: WIRING CONNECTIONS

### Complete Wiring Diagram:
```
                    ┌─────────────┐
                    │ Soil Sensor │
                    └──┬───┬───┬──┘
                       │   │   │
                      VCC OUT GND
                       │   │   │
        ┌──────────────┴───┴───┴────────────┐
        │              ESP32 Board           │
        │                                    │
        │  3.3V ────┬─── VCC (Soil)         │
        │  GPIO 34 ─┴─── OUT (Soil)         │
        │  GPIO 5  ──────── IN (Relay)      │
        │  GND ────────── GND (Soil+Relay)  │
        │  VIN ────────── VCC (Relay)       │
        └───────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    │  Relay   │
                    │  Module  │
                    └────┬─────┘
                         │
                  COM  NO  NC
                   │   │   
                   │   └──── + (Pump)
                   │
                   └──────── - (Pump)
                   
         Power ──────────── + (Pump via COM)
```

### Step-by-Step Wiring:

#### A) Soil Moisture Sensor → ESP32:
```
Soil Sensor          ESP32
───────────         ────────
VCC        →        3.3V
OUT        →        GPIO 34
GND        →        GND
```

#### B) Relay Module → ESP32:
```
Relay Module        ESP32
───────────         ────────
VCC        →        VIN (5V)
IN         →        GPIO 5
GND        →        GND
```

#### C) Water Pump → Relay:
```
Relay              Pump           Power
─────              ────           ─────
COM    →           -              
NO     →           +
                   
                   + ←──────── Power Supply +
COM ←────────────────────────── Power Supply -
```

---

## 💻 STEP 2: INSTALL ARDUINO IDE

### 2.1 Download Arduino IDE:
1. Go to: https://www.arduino.cc/en/software
2. Click **"Windows Win 10 and newer"**
3. Download the installer
4. Run `arduino-ide_xxx_Windows_64bit.exe`
5. Install with **default settings**
6. Open Arduino IDE

### 2.2 Add ESP32 Board Support:
1. In Arduino IDE, go to **File → Preferences**
2. Find **"Additional Board Manager URLs"** field
3. Paste this URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. In search box, type: **esp32**
7. Find **"esp32 by Espressif Systems"**
8. Click **Install** (wait 2-5 minutes)
9. Click **Close** when done

---

## 📝 STEP 3: CONFIGURE THE CODE

### 3.1 Open the Code File:
1. Go to your project folder:
   ```
   IOT_based_agriculture\hardware\
   ```
2. Open file: **`esp32_soil_only.ino`** in Arduino IDE

### 3.2 Update WiFi Settings (Lines 9-10):
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";     // ← Type your WiFi name here
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD"; // ← Type your WiFi password here
```

**Example:**
```cpp
const char* WIFI_SSID = "HomeWiFi";
const char* WIFI_PASS = "MyPassword123";
```

### 3.3 Get Your Computer's IP Address:

**Windows:**
1. Press **Windows + R**
2. Type: `cmd` and press **Enter**
3. Type: `ipconfig` and press **Enter**
4. Look for **"IPv4 Address"** under your WiFi adapter
5. Note down the IP (e.g., `192.168.1.50`)

### 3.4 Update API URLs (Lines 12-15):
```cpp
const char* API_URL = "http://192.168.1.50:5000/api/sensor-data";          // ← Your IP
const char* REGISTER_URL = "http://192.168.1.50:5000/api/devices/register"; // ← Your IP
const char* POLL_URL = "http://192.168.1.50:5000/api/irrigation/poll/";     // ← Your IP
const char* COMPLETE_URL = "http://192.168.1.50:5000/api/irrigation/complete"; // ← Your IP
```

**Replace `192.168.1.50` with YOUR IP address!**

### 3.5 Configure Device Name (Lines 5-7):
```cpp
const char* DEVICE_ID   = "sensor-001";      // ← Keep as is for first device
const char* DEVICE_NAME = "Field A - North"; // ← Change to your location
const char* LOCATION    = "North Field";     // ← Change to your field name
```

### 3.6 Save the File:
- Press **Ctrl + S**

---

## 📤 STEP 4: UPLOAD CODE TO ESP32

### 4.1 Connect ESP32:
1. Take your ESP32 board
2. Connect USB cable to ESP32
3. Connect other end to your computer
4. Wait for Windows to detect it (LED on ESP32 should light up)

### 4.2 Select Board Type:
1. Go to **Tools → Board → esp32**
2. Select: **ESP32 Dev Module**
   (If you have NodeMCU-32S, select that instead)

### 4.3 Select COM Port:
1. Go to **Tools → Port**
2. You'll see something like **COM3**, **COM4**, etc.
3. Select the one that appears (usually the highest number)

**If NO port appears:**
- Unplug USB and plug back in
- Try a different USB cable (some are power-only)
- Install CH340 driver (Google "CH340 driver download")

### 4.4 Configure Upload Settings:
Go to **Tools** menu and set:
```
Upload Speed:      115200
CPU Frequency:     240MHz
Flash Frequency:   80MHz
Flash Mode:        QIO
Flash Size:        4MB (32Mb)
Partition Scheme:  Default 4MB
```

### 4.5 Upload the Code:
1. Click the **Upload** button (→ arrow icon) in toolbar
2. Or press **Ctrl + U**
3. Watch the console at bottom:
   ```
   Connecting.......
   Writing at 0x00001000... (10%)
   Writing at 0x00002000... (20%)
   ...
   Leaving...
   Hard resetting via RTS pin...
   ```
4. Wait for **"Done uploading"** message

**If stuck at "Connecting...":**
- Hold down the **BOOT** button on ESP32
- Click Upload again
- Release BOOT button after upload starts

---

## 🔍 STEP 5: TEST AND VERIFY

### 5.1 Open Serial Monitor:
1. Click **Serial Monitor** icon (top-right, looks like magnifying glass)
2. Or go to **Tools → Serial Monitor**
3. Or press **Ctrl + Shift + M**
4. Set baud rate to **115200** (bottom-right dropdown)

### 5.2 What You Should See:
```
--- Krishi Setu Sensor Node ---
Device ID: sensor-001
Relay initialized (Pump OFF)
WiFi connected: 192.168.1.101
Device registration => 201
Soil Raw: 2450 | Soil %: 55
[sensor-001] Soil:55% => 201
```

### 5.3 Verify Each Line:

✅ **"WiFi connected"** → ESP32 connected to WiFi
✅ **"Device registration => 201"** → Registered with backend
✅ **"Relay initialized"** → Pump control ready
✅ **"Soil Raw: xxxx"** → Sensor is reading
✅ **"Soil %: xx"** → Percentage calculated
✅ **"=> 201"** → Data sent successfully

---

## 🎛️ STEP 6: CALIBRATE SOIL SENSOR

### 6.1 Test Dry Reading:
1. Keep soil sensor in **air** (not in water/soil)
2. Look at Serial Monitor
3. Note the **"Soil Raw: xxxx"** value
4. Example: `Soil Raw: 3300`

### 6.2 Test Wet Reading:
1. Put soil sensor in **glass of water**
2. Wait 10 seconds
3. Note the **"Soil Raw: xxxx"** value
4. Example: `Soil Raw: 1200`

### 6.3 Update Calibration Values:
1. In Arduino IDE, find lines 24-25:
   ```cpp
   int SOIL_DRY = 3300; // ← Change to YOUR dry reading
   int SOIL_WET = 1200; // ← Change to YOUR wet reading
   ```
2. Update with YOUR values
3. Save and **upload again**

---

## 🚰 STEP 7: TEST WATER PUMP CONTROL

### 7.1 Verify Backend Running:
```bash
# In terminal, make sure you see:
Server running on http://localhost:5000
```

### 7.2 Open Dashboard:
1. Go to: **http://localhost:3001**
2. You should see your device: **sensor-001** as **Active 🟢**

### 7.3 Test Irrigation:
1. Click on **sensor-001** device card
2. Modal opens
3. Scroll to **"Irrigation Control"** section
4. Click **"💧 Start Manual Irrigation (10 min)"** button
5. See alert: "Irrigation started!"

### 7.4 Watch ESP32:
In Serial Monitor, you'll see:
```
🚨 Irrigation command received!
Command ID: 1 | Duration: 10 minutes
💧 Starting irrigation...
✅ Pump ON
⏱️  Running... 10s
⏱️  Running... 20s
...
🛑 Pump OFF
✅ Irrigation completed!
📊 Completion reported => 201
```

### 7.5 Verify Relay:
- **Relay LED** should turn ON when pump starts
- **Pump should run** for 10 minutes
- **Relay LED** should turn OFF when done

---

## ⚠️ IMPORTANT SAFETY NOTES

### Relay Wiring:
- **COM** (Common) → Connects to power supply negative
- **NO** (Normally Open) → Connects to pump positive
- **NC** (Normally Closed) → Leave empty
- When relay activates, COM connects to NO, pump runs

### Pump Power:
- **5V pump**: Can power from USB
- **12V pump**: Need external 12V power supply
- **Never** connect 12V directly to ESP32!

### Water Safety:
- Keep ESP32 and relay **away from water**
- Use waterproof enclosure
- Test without water first

---

## 🔧 TROUBLESHOOTING

### Problem 1: "WiFi connection failed!"
**Solution:**
- Check WiFi name and password (exact spelling, case-sensitive)
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

### Problem 2: "=> 0" or "=> -1" in Serial Monitor
**Solution:**
- Backend not running (start with `npm start`)
- Wrong IP address in code
- Computer and ESP32 on different WiFi networks
- Windows Firewall blocking (allow Node.js)

### Problem 3: No COM Port Appears
**Solution:**
- Try different USB cable
- Install CP2102 or CH340 driver
- Try different USB port on computer
- Check Device Manager for unknown devices

### Problem 4: Soil Reading Always 0% or 100%
**Solution:**
- Check soil sensor wiring (especially OUT to GPIO 34)
- Calibrate sensor (Step 6)
- Try different soil sensor
- Verify sensor is powered (VCC connected)

### Problem 5: Relay Doesn't Click
**Solution:**
- Check relay wiring (VCC to VIN, IN to GPIO 5, GND to GND)
- Verify GPIO 5 is correct pin
- Test relay with LED or multimeter
- Some relays need 5V (use VIN), some need 3.3V

### Problem 6: Pump Doesn't Run
**Solution:**
- Check pump power supply is ON
- Verify relay is clicking
- Check pump wiring to relay (COM and NO)
- Test pump directly with power supply
- Ensure pump voltage matches power supply

---

## 📊 STEP 8: VERIFY IN DASHBOARD

### What You Should See:

**Device Panel:**
- ✅ **sensor-001** shows as **Active 🟢**
- ✅ Last update time is recent (under 1 minute)

**Sensor Data Cards:**
- ✅ Temperature: 25.0°C (dummy value)
- ✅ Humidity: 60.0% (dummy value)  
- ✅ Soil Moisture: **YOUR REAL VALUE** (e.g., 45%)

**Device Modal (click sensor-001):**
- ✅ Device info shows
- ✅ Latest readings display
- ✅ 24-hour chart (builds over time)
- ✅ Irrigation control section
- ✅ "Start Irrigation" button works

---

## 🎯 COMPLETE CHECKLIST

### Hardware:
- [ ] ESP32 connected to computer via USB
- [ ] Soil sensor wired to ESP32 (VCC, OUT, GND)
- [ ] Relay module wired to ESP32 (VCC, IN, GND)
- [ ] Pump wired to relay (COM, NO)
- [ ] Power supply connected to pump
- [ ] All connections secure

### Software:
- [ ] Arduino IDE installed
- [ ] ESP32 board support added
- [ ] Code file opened (esp32_soil_only.ino)
- [ ] WiFi credentials entered
- [ ] IP address updated
- [ ] Code uploaded successfully

### Testing:
- [ ] Serial Monitor shows "WiFi connected"
- [ ] Serial Monitor shows "201" status
- [ ] Soil readings appear every 30s
- [ ] Backend shows POST requests
- [ ] Dashboard shows device Active
- [ ] Irrigation button triggers pump

---

## 🚀 YOU'RE DONE!

### What Works Now:
✅ **Soil Monitoring** - Real-time soil moisture every 30s
✅ **Remote Irrigation** - Control pump from dashboard
✅ **Automatic Logging** - Data saved to database
✅ **24-Hour Charts** - View trends over time
✅ **Water Usage** - Track irrigation history

### Next Steps:
1. **Let it run** for 24 hours to build data
2. **Monitor trends** in dashboard charts
3. **Test irrigation** at different times
4. **Add more sensors** (change Device ID, upload to new ESP32)
5. **Set up scheduling** (future feature)

---

## 📞 NEED HELP?

### Send Me:
1. **Photo** of your wiring
2. **Serial Monitor** output (first 20 lines)
3. **Error messages** if any
4. **Dashboard screenshot**

**I'll help you debug!** 💪

---

**🎉 Congratulations! Your smart irrigation system is LIVE! 💧🌱**
