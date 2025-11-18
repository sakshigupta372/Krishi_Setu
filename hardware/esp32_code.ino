#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
// Set to your PC's LAN IPv4 where backend runs (from ipconfig) e.g. http://192.168.1.50:5000/api/sensor-data
const char* API_URL   = "http://172.20.10.3:5000/api/sensor-data";

// DHT sensor configuration
#define DHTPIN 4      // GPIO for DHT data
#define DHTTYPE DHT22 // change to DHT11 if you use DHT11

// Soil moisture analog input (use an ADC1 pin like 34/35/32/33)
const int SOIL_PIN = 34;  // ADC1 channel, input only

// Calibration: update after measuring your sensor raw values
// DRY: sensor in air/dry soil. WET: sensor fully inserted in water/wet soil.
int SOIL_DRY = 3300; // example raw reading for DRY
int SOIL_WET = 1200; // example raw reading for WET

// Send an update every 30 seconds
const unsigned long POST_INTERVAL_MS = 30000;

DHT dht(DHTPIN, DHTTYPE);

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Read DHT
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT read failed, will retry...");
    delay(2000);
    return;
  }

  // Read soil moisture raw and map to percentage
  int raw = analogRead(SOIL_PIN);
  int soil = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
  if (soil < 0) soil = 0;
  if (soil > 100) soil = 100;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    String payload = String("{") +
      "\"temperature\":" + String(temperature, 2) + "," +
      "\"humidity\":" + String(humidity, 2) + "," +
      "\"soil_moisture\":" + String(soil) +
      "}";

    int code = http.POST(payload);
    Serial.print("POST ");
    Serial.print(API_URL);
    Serial.print(" => ");
    Serial.println(code);
    http.end();
  }

  delay(POST_INTERVAL_MS);
}
