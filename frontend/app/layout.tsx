// app/layout.tsx
import "./globals.css";
import { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import theme from "./theme";
import { StateProvider } from "@/lib/state";
import { Box } from "@mui/material";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Text-to-3D Pipeline",
  description: "Generate 3D from text or images",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <StateProvider>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100vh",
                  padding: 2, // Optional: Adds padding around the content
                }}
              >
                <Box
                  sx={{
                    width: {
                      xs: "100%", // 100% width on mobile devices
                      sm: "90%", // 90% width on small screens
                      md: "80%", // 80% width on medium screens
                      lg: "70%", // 70% width on large screens
                      xl: "60%", // 60% width on extra-large screens
                    },
                    maxWidth: "1200px", // Optional: Sets a maximum width for very large screens
                    boxShadow: 3, // Optional: Adds a subtle shadow for depth
                    borderRadius: 2, // Optional: Rounds the corners for a softer look
                  }}
                >
                  {children}
                </Box>
              </Box>
            </StateProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
