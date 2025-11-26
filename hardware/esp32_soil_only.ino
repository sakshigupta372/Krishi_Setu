#include <WiFi.h>
#include <HTTPClient.h>

// Device identification - CHANGE THIS FOR EACH SENSOR
const char* DEVICE_ID   = "sensor-001";
const char* DEVICE_NAME = "Field A - North";
const char* LOCATION    = "North Field";

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
// Set to your PC's LAN IPv4 where backend runs (from ipconfig) e.g. http://192.168.1.50:5000
const char* API_URL         = "http://192.168.1.50:5000/api/sensor-data";
const char* REGISTER_URL    = "http://192.168.1.50:5000/api/devices/register";
const char* POLL_URL        = "http://192.168.1.50:5000/api/irrigation/poll/";
const char* COMPLETE_URL    = "http://192.168.1.50:5000/api/irrigation/complete";

// Soil moisture analog input (use an ADC1 pin like 34/35/32/33)
const int SOIL_PIN = 34;  // ADC1 channel, input only

// Relay control for water pump
const int RELAY_PIN = 5;  // GPIO for relay control

// Calibration: update after measuring your sensor raw values
// DRY: sensor in air/dry soil. WET: sensor fully inserted in water/wet soil.
int SOIL_DRY = 3300; // example raw reading for DRY (adjust after testing)
int SOIL_WET = 1200; // example raw reading for WET (adjust after testing)

// Send an update every 30 seconds
const unsigned long POST_INTERVAL_MS = 30000;
const unsigned long POLL_INTERVAL_MS = 10000; // Check for irrigation commands every 10s

unsigned long lastPost = 0;
unsigned long lastPoll = 0;

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nWiFi connected: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(REGISTER_URL);
  http.addHeader("Content-Type", "application/json");
  
  String payload = String("{") +
    "\"device_id\":\"" + String(DEVICE_ID) + "\"," +
    "\"device_name\":\"" + String(DEVICE_NAME) + "\"," +
    "\"location\":\"" + String(LOCATION) + "\"" +
    "}";
  
  int code = http.POST(payload);
  Serial.print("Device registration => ");
  Serial.println(code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- Krishi Setu Sensor Node ---");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  
  // Setup relay pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump OFF initially
  Serial.println("Relay initialized (Pump OFF)");
  
  connectWiFi();
  
  // Register device with backend
  if (WiFi.status() == WL_CONNECTED) {
    registerDevice();
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long now = millis();
  
  // Read and send soil moisture data every 30 seconds
  if (now - lastPost >= POST_INTERVAL_MS) {
    lastPost = now;
    
    // Read soil moisture raw and map to percentage
    int raw = analogRead(SOIL_PIN);
    int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
    if (soil < 0) soil = 0;
    if (soil > 100) soil = 100;
    
    Serial.print("Soil Raw: ");
    Serial.print(raw);
    Serial.print(" | Soil %: ");
    Serial.println(soil);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(API_URL);
      http.addHeader("Content-Type", "application/json");

      // Send only soil moisture data (no temperature/humidity)
      String payload = String("{") +
        "\"device_id\":\"" + String(DEVICE_ID) + "\"," +
        "\"temperature\":" + String(25.0) + "," +  // Dummy value for compatibility
        "\"humidity\":" + String(60.0) + "," +     // Dummy value for compatibility
        "\"soil_moisture\":" + String(soil) +
        "}";

      int code = http.POST(payload);
      Serial.print("[" + String(DEVICE_ID) + "] Soil:");
      Serial.print(soil);
      Serial.print("% => ");
      Serial.println(code);
      http.end();
    }
  }
  
  // Check for irrigation commands every 10 seconds
  if (now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    checkIrrigationCommand();
  }
}

void checkIrrigationCommand() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String pollUrl = String(POLL_URL) + String(DEVICE_ID);
  http.begin(pollUrl);
  
  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    
    // Check if there's a command
    if (response.indexOf("\"id\"") > 0 && response.indexOf("\"duration_minutes\"") > 0) {
      Serial.println("🚨 Irrigation command received!");
      
      // Extract command ID and duration (simple parsing)
      int idStart = response.indexOf("\"id\":") + 5;
      int idEnd = response.indexOf(",", idStart);
      String commandId = response.substring(idStart, idEnd);
      
      int durStart = response.indexOf("\"duration_minutes\":") + 19;
      int durEnd = response.indexOf(",", durStart);
      if (durEnd == -1) durEnd = response.indexOf("}", durStart);
      int duration = response.substring(durStart, durEnd).toInt();
      
      Serial.print("Command ID: ");
      Serial.print(commandId);
      Serial.print(" | Duration: ");
      Serial.print(duration);
      Serial.println(" minutes");
      
      // Start irrigation
      startIrrigation(commandId.toInt(), duration);
    }
  }
  http.end();
}

void startIrrigation(int commandId, int durationMinutes) {
  Serial.println("💧 Starting irrigation...");
  
  // Turn ON pump
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("✅ Pump ON");
  
  // Run for specified duration (convert to milliseconds)
  unsigned long duration = durationMinutes * 60 * 1000;
  unsigned long startTime = millis();
  
  // Monitor while running
  while (millis() - startTime < duration) {
    if (millis() - startTime % 10000 == 0) {
      int elapsed = (millis() - startTime) / 1000;
      Serial.print("⏱️  Running... ");
      Serial.print(elapsed);
      Serial.println("s");
    }
    delay(1000);
  }
  
  // Turn OFF pump
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("🛑 Pump OFF");
  Serial.println("✅ Irrigation completed!");
  
  // Calculate water used (example: 5L per minute)
  float waterUsed = durationMinutes * 5.0;
  
  // Report completion to backend
  reportCompletion(commandId, waterUsed);
}

void reportCompletion(int commandId, float waterUsed) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(COMPLETE_URL);
  http.addHeader("Content-Type", "application/json");
  
  String payload = String("{") +
    "\"device_id\":\"" + String(DEVICE_ID) + "\"," +
    "\"command_id\":" + String(commandId) + "," +
    "\"water_used_liters\":" + String(waterUsed, 1) +
    "}";
  
  int code = http.POST(payload);
  Serial.print("📊 Completion reported => ");
  Serial.println(code);
  http.end();
}
