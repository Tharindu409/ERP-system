import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";

import {
  EventAvailable,
  EventBusy,
  HourglassEmpty,
  BeachAccess,
} from "@mui/icons-material";

import api from "../api/axios";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface LeaveBalanceResponse {
  employeeId: number;
  employeeName: string;
  year: number;
  balances: LeaveBalance[];
}

const LeaveBalance = () => {
  const [data, setData] = useState<LeaveBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaveBalance();
  }, []);

  const loadLeaveBalance = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Leave/balance");

      setData(response.data);
    } catch (err: any) {
      console.error("Leave balance error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load leave balance."
      );
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case "annual":
        return <BeachAccess sx={{ fontSize: 35 }} />;

      case "casual":
        return <EventAvailable sx={{ fontSize: 35 }} />;

      case "sick":
        return <EventBusy sx={{ fontSize: 35 }} />;

      default:
        return <EventAvailable sx={{ fontSize: 35 }} />;
    }
  };

  const getPercentage = (used: number, total: number) => {
    if (total === 0) return 0;

    return Math.min((used / total) * 100, 100);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const totalAllocated = data.balances.reduce(
    (sum, item) => sum + item.totalDays,
    0
  );

  const totalUsed = data.balances.reduce(
    (sum, item) => sum + item.usedDays,
    0
  );

  const totalPending = data.balances.reduce(
    (sum, item) => sum + item.pendingDays,
    0
  );

  const totalRemaining = data.balances.reduce(
    (sum, item) => sum + item.remainingDays,
    0
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#111827",
            mb: 1,
          }}
        >
          Leave Balance
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: "#6b7280" }}
        >
          View your leave allowance and remaining leave for{" "}
          {data.year}.
        </Typography>
      </Box>

      {/* Employee */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold" }}
          >
            {data.employeeName}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#6b7280", mt: 0.5 }}
          >
            Employee ID: {data.employeeId} • Year: {data.year}
          </Typography>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: "100%",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
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
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Total Leave
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                    }}
                  >
                    {totalAllocated}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    days
                  </Typography>
                </Box>

                <BeachAccess
                  sx={{
                    fontSize: 40,
                    color: "#2563eb",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: "100%",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
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
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Used Leave
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                    }}
                  >
                    {totalUsed}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    days
                  </Typography>
                </Box>

                <EventBusy
                  sx={{
                    fontSize: 40,
                    color: "#dc2626",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: "100%",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
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
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Pending Leave
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                    }}
                  >
                    {totalPending}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    days
                  </Typography>
                </Box>

                <HourglassEmpty
                  sx={{
                    fontSize: 40,
                    color: "#f59e0b",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: "100%",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
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
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Remaining Leave
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                    }}
                  >
                    {totalRemaining}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    days
                  </Typography>
                </Box>

                <EventAvailable
                  sx={{
                    fontSize: 40,
                    color: "#16a34a",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Type Cards */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          mb: 2,
        }}
      >
        Leave Breakdown
      </Typography>

      <Grid container spacing={3}>
        {data.balances.map((item) => {
          const percentage = getPercentage(
            item.usedDays,
            item.totalDays
          );

          return (
            <Grid
              size={{ xs: 12, md: 4 }}
              key={item.leaveType}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: 55,
                        height: 55,
                        borderRadius: 2,
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getIcon(item.leaveType)}
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold" }}
                      >
                        {item.leaveType} Leave
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ color: "#6b7280" }}
                      >
                        {item.totalDays} days allocated
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Used
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {item.usedDays} / {item.totalDays}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                      }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: "#f0fdf4",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "#6b7280" }}
                        >
                          Remaining
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "#16a34a",
                          }}
                        >
                          {item.remainingDays}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: "#fffbeb",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "#6b7280" }}
                        >
                          Pending
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "#d97706",
                          }}
                        >
                          {item.pendingDays}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default LeaveBalance;