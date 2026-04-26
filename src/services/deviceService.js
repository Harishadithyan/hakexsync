// src/services/deviceService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp, orderBy,
} from "firebase/firestore";
import { ref, onValue, set, off } from "firebase/database";
import { db, rtdb } from "./firebase";
import { generateDeviceToken } from "./qrService";

export function listenDevices(uid, callback) {
  const q = query(
    collection(db, "devices"),
    where("ownerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addDevice(uid, data) {
  const token  = generateDeviceToken();
  const docRef = await addDoc(collection(db, "devices"), {
    ownerId:      uid,
    name:         data.name,
    type:         data.type,
    location:     data.location,
    status:       "offline",
    syncProgress: 0,
    uptime:       "—",
    alerts:       0,
    mqttToken:    token,
    mqttTopic:    `hakexsync/${uid}/PLACEHOLDER`,
    paired:       false,
    createdAt:    serverTimestamp(),
    lastSeen:     null,
  });
  await updateDoc(doc(db, "devices", docRef.id), {
    mqttTopic: `hakexsync/${uid}/${docRef.id}`,
  });
  await set(ref(rtdb, `telemetry/${docRef.id}`), {
    cpu: null, mem: null, temp: null, timestamp: Date.now(),
  });
  return { id: docRef.id, token };
}

export async function updateDevice(id, data) {
  await updateDoc(doc(db, "devices", id), {
    name: data.name, type: data.type, location: data.location,
  });
}

export async function deleteDevice(id) {
  await deleteDoc(doc(db, "devices", id));
  await set(ref(rtdb, `telemetry/${id}`), null);
}

export async function markDevicePaired(id) {
  await updateDoc(doc(db, "devices", id), {
    paired: true, status: "online", lastSeen: new Date().toISOString(),
  });
}

export function listenTelemetry(deviceId, callback) {
  const r = ref(rtdb, `telemetry/${deviceId}`);
  onValue(r, (snap) => callback(snap.val()));
  return () => off(r);
}

export async function pushTelemetry(deviceId, data) {
  await set(ref(rtdb, `telemetry/${deviceId}`), { ...data, timestamp: Date.now() });
}
