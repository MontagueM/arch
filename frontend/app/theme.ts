"use client";
import { createTheme } from "@mui/material/styles";
import "@fontsource/inter/400.css";

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: "dark", // Enable dark mode
    background: {
      default: "#000000", // Set default background to black
      paper: "#121212", // Optional: Slightly lighter black for paper components
    },
    text: {
      primary: "#FFFFFF", // Set primary text color to white
      secondary: "#B0B0B0", // Optional: Secondary text color
    },
    // Define primary and secondary colors if needed
    primary: {
      main: "#FFFFFF", // Primary color (used for buttons, etc.)
    },
    secondary: {
      main: "#000000", // Secondary color
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif", // Set font to 'Inter'
  },
  components: {
    // Customize MUI Button component
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#000000", // Black text
          backgroundColor: "#FFFFFF", // White background
          "&:hover": {
            backgroundColor: "#f0f0f0", // Light gray on hover
          },
        },
      },
    },
    // Optional: Customize other components as needed
  },
});

export default theme;
