import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonIcon from "@mui/icons-material/Person";

import api from "../api/axios";

interface DashboardData {
  employees: {
    total: number;
    active: number;
    inactive: number;
  };

  departments: {
    total: number;
  };

  users: {
    total: number;
    active: number;
    inactive: number;
  };
}

const Dashboard = () => {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/Dashboard");

        setDashboard(response.data);
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Typography>
        Loading dashboard...
      </Typography>
    );
  }

  const cards = [
    {
      title: "Total Employees",
      value: dashboard?.employees.total ?? 0,
      icon: <PeopleIcon />,
    },
    {
      title: "Active Employees",
      value: dashboard?.employees.active ?? 0,
      icon: <PersonIcon />,
    },
    {
      title: "Departments",
      value: dashboard?.departments.total ?? 0,
      icon: <BusinessIcon />,
    },
    {
      title: "Total Users",
      value: dashboard?.users.total ?? 0,
      icon: <ManageAccountsIcon />,
    },
  ];

  return (
    <Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
        >
          Dashboard
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Overview of your HR system
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {cards.map((card) => (
          <Grid
            key={card.title}
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >

                  <Box>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      sx={{ mt: 1 }}
                    >
                      {card.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                    }}
                  >
                    {card.icon}
                  </Box>

                </Box>

              </CardContent>
            </Card>
          </Grid>
        ))}

      </Grid>

    </Box>
  );
};

export default Dashboard;