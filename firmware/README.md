# HakexSync ESP32 Firmware

## Required Libraries

Install all via **Arduino IDE → Sketch → Include Library → Manage Libraries**:

| Library | Author | Version |
|---|---|---|
| PubSubClient | Nick O'Leary | ≥ 2.8 |
| ArduinoJson | Benoit Blanchon | ≥ 7.x |
| DHT sensor library | Adafruit | ≥ 1.4 (optional) |
| Adafruit Unified Sensor | Adafruit | ≥ 1.1 (DHT dep) |

## Board Setup

1. **Arduino IDE → Preferences → Additional boards URLs:**
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
2. **Tools → Board → ESP32 Dev Module** (or your specific variant)
3. **Tools → Upload Speed → 115200**
4. **Tools → Flash Size → 4MB**

## Wiring (with DHT22 sensor)

```
ESP32            DHT22
─────            ─────
GPIO 4    ───►  DATA
3.3V      ───►  VCC
GND       ───►  GND
                DATA ──[10kΩ]── VCC  (pull-up resistor)
```

Without a DHT sensor: comment out `#define USE_DHT_SENSOR` in the sketch —
it will send simulated temperature/CPU/memory values so the dashboard still shows live data.

## First-Boot Provisioning Flow

```
Flash firmware
     │
     ▼
ESP32 boots → no saved config
     │
     ▼
Starts WiFi AP: "HakexSync-Setup" (open network)
     │
     ▼
You connect your phone/laptop to "HakexSync-Setup"
     │
     ▼
Open browser → 192.168.4.1
     │
     ▼
Captive portal page loads
     │
     ├─ Scan QR from HakexSync app  ──► fields auto-fill
     │   OR
     └─ Paste JSON manually
     │
     ▼
Enter your WiFi password → tap "Save & Connect"
     │
     ▼
ESP32 saves to flash, restarts, connects to your WiFi + HiveMQ
     │
     ▼
HakexSync dashboard shows device ONLINE ✅
```

## MQTT Topics Published by ESP32

| Topic | Content | Retained |
|---|---|---|
| `hakexsync/{uid}/{deviceId}/telemetry` | `{"temp":24.5,"cpu":18,"mem":45,"rssi":-65,"uptime_s":120}` | No |
| `hakexsync/{uid}/{deviceId}/ping` | `{"ts":123456}` | No |
| `hakexsync/{uid}/{deviceId}/status` | `{"status":"online"}` or `{"status":"offline"}` (LWT) | Yes |

## MQTT Topics Subscribed by ESP32

| Topic | Payload | Action |
|---|---|---|
| `hakexsync/{uid}/{deviceId}/cmd` | `{"action":"ping"}` | Sends immediate ping |
| `hakexsync/{uid}/{deviceId}/cmd` | `{"action":"restart"}` | Restarts ESP32 |
| `hakexsync/{uid}/{deviceId}/cmd` | `{"action":"reset"}` | Clears config, re-enters provisioning mode |
| `hakexsync/{uid}/{deviceId}/cmd` | `{"action":"interval","value":10000}` | Changes publish interval (ms) |

## Reset to Provisioning Mode

From the HakexSync dashboard → Device Detail → Send Command → Reset.
Or hold GPIO 0 (BOOT button) for 3 seconds while powered.

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't see "HakexSync-Setup" AP | Check Serial monitor — make sure it prints `[AP] Started` |
| Captive portal doesn't open | Navigate manually to `192.168.4.1` |
| MQTT not connecting | Check Serial for MQTT state code. State -2 = can't reach broker (WiFi issue). State 5 = auth rejected. |
| Device stays offline in app | Verify the `mqtt_topic` in QR matches `hakexsync/{uid}/{deviceId}` exactly |
| DHT reads NaN | Check wiring and pull-up resistor. Try changing DHT_TYPE to DHT11. |
