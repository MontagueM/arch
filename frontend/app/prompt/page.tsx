// app/prompt/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useGlobalState } from "../../lib/state";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";

interface WebSocketMessage {
  type: string;
  progress?: number;
  image?: string;
  message?: string;
}

export default function PromptPage() {
  const router = useRouter();
  const { prompt, setGeneratedImage } = useGlobalState();
  const [image, setImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!prompt) {
      router.push("/");
      return;
    }

    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://localhost:8000/ws/generate-image`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connection established.");
      // Send the prompt to the server
      ws.current?.send(JSON.stringify({ prompt }));
    };

    ws.current.onmessage = (event) => {
      console.log(
        "WebSocket message received:",
        event.data,
        typeof event.data,
        event.data instanceof Blob,
      );
      if (typeof event.data === "string") {
        // Handle text messages (progress updates or errors)
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === "progress" && data.progress !== undefined) {
            setProgress(data.progress);
          } else if (data.type === "error" && data.message) {
            console.error("Error from server:", data.message);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      } else if (event.data instanceof Blob) {
        // Handle binary messages (WebP image)
        const blob = new Blob([event.data], { type: "image/webp" });
        const imageUrl = URL.createObjectURL(blob);
        setImage(imageUrl);
        setGeneratedImage(imageUrl); // Still storing as an array for compatibility
        setLoading(false);
        // Optionally, close the WebSocket connection
        ws.current?.close();
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setLoading(false);
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
      if (loading) {
        // If connection closes before completion, handle accordingly
        setLoading(false);
      }
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
    };
  }, []);

  if (!prompt) return null;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Generated Image
      </Typography>
      {loading && (
        <Stack direction="row" alignItems="center" spacing={2}>
          <CircularProgress variant="determinate" value={progress} />
          <Typography>
            {prompt} ({progress}%)
          </Typography>
        </Stack>
      )}
      {!loading && image && (
        <Box>
          <Box
            component="img"
            src={image}
            alt={`Generated from: ${prompt}`}
            style={{ cursor: "pointer", maxWidth: "100%", height: "auto" }}
            onClick={() => {
              // User selects this image
              router.push(`/choose-image`);
            }}
          />
          <Box mt={2}>
            <Button variant="contained" onClick={() => router.push("/")}>
              Go Back
            </Button>
          </Box>
        </Box>
      )}
      {!loading && !image && (
        <Typography color="error">Failed to generate image.</Typography>
      )}
    </Box>
  );
}
