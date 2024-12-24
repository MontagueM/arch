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
            <StateProvider>{children}</StateProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
