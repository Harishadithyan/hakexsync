// src/hooks/useMQTT.js

import { useEffect, useState, useCallback, useRef } from "react";
import {
  mqttConnect,
  mqttDisconnect,
  mqttPublish,
} from "../services/mqttService";
import { useAuth } from "../context/AuthContext";

export function useMQTT() {
  const { user } = useAuth();
  const [brokerState, setBrokerState] = useState("disconnected");

  // 🔥 IMPORTANT: Prevent double connect (React Strict Mode fix)
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!user) {
      mqttDisconnect();
      setBrokerState("disconnected");
      hasConnected.current = false;
      return;
    }

    // ✅ Prevent duplicate connection
    if (hasConnected.current) return;

    hasConnected.current = true;

    setBrokerState("connecting");

    mqttConnect(user.uid, (state) => {
      setBrokerState(state);
    });

    return () => {
      // Only reset flag, don't disconnect here
      // (disconnect handled when user becomes null)
      hasConnected.current = false;
    };
  }, [user?.uid]);

  // ── Publish helper ──────────────────────────────────────────────
  const publish = useCallback(
    (deviceId, subtopic, payload) => {
      if (!user) return;
      mqttPublish(user.uid, deviceId, subtopic, payload);
    },
    [user]
  );

  return {
    brokerState,
    publish,
    isConnected: brokerState === "connected",
  };
}