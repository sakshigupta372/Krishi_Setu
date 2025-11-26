# 📖 ESP32 Code Explanation - Part 2: Main Loop & Irrigation Control

## 🔄 SECTION 11: Main Loop Function (Lines 89-138)

```cpp
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long now = millis();  // Get current time
  
  // TASK 1: Send soil data every 30 seconds
  if (now - lastPost >= POST_INTERVAL_MS) {
    lastPost = now;
    
    // Read sensor
    int raw = analogRead(SOIL_PIN);
    int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
    if (soil < 0) soil = 0;
    if (soil > 100) soil = 100;
    
    Serial.println("Soil Raw: " + String(raw) + " | Soil %: " + String(soil));

    // Send to backend
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(API_URL);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\","
                       "\"temperature\":25.0,"
                       "\"humidity\":60.0,"
                       "\"soil_moisture\":" + String(soil) + "}";

      int code = http.POST(payload);
      Serial.println("[" + String(DEVICE_ID) + "] Soil:" + String(soil) + "% => " + String(code));
      http.end();
    }
  }
  
  // TASK 2: Check for irrigation commands every 10 seconds
  if (now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    checkIrrigationCommand();
  }
}
```

### 🔍 Deep Dive: How Timing Works

**Time Tracking:**
```cpp
unsigned long now = millis();  // Current time in milliseconds
```

**Example Timeline:**
```
ESP32 starts at 0ms

After 0ms:   now = 0
             lastPost = 0
             0 - 0 = 0 >= 30000? YES → Send data, set lastPost = 0

After 10000ms: now = 10000
               lastPost = 0
               10000 - 0 = 10000 >= 30000? NO → Skip data sending
               10000 - 0 = 10000 >= 10000? YES → Check commands, set lastPoll = 10000

After 20000ms: now = 20000
               lastPost = 0, lastPoll = 10000
               20000 - 0 = 20000 >= 30000? NO → Skip data
               20000 - 10000 = 10000 >= 10000? YES → Check commands, set lastPoll = 20000

After 30000ms: now = 30000
               lastPost = 0, lastPoll = 20000
               30000 - 0 = 30000 >= 30000? YES → Send data, set lastPost = 30000
               30000 - 20000 = 10000 >= 10000? YES → Check commands, set lastPoll = 30000
```

---

### 📊 Reading Soil Sensor (Line 101-104)

```cpp
int raw = analogRead(SOIL_PIN);              // Read GPIO 34
int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);  // Convert to %
if (soil < 0) soil = 0;                      // Min 0%
if (soil > 100) soil = 100;                  // Max 100%
```

**How `analogRead()` Works:**
- Reads voltage on GPIO 34
- Returns value: **0 to 4095**
  - 0 = 0V (GND)
  - 2048 = 1.65V (half)
  - 4095 = 3.3V (max)

**How `map()` Converts:**
```
Formula: output = (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow

Example with raw = 2250:
  SOIL_DRY = 3300 (dry = 0%)
  SOIL_WET = 1200 (wet = 100%)
  
  soil = (2250 - 3300) * (100 - 0) / (1200 - 3300) + 0
       = -1050 * 100 / -2100
       = -105000 / -2100
       = 50%
```

**Real-World Examples:**
```
Sensor in air:       raw = 3300 → 0% moisture
Sensor in water:     raw = 1200 → 100% moisture
Slightly damp soil:  raw = 3000 → 14% moisture
Moderately wet:      raw = 2250 → 50% moisture
Very wet soil:       raw = 1500 → 86% moisture
```

---

### 📤 Sending Data to Backend (Lines 111-130)

```cpp
if (WiFi.status() == WL_CONNECTED) {
  HTTPClient http;
  http.begin(API_URL);                        // Set URL
  http.addHeader("Content-Type", "application/json");  // JSON format
  
  // Build JSON payload
  String payload = "{\"device_id\":\"sensor-001\","
                   "\"temperature\":25.0,"
                   "\"humidity\":60.0,"
                   "\"soil_moisture\":55}";
  
  int code = http.POST(payload);  // Send HTTP POST
  Serial.println("[sensor-001] Soil:55% => 201");
  http.end();                     // Close connection
}
```

**JSON Sent to Backend:**
```json
{
  "device_id": "sensor-001",
  "temperature": 25.0,
  "humidity": 60.0,
  "soil_moisture": 55
}
```

**Why Dummy Temp/Humidity?**
- Backend expects these fields (designed for DHT22 originally)
- We only have soil sensor
- Dummy values keep backend compatible
- Dashboard ignores these values for soil-only sensors

**HTTP Status Codes:**
- **201** = Created (Success!)
- **400** = Bad Request (JSON error)
- **500** = Server Error (Backend problem)
- **0** = No response (WiFi/network issue)

---

## 💧 SECTION 12: Check Irrigation Commands (Lines 140-176)

