# 🌾 Krishi Setu
**IoT-Based Smart Agriculture Monitoring and Irrigation Control System**

[![ESP32](https://img.shields.io/badge/ESP32-Supported-green.svg)](hardware/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](dashboard/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](backend/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete real-time agricultural IoT system featuring **ESP32 hardware integration**, **live sensor monitoring**, **remote irrigation control**, and a **beautiful React dashboard**. Designed to help farmers make data-driven decisions, reduce manual monitoring, and control irrigation remotely via web interface.

### 🌟 **NEW**: Direct ESP32 Serial Communication | Real-time Updates | Irrigation Control | Authentication System

[View Demo](#-screenshots) • [Quick Start](#-quick-start) • [Hardware Setup](#-esp32-hardware-setup) • [Documentation](#-documentation)

---

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [ESP32 Hardware Setup](#esp32-hardware-setup)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 🎨 Dashboard & UI
- **🔐 Authentication System**: Secure login/signup with JWT tokens
- **🌾 Beautiful Agricultural Theme**: Crop field background with glass-morphism design
- **📊 Real-time Monitoring**: Live sensor data updates every 3 seconds
- **📈 Interactive Charts**: 24-hour historical trends with smooth animations
- **🚨 Smart Alerts**: Threshold-based notifications for critical conditions
- **📱 Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **🎭 Multiple Sensors**: Support for unlimited sensor devices
- **💧 Irrigation Control**: Remote pump control via web interface

### ⚙️ Backend & API
- **🔌 ESP32 Serial Integration**: Direct USB communication with hardware (115200 baud)
- **🔄 Auto-detection**: Automatically finds ESP32 on any COM port
- **💾 Dual Storage**: PostgreSQL with automatic fallback to in-memory store
- **🛡️ JWT Authentication**: Secure user sessions and protected endpoints
- **📡 RESTful APIs**: Clean, documented API design
- **✅ Data Validation**: Input sanitization and type checking
- **🌐 CORS Support**: Configured for secure cross-origin requests
- **🔁 Graceful Fallback**: Mock data mode if hardware unavailable

### 🔧 Hardware Integration
- **✅ ESP32 Firmware**: Ready-to-upload Arduino code
- **🌡️ Multi-Sensor Support**: Soil moisture, temperature, humidity
- **💧 Pump Control**: Relay-based irrigation system (GPIO5)
- **🔗 USB Serial**: No WiFi needed - direct computer connection
- **📊 Real Data Flow**: Reads sensors every 5 seconds
- **⚡ Instant Commands**: Send irrigation commands via serial
- **📏 Calibration Ready**: Adjustable sensor thresholds

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Modern SPA dashboard |
| **Backend** | Node.js + Express | REST API server |
| **Serial Comm** | serialport (Node.js) | ESP32 USB communication |
| **Authentication** | JWT + bcryptjs | Secure user sessions |
| **Database** | PostgreSQL (optional) | Data persistence |
| **Visualization** | Chart.js | Beautiful charts & graphs |
| **Styling** | CSS3 + Glass-morphism | Modern agricultural UI |
| **Hardware** | ESP32-DevKit | Microcontroller (115200 baud) |
| **Sensors** | Capacitive Soil Moisture | Accurate soil readings |
| **Relay** | 5V Module | Pump control (GPIO5) |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER (Farmer)                       │
│                 Accesses via Browser                    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────────┐
│              React Dashboard (Port 3000)                │
│  • Login/Signup  • Sensor Cards  • Charts  • Controls  │
│  • Glass-morphism UI  • Real-time Updates (3s poll)   │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
                        ↓
┌─────────────────────────────────────────────────────────┐
│           Express Backend (Port 5000)                   │
│  • JWT Auth  • Serial Handler  • REST APIs             │
│  • Irrigation Control  • Data Storage                  │
└────────┬────────────────────────┬───────────────────────┘
         │                        │
    [Database]              [USB Serial Port]
         ↓                        ↓ 115200 baud
┌──────────────────┐    ┌──────────────────────────────┐
│   PostgreSQL     │    │  ESP32 (Hardware)            │
│  (Optional)      │    │  • Reads soil sensor (GPIO34)│
│  • sensor_data   │    │  • Controls relay (GPIO5)    │
│  • water_usage   │    │  • Sends JSON every 5s       │
│  • users         │    │  • Receives commands         │
└──────────────────┘    └──────────────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        ↓                     ↓
                ┌───────────────┐    ┌──────────────┐
                │ Soil Sensor   │    │ Relay Module │
                │ (Moisture %)  │    │ (Pump ON/OFF)│
                └───────────────┘    └──────┬───────┘
                                            │
                                            ↓
                                    ┌──────────────┐
                                    │ Water Pump   │
                                    │ (12V DC)     │
                                    └──────────────┘
```

---

## ⚡ Quick Start

**For complete beginners:** Read [`COMPLETE_BEGINNER_GUIDE.md`](COMPLETE_BEGINNER_GUIDE.md) for step-by-step instructions!

### 3-Minute Setup (Without Hardware)

```bash
# 1. Clone repository
git clone https://github.com/sakshigupta372/Krishi_Setu.git
cd Krishi_Setu

# 2. Start Backend (Terminal 1)
cd backend
npm install
npm start
# Wait for: "Server running on http://localhost:5000"

# 3. Start Dashboard (Terminal 2 - new window)
cd dashboard
npm install
npm start
# Browser opens automatically at http://localhost:3000

# 4. Login
# Email: test@test.com
# Password: test123

# 🎉 Dashboard loads with test data!
```

### With ESP32 Hardware

**Step 1:** Upload Arduino code
```bash
# Open: hardware/esp32_no_wifi/esp32_no_wifi.ino in Arduino IDE
# Select: Tools → Board → ESP32 Dev Module
# Select: Tools → Port → COM3 (your ESP32 port)
# Click: Upload button (→)
```

**Step 2:** Start backend (it auto-detects ESP32!)
```bash
cd backend
npm start
# Look for: "✅ Serial port connected successfully!"
# Look for: "📊 Received sensor data: ..."
```

**Step 3:** Start dashboard & watch REAL data flow! 🚀

**Troubleshooting:** See [`FIX_COM_PORT.md`](FIX_COM_PORT.md) if ESP32 not detected.

---

## 📦 Installation

### Prerequisites
- **Node.js** (v16+)
- **npm** or **yarn**
- **PostgreSQL** (optional, falls back to in-memory)
- **Git**

### Clone Repository
```bash
git clone https://github.com/sakshigupta372/IOT_Based_Agricultural_System.git
cd IOT_Based_Agricultural_System
```

### Backend Setup
```bash
cd backend
npm install

# Optional: Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials if using DB

# Start backend server
npm start
```
Expected output: `Server running on http://localhost:5000`

### Frontend Setup
```bash
cd dashboard
npm install

# Start frontend dev server
npm start
```
Expected output: `Local: http://localhost:3000`

---

## 🚀 Usage

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Verify Backend Health
```bash
curl http://localhost:5000/api/health
```
Response: `{"ok":true,"mode":"postgres"}` or `{"ok":true,"mode":"memory"}`

### 3. Start Frontend
```bash
cd dashboard
npm start
```
Open browser: http://localhost:3000

### 4. View Dashboard
- Navigate to http://localhost:3000
- Cards will show latest readings
- Charts display 24-hour trends
- Stats panel shows aggregates
- Alerts appear for critical thresholds

---

## 📡 API Documentation

**Base URL**: `http://localhost:5000/api`

### Endpoints

#### 1. Health Check
```http
GET /api/health
```
**Response**:
```json
{
  "ok": true,
  "mode": "postgres"
}
```

#### 2. Add Sensor Data
```http
POST /api/sensor-data
Content-Type: application/json

{
  "temperature": 25.5,
  "humidity": 60.0,
  "soil_moisture": 45
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "temperature": "25.50",
    "humidity": "60.00",
    "soil_moisture": 45,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 3. Get Latest Reading
```http
GET /api/sensor-data/latest
```
**Response** (200 OK):
```json
{
  "id": 123,
  "temperature": "25.50",
  "humidity": "60.00",
  "soil_moisture": 45,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```
**Response** (404 Not Found):
```json
{
  "error": "no_data"
}
```

#### 4. Get Historical Data
```http
GET /api/sensor-data/history?hours=24
```
**Response**:
```json
{
  "count": 48,
  "data": [
    {
      "id": 1,
      "temperature": "25.50",
      "humidity": "60.00",
      "soil_moisture": 45,
      "timestamp": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### 5. Get Statistics
```http
GET /api/stats?hours=24
```
**Response**:
```json
{
  "avg_temp": "25.75",
  "min_temp": "23.20",
  "max_temp": "28.50",
  "avg_humidity": "59.50",
  "avg_soil": "42.30"
}
```

---

## 🔌 ESP32 Hardware Setup

### Required Components
- ESP32 development board
- DHT22 or DHT11 temperature/humidity sensor
- Capacitive soil moisture sensor
- Jumper wires
- Breadboard

### Wiring Diagram
```
DHT22:
  VCC  → ESP32 3.3V
  GND  → ESP32 GND
  DATA → ESP32 GPIO 4 (+ 10kΩ pull-up resistor to 3.3V if needed)

Soil Moisture Sensor:
  VCC → ESP32 3.3V
  GND → ESP32 GND
  AO  → ESP32 GPIO 34 (ADC1)
```

### Firmware Configuration

1. **Install Arduino IDE** and ESP32 board support
2. **Install Libraries**:
   - DHT sensor library by Adafruit
   - Adafruit Unified Sensor
3. **Open** `hardware/esp32_code.ino`
4. **Configure WiFi**:
   ```cpp
   const char* WIFI_SSID = "YourNetworkName";
   const char* WIFI_PASS = "YourPassword";
   ```
5. **Set Backend URL** (use your PC's LAN IPv4):
   ```cpp
   const char* API_URL = "http://192.168.1.100:5000/api/sensor-data";
   ```
   Find your PC IP with `ipconfig` (Windows) or `ifconfig` (Linux/Mac)

6. **Calibrate Soil Moisture**:
   - Temporarily print raw values: `Serial.println(analogRead(34));`
   - Measure dry (in air): note value → set `SOIL_DRY`
   - Measure wet (in water): note value → set `SOIL_WET`
   ```cpp
   const int SOIL_DRY = 4095;  // Example: adjust to your sensor
   const int SOIL_WET = 1500;
   ```

7. **Flash ESP32**:
   - Select board: ESP32 Dev Module
   - Select port: COM port of your ESP32
   - Upload code

8. **Verify Serial Output** (115200 baud):
   ```
   WiFi connected: 192.168.1.50
   POST http://192.168.1.100:5000/api/sensor-data => 201
   ```

### Windows Firewall (Required)
Run PowerShell as Administrator:
```powershell
New-NetFirewallRule -DisplayName "SmartFarm API 5000 (Private)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -Profile Private
```

---

## 🐛 Troubleshooting

### Backend Issues

**"Failed to fetch" in Dashboard**
- Ensure backend is running on port 5000
- Check `http://localhost:5000/api/health`
- Restart both servers

**PostgreSQL Connection Error**
- Backend auto-falls back to in-memory mode
- Check `.env` credentials if you want DB persistence

**Port Already in Use**
```bash
# Windows
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Frontend Issues

**Blank Dashboard**
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Check browser console (F12) for errors
- Verify Vite proxy in `dashboard/vite.config.js`

**Charts Not Updating**
- Connect ESP32 hardware or use test API calls
- Check backend `/api/sensor-data/history` returns data

### ESP32 Issues

**WiFi Connection Failed**
- Verify SSID and password
- Ensure 2.4 GHz network (ESP32 doesn't support 5 GHz)
- Check Serial Monitor for debug output

**HTTP POST Returns -1 or 0**
- ESP32 and PC must be on same network
- Verify `API_URL` has correct PC IPv4 address
- Ensure Windows Firewall rule allows port 5000
- Test from another PC: `curl http://<PC-IP>:5000/api/health`

**DHT Read Failed**
- Check wiring (VCC, GND, DATA to GPIO 4)
- Add 10kΩ pull-up resistor if using raw sensor
- Verify `#define DHTTYPE` matches your sensor (DHT22 or DHT11)

**400 Bad Request**
- Check payload types: temperature and humidity must be floats, soil_moisture must be integer
- View Serial output for posted JSON

---

## 📸 Screenshots

### Login Page
Beautiful agricultural theme with crop field background and glass-morphism design.

### Dashboard
Real-time sensor cards showing temperature, humidity, and soil moisture with live updates.

### Sensor Modal
Detailed view with 24-hour charts, irrigation controls, and water usage history.

### Charts & Analytics
Interactive historical data visualization with smooth animations.

*Screenshots coming soon! The project is fully functional - see Quick Start to run it yourself!*

---

## 📖 Documentation

### Complete Guides
- **[COMPLETE_BEGINNER_GUIDE.md](COMPLETE_BEGINNER_GUIDE.md)** - Step-by-step for beginners (14,000 words!)
- **[HARDWARE_SETUP_COMPLETE.md](HARDWARE_SETUP_COMPLETE.md)** - Full hardware setup guide
- **[START_HARDWARE_MODE.md](START_HARDWARE_MODE.md)** - Quick hardware start (5 steps)
- **[FIX_COM_PORT.md](FIX_COM_PORT.md)** - Troubleshoot COM port issues

### Quick References
- **[QUICK_START_CARD.md](QUICK_START_CARD.md)** - 5-step quick reference
- **[QUICK_START_AUTH.md](QUICK_START_AUTH.md)** - Authentication system guide
- **[WIRING_SIMPLE.md](WIRING_SIMPLE.md)** - Simple wiring diagrams

### Advanced Topics
- **[HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md)** - Technical architecture
- **[PUSH_TO_GITHUB.md](PUSH_TO_GITHUB.md)** - Deploy to GitHub guide
- **[PHOTO_BACKGROUND_GUIDE.md](PHOTO_BACKGROUND_GUIDE.md)** - UI customization

**All documentation is in the repository root directory!**

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👥 Authors

**Sakshi Gupta**
- GitHub: [@sakshigupta372](https://github.com/sakshigupta372)
- Repository: [Krishi_Setu](https://github.com/sakshigupta372/Krishi_Setu)

---

## 🙏 Acknowledgments

- **React.js** - Modern UI framework
- **Node.js & Express** - Powerful backend platform
- **SerialPort** - ESP32 communication library
- **Chart.js** - Beautiful data visualization
- **Arduino & Espressif** - ESP32 platform and tools
- **Open Source Community** - For amazing tools and libraries

---

## 🌟 Star This Project

If you find this project helpful, please consider giving it a ⭐ on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/sakshigupta372/Krishi_Setu.svg?style=social&label=Star)](https://github.com/sakshigupta372/Krishi_Setu)

---

## 📧 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/sakshigupta372/Krishi_Setu/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sakshigupta372/Krishi_Setu/discussions)
- **Email:** Open an issue for support

---

## 📝 Project Status

✅ **Active Development** - New features and improvements being added regularly!

### Recent Updates
- ✅ ESP32 serial communication integration
- ✅ User authentication system (JWT)
- ✅ Remote irrigation control
- ✅ Beautiful agricultural UI theme
- ✅ Comprehensive documentation (25+ guides!)

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Email/SMS alerts
- [ ] Weather API integration
- [ ] Multiple farm management
- [ ] AI-powered recommendations

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - You are free to:
✅ Use commercially
✅ Modify
✅ Distribute
✅ Use privately

With conditions:
📄 Include copyright notice
📄 Include license text
```

---

<div align="center">

### 🌾 **Krishi Setu** - Smart Farming for a Better Tomorrow 🌍

**Made with ❤️ for farmers everywhere**

[⭐ Star](https://github.com/sakshigupta372/Krishi_Setu) • [🐛 Report Bug](https://github.com/sakshigupta372/Krishi_Setu/issues) • [💡 Request Feature](https://github.com/sakshigupta372/Krishi_Setu/issues)

**Happy Farming! 🚜**

</div>
