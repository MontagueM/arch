"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Divider,
  Stack,
  CircularProgress,
  IconButton,
} from "@mui/material";
import DropZone from "../components/DropZone";
import { useGlobalState } from "../lib/state";
import CloseIcon from "@mui/icons-material/Close";

export default function HomePage() {
  const router = useRouter();
  const { setPrompt, setDroppedImage } = useGlobalState();
  const [localPrompt, setLocalPrompt] = useState(
    "a cuddly snowman toy with a blue scarf",
  );
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket("ws://localhost:8000/ws/remove-background");

    ws.current.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setProcessing(false);
    };

    ws.current.onmessage = (event) => {
      const processedBytes = event.data;
      const blob = new Blob([processedBytes], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setProcessing(false);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleDrop = (file: File | null) => {
    if (!file) return;
    setLocalFile(file);
    setProcessing(true);
    setProcessedImage(null);

    // Send the file via WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        ws.current?.send(new Uint8Array(arrayBuffer));
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error("WebSocket is not open");
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setLocalFile(null);
    setProcessedImage(null);
    setProcessing(false);
  };

  const handleGenerateImages = () => {
    if (!localPrompt.trim()) return;
    setPrompt(localPrompt);
    router.push("/choose-image"); // This will lead to loading and then show images
  };

  const handleGenerate3DViewFromImage = () => {
    if (!localFile) return;
    setDroppedImage(localFile);
    router.push("/3d-view?fromImage=1"); // This simulates going directly to 3D generation page
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 2,
      }}
    >
      <Stack spacing={4}>
        {/* Text Prompt Section */}
        <Stack spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Enter text prompt"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            variant="outlined"
            sx={{
              "& .MuiInputBase-input": {
                textAlign: "center",
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleGenerateImages}
            disabled={!localPrompt.trim()}
            fullWidth
          >
            Generate Images
          </Button>
        </Stack>

        <Divider />

        {/* Image Drop Section */}
        <Stack spacing={2} alignItems="center">
          {!processing && !processedImage && (
            <DropZone
              onDrop={handleDrop}
              disabled={processing || !!processedImage}
            />
          )}

          {processing && (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>Processing...</span>
              </Box>
            </Box>
          )}

          {processedImage && (
            <Box sx={{ position: "relative" }}>
              <img
                src={processedImage}
                alt="Processed"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
              <IconButton
                onClick={handleCancel}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(255,255,255,0.7)",
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handleGenerate3DViewFromImage}
            disabled={!processedImage}
            fullWidth
          >
            Generate 3D View
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
