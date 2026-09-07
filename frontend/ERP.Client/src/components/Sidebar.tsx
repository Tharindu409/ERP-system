import {
  Dashboard as DashboardIcon,
  People,
  Business,
  AccessTime,
  EventNote,
  Payments,
  ManageAccounts,
  AccountCircle,
  BarChart,
  EventAvailable,
  Assessment,
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

  const { logout, user } = useAuth();

  const role = user?.role;

  // =========================================================
  // Menu Items
  // =========================================================

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <DashboardIcon />,
      roles: ["Admin", "HR", "Manager", "Employee"],
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <People />,
      roles: ["Admin", "HR", "Manager"],
    },
    {
      name: "Departments",
      path: "/departments",
      icon: <Business />,
      roles: ["Admin", "HR"],
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: <AccessTime />,
      roles: ["Admin", "HR", "Manager", "Employee"],
    },
    {
      name: "Leave Management",
      path: "/leave",
      icon: <EventNote />,
      roles: ["Admin", "HR", "Manager", "Employee"],
    },
    {
      name: "Leave Balance",
      path: "/leave-balance",
      icon: <EventAvailable />,
      roles: ["Admin", "HR", "Manager", "Employee"],
    },
    {
      name: "Payroll",
      path: "/payroll",
      icon: <Payments />,
      roles: ["Admin", "HR", "Manager"],
    },
    {
      name: "Payroll Reports",
      path: "/payroll-reports",
      icon: <Assessment />,
      roles: ["Admin", "HR", "Manager"],
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: <AccountCircle />,
      roles: ["Admin", "HR", "Manager", "Employee"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart />,
      roles: ["Admin", "HR", "Manager"],
    },
    {
      name: "User Management",
      path: "/users",
      icon: <ManageAccounts />,
      roles: ["Admin"],
    },
    {
      name: "Attendance Reports",
      path: "/attendance-reports",
      icon: <Assessment />,
      roles: ["Admin", "HR", "Manager"],
    },
    {
      name: "Employee Summary",
      path: "/employee-attendance-summary",
      icon: <Assessment />,
      roles: ["Admin", "HR", "Manager"],
    },
  ];

  // =========================================================
  // Filter Menu According To Role
  // =========================================================

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(role || "")
  );

  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =========================================================
  // UI
  // =========================================================

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
          sx={{
            color: "white",
            fontWeight: "bold",
          }}
        >
          HR ERP
        </Typography>
      </Box>

      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.1)",
        }}
      />

      {/* Menu */}
      <List
  sx={{
    px: 1.5,
    py: 2,
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",

    "&::-webkit-scrollbar": {
      width: 6,
    },

    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#374151",
      borderRadius: 3,
    },

    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
  }}
>
        {filteredMenuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,

                color: active
                  ? "white"
                  : "#9ca3af",

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

              <ListItemText
                primary={item.name}
              />
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