// src/hooks/useDevices.js
import { useEffect, useRef, useState } from "react";
import { listenDevices, listenTelemetry } from "../services/deviceService";
import { useAuth } from "../context/AuthContext";

export function useDevices() {
  const { user } = useAuth();
  const [devices,   setDevices]   = useState([]);
  const [telemetry, setTelemetry] = useState({});   // { [deviceId]: {...} }
  const [loading,   setLoading]   = useState(true);
  const unsubsRef = useRef([]);

  // 1️⃣  Firestore listener for device list
  useEffect(() => {
    if (!user) return;
    const unsub = listenDevices(user.uid, (devs) => {
      setDevices(devs);
      setLoading(false);

      // 2️⃣  For each device, subscribe to its RTDB telemetry
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];

      devs.forEach((dev) => {
        const stop = listenTelemetry(dev.id, (data) => {
          setTelemetry((prev) => ({ ...prev, [dev.id]: data }));
        });
        unsubsRef.current.push(stop);
      });
    });

    return () => {
      unsub();
      unsubsRef.current.forEach((fn) => fn());
    };
  }, [user]);

  // Merge telemetry into each device object for convenience
  const devicesWithTelemetry = devices.map((d) => ({
    ...d,
    telemetry: telemetry[d.id] ?? null,
  }));

  const onlineCount  = devicesWithTelemetry.filter((d) => d.status === "online").length;
  const offlineCount = devicesWithTelemetry.filter((d) => d.status === "offline").length;

  return { devices: devicesWithTelemetry, loading, onlineCount, offlineCount };
}
