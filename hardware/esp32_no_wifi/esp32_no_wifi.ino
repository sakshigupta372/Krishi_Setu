// ESP32 Code - NO WIFI VERSION (USB Serial Only)
// Direct USB connection to computer

// Device identification
const char* DEVICE_ID   = "sensor-001";
const char* DEVICE_NAME = "Field A - North";
const char* LOCATION    = "North Field";

// Soil moisture analog input
const int SOIL_PIN = 34;  // ADC1 channel, input only

// Relay control for water pump
const int RELAY_PIN = 5;  // GPIO for relay control

// Calibration: update after measuring your sensor raw values
int SOIL_DRY = 3300; // raw reading for DRY (adjust after testing)
int SOIL_WET = 1200; // raw reading for WET (adjust after testing)

// Send an update every 5 seconds (faster for testing)
const unsigned long POST_INTERVAL_MS = 5000;

unsigned long lastPost = 0;
bool pumpRunning = false;
unsigned long pumpStartTime = 0;
unsigned long pumpDuration = 0;

void setup() {
  Serial.begin(115200);
  delay(2000); // Wait for serial to initialize
  
  Serial.println("\n\n========================================");
  Serial.println("  Krishi Setu - NO WIFI TEST MODE");
  Serial.println("========================================");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Device Name: " + String(DEVICE_NAME));
  Serial.println("Location: " + String(LOCATION));
  Serial.println("========================================\n");
  
  // Setup relay pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump OFF initially
  Serial.println("✅ Relay initialized (Pump OFF)");
  
  Serial.println("\n📊 Starting sensor readings...\n");
  Serial.println("Format: JSON data will be sent every 5 seconds");
  Serial.println("Commands: Type 'START:X' to run pump for X minutes");
  Serial.println("          Type 'STOP' to stop pump immediately");
  Serial.println("          Type 'STATUS' to check system status\n");
}

void loop() {
  unsigned long now = millis();
  
  // Read and send soil moisture data every 5 seconds
  if (now - lastPost >= POST_INTERVAL_MS) {
    lastPost = now;
    
    // Read soil moisture raw and map to percentage
    int raw = analogRead(SOIL_PIN);
    int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
    if (soil < 0) soil = 0;
    if (soil > 100) soil = 100;
    
    // Send JSON data over serial (computer will read this)
    Serial.print("DATA:");
    Serial.print("{");
    Serial.print("\"device_id\":\"" + String(DEVICE_ID) + "\",");
    Serial.print("\"device_name\":\"" + String(DEVICE_NAME) + "\",");
    Serial.print("\"location\":\"" + String(LOCATION) + "\",");
    Serial.print("\"temperature\":25.0,");  // Dummy
    Serial.print("\"humidity\":60.0,");     // Dummy
    Serial.print("\"soil_moisture\":" + String(soil) + ",");
    Serial.print("\"soil_raw\":" + String(raw) + ",");
    Serial.print("\"pump_status\":\"" + String(pumpRunning ? "running" : "idle") + "\",");
    Serial.print("\"timestamp\":" + String(now));
    Serial.println("}");
  }
  
  // Check for commands from computer via Serial
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Handle pump timer
  if (pumpRunning) {
    unsigned long elapsed = now - pumpStartTime;
    if (elapsed >= pumpDuration) {
      stopPump();
    } else {
      // Print progress every 5 seconds
      if (elapsed % 5000 < 100) {
        int remainingSeconds = (pumpDuration - elapsed) / 1000;
        Serial.println("⏱️  Pump running... " + String(remainingSeconds) + "s remaining");
      }
    }
  }
}

void handleCommand(String command) {
  command.toUpperCase();
  
  if (command.startsWith("START:")) {
    // Extract minutes: START:10
    int minutes = command.substring(6).toInt();
    if (minutes > 0 && minutes <= 60) {
      startPump(minutes);
    } else {
      Serial.println("❌ Invalid duration. Use: START:1 to START:60 (minutes)");
    }
  }
  else if (command == "STOP") {
    if (pumpRunning) {
      stopPump();
    } else {
      Serial.println("ℹ️  Pump is already OFF");
    }
  }
  else if (command == "STATUS") {
    printStatus();
  }
  else if (command == "HELP") {
    printHelp();
  }
  else {
    Serial.println("❌ Unknown command: " + command);
    Serial.println("   Type HELP for available commands");
  }
}

void startPump(int minutes) {
  pumpDuration = minutes * 60 * 1000; // Convert to milliseconds
  pumpStartTime = millis();
  pumpRunning = true; 
  
  digitalWrite(RELAY_PIN, HIGH); // Turn ON pump
  
  Serial.println("\n💧========================================");
  Serial.println("  IRRIGATION STARTED");
  Serial.println("========================================");
  Serial.println("Duration: " + String(minutes) + " minutes");
  Serial.println("✅ Pump ON");
  Serial.println("========================================\n");
}

void stopPump() {
  digitalWrite(RELAY_PIN, LOW); // Turn OFF pump
  
  unsigned long totalTime = (millis() - pumpStartTime) / 1000;
  float waterUsed = (totalTime / 60.0) * 5.0; // 5L per minute
  
  Serial.println("\n🛑========================================");
  Serial.println("  IRRIGATION STOPPED");
  Serial.println("========================================");
  Serial.println("Total time: " + String(totalTime) + " seconds");
  Serial.println("Water used: " + String(waterUsed, 1) + " liters");
  Serial.println("✅ Pump OFF");
  Serial.println("========================================\n");
  
  // Send completion data
  Serial.print("COMPLETE:");
  Serial.print("{");
  Serial.print("\"device_id\":\"" + String(DEVICE_ID) + "\",");
  Serial.print("\"duration_seconds\":" + String(totalTime) + ",");
  Serial.print("\"water_used_liters\":" + String(waterUsed, 1));
  Serial.println("}");
  
  pumpRunning = false;
}

void printStatus() {
  int raw = analogRead(SOIL_PIN);
  int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
  if (soil < 0) soil = 0;
  if (soil > 100) soil = 100;
  
  Serial.println("\n📊========================================");
  Serial.println("  SYSTEM STATUS");
  Serial.println("========================================");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Device Name: " + String(DEVICE_NAME));
  Serial.println("Location: " + String(LOCATION));
  Serial.println("----------------------------------------");
  Serial.println("Soil Moisture: " + String(soil) + "%");
  Serial.println("Soil Raw: " + String(raw));
  Serial.println("Pump Status: " + String(pumpRunning ? "RUNNING" : "IDLE"));
  if (pumpRunning) {
    unsigned long remaining = (pumpDuration - (millis() - pumpStartTime)) / 1000;
    Serial.println("Time Remaining: " + String(remaining) + " seconds");
  }
  Serial.println("========================================\n");
}

void printHelp() {
  Serial.println("\n📖========================================");
  Serial.println("  AVAILABLE COMMANDS");
  Serial.println("========================================");
  Serial.println("START:X  - Start pump for X minutes");
  Serial.println("           Example: START:10");
  Serial.println("STOP     - Stop pump immediately");
  Serial.println("STATUS   - Show current system status");
  Serial.println("HELP     - Show this help message");
  Serial.println("========================================\n");
}
