/*
 * ============================================================
 *  HakexSync ESP32 Firmware  v1.0
 *  hakexsync_esp32.ino
 * ============================================================
 *
 *  WHAT IT DOES
 *  ─────────────
 *  1. On first boot → starts a WiFi Access Point called "HakexSync-Setup"
 *  2. Hosts a captive-portal web page at 192.168.4.1
 *  3. User scans the QR from the HakexSync dashboard and the portal
 *     pre-fills all fields (WiFi SSID/password + MQTT credentials).
 *  4. On save → connects to the user's WiFi and to HiveMQ broker.
 *  5. Every INTERVAL_MS it publishes:
 *       hakexsync/{uid}/{deviceId}/telemetry  →  JSON sensor data
 *       hakexsync/{uid}/{deviceId}/ping        →  heartbeat
 *       hakexsync/{uid}/{deviceId}/status      →  "online" on connect
 *                                                  "offline" on LWT
 *  6. Subscribes to:
 *       hakexsync/{uid}/{deviceId}/cmd         →  receives commands from app
 *
 *  DEPENDENCIES  (install via Arduino Library Manager)
 *  ─────────────
 *  - PubSubClient          by Nick O'Leary     (MQTT)
 *  - ArduinoJson           by Benoit Blanchon  (JSON)
 *  - Preferences           built-in ESP32 library
 *  - WebServer             built-in ESP32 library
 *  - WiFi                  built-in ESP32 library
 *  - DHT sensor library    by Adafruit         (if using DHT11/22)
 *  - Adafruit Unified Sensor                   (DHT dependency)
 *
 *  WIRING (optional DHT sensor)
 *  ─────────
 *  DHT11/22 DATA pin → GPIO 4
 *  VCC → 3.3V or 5V
 *  GND → GND
 *  (Add 10kΩ pull-up between DATA and VCC)
 *
 *  BOARDS MANAGER URL (if not added yet)
 *  ─────────
 *  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *  Board: "ESP32 Dev Module"  (or WEMOS D1 Mini ESP32, etc.)
 * ============================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ── Optional: DHT temperature/humidity sensor ─────────────────────
// Comment out if you don't have a DHT sensor wired up
#define USE_DHT_SENSOR
#ifdef USE_DHT_SENSOR
  #include <DHT.h>
  #define DHT_PIN  4
  #define DHT_TYPE DHT22   // change to DHT11 if needed
  DHT dht(DHT_PIN, DHT_TYPE);
#endif

// ── Captive portal AP settings ────────────────────────────────────
const char* AP_SSID     = "HakexSync-Setup";
const char* AP_PASSWORD = "";                  // open network

// ── HiveMQ public broker ──────────────────────────────────────────
const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;
// No username/password needed for the HiveMQ public broker.
// For HiveMQ Cloud (free tier), set these:
const char* MQTT_USER = "";
const char* MQTT_PASS = "";

// ── Telemetry interval ────────────────────────────────────────────
unsigned long INTERVAL_MS = 5000;

// ── Global state ──────────────────────────────────────────────────
Preferences   prefs;
WebServer     server(80);
WiFiClient    wifiClient;
PubSubClient  mqtt(wifiClient);

// Config loaded from flash
String  cfg_wifi_ssid;
String  cfg_wifi_pass;
String  cfg_uid;
String  cfg_device_id;
String  cfg_token;
String  cfg_topic_root;       // hakexsync/{uid}/{deviceId}
bool    provisioned = false;

unsigned long lastPublish = 0;
bool          mqttConnected = false;

// ─────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[HakexSync] Booting...");

#ifdef USE_DHT_SENSOR
  dht.begin();
  Serial.println("[DHT] Sensor initialized");
#endif

  // Load saved config from NVS flash
  prefs.begin("hakexsync", false);
  cfg_wifi_ssid   = prefs.getString("wifi_ssid",  "");
  cfg_wifi_pass   = prefs.getString("wifi_pass",  "");
  cfg_uid         = prefs.getString("hs_uid",     "");
  cfg_device_id   = prefs.getString("hs_did",     "");
  cfg_token       = prefs.getString("hs_token",   "");
  cfg_topic_root  = prefs.getString("mqtt_topic", "");
  prefs.end();

  provisioned = (cfg_wifi_ssid.length() > 0 && cfg_device_id.length() > 0);

  if (provisioned) {
    Serial.println("[Config] Found saved config — connecting to WiFi");
    connectWiFi();
  } else {
    Serial.println("[Config] No config — starting provisioning AP");
    startProvisioningAP();
  }
}

// ─────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────
void loop() {
  if (!provisioned) {
    // Serve captive portal
    server.handleClient();
    return;
  }

  // Keep WiFi alive
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection — reconnecting...");
    connectWiFi();
  }

  // Keep MQTT alive
  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  // Publish telemetry on interval
  unsigned long now = millis();
  if (now - lastPublish >= INTERVAL_MS) {
    lastPublish = now;
    publishTelemetry();
    publishPing();
  }
}

// ─────────────────────────────────────────────────────────────────
//  WiFi
// ─────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s ...\n", cfg_wifi_ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfg_wifi_ssid.c_str(), cfg_wifi_pass.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    setupMQTT();
  } else {
    Serial.println("\n[WiFi] Failed — falling back to provisioning AP");
    startProvisioningAP();
  }
}

// ─────────────────────────────────────────────────────────────────
//  MQTT setup
// ─────────────────────────────────────────────────────────────────
void setupMQTT() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMQTTMessage);
  mqtt.setKeepAlive(60);
  mqtt.setBufferSize(512);
  connectMQTT();
}

void connectMQTT() {
  String clientId = "hakexsync_" + cfg_device_id.substring(0, 8) + "_" + String(random(0xffff), HEX);
  String willTopic  = cfg_topic_root + "/status";
  String willMsg    = "{\"status\":\"offline\"}";
  String subTopic   = cfg_topic_root + "/cmd";

  Serial.printf("[MQTT] Connecting as %s ...\n", clientId.c_str());

  bool ok;
  if (strlen(MQTT_USER) > 0) {
    ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS,
                      willTopic.c_str(), 1, true, willMsg.c_str());
  } else {
    ok = mqtt.connect(clientId.c_str(), nullptr, nullptr,
                      willTopic.c_str(), 1, true, willMsg.c_str());
  }

  if (ok) {
    Serial.println("[MQTT] Connected to HiveMQ broker!");
    mqttConnected = true;

    // Subscribe to commands from the app
    mqtt.subscribe(subTopic.c_str(), 1);
    Serial.printf("[MQTT] Subscribed to %s\n", subTopic.c_str());

    // Announce online
    publishStatus("online");

    // First telemetry burst immediately
    publishTelemetry();
    publishPing();
  } else {
    Serial.printf("[MQTT] Connection failed (state=%d) — retrying in 5s\n", mqtt.state());
    delay(5000);
  }
}

// ─────────────────────────────────────────────────────────────────
//  MQTT Incoming command handler
// ─────────────────────────────────────────────────────────────────
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  Serial.printf("[MQTT] CMD received on %s: %s\n", topic, msg.c_str());

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, msg);
  if (err) return;

  const char* action = doc["action"];
  if (!action) return;

  if (strcmp(action, "ping") == 0) {
    publishPing();
  } else if (strcmp(action, "reset") == 0) {
    Serial.println("[CMD] Resetting provisioning...");
    clearConfig();
    delay(500);
    ESP.restart();
  } else if (strcmp(action, "interval") == 0) {
    int ms = doc["value"] | 5000;
    INTERVAL_MS = max(1000, ms);
    Serial.printf("[CMD] Interval set to %lu ms\n", INTERVAL_MS);
  } else if (strcmp(action, "restart") == 0) {
    ESP.restart();
  }
}

// ─────────────────────────────────────────────────────────────────
//  Publish helpers
// ─────────────────────────────────────────────────────────────────
void publishTelemetry() {
  StaticJsonDocument<256> doc;

  // System metrics (always available)
  doc["rssi"]     = WiFi.RSSI();
  doc["uptime_s"] = millis() / 1000;
  doc["heap"]     = ESP.getFreeHeap();
  doc["device_id"]= cfg_device_id;

#ifdef USE_DHT_SENSOR
  float temp = dht.readTemperature();   // Celsius
  float hum  = dht.readHumidity();
  if (!isnan(temp)) doc["temp"] = round(temp * 10.0) / 10.0;
  if (!isnan(hum))  doc["hum"]  = round(hum  * 10.0) / 10.0;
  // HakexSync also reads cpu/mem — not applicable on ESP32,
  // but we can simulate meaningful values for demo:
  doc["cpu"] = (float)random(10, 40);   // remove if you have real load data
  doc["mem"] = map(ESP.getFreeHeap(), 0, ESP.getHeapSize(), 95, 10);
#else
  // No sensor — send simulated values so the dashboard shows data
  doc["temp"] = 22.0 + (float)random(-20, 40) / 10.0;
  doc["cpu"]  = (float)random(5, 50);
  doc["mem"]  = (float)random(20, 70);
#endif

  String out;
  serializeJson(doc, out);

  String topic = cfg_topic_root + "/telemetry";
  mqtt.publish(topic.c_str(), out.c_str(), false);
  Serial.printf("[MQTT] Telemetry → %s\n", out.c_str());
}

void publishPing() {
  StaticJsonDocument<64> doc;
  doc["ts"] = millis();
  String out;
  serializeJson(doc, out);
  String topic = cfg_topic_root + "/ping";
  mqtt.publish(topic.c_str(), out.c_str(), false);
}

void publishStatus(const char* status) {
  StaticJsonDocument<64> doc;
  doc["status"] = status;
  String out;
  serializeJson(doc, out);
  String topic = cfg_topic_root + "/status";
  mqtt.publish(topic.c_str(), out.c_str(), true);   // retained
}

// ─────────────────────────────────────────────────────────────────
//  Provisioning AP + Captive Portal
// ─────────────────────────────────────────────────────────────────
void startProvisioningAP() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.printf("[AP] Started. IP: %s\n", WiFi.softAPIP().toString().c_str());

  // Routes
  server.on("/",       HTTP_GET,  handleRoot);
  server.on("/save",   HTTP_POST, handleSave);
  server.on("/status", HTTP_GET,  handleAPStatus);
  server.onNotFound(handleRoot);   // redirect any URL to portal
  server.begin();
  Serial.println("[AP] HTTP server started on port 80");
}

// ── Captive portal HTML ──────────────────────────────────────────
void handleRoot() {
  // The QR code JSON is optionally passed as a query param ?data=...
  // so users can also navigate directly and paste the JSON.
  String page = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HakexSync Setup</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#080616;color:#E5E7EB;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0E0B28;border:1px solid rgba(47,47,228,0.25);border-radius:20px;padding:32px 28px;width:100%;max-width:440px}
h1{font-size:22px;font-weight:800;margin-bottom:4px;color:#fff}
.sub{font-size:13px;color:#6B7280;margin-bottom:28px;line-height:1.6}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(47,47,228,0.12);border:1px solid rgba(47,47,228,0.3);border-radius:100px;padding:4px 12px;font-size:11px;font-weight:600;color:#9B7AFF;margin-bottom:20px}
label{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#9CA3AF;margin-bottom:6px}
input,textarea{width:100%;background:#14103A;border:1px solid rgba(47,47,228,0.2);border-radius:10px;padding:12px 14px;color:#E5E7EB;font-size:14px;outline:none;margin-bottom:14px;font-family:inherit}
input:focus,textarea:focus{border-color:#2F2FE4;box-shadow:0 0 0 3px rgba(47,47,228,0.12)}
textarea{height:90px;resize:vertical;font-size:12px;font-family:monospace}
.btn{width:100%;background:linear-gradient(135deg,#2F2FE4,#162E93);border:none;border-radius:12px;padding:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px}
.btn:hover{opacity:.9}
.divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:#6B7280;font-size:12px}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(47,47,228,0.15)}
.info{background:rgba(47,47,228,0.06);border:1px solid rgba(47,47,228,0.15);border-radius:10px;padding:12px 14px;font-size:12px;color:#6B7280;line-height:1.6;margin-bottom:18px}
.info code{color:#9B7AFF;font-size:11px}
</style>
</head>
<body>
<div class="card">
  <div class="badge">⬡ HakexSync</div>
  <h1>Device Setup</h1>
  <p class="sub">Enter your WiFi credentials and paste the JSON from the HakexSync QR code, or let the app pre-fill by scanning the QR.</p>

  <div class="info">
    📱 Scan the QR code shown in the HakexSync app — it will paste all MQTT credentials automatically.
    Then just enter your <code>WiFi password</code> and tap Save.
  </div>

  <form method="POST" action="/save">
    <label>WiFi Network (SSID)</label>
    <input name="wifi_ssid" id="wifi_ssid" placeholder="Your WiFi name" required>

    <label>WiFi Password</label>
    <input name="wifi_pass" id="wifi_pass" type="password" placeholder="Your WiFi password">

    <div class="divider">OR paste QR JSON below</div>

    <label>QR Code JSON (paste from app)</label>
    <textarea name="qr_json" id="qr_json" placeholder='{"hs_uid":"...","hs_did":"...","mqtt_topic":"...",...}'></textarea>

    <div class="divider">MQTT credentials (auto-filled from QR)</div>

    <label>MQTT Topic Root</label>
    <input name="mqtt_topic" id="mqtt_topic" placeholder="hakexsync/uid/deviceId">

    <label>Device ID</label>
    <input name="hs_did" id="hs_did" placeholder="Firestore device document ID">

    <label>User ID (UID)</label>
    <input name="hs_uid" id="hs_uid" placeholder="Firebase user UID">

    <label>Pairing Token</label>
    <input name="hs_token" id="hs_token" placeholder="16-char token">

    <button type="submit" class="btn">Save &amp; Connect →</button>
  </form>
</div>

<script>
// Auto-fill fields when QR JSON is pasted
document.getElementById('qr_json').addEventListener('input', function(){
  try {
    const d = JSON.parse(this.value.trim());
    if(d.wifi_ssid)   document.getElementById('wifi_ssid').value   = d.wifi_ssid;
    if(d.mqtt_topic)  document.getElementById('mqtt_topic').value  = d.mqtt_topic;
    if(d.hs_did)      document.getElementById('hs_did').value      = d.hs_did;
    if(d.hs_uid)      document.getElementById('hs_uid').value      = d.hs_uid;
    if(d.hs_token)    document.getElementById('hs_token').value    = d.hs_token;
  } catch(e){}
});
// Also check URL query param ?data=
const params = new URLSearchParams(window.location.search);
if(params.get('data')){
  document.getElementById('qr_json').value = decodeURIComponent(params.get('data'));
  document.getElementById('qr_json').dispatchEvent(new Event('input'));
}
</script>
</body>
</html>
)rawhtml";
  server.send(200, "text/html", page);
}

void handleSave() {
  String wifi_ssid  = server.arg("wifi_ssid");
  String wifi_pass  = server.arg("wifi_pass");
  String mqtt_topic = server.arg("mqtt_topic");
  String hs_did     = server.arg("hs_did");
  String hs_uid     = server.arg("hs_uid");
  String hs_token   = server.arg("hs_token");

  // Try to parse from raw QR JSON if direct fields are empty
  String qr_json = server.arg("qr_json");
  if (hs_did.isEmpty() && qr_json.length() > 10) {
    StaticJsonDocument<512> doc;
    if (!deserializeJson(doc, qr_json)) {
      if (doc["wifi_ssid"].as<String>().length())  wifi_ssid  = doc["wifi_ssid"].as<String>();
      if (doc["mqtt_topic"].as<String>().length()) mqtt_topic = doc["mqtt_topic"].as<String>();
      if (doc["hs_did"].as<String>().length())     hs_did     = doc["hs_did"].as<String>();
      if (doc["hs_uid"].as<String>().length())     hs_uid     = doc["hs_uid"].as<String>();
      if (doc["hs_token"].as<String>().length())   hs_token   = doc["hs_token"].as<String>();
    }
  }

  if (wifi_ssid.isEmpty() || hs_did.isEmpty()) {
    server.send(400, "text/plain", "Missing required fields");
    return;
  }

  // Persist to NVS flash
  prefs.begin("hakexsync", false);
  prefs.putString("wifi_ssid",  wifi_ssid);
  prefs.putString("wifi_pass",  wifi_pass);
  prefs.putString("hs_uid",     hs_uid);
  prefs.putString("hs_did",     hs_did);
  prefs.putString("hs_token",   hs_token);
  prefs.putString("mqtt_topic", mqtt_topic);
  prefs.end();

  String html = "<html><body style='font-family:sans-serif;background:#080616;color:#E5E7EB;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0'>"
                "<div style='text-align:center'>"
                "<div style='font-size:48px;margin-bottom:16px'>✅</div>"
                "<h2 style='font-size:22px;font-weight:800;margin-bottom:8px'>Saved!</h2>"
                "<p style='color:#6B7280'>Your ESP32 is now connecting to WiFi and HiveMQ.<br>"
                "Watch the HakexSync dashboard — it should go online in a few seconds.</p>"
                "</div></body></html>";
  server.send(200, "text/html", html);

  // Brief delay then restart into normal mode
  delay(2000);
  ESP.restart();
}

void handleAPStatus() {
  server.send(200, "application/json", "{\"status\":\"provisioning\"}");
}

// ─────────────────────────────────────────────────────────────────
//  Clear saved config (triggered by reset command from app)
// ─────────────────────────────────────────────────────────────────
void clearConfig() {
  prefs.begin("hakexsync", false);
  prefs.clear();
  prefs.end();
  Serial.println("[Config] Cleared all saved credentials");
}
