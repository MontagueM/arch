import React, { useCallback, useMemo, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export interface UseWebSocketProcessOptions {
  onOpen?: (ws: WebSocket) => void;
  onMessageString?: (data: string) => void;
  onMessageBlob?: (data: Blob) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export interface WebSocketBaseMessage {
  type: string;
  progress?: number;
  message?: string;
}

export function useWebSocketProcess(wsUrl: string, loadingText: string) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  const startProcess = useCallback(
    (options: UseWebSocketProcessOptions) => {
      if (!wsUrl) return;

      wsRef.current?.close();
      setLoading(true);
      setProgress(0);

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const fullUrl = `${protocol}://localhost:8000${wsUrl}`;
      wsRef.current = new WebSocket(fullUrl);

      wsRef.current.onopen = () => {
        setLoading(true);
        options.onOpen?.(wsRef.current as WebSocket);
      };

      wsRef.current.onmessage = (event) => {
        const data = event.data;
        if (typeof data === "string") {
          try {
            const msg: WebSocketBaseMessage = JSON.parse(data);
            if (msg.type === "progress" && msg.progress) {
              setProgress(msg.progress);
            } else if (msg.type === "error" && msg.message) {
              console.error("WS error:", msg.message);
            } else {
              options.onMessageString?.(data);
            }
          } catch (err) {
            console.error("JSON parse error:", err);
          }
        } else if (data instanceof Blob) {
          options.onMessageBlob?.(data);
        } else {
          console.error("Unknown message type:", data);
        }
      };

      wsRef.current.onerror = (error) => {
        setLoading(false);
        options.onError?.(error);
      };

      wsRef.current.onclose = () => {
        setLoading(false);
        options.onClose?.();
      };
    },
    [wsUrl],
  );

  const setProgressSafely = useCallback((val: number) => {
    setProgress(Math.max(0, Math.min(100, val)));
  }, []);

  const loadingElement = useMemo(() => {
    if (!loading) {
      return null;
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          width: "100%",
          height: "100%",
        }}
      >
        <CircularProgress
          variant={progress > 0 ? "determinate" : "indeterminate"}
          value={progress}
        />
        <Typography>{loadingText}...</Typography>
        {progress > 0 && <Typography>{progress}%</Typography>}
      </Box>
    );
  }, [loading, loadingText, progress]);

  return {
    loading,
    progress,
    setLoading,
    setProgress: setProgressSafely,
    startProcess,
    loadingElement,
  };
}
