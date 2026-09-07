import { useEffect, useState, type ReactNode } from "react";
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
}

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || "Unable to load dashboard analytics.";
  }
  return "Unable to load dashboard analytics.";
};

const MetricCard = ({ label, value, icon, color }: MetricCardProps) => (
  <Card sx={{ height: "100%", border: "1px solid #e5e7eb", borderRadius: 3 }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>{value}</Typography>
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: `${color}18`, color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isManagement = ["Admin", "HR", "Manager"].includes(user?.role || "");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardAnalytics>("/Dashboard/analytics");
        setAnalytics(response.data);
      } catch (requestError: unknown) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (error || !analytics) {
    return <Alert severity="error">{error || "Dashboard analytics are unavailable."}</Alert>;
  }

  const attendanceTotal = analytics.presentToday + analytics.lateToday + analytics.absentToday + analytics.onLeaveToday;
  const overview = [
    { label: "Present", value: analytics.presentToday, color: "#16a34a" },
    { label: "Late", value: analytics.lateToday, color: "#d97706" },
    { label: "Absent", value: analytics.absentToday, color: "#dc2626" },
    { label: "Leave", value: analytics.onLeaveToday, color: "#2563eb" },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>Dashboard</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {isManagement ? "HR workforce and attendance overview" : "Your attendance and leave overview"}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><MetricCard label={isManagement ? "Total Employees" : "My Account"} value={analytics.totalEmployees} icon={<People />} color="#2563eb" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><MetricCard label="Present Today" value={analytics.presentToday} icon={<EventAvailable />} color="#16a34a" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><MetricCard label="Late Today" value={analytics.lateToday} icon={<Schedule />} color="#d97706" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><MetricCard label="Absent Today" value={analytics.absentToday} icon={<EventBusy />} color="#dc2626" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><MetricCard label="On Leave Today" value={analytics.onLeaveToday} icon={<AccessTime />} color="#2563eb" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>Attendance Overview</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>Attendance percentage</Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>{analytics.attendancePercentage.toFixed(2)}%</Typography>
            <LinearProgress variant="determinate" value={Math.min(analytics.attendancePercentage, 100)} sx={{ height: 9, borderRadius: 5, mb: 3 }} />
            {overview.map((item) => (
              <Box key={item.label} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}><Typography>{item.label}</Typography><Typography sx={{ fontWeight: "bold" }}>{item.value}</Typography></Box>
                <LinearProgress variant="determinate" value={attendanceTotal ? (item.value / attendanceTotal) * 100 : 0} sx={{ height: 7, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: item.color } }} />
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 3 }}><CardContent>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Leave Overview</Typography>
            <Typography color="text.secondary">Pending requests</Typography><Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>{analytics.pendingLeaveRequests}</Typography>
            <Typography color="text.secondary">Approved requests</Typography><Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>{analytics.approvedLeaveRequests}</Typography>
            <Typography color="text.secondary">Rejected requests</Typography><Typography variant="h4" sx={{ fontWeight: "bold" }}>{analytics.rejectedLeaveRequests}</Typography>
          </CardContent></Card>
          <Card><CardContent>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Payroll Overview</Typography>
            <Typography color="text.secondary">Processed this month</Typography><Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>{analytics.payrollProcessed}</Typography>
            <Typography color="text.secondary">Net payroll</Typography><Typography variant="h5" sx={{ fontWeight: "bold" }}>{analytics.payrollTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
            <Payments color="primary" sx={{ mt: 1 }} />
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
