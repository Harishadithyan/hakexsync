// src/services/qrService.js
// Generates a QR code that encodes all the credentials an ESP32 needs
// to connect to WiFi + HiveMQ and start publishing telemetry.

import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

// ── Generate a unique device token ────────────────────────────────
export function generateDeviceToken() {
  return uuidv4().replace(/-/g, "").slice(0, 16).toUpperCase();
}

// ── Build the JSON payload encoded into the QR ────────────────────
// The ESP32 firmware reads this JSON over Serial/BLE provisioning
// or you display it and the user types the fields into the ESP32's
// captive-portal WiFi setup page.
// ── Build QR payload (UPDATED FOR HIVEMQ CLOUD) ───────────────────
export function buildPairingPayload({
  uid,
  deviceId,
  deviceName,
  ssid = "",
  token,
}) {
  return {
    device: {
      uid,
      id: deviceId,
      name: deviceName,
      token,
    },

    mqtt: {
      host: "f68bbb2b711f4902b954a1d708c64437.s1.eu.hivemq.cloud",
      port: 8883,
      tls: true,

      // ⚠️ Replace with your HiveMQ credentials
      username: "YOUR_USERNAME",
      password: "YOUR_PASSWORD",

      base_topic: `hakexsync/${uid}/${deviceId}`,
    },

    wifi: {
      ssid,
      password: "",
    },

    settings: {
      interval_ms: 5000,
    },
  };
}

// ── Render QR to a <canvas> element ───────────────────────────────
export async function renderQRToCanvas(canvas, payload) {
  const json = JSON.stringify(payload);
  await QRCode.toCanvas(canvas, json, {
    width:            280,
    margin:           2,
    color: {
      dark:  "#E5E7EB",   // light dots  (matches --text)
      light: "#0E0B28",   // dark bg     (matches --surface)
    },
    errorCorrectionLevel: "M",
  });
}

// ── Render QR to a data-URL (for <img> tags) ──────────────────────
export async function renderQRToDataURL(payload) {
  const json = JSON.stringify(payload);
  return QRCode.toDataURL(json, {
    width:  280,
    margin: 2,
    color: { dark: "#E5E7EB", light: "#0E0B28" },
    errorCorrectionLevel: "M",
  });
}
