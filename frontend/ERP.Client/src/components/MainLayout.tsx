import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flexGrow: 1,
          marginLeft: "260px",
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: "calc(100% - 260px)",
            marginLeft: "260px",
            backgroundColor: "white",
            color: "#111827",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
            >
              Human Resource Management
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconButton>
                <NotificationsNoneIcon />
              </IconButton>

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
            p: 4,
            pt: 12,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;