```cpp
void checkIrrigationCommand() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String pollUrl = String(POLL_URL) + String(DEVICE_ID);
  http.begin(pollUrl);  // e.g., http://192.168.1.50:5000/api/irrigation/poll/sensor-001
  
  int code = http.GET();  // Ask backend: "Any commands for me?"
  
  if (code == 200) {
    String response = http.getString();
    
    // Check if command exists
    if (response.indexOf("\"id\"") > 0 && response.indexOf("\"duration_minutes\"") > 0) {
      Serial.println("🚨 Irrigation command received!");
      
      // Parse JSON manually (extract ID and duration)
      int idStart = response.indexOf("\"id\":") + 5;
      int idEnd = response.indexOf(",", idStart);
      String commandId = response.substring(idStart, idEnd);
      
      int durStart = response.indexOf("\"duration_minutes\":") + 19;
      int durEnd = response.indexOf(",", durStart);
      if (durEnd == -1) durEnd = response.indexOf("}", durStart);
      int duration = response.substring(durStart, durEnd).toInt();
      
      Serial.println("Command ID: " + commandId + " | Duration: " + String(duration) + " minutes");
      
      // Execute irrigation
      startIrrigation(commandId.toInt(), duration);
    }
  }
  http.end();
}
```

### 🔍 How Command Polling Works

**ESP32 Asks Backend:**
```
GET http://192.168.1.50:5000/api/irrigation/poll/sensor-001
```

**Backend Responses:**

**Case 1: No Command Pending**
```json
{}
```
- Empty response
- `indexOf("id")` returns -1
- Function exits, does nothing

**Case 2: Command Pending**
```json
{
  "id": 123,
  "device_id": "sensor-001",
  "duration_minutes": 10,
  "status": "pending"
}
```
- Contains "id" and "duration_minutes"
- Function extracts values
- Calls `startIrrigation(123, 10)`

---

### 🧩 JSON Parsing Explained

**Simple String Parsing:**
```cpp
// Response: {"id":123,"device_id":"sensor-001","duration_minutes":10}

int idStart = response.indexOf("\"id\":") + 5;
// Finds position of "id": (position 2)
// Adds 5 to skip past "id": → now at position 7 (the "1" in "123")

int idEnd = response.indexOf(",", idStart);
// Finds next comma after position 7 → position 10

String commandId = response.substring(idStart, idEnd);
// Extracts from position 7 to 10 → "123"
```

**Visual Breakdown:**
```
String: {"id":123,"device_id":"sensor-001","duration_minutes":10}
Index:  0123456789...

"id": found at position 2
Position 2 + 5 = Position 7 → Start of "123"
Next comma at position 10 → End marker
Extract from 7 to 10 → "123"
```

**Why Manual Parsing?**
- No JSON library included (saves memory)
- Simple approach for small JSON
- Fast and efficient
- Works for our specific format

---

## 🚿 SECTION 13: Start Irrigation (Lines 178-210)

```cpp
void startIrrigation(int commandId, int durationMinutes) {
  Serial.println("💧 Starting irrigation...");
  
  // Turn pump ON
  digitalWrite(RELAY_PIN, HIGH);  // GPIO 5 → HIGH (3.3V)
  Serial.println("✅ Pump ON");
  
  // Convert minutes to milliseconds
  unsigned long duration = durationMinutes * 60 * 1000;
  unsigned long startTime = millis();
  
  // Wait while pump runs
  while (millis() - startTime < duration) {
    if (millis() - startTime % 10000 == 0) {
      int elapsed = (millis() - startTime) / 1000;
      Serial.println("⏱️  Running... " + String(elapsed) + "s");
    }
    delay(1000);  // Check every second
  }
  
  // Turn pump OFF
  digitalWrite(RELAY_PIN, LOW);  // GPIO 5 → LOW (0V)
  Serial.println("🛑 Pump OFF");
  Serial.println("✅ Irrigation completed!");
  
  // Calculate water used (5 liters per minute)
  float waterUsed = durationMinutes * 5.0;
  
  // Report completion
  reportCompletion(commandId, waterUsed);
}
```

### 🔍 How Relay Control Works

**Relay States:**
```cpp
digitalWrite(RELAY_PIN, HIGH);  // Pump ON
digitalWrite(RELAY_PIN, LOW);   // Pump OFF
```

**Physical Process:**
```
HIGH (3.3V) → Relay coil energized → Contacts close → Pump gets power → Water flows
LOW (0V) → Relay coil off → Contacts open → Pump loses power → Water stops
```

**Wiring Connection:**
```
ESP32 GPIO 5 → Relay IN
When HIGH → Relay connects COM to NO
NO is connected to Pump (+)
COM is connected to Power (-)
Circuit completes → Pump runs!
```

---

### ⏱️ Duration Timing

