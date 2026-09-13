import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";

const AppTheme = () => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#67c5d5" : "#155e75", contrastText: mode === "dark" ? "#08252c" : "#ffffff" },
      secondary: { main: mode === "dark" ? "#f2a94b" : "#d97706" },
      background: { default: mode === "dark" ? "#0e1b20" : "#f3f7f8", paper: mode === "dark" ? "#15262d" : "#ffffff" },
      text: { primary: mode === "dark" ? "#edf7f8" : "#172b32", secondary: mode === "dark" ? "#a9c1c5" : "#61747b" },
      divider: mode === "dark" ? "#29434b" : "#dbe6e8",
    },
    typography: { fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif', h4: { fontWeight: 700 }, h6: { fontWeight: 700 }, button: { textTransform: "none", fontWeight: 700 } },
    shape: { borderRadius: 10 },
    components: {
      MuiCard: { styleOverrides: { root: { border: "1px solid", borderColor: mode === "dark" ? "#29434b" : "#dbe6e8", boxShadow: mode === "dark" ? "0 12px 32px rgba(0,0,0,0.2)" : "0 10px 30px rgba(23, 43, 50, 0.06)" } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 8, minHeight: 40 } } },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiTableHead: { styleOverrides: { root: { backgroundColor: mode === "dark" ? "#1d363e" : "#eef5f6" } } },
    },
  }), [mode]);

  return <ThemeProvider theme={theme}><AuthProvider><App /></AuthProvider></ThemeProvider>;
};

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <AppTheme />
    </ThemeModeProvider>
  </React.StrictMode>
);