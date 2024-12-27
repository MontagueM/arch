"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DropZone from "../components/DropZone";
import ThreeViewer from "../components/ThreeViewer";
import { useWebSocketProcess } from "../hooks/useWebSocketProcess";
import axios from "axios";

enum ImageModel {
  Dalle3 = "dalle3",
  Sana = "sana",
}

export default function SinglePage() {
  const [localPrompt, setLocalPrompt] = useState("a fantasy sword");
  const [imageModel, setImageModel] = useState<ImageModel>(ImageModel.Dalle3);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [viewDataUrl, setViewDataUrl] = useState<string | null>(null);
  const [modelDataUrl, setModelDataUrl] = useState<string | null>(null);

  const removeBg = useWebSocketProcess(
    "/ws/remove-background",
    "Removing background",
  );
  const genImage = useWebSocketProcess(
    "/ws/generate-image",
    "Generating image",
  );
  const gen3DView = useWebSocketProcess(
    "/ws/generate-3d-view",
    "Generating 3D View",
  );
  const gen3DModel = useWebSocketProcess(
    "/ws/generate-3d-model",
    "Generating 3D Model",
  );

  const loading = useMemo(() => {
    return (
      removeBg.loading ||
      genImage.loading ||
      gen3DView.loading ||
      gen3DModel.loading
    );
  }, [
    removeBg.loading,
    genImage.loading,
    gen3DView.loading,
    gen3DModel.loading,
  ]);

  /**
   * Handle dropping of the image file.
   */
  const handleDrop = useCallback(
    (file: File | null) => {
      if (!file) return;
      setLocalFile(file);
      setImageUrl(null);
      setViewDataUrl(null);
      setModelDataUrl(null);

      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        removeBg.startProcess({
          onOpen: (ws) => {
            ws.send(arrayBuffer);
          },
          onMessageBlob: (data) => {
            const url = URL.createObjectURL(
              new Blob([data], { type: "image/png" }),
            );
            setImageUrl(url);
          },
        });
      };
      reader.readAsArrayBuffer(file);
    },
    [removeBg],
  );

  /**
   * Handle text-to-image generation.
   */
  const handleGenerateImage = useCallback(() => {
    if (!localPrompt.trim()) return;
    setImageUrl(null);
    setViewDataUrl(null);
    setModelDataUrl(null);

    genImage.startProcess({
      onOpen: (ws) => {
        ws.send(
          JSON.stringify({
            prompt: localPrompt,
            image_model: imageModel.toString(),
          }),
        );
      },
      onMessageBlob: (data) => {
        const url = URL.createObjectURL(
          new Blob([data], { type: "image/webp" }),
        );
        setImageUrl(url);
      },
    });
  }, [localPrompt, genImage, imageModel]);

  /**
   * Handle creation of a 3D “view” from the processed or generated image.
   */
  const handleGenerate3DViewFromImage = useCallback(() => {
    if (!imageUrl) return;
    setViewDataUrl(null);
    setModelDataUrl(null);

    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        gen3DView.startProcess({
          onOpen: (ws) => {
            ws.send(arrayBuffer);
          },
          onMessageBlob: (data) => {
            const url = URL.createObjectURL(
              new Blob([data], { type: "application/octet-stream" }),
            );
            setViewDataUrl(url);
          },
        });
      });
  }, [imageUrl, gen3DView]);

  /**
   * Handle creation of a 3D model from the generated 3D “view.”
   */
  const handleGenerate3DModel = useCallback(() => {
    if (!viewDataUrl) return;
    setModelDataUrl(null);

    gen3DModel.startProcess({
      onMessageBlob: (data) => {
        const url = URL.createObjectURL(
          new Blob([data], { type: "model/glb" }),
        );
        setModelDataUrl(url);
      },
    });
  }, [viewDataUrl, gen3DModel]);

  /**
   * Handle saving the mesh.
   */
  const handleSaveMesh = useCallback(() => {
    if (!modelDataUrl) return;
    const link = document.createElement("a");
    link.href = modelDataUrl;
    link.download = "generated_model.glb";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [modelDataUrl]);

  /**
   * Reset/cancel removing background from dropped image.
   */
  const handleCancel = useCallback(() => {
    setLocalFile(null);
    setImageUrl(null);
  }, []);

  const handleSendToBlender = useCallback(async () => {
    if (!modelDataUrl) {
      return;
    }

    try {
      const modelData = await fetch(modelDataUrl).then((res) => res.blob());
      const response = await axios.post(
        "http://localhost:5666/upload",
        modelData,
        {
          headers: {
            "Content-Type": "application/octet-stream",
          },
        },
      );
      if (response.status !== 204) {
        throw new Error(response.data as string);
      }
      console.log("Model sent to Blender.");
    } catch (error: unknown) {
      console.error(
        "Failed to send model to Blender:",
        (error as Error)?.message,
      );
      alert(
        "Failed to send model to Blender. Please check if the plugin is installed and running and try again.",
      );
    }
  }, [modelDataUrl]);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", flex: "0 0 45%", overflow: "hidden" }}>
        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Input
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder="Enter text prompt"
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              variant="outlined"
            />
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value as ImageModel)}
                variant="outlined"
                size="small"
              >
                <MenuItem value={ImageModel.Dalle3}>DALL-E 3</MenuItem>
                <MenuItem value={ImageModel.Sana}>Sana</MenuItem>
              </Select>
              <Button
                variant="contained"
                onClick={handleGenerateImage}
                disabled={!localPrompt.trim() || loading}
                size="small"
              >
                Generate Image
              </Button>
            </Box>

            <Divider flexItem>OR</Divider>

            <DropZone onDrop={handleDrop} disabled={loading} />

            {localFile && (
              <Box>
                <Button variant="outlined" onClick={handleCancel} size="small">
                  Cancel/Reset
                </Button>
              </Box>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
              Image
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleGenerate3DViewFromImage}
              disabled={!imageUrl}
            >
              Generate 3D View &gt;&gt;
            </Button>
          </Box>

          <Box sx={{ position: "relative", height: "calc(100% - 40px)" }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Generated/Processed"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#141414",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888",
                }}
              >
                {genImage.loading || removeBg.loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {genImage.loadingElement || removeBg.loadingElement}
                  </Box>
                ) : (
                  <Typography>No image yet</Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flex: "0 0 55%", overflow: "hidden" }}>
        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
              3D View
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleGenerate3DModel}
              disabled={!viewDataUrl}
            >
              Generate 3D Model &gt;&gt;
            </Button>
          </Box>

          {gen3DView.loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80%",
              }}
            >
              {gen3DView.loadingElement}
            </Box>
          )}

          {!gen3DView.loading && viewDataUrl && (
            <Box
              sx={{
                width: "100%",
                height: "calc(100% - 40px)",
                border: "1px solid #ccc",
              }}
            >
              <ThreeViewer gaussianUrl={viewDataUrl} />
            </Box>
          )}

          {!gen3DView.loading && !viewDataUrl && (
            <Box
              sx={{
                width: "100%",
                height: "calc(100% - 40px)",
                backgroundColor: "#141414",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                border: "1px",
              }}
            >
              No 3D view yet
            </Box>
          )}
        </Box>

        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
              3D Model
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveMesh}
                disabled={!modelDataUrl}
              >
                Save Mesh
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSendToBlender}
                disabled={!modelDataUrl}
              >
                Send to Blender
              </Button>
            </Box>
          </Box>

          {gen3DModel.loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80%",
              }}
            >
              {gen3DModel.loadingElement}
            </Box>
          )}

          {!gen3DModel.loading && modelDataUrl && (
            <Box
              sx={{
                width: "100%",
                height: "calc(100% - 40px)",
                border: "1px solid #ccc",
              }}
            >
              <ThreeViewer glbUrl={modelDataUrl} />
            </Box>
          )}

          {!gen3DModel.loading && !modelDataUrl && (
            <Box
              sx={{
                width: "100%",
                height: "calc(100% - 40px)",
                backgroundColor: "#141414",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                border: "1px",
              }}
            >
              No 3D model yet
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
