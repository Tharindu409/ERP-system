import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Typography,
} from "@mui/material";

import {
  AccessTime,
  EventAvailable,
  EventBusy,
  People,
  Payments,
  Schedule,
} from "@mui/icons-material";

import { isAxiosError } from "axios";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface DashboardAnalytics {
  isManagement: boolean;
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendancePercentage: number;
  completedCheckOuts: number;
  notCheckedOut: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  payrollProcessed: number;
  payrollTotal: number;
}

interface ApiErrorResponse {
  message?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  description: string;
}

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ||
      "Unable to load dashboard analytics."
    );
  }

  return "Unable to load dashboard analytics.";
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard = ({
  label,
  value,
  icon,
  color,
  description,
}: MetricCardProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minWidth: 0,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                mb: 1,
              }}
            >
              {label}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 1,
              }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 46,
              height: 46,
              minWidth: 46,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}15`,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/* =========================================================
   SECTION CARD
========================================================= */

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        height: "100%",
        minWidth: 0,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 3,
          }}
        >
          {title}
        </Typography>

        {children}
      </CardContent>
    </Card>
  );
};

const DonutChart = ({
  items,
  total,
}: {
  items: { label: string; value: number; color: string }[];
  total: number;
}) => {
  let cursor = 0;
  const gradient = items
    .map((item) => {
      const start = total ? (cursor / total) * 100 : 0;
      cursor += item.value;
      const end = total ? (cursor / total) * 100 : 0;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
      <Box
        role="img"
        aria-label={`Attendance distribution: ${total} records`}
        sx={{
          width: 148,
          height: 148,
          borderRadius: "50%",
          flexShrink: 0,
          background: total ? `conic-gradient(${gradient})` : "#dbe6e8",
          display: "grid",
          placeItems: "center",
          position: "relative",
          "&::after": {
            content: "\"\"",
            position: "absolute",
            inset: 18,
            borderRadius: "50%",
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ zIndex: 1, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{total}</Typography>
          <Typography variant="caption" color="text.secondary">records</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 180 }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.color }} />
              <Typography variant="body2">{item.label}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

const Dashboard = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isManagement = [
    "Admin",
    "HR",
    "Manager",
  ].includes(user?.role || "");

  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<DashboardAnalytics>(
            "/Dashboard/analytics"
          );

        setAnalytics(response.data);
      } catch (requestError: unknown) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={40} />

          <Typography
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Loading dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !analytics) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: 2,
        }}
      >
        {error ||
          "Dashboard analytics are unavailable."}
      </Alert>
    );
  }

  /* =======================================================
     ATTENDANCE CALCULATIONS
  ======================================================= */

  const attendanceTotal =
    analytics.presentToday +
    analytics.lateToday +
    analytics.absentToday +
    analytics.onLeaveToday;

  const overview = [
    {
      label: "Present",
      value: analytics.presentToday,
      color: "#16a34a",
    },
    {
      label: "Late",
      value: analytics.lateToday,
      color: "#d97706",
    },
    {
      label: "Absent",
      value: analytics.absentToday,
      color: "#dc2626",
    },
    {
      label: "Leave",
      value: analytics.onLeaveToday,
      color: "#2563eb",
    },
  ];

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          Dashboard
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.7,
            fontSize: "0.95rem",
          }}
        >
          {isManagement
            ? "HR workforce and attendance overview"
            : "Your attendance and leave overview"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(0, 0.8fr)" },
          gap: 3,
          mb: 3,
        }}
      >
        <SectionCard title="Attendance Mix">
          <DonutChart items={overview} total={attendanceTotal} />
        </SectionCard>

        <SectionCard title="Leave Pipeline">
          <Box sx={{ mb: 2 }}>
            <Box sx={{ height: 14, display: "flex", overflow: "hidden", borderRadius: 7, bgcolor: "action.hover" }}>
              {[
                { value: analytics.pendingLeaveRequests, color: "#d97706" },
                { value: analytics.approvedLeaveRequests, color: "#16a34a" },
                { value: analytics.rejectedLeaveRequests, color: "#dc2626" },
              ].map((item, index) => {
                const total = analytics.pendingLeaveRequests + analytics.approvedLeaveRequests + analytics.rejectedLeaveRequests;
                return <Box key={index} sx={{ width: total ? `${(item.value / total) * 100}%` : "0%", bgcolor: item.color, transition: "width 400ms ease" }} />;
              })}
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
            {[
              { label: "Pending", value: analytics.pendingLeaveRequests, color: "#d97706" },
              { label: "Approved", value: analytics.approvedLeaveRequests, color: "#16a34a" },
              { label: "Rejected", value: analytics.rejectedLeaveRequests, color: "#dc2626" },
            ].map((item) => <Box key={item.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}><Typography variant="caption" color="text.secondary">{item.label}</Typography><Typography variant="h6" sx={{ color: item.color }}>{item.value}</Typography></Box>)}
          </Box>
        </SectionCard>
      </Box>

      {/* =================================================
          TOP METRIC CARDS

          CSS GRID prevents overlapping
      ================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        <MetricCard
          label={
            isManagement
              ? "Total Employees"
              : "My Account"
          }
          value={analytics.totalEmployees}
          icon={<People />}
          color="#2563eb"
          description={
            isManagement
              ? "Registered employees"
              : "Account overview"
          }
        />

        <MetricCard
          label="Present Today"
          value={analytics.presentToday}
          icon={<EventAvailable />}
          color="#16a34a"
          description="Checked in"
        />

        <MetricCard
          label="Late Today"
          value={analytics.lateToday}
          icon={<Schedule />}
          color="#d97706"
          description="Late arrivals"
        />

        <MetricCard
          label="Absent Today"
          value={analytics.absentToday}
          icon={<EventBusy />}
          color="#dc2626"
          description="Not present"
        />

        <MetricCard
          label="On Leave Today"
          value={analytics.onLeaveToday}
          icon={<AccessTime />}
          color="#2563eb"
          description="Approved leave"
        />
      </Box>

      {/* =================================================
          MAIN DASHBOARD

          Left = Attendance
          Right = Leave + Payroll
      ================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.45fr) minmax(320px, 1fr)",
          },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        {/* =================================================
            ATTENDANCE OVERVIEW
        ================================================== */}

        <SectionCard title="Attendance Overview">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mb: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Overall attendance
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                }}
              >
                {analytics.attendancePercentage.toFixed(
                  2
                )}
                %
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Today
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(
              analytics.attendancePercentage,
              100
            )}
            sx={{
              height: 10,
              borderRadius: 5,
              mb: 4,
              bgcolor: "#eef2f7",
            }}
          />

          {overview.map((item) => {
            const percentage = attendanceTotal
              ? (item.value / attendanceTotal) * 100
              : 0;

            return (
              <Box
                key={item.label}
                sx={{ mb: 2.5 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.8,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        bgcolor: item.color,
                      }}
                    />

                    <Typography variant="body2">
                      {item.label}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 7,
                    borderRadius: 4,
                    bgcolor: "#f1f5f9",

                    "& .MuiLinearProgress-bar": {
                      bgcolor: item.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            );
          })}
        </SectionCard>

        {/* =================================================
            RIGHT COLUMN
        ================================================== */}

        <Box
          sx={{
            display: "grid",
            gridTemplateRows: "auto auto",
            gap: 3,
          }}
        >
          {/* =================================================
              LEAVE OVERVIEW
          ================================================== */}

          <SectionCard title="Leave Overview">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 1.5,
              }}
            >
              {/* Pending */}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Pending
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 1,
                    color: "#d97706",
                  }}
                >
                  {analytics.pendingLeaveRequests}
                </Typography>
              </Box>

              {/* Approved */}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Approved
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 1,
                    color: "#16a34a",
                  }}
                >
                  {analytics.approvedLeaveRequests}
                </Typography>
              </Box>

              {/* Rejected */}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#fef2f2",
                  border: "1px solid #fecaca",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Rejected
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 1,
                    color: "#dc2626",
                  }}
                >
                  {analytics.rejectedLeaveRequests}
                </Typography>
              </Box>
            </Box>
          </SectionCard>

          {/* =================================================
              PAYROLL OVERVIEW
          ================================================== */}

          <SectionCard title="Payroll Overview">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Processed this month
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                >
                  {analytics.payrollProcessed}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 46,
                  height: 46,
                  minWidth: 46,
                  borderRadius: 2,
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Payments />
              </Box>
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Net Payroll
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mt: 0.7,
                }}
              >
                {analytics.payrollTotal.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </Typography>
            </Box>
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;