# 🔌 Simple Wiring Guide - Soil Sensor + Relay + Pump

## 📐 Your Hardware Wiring

### Visual Diagram:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│                BREADBOARD (Optional)             │
│                                                  │
│  ─────────────────────────────────────────────  │ ← Power rail (+)
│  ═════════════════════════════════════════════  │ ← Ground rail (-)
│                                                  │
└──────────────────────────────────────────────────┘
           │                    │
           │                    │
    ┌──────┴─────┐       ┌─────┴──────┐
    │ Soil Sensor│       │   Relay    │
    │            │       │   Module   │
    └─────┬──────┘       └─────┬──────┘
          │                    │
      VCC OUT GND          VCC IN GND
       │   │   │            │  │  │
       │   │   └────────────┼──┼──┤
       │   │                │  │  │
       │   └────────────┐   │  │  │
       │                │   │  │  │
┌──────┴────────────────┴───┴──┴──┴───────┐
│                                          │
│           ESP32 Board                    │
│                                          │
│  3.3V   GPIO34   GND   VIN  GPIO5  GND  │
└──────────────────────────────────────────┘
                                   │
                            ┌──────┴──────┐
                            │  Water Pump │
                            │   (via      │
                            │   Relay)    │
                            └─────────────┘
```

---

## 🎯 STEP-BY-STEP WIRING

### STEP 1: Soil Moisture Sensor

#### Connections:
```
Soil Sensor Pin      Wire Color      ESP32 Pin
─────────────────    ──────────      ─────────
VCC                  RED             3.3V
OUT (Analog)         YELLOW          GPIO 34
GND                  BLACK           GND
```

#### Visual:
```
Soil Sensor
┌─────────────┐
│  VCC OUT GND│
└───┬───┬───┬─┘
    │   │   │
    │   │   └───── BLACK wire → ESP32 GND
    │   └───────── YELLOW wire → ESP32 GPIO 34
    └───────────── RED wire → ESP32 3.3V
```

---

### STEP 2: Relay Module

#### Connections:
```
Relay Pin       Wire Color      ESP32 Pin
──────────      ──────────      ─────────
VCC             RED             VIN (5V)
IN              GREEN           GPIO 5
GND             BLACK           GND
```

#### Visual:
```
Relay Module
┌──────────────────┐
│  VCC  IN  GND    │
└───┬───┬───┬──────┘
    │   │   │
    │   │   └─────── BLACK wire → ESP32 GND
    │   └─────────── GREEN wire → ESP32 GPIO 5
    └─────────────── RED wire → ESP32 VIN

   COM  NO  NC
    │   │   │
    │   │   └─────── Leave empty (not used)
    │   └─────────── Goes to PUMP (+)
    └─────────────── Goes to POWER (-)
```

---

### STEP 3: Water Pump to Relay

#### Connections:
```
Relay Terminal      Wire               Pump / Power
──────────────      ────               ────────────
COM                 BLACK              Power Supply (-)
NO                  RED                Pump (+)

Pump (-)            BLACK              Power Supply (-)
```

#### Visual:
```
Power Supply          Relay              Pump
┌──────────┐         ┌─────┐         ┌──────┐
│    +     ├─────────┤     │         │  +   │
│          │         │     │         │      │
│    -     ├────┬────┤ COM ├─────────┤  -   │
└──────────┘    │    └──┬──┘         └──────┘
                │       │
                └───────┤ NO
                        │
                    Not Used
                        │ NC
```

**How It Works:**
- When relay is **OFF**: COM and NO are disconnected, pump is OFF
- When relay is **ON**: COM and NO connect, pump gets power and runs

---

## 🎨 COLOR-CODED WIRING

### Recommended Wire Colors:
```
RED     = Power (3.3V, 5V, +12V)
BLACK   = Ground (GND, -)
YELLOW  = Soil Sensor Data (GPIO 34)
GREEN   = Relay Control (GPIO 5)
```

### Full Connection Map:
```
ESP32 Pin          Wire Color     Goes To
─────────────      ──────────     ───────────────────
3.3V               RED            Soil Sensor VCC
GPIO 34            YELLOW         Soil Sensor OUT
GND (near GPIO34)  BLACK          Soil Sensor GND
VIN                RED            Relay VCC
GPIO 5             GREEN          Relay IN
GND (near GPIO5)   BLACK          Relay GND
```

---

## 📋 WIRING CHECKLIST

### Before Connecting Power:

#### Soil Sensor:
- [ ] RED wire: Soil VCC → ESP32 3.3V
- [ ] YELLOW wire: Soil OUT → ESP32 GPIO 34
- [ ] BLACK wire: Soil GND → ESP32 GND

#### Relay Module:
- [ ] RED wire: Relay VCC → ESP32 VIN
- [ ] GREEN wire: Relay IN → ESP32 GPIO 5
- [ ] BLACK wire: Relay GND → ESP32 GND

#### Water Pump:
- [ ] Pump (+) RED wire → Relay NO terminal
- [ ] Pump (-) BLACK wire → Power Supply (-)
- [ ] Relay COM terminal → Power Supply (-)

### Safety Check:
- [ ] No wires touching each other (short circuit)
- [ ] All RED wires go to power pins only
- [ ] All BLACK wires go to GND pins only
- [ ] Relay is rated for your pump voltage (5V or 12V)
- [ ] Power supply voltage matches pump voltage

---

## 🔧 USING A BREADBOARD (OPTIONAL)

### Layout:
```
           Breadboard
