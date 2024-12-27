"use client";

import React, { useCallback, useState } from "react";
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
import { useGlobalState } from "../lib/state";
import { useWebSocketProcess } from "../hooks/useWebSocketProcess";

enum ImageModel {
  Dalle3 = "dalle3",
  Sama = "sama",
}

export default function SinglePage() {
  const [localPrompt, setLocalPrompt] = useState("a fantasy sword");
  const [imageModel, setImageModel] = useState<ImageModel>(ImageModel.Dalle3);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [viewDataUrl, setViewDataUrl] = useState<string | null>(null);
  const [modelDataUrl, setModelDataUrl] = useState<string | null>(null);

  const { setDroppedImage } = useGlobalState();

  const removeBg = useWebSocketProcess("/ws/remove-background");
  const genImage = useWebSocketProcess("/ws/generate-image");
  const gen3DView = useWebSocketProcess("/ws/generate-3d-view");
  const gen3DModel = useWebSocketProcess("/ws/generate-3d-model");

  /**
   * Handle dropping of the image file.
   */
  const handleDrop = useCallback(
    (file: File | null) => {
      if (!file) return;
      setLocalFile(file);
      setImageUrl(null);

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

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent scrolling
      }}
    >
      {/* Top Row (45%): Left = Input, Right = Image */}
      <Box sx={{ display: "flex", flex: "0 0 45%", overflow: "hidden" }}>
        {/* Input Box */}
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
                <MenuItem value={ImageModel.Sama}>SAMA</MenuItem>
              </Select>
              <Button
                variant="contained"
                onClick={handleGenerateImage}
                disabled={!localPrompt.trim()}
              >
                {imageUrl ? "Generate New Image" : "Generate Image"}
              </Button>
            </Box>

            <Divider flexItem>OR</Divider>

            {!removeBg.loading && (
              <DropZone onDrop={handleDrop} disabled={removeBg.loading} />
            )}

            {removeBg.loading && (
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span>Processing...</span>
                </Box>
              </Box>
            )}

            {localFile && (
              <Button variant="outlined" onClick={handleCancel} fullWidth>
                Cancel/Reset
              </Button>
            )}
          </Stack>
        </Box>

        {/* Image Box */}
        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Header row with "Image" on left, "Generate 3D View >>" on right */}
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
                No image yet
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Row (55%): Left = 3D View, Right = 3D Model */}
      <Box sx={{ display: "flex", flex: "0 0 55%", overflow: "hidden" }}>
        {/* 3D View Box */}
        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Header row with "3D View" on left, "Generate 3D Model >>" on right */}
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

          {/* Loading Indicator / 3D View */}
          {gen3DView.loading && (
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              {gen3DView.progress > 0 ? (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={gen3DView.progress}
                  />
                  <Typography>{gen3DView.progress}%</Typography>
                </>
              ) : (
                <CircularProgress />
              )}
            </Stack>
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
                border: "1px solid #ccc",
              }}
            >
              No 3D view yet
            </Box>
          )}
        </Box>

        {/* 3D Model Box */}
        <Box
          sx={{
            width: "50%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Header row with "3D Model" on left, "Save Mesh" on right */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
              3D Model
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveMesh}
              disabled={!modelDataUrl}
            >
              Save Mesh
            </Button>
          </Box>

          {/* Loading Indicator / 3D Model */}
          {gen3DModel.loading && (
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              {gen3DModel.progress > 0 ? (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={gen3DModel.progress}
                  />
                  <Typography>{gen3DModel.progress}%</Typography>
                </>
              ) : (
                <CircularProgress />
              )}
            </Stack>
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
                border: "1px solid #ccc",
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
