import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight, EventNote } from "@mui/icons-material";
import api from "../api/axios";

interface LeaveRecord {
  id: number;
  employeeName?: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
}

const calendarDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusColors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  Approved: "success",
  Pending: "warning",
  Rejected: "error",
  Cancelled: "default",
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const LeaveCalendar = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaves = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : {};
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
        const response = await api.get(["Admin", "HR", "Manager"].includes(role) ? "/Leave" : "/Leave/my");
        setLeaves(response.data);
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || "Failed to load leave calendar.");
      } finally {
        setLoading(false);
      }
    };

    void loadLeaves();
  }, []);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const offset = first.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day < 1 || day > count ? null : new Date(month.getFullYear(), month.getMonth(), day);
    });
  }, [month]);

  const leavesForDay = (day: Date) => {
    const date = formatDate(day);
    return leaves.filter((leave) => leave.startDate <= date && leave.endDate >= date);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4">Leave Calendar</Typography>
          <Typography color="text.secondary">See approved, pending, and rejected leave at a glance.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<EventNote />} onClick={() => navigate("/leave")}>Leave Management</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <IconButton aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></IconButton>
            <Typography variant="h6">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</Typography>
            <IconButton aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></IconButton>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.75 }}>
            {calendarDays.map((day) => <Typography key={day} variant="caption" color="text.secondary" sx={{ p: 1, fontWeight: 700, textAlign: "center" }}>{day}</Typography>)}
            {days.map((day, index) => {
              const entries = day ? leavesForDay(day) : [];
              const isToday = day && formatDate(day) === formatDate(new Date());
              return <Box key={`${day?.toISOString() || "empty"}-${index}`} sx={{ minHeight: { xs: 74, sm: 112 }, p: { xs: 0.75, sm: 1 }, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: day ? "background.paper" : "action.hover", opacity: day ? 1 : 0.45 }}>
                {day && <>
                  <Typography variant="caption" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 25, height: 25, borderRadius: "50%", bgcolor: isToday ? "secondary.main" : "transparent", color: isToday ? "secondary.contrastText" : "text.primary", fontWeight: 700 }}>{day.getDate()}</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    {entries.slice(0, 3).map((leave) => <Chip key={`${leave.id}-${formatDate(day)}`} size="small" label={leave.employeeName ? `${leave.employeeName} · ${leave.leaveType}` : leave.leaveType} color={statusColors[leave.status] || "info"} sx={{ maxWidth: "100%", justifyContent: "flex-start", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }} />)}
                    {entries.length > 3 && <Typography variant="caption" color="text.secondary">+{entries.length - 3} more</Typography>}
                  </Stack>
                </>}
              </Box>;
            })}
          </Box>

          {loading && <Typography color="text.secondary" sx={{ mt: 2 }}>Loading leave calendar...</Typography>}
          {!loading && leaves.length === 0 && <Typography color="text.secondary" sx={{ mt: 2 }}>No leave requests available.</Typography>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            {Object.entries(statusColors).map(([status, color]) => <Chip key={status} size="small" label={status} color={color} variant="outlined" />)}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeaveCalendar;
