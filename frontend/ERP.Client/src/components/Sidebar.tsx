import {
  Dashboard as DashboardIcon,
  People,
  Business,
  AccessTime,
  EventNote,
  Payments,
  ManageAccounts,
  Logout,
} from "@mui/icons-material";

import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <People />,
    },
    {
      name: "Departments",
      path: "/departments",
      icon: <Business />,
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: <AccessTime />,
    },
    {
      name: "Leave Management",
      path: "/leave",
      icon: <EventNote />,
    },
    {
      name: "Payroll",
      path: "/payroll",
      icon: <Payments />,
    },
    {
      name: "User Management",
      path: "/users",
      icon: <ManageAccounts />,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        backgroundColor: "#111827",
        color: "white",
        display: "flex",
        flexDirection: "column",
        zIndex: 1200,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          height: 70,
          display: "flex",
          alignItems: "center",
          px: 3,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ color: "white" }}
        >
          HR ERP
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Menu */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? "white" : "#9ca3af",

                backgroundColor: active
                  ? "#2563eb"
                  : "transparent",

                "&:hover": {
                  backgroundColor: active
                    ? "#2563eb"
                    : "#1f2937",
                  color: "white",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.name} />
            </ListItemButton>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "#fca5a5",

            "&:hover": {
              backgroundColor: "#7f1d1d",
              color: "white",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 42,
              color: "inherit",
            }}
          >
            <Logout />
          </ListItemIcon>

          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default Sidebar;