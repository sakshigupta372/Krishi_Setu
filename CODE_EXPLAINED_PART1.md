# 📖 ESP32 Code Explanation - Part 1: Setup & Configuration

## 🎯 Complete Overview

This code makes your ESP32:
1. **Monitor** soil moisture continuously
2. **Send** data to dashboard every 30 seconds  
3. **Check** for irrigation commands every 10 seconds
4. **Control** water pump via relay
5. **Report** water usage after irrigation

---

## 📚 SECTION 1: Libraries (Lines 1-2)

```cpp
#include <WiFi.h>       // WiFi connectivity
#include <HTTPClient.h>  // HTTP requests to backend
```

**Purpose:** Communication tools
- **WiFi.h** → Connect to your WiFi network
- **HTTPClient.h** → Send/receive data from backend API

---

## 🏷️ SECTION 2: Device Identity (Lines 5-7)

```cpp
const char* DEVICE_ID   = "sensor-001";
const char* DEVICE_NAME = "Field A - North";
const char* LOCATION    = "North Field";
```

**What It Does:**
- Unique ID for this sensor
- Appears in dashboard
- Backend tracks which device sent data

**For Multiple Sensors:**
- sensor-001, sensor-002, sensor-003 (each ESP32 needs unique ID)

---

## 📡 SECTION 3: WiFi Credentials (Lines 9-10)

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";      // ← Change to your WiFi name
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";  // ← Change to your password
```

**Important:**
- ⚠️ ESP32 only works with **2.4GHz WiFi** (not 5GHz)
- Case-sensitive!
- Must be exact match

---

## 🌐 SECTION 4: Backend URLs (Lines 12-15)

```cpp
const char* API_URL = "http://192.168.1.50:5000/api/sensor-data";
```

**Get Your IP:**
```bash
# Windows CMD:
ipconfig
# Note "IPv4 Address" (e.g., 192.168.1.50)
```

**Replace `192.168.1.50` with YOUR computer's IP in all 4 URLs!**

**What Each URL Does:**
- **API_URL** → Send soil moisture readings
- **REGISTER_URL** → Register device at startup
- **POLL_URL** → Check for irrigation commands
- **COMPLETE_URL** → Report irrigation finished

---

## 📌 SECTION 5: Hardware Pins (Lines 18, 21)

```cpp
const int SOIL_PIN = 34;   // Reads soil sensor (analog input)
const int RELAY_PIN = 5;   // Controls pump relay (digital output)
```

**GPIO 34 (Soil Sensor):**
- Analog input (reads 0-4095)
- Measures voltage from sensor
- Must be ADC1 pin (34, 35, 36, 39)

**GPIO 5 (Relay):**
- Digital output (HIGH/LOW)
- HIGH = Pump ON
- LOW = Pump OFF

---

## 🎚️ SECTION 6: Soil Calibration (Lines 25-26)

```cpp
int SOIL_DRY = 3300;  // Raw value when sensor in air
int SOIL_WET = 1200;  // Raw value when sensor in water
```

**How to Calibrate:**
1. Upload code
2. Open Serial Monitor
3. Sensor in air → Note "Soil Raw: xxxx"
4. Sensor in water → Note "Soil Raw: xxxx"
5. Update these values
6. Re-upload

**Purpose:** Convert raw readings to accurate 0-100% moisture

---

## ⏰ SECTION 7: Timing (Lines 29-30, 32-33)

```cpp
const unsigned long POST_INTERVAL_MS = 30000;  // Send data every 30s
const unsigned long POLL_INTERVAL_MS = 10000;  // Check commands every 10s

unsigned long lastPost = 0;  // Track last data send
unsigned long lastPoll = 0;  // Track last command check
```

**Timeline:**
```
0s:   Send data, Check commands
10s:  Check commands
20s:  Check commands
30s:  Send data, Check commands
40s:  Check commands
50s:  Check commands
60s:  Send data, Check commands
```

---

## 📶 SECTION 8: WiFi Connection (Lines 35-49)

```cpp
void connectWiFi() {
  WiFi.mode(WIFI_STA);                    // Station mode (client)
  WiFi.begin(WIFI_SSID, WIFI_PASS);      // Start connecting
  unsigned long start = millis();         // Start timer
  
  // Wait up to 20 seconds
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);      // Wait 0.5s
    Serial.print("."); // Show progress
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected: " + WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}
```

**What It Does:**
1. Set ESP32 as WiFi client
2. Try to connect using credentials
3. Wait up to 20 seconds
4. Print result (success + IP or failure)

---

## 📝 SECTION 9: Device Registration (Lines 51-68)

```cpp
void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) return;  // Exit if no WiFi
  
  HTTPClient http;
  http.begin(REGISTER_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON
  String payload = "{\"device_id\":\"sensor-001\","
                   "\"device_name\":\"Field A\","
                   "\"location\":\"North Field\"}";
  
  int code = http.POST(payload);  // Send to backend
  Serial.println("Device registration => " + String(code));
  http.end();
}
```

**What It Does:**
- Sends device info to backend
- Backend saves to database
- Dashboard now knows this device exists
- Only runs once at startup

**Success:** Code = 201 (Created)

---

## 🚀 SECTION 10: Setup Function (Lines 70-87)

```cpp
void setup() {
  Serial.begin(115200);  // Start serial communication
  Serial.println("\n--- Krishi Setu Sensor Node ---");
  
  pinMode(RELAY_PIN, OUTPUT);     // Set GPIO 5 as output
  digitalWrite(RELAY_PIN, LOW);   // Pump OFF initially
  
  connectWiFi();                  // Connect to WiFi
  
  if (WiFi.status() == WL_CONNECTED) {
    registerDevice();             // Register with backend
  }
}
```

**Runs Once at Power-On:**
1. Start Serial Monitor (115200 baud)
2. Initialize relay pin (pump OFF)
3. Connect to WiFi
4. Register device with backend
5. Move to loop()

---

## 🔍 Serial Monitor Output (Startup)

```
--- Krishi Setu Sensor Node ---
Device ID: sensor-001
Relay initialized (Pump OFF)
.......
WiFi connected: 192.168.1.101
Device registration => 201
```

**What Each Line Means:**
- `Device ID` → Confirms device identity
- `Relay initialized` → Pump starts OFF (safe)
- `.......` → WiFi connection attempts
- `WiFi connected` → Success! Shows IP address
- `=> 201` → Registration successful

---

**Continue to Part 2 for loop() function and irrigation control!**
