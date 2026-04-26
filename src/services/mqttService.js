// src/services/mqttService.js

import mqtt from "mqtt";
import { ref, push } from "firebase/database";
import { doc, updateDoc } from "firebase/firestore";
import { rtdb, db } from "./firebase";

// ── 🔥 Hivemq Cloud Config ─────────────────────────

// ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES
const BROKER_URL = "wss://f68bbb2b711f4902b954a1d708c64437.s1.eu.hivemq.cloud:8884/mqtt";

const OPTIONS = {
  username: "hakexsync_admin",
  password: "Hakex@sync89",

  keepalive: 60,
  connectTimeout: 30000,
  reconnectPeriod: 5000,
  clean: true,
};

// ── STATE ─────────────────────────────────────────
let client = null;
let currentUid = null;

const listeners = new Map();
const lastUpdateMap = new Map();
const deviceLastPing = new Map();

let retryCount = 0;
const MAX_RETRIES = 5;

// ── 🔒 MULTI TAB LOCK (FINAL FIX) ─────────────────
const TAB_LOCK_KEY = "mqtt_tab_lock";
const TAB_ID = Math.random().toString(36).slice(2);
let lockInterval = null;

function acquireLock() {
  const now = Date.now();
  const existing = JSON.parse(localStorage.getItem(TAB_LOCK_KEY) || "null");

  if (
    !existing ||
    existing.tabId === TAB_ID ||
    now - existing.timestamp > 4000
  ) {
    localStorage.setItem(
      TAB_LOCK_KEY,
      JSON.stringify({ tabId: TAB_ID, timestamp: now })
    );

    lockInterval = setInterval(() => {
      localStorage.setItem(
        TAB_LOCK_KEY,
        JSON.stringify({ tabId: TAB_ID, timestamp: Date.now() })
      );
    }, 2000);

    return true;
  }

  return false;
}

function releaseLock() {
  if (lockInterval) clearInterval(lockInterval);
  localStorage.removeItem(TAB_LOCK_KEY);
}

// ── HELPERS ───────────────────────────────────────
function shouldUpdate(deviceId, interval = 10000) {
  const now = Date.now();
  const last = lastUpdateMap.get(deviceId) || 0;

  if (now - last > interval) {
    lastUpdateMap.set(deviceId, now);
    return true;
  }
  return false;
}

function markPing(deviceId) {
  deviceLastPing.set(deviceId, Date.now());
}

// ── OFFLINE DETECTION ─────────────────────────────
setInterval(() => {
  const now = Date.now();

  deviceLastPing.forEach((last, deviceId) => {
    if (now - last > 60000) {
      updateDoc(doc(db, "devices", deviceId), {
        status: "offline",
      }).catch(() => {});
    }
  });
}, 30000);

// ── CONNECT ───────────────────────────────────────
export function mqttConnect(uid, onStateChange) {
  if (!uid) return;

  if (client && client.connected && currentUid === uid) return;

  if (!acquireLock()) {
    console.warn("[MQTT] Another tab already connected");
    return;
  }

  currentUid = uid;
  retryCount = 0;

  client = mqtt.connect(BROKER_URL, {
    ...OPTIONS,
    clientId: `hakex_${uid.slice(0, 6)}_${Math.random()
      .toString(16)
      .slice(2, 6)}`,
  });

  client.on("connect", () => {
    console.log("[MQTT] Connected to HiveMQ Cloud ✅");
    retryCount = 0;
    onStateChange?.("connected");

    client.subscribe(`hakexsync/${uid}/+/#`, { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error", err);
    });
  });

  client.on("reconnecting", () => {
    console.log("[MQTT] Reconnecting...");
    onStateChange?.("reconnecting");
  });

  client.on("offline", () => {
    console.log("[MQTT] Offline");
    onStateChange?.("disconnected");
  });

  client.on("error", (err) => {
    console.error("[MQTT] Error", err);

    retryCount++;

    if (retryCount > MAX_RETRIES) {
      console.error("[MQTT] Max retries reached. Stopping.");
      client.end(true);
      releaseLock();
    }

    onStateChange?.("error");
  });

  client.on("message", async (topic, payload) => {
    handleMessage(uid, topic, payload.toString());
  });

  window.addEventListener("beforeunload", mqttDisconnect);
}

// ── DISCONNECT ────────────────────────────────────
export function mqttDisconnect() {
  if (!client) return;

  client.end(true);
  client = null;
  currentUid = null;

  listeners.clear();
  releaseLock();

  console.log("[MQTT] Disconnected");
}

// ── PUBLISH ───────────────────────────────────────
export function mqttPublish(uid, deviceId, subtopic, payload) {
  if (!client?.connected) return;

  const topic = `hakexsync/${uid}/${deviceId}/${subtopic}`;
  const qos = subtopic === "telemetry" ? 0 : 1;

  client.publish(topic, JSON.stringify(payload), { qos });
}

// ── MESSAGE HANDLER ───────────────────────────────
async function handleMessage(uid, topic, raw) {
  if (!topic.startsWith(`hakexsync/${uid}/`)) return;

  const [, , deviceId, subtopic] = topic.split("/");

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = raw;
  }

  console.log("[MQTT]", topic, payload);

  // ── TELEMETRY → RTDB ────────────────────────────
  if (subtopic === "telemetry") {
    await push(ref(rtdb, `telemetry/${deviceId}`), {
      ...payload,
      timestamp: Date.now(),
    });

    if (shouldUpdate(deviceId)) {
      await updateDoc(doc(db, "devices", deviceId), {
        status: "online",
        lastSeen: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  // ── STATUS → Firestore ──────────────────────────
  if (subtopic === "status") {
    await updateDoc(doc(db, "devices", deviceId), {
      status: payload,
      lastSeen: new Date().toISOString(),
    }).catch(() => {});
  }

  // ── PING → heartbeat ────────────────────────────
  if (subtopic === "ping") {
    markPing(deviceId);
  }
}