┌────────────────────────────────┐
│ + + + + + + + + + + + + + + +  │ ← Red power rail (3.3V from ESP32)
│                                │
│ - - - - - - - - - - - - - - -  │ ← Black ground rail (GND from ESP32)
└────────────────────────────────┘
     │                    │
     │ Connect sensors    │
     │ and relay here     │
     └────────────────────┘
```

### Advantage of Breadboard:
- ✅ Easy to connect multiple GND pins
- ✅ Share power rail between sensors
- ✅ Easy to add/remove components
- ✅ No soldering required

---

## ⚠️ IMPORTANT NOTES

### GPIO 34 Pin:
- ✅ **Input only** pin (perfect for sensors)
- ✅ ADC1 channel (reads 0-4095)
- ❌ Cannot be OUTPUT (don't use for relay)
- ❌ No internal pull-up/pull-down

### GPIO 5 Pin:
- ✅ Can be INPUT or OUTPUT
- ✅ Perfect for relay control
- ✅ Has internal pull-up resistor

### Relay Power:
- ⚡ Use **VIN** (5V) for relay, not 3.3V
- ⚡ Most relays need 5V to operate reliably
- ⚡ VIN provides 5V when powered via USB

### Pump Power:
- 🔋 **5V pump**: Can share USB power (but may be weak)
- 🔋 **12V pump**: MUST use external 12V power supply
- ❌ **Never** connect 12V to ESP32 directly!

---

## 🧪 TESTING WITHOUT WATER

### Test 1: LED Test (Before Pump)
Instead of pump, connect **LED + resistor**:
```
Relay NO → LED (+) → 220Ω Resistor → GND
Relay COM → Power (+)
```
When relay activates, LED lights up!

### Test 2: Multimeter Test
```
Set multimeter to Voltage mode
Touch probes to:
- Relay NO (should show 0V when OFF)
- Relay COM (should show power voltage)

When irrigation starts:
- NO should show same voltage as COM
```

---

## 📸 PHOTO CHECKLIST

### Take Photos of:
1. **Soil sensor connections** (close-up)
2. **Relay connections** (close-up)
3. **ESP32 pins** (which ones used)
4. **Pump wiring** to relay
5. **Full setup** (top view)

Compare with online examples!

---

## ❌ COMMON MISTAKES

### Mistake 1: Wrong GPIO Pins
```
❌ WRONG:
   Soil OUT → GPIO 5   (GPIO 5 is for OUTPUT, not ADC)
   Relay IN → GPIO 34  (GPIO 34 is INPUT only)

✅ CORRECT:
   Soil OUT → GPIO 34  (GPIO 34 is ADC input)
   Relay IN → GPIO 5   (GPIO 5 is digital output)
```

### Mistake 2: Wrong Power Connections
```
❌ WRONG:
   Relay VCC → 3.3V    (Too weak, relay won't click)
   Soil VCC → VIN      (Too high, may damage sensor)

✅ CORRECT:
   Relay VCC → VIN     (5V, relay works properly)
   Soil VCC → 3.3V     (Safe voltage for sensor)
```

### Mistake 3: Relay Wiring
```
❌ WRONG:
   Pump (+) → COM      (Pump always powered)
   Power (-) → NO      (Wrong connection)

✅ CORRECT:
   Power (-) → COM     (Common connection)
   Pump (+) → NO       (Switched connection)
```

---

## 🎯 QUICK REFERENCE

### Pin Summary:
```
ESP32 Pin      Purpose              Wire Color
─────────      ───────              ──────────
3.3V           Soil Sensor Power    RED
GPIO 34        Soil Sensor Data     YELLOW
GND            Ground (All)         BLACK
VIN (5V)       Relay Power          RED
GPIO 5         Relay Control        GREEN
```

### Relay Terminal Summary:
```
Terminal       Connects To
────────       ───────────
VCC            ESP32 VIN (5V)
IN             ESP32 GPIO 5
GND            ESP32 GND
COM            Power Supply (-)
NO             Pump (+)
NC             Not used
```

---

## 🔍 VERIFICATION

### Visual Check:
- [ ] Soil sensor has 3 wires connected
- [ ] Relay module has 3 wires to ESP32
- [ ] Relay has 2 terminals to pump/power
- [ ] No loose wires
- [ ] No exposed metal touching

### Voltage Check (Multimeter):
- [ ] ESP32 3.3V pin = 3.3V
- [ ] ESP32 VIN pin = 5V (when USB connected)
- [ ] Soil sensor VCC = 3.3V
- [ ] Relay VCC = 5V

---

## 📞 NEED HELP?

### If Stuck:
1. **Take clear photos** of your wiring
2. **Label** which wire goes where
3. **Note** any error messages
4. **Send** to me for debugging

**I'll help you get it working!** 💪

---

**🎉 Follow this guide and your wiring will be PERFECT! 🔌✨**
