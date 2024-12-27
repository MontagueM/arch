import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography } from "@mui/material";

interface ImageDropZoneProps {
  onDrop: (file: File | null) => void;
  disabled: boolean;
}

export default function DropZone({ onDrop, disabled }: ImageDropZoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles[0]);
      } else {
        onDrop(null);
      }
    },
    [onDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
    disabled,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed #ccc",
        p: 4,
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography>Drop the image here...</Typography>
      ) : (
        <Typography>Drag and drop an image, or click to select</Typography>
      )}
    </Box>
  );
}
