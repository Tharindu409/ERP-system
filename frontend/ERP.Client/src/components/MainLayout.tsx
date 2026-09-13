import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Toolbar,
  Typography,
} from "@mui/material";

import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { Badge, Menu, MenuItem, Divider } from "@mui/material";
import { useState } from "react";
import { useThemeMode } from "../context/ThemeModeContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        sx={{
          flexGrow: 1,
          marginLeft: { xs: 0, md: "260px" },
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { xs: "100%", md: "calc(100% - 260px)" },
            marginLeft: { xs: 0, md: "260px" },
            backgroundColor: "rgba(255,255,255,0.92)",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(12px)",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconButton
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { xs: "inline-flex", md: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Box>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 1.4 }}>
                Operations workspace
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Human Resource Management
              </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Tooltip title="Notifications">
                <IconButton onClick={(event) => setNotificationAnchor(event.currentTarget)}>
                  <Badge color="secondary" variant="dot" invisible={false}>
                    <NotificationsActiveOutlinedIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={mode === "light" ? "Use dark mode" : "Use light mode"}>
                <IconButton onClick={toggleMode} aria-label="Toggle color mode">
                  {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={() => setNotificationAnchor(null)}
                sx={{ mt: 1, "& .MuiPaper-root": { minWidth: 280 } }}
              >
                <MenuItem disabled sx={{ fontWeight: 700 }}>Notifications</MenuItem>
                <Divider />
                <MenuItem disabled>No new notifications</MenuItem>
              </Menu>

              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  backgroundColor: "#2563eb",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ ml: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  {user?.username}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  System User
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 3, lg: 4 },
            pt: { xs: 11, md: 12 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;