**Time Conversion:**
```cpp
unsigned long duration = durationMinutes * 60 * 1000;

Examples:
1 minute  → 1 * 60 * 1000 = 60,000 ms
5 minutes → 5 * 60 * 1000 = 300,000 ms
10 minutes → 10 * 60 * 1000 = 600,000 ms
```

**While Loop:**
```cpp
unsigned long startTime = millis();  // Record start

while (millis() - startTime < duration) {
  // Keep looping until duration elapsed
  delay(1000);  // Check every second
}
```

**Example (10 minute irrigation):**
```
Start: millis() = 100000, startTime = 100000
After 1s: millis() = 101000, elapsed = 1000ms < 600000ms → Continue
After 2s: millis() = 102000, elapsed = 2000ms < 600000ms → Continue
...
After 599s: millis() = 699000, elapsed = 599000ms < 600000ms → Continue
After 600s: millis() = 700000, elapsed = 600000ms >= 600000ms → Exit loop
```

---

### 💧 Water Usage Calculation

```cpp
float waterUsed = durationMinutes * 5.0;
```

**Assumption:** Pump delivers 5 liters per minute

**Examples:**
```
1 minute  → 1 * 5.0 = 5.0 liters
5 minutes → 5 * 5.0 = 25.0 liters
10 minutes → 10 * 5.0 = 50.0 liters
```

**Customization:**
If your pump is different:
```cpp
float waterUsed = durationMinutes * 3.5;  // 3.5L per minute
float waterUsed = durationMinutes * 7.2;  // 7.2L per minute
```

**Accurate Measurement:**
For precision, use a flow meter sensor:
```cpp
// Read from flow meter instead
float waterUsed = flowMeterGetLiters();
```

---

## 📊 SECTION 14: Report Completion (Lines 212-229)

```cpp
void reportCompletion(int commandId, float waterUsed) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(COMPLETE_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON
  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\","
                   "\"command_id\":" + String(commandId) + ","
                   "\"water_used_liters\":" + String(waterUsed, 1) + "}";
  
  int code = http.POST(payload);
  Serial.println("📊 Completion reported => " + String(code));
  http.end();
}
```

### 📤 Completion Report

**JSON Sent:**
```json
{
  "device_id": "sensor-001",
  "command_id": 123,
  "water_used_liters": 50.0
}
```

**What Backend Does:**
1. Updates irrigation_commands table (status = "completed")
2. Saves to irrigation_history table
3. Updates water usage statistics
4. Dashboard shows completion

**Success Code:** 201 = Completed and logged

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ESP32 STARTS                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   setup()      │
         │  - Init relay  │
         │  - Connect WiFi│
         │  - Register    │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────────────┐
         │   loop() - FOREVER     │
         └────────┬───────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────┐      ┌────────────────┐
│ Every 30s:   │      │ Every 10s:     │
│ - Read soil  │      │ - Poll backend │
│ - Send data  │      │ - Check command│
│ - Get 201    │      │ - If command:  │
└──────────────┘      │   Start pump   │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ startIrrigation│
                      │ - Pump ON      │
                      │ - Wait duration│
                      │ - Pump OFF     │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ reportComplete │
                      │ - Send water   │
                      │   usage        │
                      │ - Backend logs │
                      └────────────────┘
```

---

## 📺 Serial Monitor Output Example

**Complete Session:**
```
--- Krishi Setu Sensor Node ---
Device ID: sensor-001
Relay initialized (Pump OFF)
.......
WiFi connected: 192.168.1.101
Device registration => 201

Soil Raw: 2450 | Soil %: 55
[sensor-001] Soil:55% => 201

Soil Raw: 2380 | Soil %: 58
[sensor-001] Soil:58% => 201

🚨 Irrigation command received!
Command ID: 123 | Duration: 10 minutes
💧 Starting irrigation...
✅ Pump ON
⏱️  Running... 10s
⏱️  Running... 20s
⏱️  Running... 30s
...
⏱️  Running... 590s
⏱️  Running... 600s
🛑 Pump OFF
✅ Irrigation completed!
📊 Completion reported => 201

Soil Raw: 1850 | Soil %: 78
[sensor-001] Soil:78% => 201
```

**What You See:**
- Regular soil readings every 30s
- Irrigation command received
- Pump runs for 10 minutes
- Completion reported
- Soil moisture increased (58% → 78%)

---

## 🎯 Summary: What Each Part Does

| Section | Function | Frequency | Purpose |
|---------|----------|-----------|---------|
| **Setup** | Initialize | Once | Configure hardware, connect WiFi |
| **Loop** | Main control | Forever | Coordinate all tasks |
| **Soil Reading** | analogRead() | Every 30s | Monitor moisture |
| **Data Sending** | POST to API | Every 30s | Update dashboard |
| **Command Check** | GET from API | Every 10s | Receive irrigation requests |
| **Irrigation** | Relay control | On demand | Run water pump |
| **Reporting** | POST completion | After irrigation | Log water usage |

---

**Your ESP32 is now a complete smart irrigation controller! 🌱💧**
