import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AccessTime, Add, Delete, Edit, Logout } from "@mui/icons-material";
import api from "../api/axios";

interface AttendanceRecord {
  id: number;
  employeeId?: number;
  employeeName?: string | null;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  remarks?: string | null;
}

type Role = "Admin" | "HR" | "Manager" | "Employee";

const decodeRole = (): Role => {
  const token = localStorage.getItem("token");
  if (!token) return "Employee";

  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
    return ["Admin", "HR", "Manager", "Employee"].includes(role) ? role : "Employee";
  } catch {
    return "Employee";
  }
};

const formatTime = (value?: string | null) => value ? value.slice(0, 5) : "-";

const today = () => new Date().toISOString().slice(0, 10);

const statusColor = (status: string) => {
  if (status === "Present") return "success";
  if (status === "Absent") return "error";
  return "warning";
};

const Attendance = () => {
  const role = decodeRole();
  const canViewAll = role !== "Employee";
  const canEdit = ["Admin", "HR", "Manager"].includes(role);
  const canDelete = role === "Admin";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(canViewAll ? today() : "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "", status: "Present", remarks: "" });

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get(canViewAll ? "/Attendance" : "/Attendance/my");
      const data = canViewAll ? response.data : response.data;
      setRecords(Array.isArray(data) ? data : data.attendance || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchesSearch = !search || (record.employeeName || "").toLowerCase().includes(search.toLowerCase());
    const matchesDate = !date || record.date.startsWith(date);
    const matchesStatus = !status || record.status === status;
    return matchesSearch && matchesDate && matchesStatus;
  }), [records, search, date, status]);

  const markAttendance = async (action: "check-in" | "check-out") => {
    try {
      setError("");
      await api.request({ method: action === "check-in" ? "post" : "put", url: `/Attendance/${action}` });
      setSuccess(action === "check-in" ? "Check-in recorded." : "Check-out recorded.");
      await loadAttendance();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || `Unable to ${action}.`);
    }
  };

  const openEdit = (record: AttendanceRecord) => {
    setEditing(record);
    setEditForm({
      checkIn: formatTime(record.checkIn),
      checkOut: formatTime(record.checkOut),
      status: record.status,
      remarks: record.remarks || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setError("");
      await api.put(`/Attendance/${editing.id}`, {
        checkIn: editForm.checkIn || null,
        checkOut: editForm.checkOut || null,
        status: editForm.status,
        remarks: editForm.remarks || null,
      });
      setEditing(null);
      setSuccess("Attendance updated successfully.");
      await loadAttendance();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to update attendance.");
    }
  };

  const deleteRecord = async (id: number) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      setError("");
      await api.delete(`/Attendance/${id}`);
      setSuccess("Attendance deleted successfully.");
      await loadAttendance();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to delete attendance.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {canViewAll ? "Today's Attendance" : "My Attendance"}
          </Typography>
          <Typography color="text.secondary">
            {canViewAll
              ? "Review employee attendance, working hours, and status"
              : "Review your attendance history and working hours"}
          </Typography>
        </Box>
        {role === "Employee" && (
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<Add />} onClick={() => markAttendance("check-in")}>Check in</Button>
            <Button variant="outlined" startIcon={<Logout />} onClick={() => markAttendance("check-out")}>Check out</Button>
          </Stack>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {canViewAll && <TextField fullWidth label="Search employee" placeholder="Search by employee name..." value={search} onChange={(event) => setSearch(event.target.value)} />}
            <TextField fullWidth label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField fullWidth select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Leave">Leave</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {loading ? <Typography>Loading attendance...</Typography> : filteredRecords.length === 0 ? (
        <Card><CardContent sx={{ textAlign: "center", py: 6 }}><AccessTime color="disabled" sx={{ fontSize: 52 }} /><Typography variant="h6">No attendance records found</Typography></CardContent></Card>
      ) : (
        <Stack spacing={2}>
          {filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="h6">{record.employeeName || "My attendance"}</Typography>
                  <Typography color="text.secondary">{record.date}</Typography>
                </Box>
                <Box><Typography variant="body2" color="text.secondary">Check-in</Typography><Typography>{formatTime(record.checkIn)}</Typography></Box>
                <Box><Typography variant="body2" color="text.secondary">Check-out</Typography><Typography>{formatTime(record.checkOut)}</Typography></Box>
                <Chip label={record.status} color={statusColor(record.status)} />
                {record.remarks && <Typography sx={{ maxWidth: 220 }} color="text.secondary">{record.remarks}</Typography>}
                {(canEdit || canDelete) && <Box>
                  {canEdit && <IconButton color="primary" onClick={() => openEdit(record)} aria-label="Edit attendance"><Edit /></IconButton>}
                  {canDelete && <IconButton color="error" onClick={() => deleteRecord(record.id)} aria-label="Delete attendance"><Delete /></IconButton>}
                </Box>}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit attendance</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Check-in" type="time" value={editForm.checkIn} onChange={(event) => setEditForm({ ...editForm, checkIn: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Check-out" type="time" value={editForm.checkOut} onChange={(event) => setEditForm({ ...editForm, checkOut: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select label="Status" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
              <MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem><MenuItem value="Leave">Leave</MenuItem>
            </TextField>
            <TextField label="Remarks" value={editForm.remarks} onChange={(event) => setEditForm({ ...editForm, remarks: event.target.value })} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={saveEdit}>Save changes</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance;