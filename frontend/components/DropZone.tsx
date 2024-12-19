import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography } from "@mui/material";

interface ImageDropZoneProps {
  onDrop: (file: File | null) => void;
}

export default function DropZone({ onDrop }: ImageDropZoneProps) {
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
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed #ccc",
        p: 4,
        textAlign: "center",
        width: 300,
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
