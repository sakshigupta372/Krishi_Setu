const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class SerialHandler {
  constructor(onDataReceived, onIrrigationComplete) {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.onDataReceived = onDataReceived;
    this.onIrrigationComplete = onIrrigationComplete;
    this.portPath = null;
  }

  // List available serial ports
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      console.log('\n📡 Available Serial Ports:');
      ports.forEach((port, index) => {
        console.log(`${index + 1}. ${port.path}`);
        if (port.manufacturer) console.log(`   Manufacturer: ${port.manufacturer}`);
        if (port.productId) console.log(`   Product ID: ${port.productId}`);
      });
      return ports;
    } catch (error) {
      console.error('❌ Error listing ports:', error.message);
      return [];
    }
  }

  // Auto-detect ESP32
  async autoDetectESP32() {
    const ports = await this.listPorts();
    
    // Common ESP32 manufacturers/identifiers
    const esp32Keywords = ['CP210', 'CH340', 'UART', 'USB', 'Silicon Labs'];
    
    for (const port of ports) {
      const manufacturer = port.manufacturer || '';
      const vendorId = port.vendorId || '';
      const productId = port.productId || '';
      
      // Check if it's likely an ESP32
      if (
        esp32Keywords.some(keyword => manufacturer.includes(keyword)) ||
        vendorId === '10C4' || // Silicon Labs
        vendorId === '1A86'    // CH340
      ) {
        console.log(`\n✅ Found potential ESP32 on: ${port.path}`);
        return port.path;
      }
    }
    
    // If no ESP32 found, return first available port
    if (ports.length > 0) {
      console.log(`\n⚠️  No ESP32 detected, using first port: ${ports[0].path}`);
      return ports[0].path;
    }
    
    return null;
  }

  // Connect to serial port
  async connect(portPath = null) {
    try {
      // Auto-detect if no port specified
      if (!portPath) {
        portPath = await this.autoDetectESP32();
      }

      if (!portPath) {
        throw new Error('No serial port available');
      }

      this.portPath = portPath;

      console.log(`\n🔌 Connecting to: ${portPath}`);

      this.port = new SerialPort({
        path: portPath,
        baudRate: 115200,
        autoOpen: false
      });

      // Setup parser to read line by line
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // Open the port
      await new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.isConnected = true;
      console.log('✅ Serial port connected successfully!');
      console.log('📡 Listening for data from ESP32...\n');

      // Setup data listener
      this.parser.on('data', (line) => {
        this.handleSerialData(line);
      });

      // Handle errors
      this.port.on('error', (err) => {
        console.error('❌ Serial Port Error:', err.message);
        this.isConnected = false;
      });

      // Handle disconnect
      this.port.on('close', () => {
        console.log('🔌 Serial port closed');
        this.isConnected = false;
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to connect to serial port:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Handle incoming serial data
  handleSerialData(line) {
    line = line.trim();
    
    // Handle DATA: prefix (sensor readings)
    if (line.startsWith('DATA:')) {
      try {
        const jsonStr = line.substring(5); // Remove 'DATA:' prefix
        const data = JSON.parse(jsonStr);
        
        console.log('📊 Sensor Data:', {
          device: data.device_id,
          temp: data.temperature,
          humidity: data.humidity,
          soil: data.soil_moisture
        });
        
        // Call callback with sensor data
        if (this.onDataReceived) {
          this.onDataReceived(data);
        }
      } catch (error) {
        console.error('❌ Error parsing sensor data:', error.message);
      }
    }
    // Handle COMPLETE: prefix (irrigation completion)
    else if (line.startsWith('COMPLETE:')) {
      try {
        const jsonStr = line.substring(9); // Remove 'COMPLETE:' prefix
        const data = JSON.parse(jsonStr);
        
        console.log('✅ Irrigation Complete:', data);
        
        // Call callback with completion data
        if (this.onIrrigationComplete) {
          this.onIrrigationComplete(data);
        }
      } catch (error) {
        console.error('❌ Error parsing completion data:', error.message);
      }
    }
    // Log other messages for debugging
    else {
      console.log('📝', line);
    }
  }

  // Send command to ESP32
  sendCommand(command) {
    if (!this.isConnected || !this.port) {
      console.error('❌ Cannot send command: Not connected');
      return false;
    }

    try {
      this.port.write(command + '\n', (err) => {
        if (err) {
          console.error('❌ Error sending command:', err.message);
        } else {
          console.log(`📤 Sent command: ${command}`);
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error sending command:', error.message);
      return false;
    }
  }

  // Start irrigation
  startIrrigation(minutes) {
    return this.sendCommand(`START:${minutes}`);
  }

  // Stop irrigation
  stopIrrigation() {
    return this.sendCommand('STOP');
  }

  // Get status
  getStatus() {
    return this.sendCommand('STATUS');
  }

  // Disconnect
  disconnect() {
    if (this.port && this.isConnected) {
      this.port.close();
      console.log('🔌 Disconnected from serial port');
    }
    this.isConnected = false;
  }

  // Check connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      port: this.portPath
    };
  }
}

module.exports = SerialHandler;
