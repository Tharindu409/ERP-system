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
  today: {
    attendance: number;
    present: number;
    absent: number;
    leave: number;
  };
  pendingLeave: number;
  monthlyPayroll: number;
}

const Dashboard = () => {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/Dashboard");

        setDashboard(response.data);
      } catch (error) {
        setError("Unable to load dashboard data. Check that the API is running and you are logged in.");
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

  if (error) {
    return <Typography color="error">{error}</Typography>;
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
    {
      title: "Today's Attendance",
      value: dashboard?.today.attendance ?? 0,
      icon: <PersonIcon />,
    },
    {
      title: "Pending Leave",
      value: dashboard?.pendingLeave ?? 0,
      icon: <BusinessIcon />,
    },
    {
      title: "Monthly Payroll",
      value: (dashboard?.monthlyPayroll ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      icon: <ManageAccountsIcon />,
    },
  ];

  return (
    <Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold" }}
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

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent><Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Attendance Overview</Typography>{[
            ["Present", dashboard?.today.present ?? 0, "#16a34a"],
            ["Absent", dashboard?.today.absent ?? 0, "#dc2626"],
            ["Leave", dashboard?.today.leave ?? 0, "#ca8a04"],
          ].map(([label, value, color]) => <Box key={label as string} sx={{ mb: 2 }}><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography>{label}</Typography><Typography sx={{ fontWeight: "bold" }}>{value}</Typography></Box><Box sx={{ height: 8, bgcolor: "#e5e7eb", borderRadius: 4, mt: 0.5 }}><Box sx={{ height: "100%", width: `${dashboard?.today.attendance ? Number(value) / dashboard.today.attendance * 100 : 0}%`, bgcolor: color, borderRadius: 4 }} /></Box></Box>)}</CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent><Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>HR Snapshot</Typography><Typography color="text.secondary">Active employees</Typography><Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>{dashboard?.employees.active ?? 0}</Typography><Typography color="text.secondary">Inactive employees</Typography><Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>{dashboard?.employees.inactive ?? 0}</Typography><Typography color="text.secondary">Open leave requests awaiting review</Typography><Typography variant="h4" sx={{ fontWeight: "bold" }}>{dashboard?.pendingLeave ?? 0}</Typography></CardContent></Card>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;