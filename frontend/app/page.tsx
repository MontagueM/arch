"use client";

import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DropZone from "../components/DropZone";
import ThreeDViewer from "../components/ThreeDViewer";
import { useGlobalState } from "../lib/state";
import { useWebSocketProcess } from "../hooks/useWebSocketProcess";

enum ImageModel {
  Dalle3 = "dalle3",
  Sama = "sama",
}

export default function SinglePage() {
  const [localPrompt, setLocalPrompt] = useState(
    "a cuddly snowman toy with a blue scarf",
  );
  const [imageModel, setImageModel] = useState<ImageModel>(ImageModel.Dalle3);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
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
      setProcessedImageUrl(null);

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
            setProcessedImageUrl(url);
          },
        });
      };
      reader.readAsArrayBuffer(file);
    },
    [removeBg, setLocalFile, setProcessedImageUrl],
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
        setGeneratedImageUrl(url);
      },
    });
  }, [localPrompt, genImage, setGeneratedImageUrl]);

  /**
   * Handle creation of a 3D “view” from the processed or generated image.
   */
  const handleGenerate3DViewFromImage = useCallback(() => {
    const imageUrl = processedImageUrl || generatedImageUrl;
    if (!imageUrl) return;
    // setDroppedImage(localFile || null);
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
              new Blob([data], { type: "model/ply" }),
            );
            setViewDataUrl(url);
          },
        });
      });
  }, [
    processedImageUrl,
    generatedImageUrl,
    localFile,
    setDroppedImage,
    gen3DView,
    setViewDataUrl,
  ]);

  /**
   * Handle creation of a 3D model from the generated 3D “view.”
   */
  const handleGenerate3DModel = useCallback(() => {
    if (!viewDataUrl) return;
    setModelDataUrl(null);

    fetch(viewDataUrl)
      .then((res) => res.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        gen3DModel.startProcess({
          onOpen: (ws) => {
            ws.send(arrayBuffer);
          },
          onMessageBlob: (data) => {
            const url = URL.createObjectURL(
              new Blob([data], { type: "model/ply" }),
            );
            setModelDataUrl(url);
          },
        });
      });
  }, [viewDataUrl, gen3DModel, setModelDataUrl]);

  /**
   * Handle saving the mesh.
   */
  const handleSaveMesh = useCallback(() => {
    if (!modelDataUrl) return;
    const link = document.createElement("a");
    link.href = modelDataUrl;
    link.download = "generated_model.ply";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [modelDataUrl]);

  /**
   * Reset or cancel removing background from dropped image.
   */
  const handleCancel = useCallback(() => {
    setLocalFile(null);
    setProcessedImageUrl(null);
  }, [setLocalFile, setProcessedImageUrl]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        p: 2,
        display: "flex",
        gap: 2,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* INPUT SIDE */}
      <Box sx={{ flex: 1 }}>
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
              {processedImageUrl
                ? "Reset and Generate New Image"
                : "Generate Image"}
            </Button>
          </Box>

          {genImage.loading && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {genImage.progress > 0 ? (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={genImage.progress}
                    size={24}
                  />
                  <Typography>{genImage.progress}%</Typography>
                </>
              ) : (
                <CircularProgress size={24} />
              )}
            </Stack>
          )}

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
        </Stack>
      </Box>

      {/* IMAGE SIDE */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom>
          Image
        </Typography>
        <Box sx={{ position: "relative", mb: 2 }}>
          {processedImageUrl ? (
            <>
              <img
                src={processedImageUrl}
                alt="Processed"
                style={{
                  width: "100%",
                  maxHeight: "300px",
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
            </>
          ) : generatedImageUrl ? (
            <img
              src={generatedImageUrl}
              alt="Generated"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "contain",
              }}
            />
          ) : (
            !removeBg.loading && (
              <Box
                width="100%"
                height={300}
                sx={{
                  backgroundColor: "#141414",
                }}
              />
            )
          )}
        </Box>
        <Button
          variant="contained"
          onClick={handleGenerate3DViewFromImage}
          disabled={!processedImageUrl && !generatedImageUrl}
          fullWidth
        >
          {viewDataUrl ? "Reset and Generate New 3D View" : "Generate 3D View"}
        </Button>
      </Box>

      {/* 3D VIEW SIDE */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom>
          3D View
        </Typography>
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
        {!gen3DView.loading && !viewDataUrl && (
          <Box
            width="100%"
            height={300}
            sx={{
              backgroundColor: "#141414",
            }}
          />
        )}
        {!gen3DView.loading && viewDataUrl && (
          <Box sx={{ width: "100%", height: 300, border: "1px solid #ccc" }}>
            <ThreeDViewer data={viewDataUrl} />
          </Box>
        )}
        <Button
          variant="contained"
          onClick={handleGenerate3DModel}
          disabled={!viewDataUrl}
          sx={{ mt: 2 }}
          fullWidth
        >
          {modelDataUrl
            ? "Reset and Generate New 3D Model"
            : "Generate 3D Model"}
        </Button>
      </Box>

      {/* 3D MODEL SIDE */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom>
          3D Model
        </Typography>
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
        {!gen3DModel.loading && !modelDataUrl && (
          <Box
            width="100%"
            height={300}
            sx={{
              backgroundColor: "#141414",
            }}
          />
        )}
        {!gen3DModel.loading && modelDataUrl && (
          <Box sx={{ width: "100%", height: 300, border: "1px solid #ccc" }}>
            <ThreeDViewer data={modelDataUrl} />
          </Box>
        )}
        <Button
          variant="contained"
          onClick={handleSaveMesh}
          disabled={!modelDataUrl}
          sx={{ mt: 2 }}
          fullWidth
        >
          Save Mesh
        </Button>
      </Box>
    </Box>
  );
}
