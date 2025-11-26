"""
Serial Bridge - Connects ESP32 (USB) to Backend (No WiFi Needed)
Reads data from ESP32 via USB serial and sends to backend API
"""

import serial
import serial.tools.list_ports
import requests
import json
import time
import sys

# Backend configuration
BACKEND_URL = "http://localhost:5000"
API_SENSOR_DATA = f"{BACKEND_URL}/api/sensor-data"
API_REGISTER = f"{BACKEND_URL}/api/devices/register"
API_IRRIGATION_COMPLETE = f"{BACKEND_URL}/api/irrigation/complete"

# Serial configuration
BAUD_RATE = 115200

def list_available_ports():
    """List all available COM ports"""
    ports = serial.tools.list_ports.comports()
    available_ports = []
    
    print("\n📡 Available COM Ports:")
    print("=" * 50)
    
    for i, port in enumerate(ports, 1):
        print(f"{i}. {port.device} - {port.description}")
        available_ports.append(port.device)
    
    print("=" * 50)
    return available_ports

def select_port():
    """Let user select COM port"""
    ports = list_available_ports()
    
    if not ports:
        print("❌ No COM ports found!")
        print("   - Check if ESP32 is connected")
        print("   - Try different USB port")
        print("   - Install CH340 driver if needed")
        return None
    
    if len(ports) == 1:
        print(f"\n✅ Auto-selecting only available port: {ports[0]}")
        return ports[0]
    
    while True:
        try:
            choice = input(f"\nSelect port (1-{len(ports)}): ").strip()
            index = int(choice) - 1
            if 0 <= index < len(ports):
                return ports[index]
            else:
                print(f"❌ Please enter number between 1 and {len(ports)}")
        except ValueError:
            print("❌ Please enter a valid number")
        except KeyboardInterrupt:
            print("\n\n❌ Cancelled by user")
            sys.exit(0)

def connect_serial(port):
    """Connect to ESP32 via serial"""
    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(2)  # Wait for connection to stabilize
        print(f"\n✅ Connected to {port} at {BAUD_RATE} baud")
        return ser
    except serial.SerialException as e:
        print(f"❌ Failed to connect to {port}: {e}")
        return None

def send_to_backend(endpoint, data):
    """Send data to backend API"""
    try:
        response = requests.post(endpoint, json=data, timeout=5)
        if response.status_code in [200, 201]:
            return True, response.status_code
        else:
            return False, response.status_code
    except requests.exceptions.RequestException as e:
        return False, str(e)

def process_line(line, device_registered):
    """Process line from ESP32"""
    line = line.strip()
    
    # Skip empty lines
    if not line:
        return device_registered
    
    # Print all non-data lines
    if not line.startswith("DATA:") and not line.startswith("COMPLETE:"):
        print(f"ESP32: {line}")
        return device_registered
    
    # Handle DATA: lines
    if line.startswith("DATA:"):
        try:
            json_str = line[5:]  # Remove "DATA:" prefix
            data = json.loads(json_str)
            
            # Register device on first data packet
            if not device_registered:
                device_info = {
                    "device_id": data.get("device_id"),
                    "device_name": data.get("device_name"),
                    "location": data.get("location")
                }
                success, code = send_to_backend(API_REGISTER, device_info)
                if success:
                    print(f"✅ Device registered: {device_info['device_id']} => {code}")
                    device_registered = True
                else:
                    print(f"⚠️  Device registration failed: {code}")
            
            # Send sensor data
            sensor_data = {
                "device_id": data.get("device_id"),
                "temperature": data.get("temperature"),
                "humidity": data.get("humidity"),
                "soil_moisture": data.get("soil_moisture")
            }
            success, code = send_to_backend(API_SENSOR_DATA, sensor_data)
            
            # Print summary
            soil = data.get("soil_moisture")
            raw = data.get("soil_raw")
            pump = data.get("pump_status")
            print(f"📊 Soil: {soil}% (raw: {raw}) | Pump: {pump} | Backend: {code}")
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
        except Exception as e:
            print(f"❌ Error processing data: {e}")
    
    # Handle COMPLETE: lines
    elif line.startswith("COMPLETE:"):
        try:
            json_str = line[9:]  # Remove "COMPLETE:" prefix
            data = json.loads(json_str)
            
            # Send completion report
            completion_data = {
                "device_id": data.get("device_id"),
                "command_id": 1,  # Dummy ID for manual irrigation
                "water_used_liters": data.get("water_used_liters")
            }
            success, code = send_to_backend(API_IRRIGATION_COMPLETE, completion_data)
            
            if success:
                print(f"✅ Irrigation completion reported => {code}")
            else:
                print(f"⚠️  Failed to report completion: {code}")
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
        except Exception as e:
            print(f"❌ Error processing completion: {e}")
    
    return device_registered

def main():
    print("\n" + "=" * 60)
    print("  🌱 Krishi Setu - Serial Bridge (No WiFi Mode)")
    print("=" * 60)
    print("\nThis script connects ESP32 (via USB) to Backend")
    print("Make sure:")
    print("  1. ESP32 is connected via USB")
    print("  2. Backend server is running (npm start)")
    print("  3. Arduino code 'esp32_no_wifi.ino' is uploaded")
    
    # Check backend
    print("\n🔍 Checking backend connection...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/devices", timeout=5)
        print(f"✅ Backend is running: {BACKEND_URL}")
    except requests.exceptions.RequestException:
        print(f"❌ Backend is NOT running!")
        print(f"   Start backend with: cd backend && npm start")
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Select COM port
    port = select_port()
    if not port:
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Connect to serial
    ser = connect_serial(port)
    if not ser:
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("  ✅ CONNECTED - Reading data from ESP32...")
    print("=" * 60)
    print("Commands you can type:")
    print("  START:10  - Start pump for 10 minutes")
    print("  STOP      - Stop pump")
    print("  STATUS    - Get system status")
    print("  QUIT      - Exit this program")
    print("=" * 60 + "\n")
    
    device_registered = False
    
    try:
        while True:
            # Read from ESP32
            if ser.in_waiting > 0:
                try:
                    line = ser.readline().decode('utf-8', errors='ignore')
                    device_registered = process_line(line, device_registered)
                except UnicodeDecodeError:
                    pass  # Skip malformed lines
                except Exception as e:
                    print(f"❌ Error reading serial: {e}")
            
            # Check for user commands (non-blocking)
            # Note: This is simplified - in production use threading
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping serial bridge...")
        ser.close()
        print("✅ Disconnected from ESP32")
        print("👋 Goodbye!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)
