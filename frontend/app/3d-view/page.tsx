// app/three-d-view/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { useGlobalState } from "../../lib/state";
import ThreeDViewer from "../../components/ThreeDViewer";

interface WebSocketMessage {
  type: string;
  progress?: number;
  image?: string;
  message?: string;
}

export default function ThreeDViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromImage = searchParams.get("fromImage");
  const { selectedImage, droppedImage } = useGlobalState();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [viewDataUrl, setViewDataUrl] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // useEffect(() => {
  //   const srcImage = fromImage ? droppedImage : selectedImage;
  //   if (!srcImage) {
  //     router.push("/");
  //     return;
  //   }
  //   (async () => {
  //     const data = await generate3DView(srcImage);
  //     setViewData(data);
  //     setLoading(false);
  //   })();
  // }, [fromImage, selectedImage, droppedImage, router]);
  const call = useCallback(() => {
    const srcImage = fromImage ? droppedImage : selectedImage;
    if (!srcImage) {
      console.log("No image selected.");
      router.push("/");
      return;
    }

    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://localhost:8000/ws/generate-3d-view`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connection established.");
      // Send the image binary data to the server
      ws.current?.send(srcImage);
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
        // read PLY binary data, create a URL for it, then set
        const blob = new Blob([event.data], { type: "model/ply" });
        const url = URL.createObjectURL(blob);
        setViewDataUrl(url);

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
  }, [fromImage, droppedImage, selectedImage, router, loading]);

  useEffect(() => {
    call();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        3D Radiance Field
      </Typography>
      {loading && (
        <Stack direction="row" alignItems="center" spacing={2}>
          <CircularProgress variant="determinate" value={progress} />
          <Typography>Loading 3D view ({progress}%)</Typography>
        </Stack>
      )}
      {!loading && viewDataUrl && (
        <Box>
          <Box
            sx={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
          >
            <ThreeDViewer data={viewDataUrl} />
          </Box>
          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="contained" onClick={() => router.push("/mesh")}>
              Generate Mesh
            </Button>
            <Button onClick={() => call()}>Regenerate</Button>
            <Button
              onClick={() => {
                if (fromImage) {
                  router.push("/");
                } else {
                  router.push("/choose-image");
                }
              }}
            >
              Go Back
            </Button>
          </Stack>
        </Box>
      )}
      {!loading && !viewDataUrl && (
        <Typography color="error">Failed to generate 3D view.</Typography>
      )}
    </Box>
  );
}
