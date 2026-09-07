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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Check, Delete, Edit, Close } from "@mui/icons-material";
import api from "../api/axios";

interface LeaveRecord {
  id: number;
  employeeId?: number;
  employeeName?: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  managerComment?: string | null;
  createdAt?: string;
}

type Role = "Admin" | "HR" | "Manager" | "Employee";

const getRole = (): Role => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "Employee";
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
    return ["Admin", "HR", "Manager", "Employee"].includes(role) ? role : "Employee";
  } catch {
    return "Employee";
  }
};

const Leave = () => {
  const role = getRole();
  const isEmployee = role === "Employee";
  const canReview = ["Admin", "HR", "Manager"].includes(role);
  const canDelete = role === "Admin";
  const [showAll, setShowAll] = useState(!isEmployee);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<LeaveRecord | null>(null);
  const [decision, setDecision] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get(!isEmployee && showAll ? "/Leave" : "/Leave/my");
      setLeaves(response.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, [showAll]);

  const filteredLeaves = useMemo(() => leaves.filter((leave) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || `${leave.employeeName || ""} ${leave.leaveType} ${leave.reason}`.toLowerCase().includes(query);
    return matchesSearch && (!status || leave.status === status);
  }), [leaves, search, status]);

  const resetForm = () => setForm({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });

  const openCreate = () => { setEditing(null); resetForm(); setError(""); setOpenForm(true); };
  const [openForm, setOpenForm] = useState(false);

  const openEdit = (leave: LeaveRecord) => {
    setEditing(leave);
    setForm({ leaveType: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason });
    setOpenForm(true);
  };

  const saveLeave = async () => {
    try {
      setError("");
      if (editing) await api.put(`/Leave/${editing.id}`, form);
      else await api.post("/Leave/apply", form);
      setOpenForm(false);
      setSuccess(editing ? "Leave request updated." : "Leave request submitted.");
      await loadLeaves();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to save leave request.");
    }
  };

  const submitDecision = async () => {
    if (!decision) return;
    try {
      await api.put(`/Leave/${decision.id}/${decision.action}`, { comment });
      setDecision(null);
      setComment("");
      setSuccess(`Leave request ${decision.action}d successfully.`);
      await loadLeaves();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to update leave status.");
    }
  };

  const removeLeave = async (leave: LeaveRecord) => {
    const action = canDelete ? "delete" : "cancel";
    if (!window.confirm(`${action === "delete" ? "Delete" : "Cancel"} this leave request?`)) return;
    try {
      await api[canDelete ? "delete" : "put"](`/Leave/${leave.id}${canDelete ? "" : "/cancel"}`);
      setSuccess(`Leave request ${action}d successfully.`);
      await loadLeaves();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || `Failed to ${action} leave request.`);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>{!isEmployee && showAll ? "All Leave Requests" : "My Leave Requests"}</Typography>
          <Typography color="text.secondary">Submit, review, and manage employee leave requests</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {!isEmployee && <Button variant={showAll ? "outlined" : "contained"} onClick={() => setShowAll(false)}>My Leaves</Button>}
          {!isEmployee && <Button variant={showAll ? "contained" : "outlined"} onClick={() => setShowAll(true)}>All Leaves</Button>}
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Submit Leave</Button>
        </Stack>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Card sx={{ mb: 3 }}><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField fullWidth label="Search" placeholder="Employee, leave type, or reason" value={search} onChange={(event) => setSearch(event.target.value)} />
        <TextField fullWidth select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <MenuItem value="">All statuses</MenuItem><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Approved">Approved</MenuItem><MenuItem value="Rejected">Rejected</MenuItem><MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
      </Stack></CardContent></Card>

      {loading ? <Typography>Loading leave requests...</Typography> : filteredLeaves.length === 0 ? <Card><CardContent><Typography>No leave requests found.</Typography></CardContent></Card> :
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead><TableRow>
              {!isEmployee && showAll && <TableCell>Employee</TableCell>}
              <TableCell>Leave Type</TableCell><TableCell>Dates</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell>Review Comment</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>{filteredLeaves.map((leave) => <TableRow key={leave.id} hover>
              {!isEmployee && showAll && <TableCell>{leave.employeeName || `Employee #${leave.employeeId}`}</TableCell>}
              <TableCell>{leave.leaveType}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{leave.startDate}<br />to {leave.endDate}</TableCell>
              <TableCell sx={{ minWidth: 180 }}>{leave.reason}</TableCell>
              <TableCell><Chip size="small" label={leave.status} color={leave.status === "Approved" ? "success" : leave.status === "Rejected" ? "error" : leave.status === "Pending" ? "warning" : "default"} /></TableCell>
              <TableCell>{leave.managerComment || "-"}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                {canReview && leave.status === "Pending" && <><IconButton color="success" onClick={() => setDecision({ id: leave.id, action: "approve" })} aria-label="Approve leave"><Check /></IconButton><IconButton color="error" onClick={() => setDecision({ id: leave.id, action: "reject" })} aria-label="Reject leave"><Close /></IconButton></>}
                {leave.status === "Pending" && <IconButton color="primary" onClick={() => openEdit(leave)} aria-label="Edit leave"><Edit /></IconButton>}
                {(canDelete || (isEmployee && leave.status === "Pending")) && <IconButton color="error" onClick={() => removeLeave(leave)} aria-label={canDelete ? "Delete leave" : "Cancel leave"}><Delete /></IconButton>}
              </TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm"><DialogTitle>{editing ? "Update Leave Request" : "Submit Leave Request"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
        <TextField select label="Leave type" value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value })}><MenuItem value="Annual">Annual</MenuItem><MenuItem value="Sick">Sick</MenuItem><MenuItem value="Casual">Casual</MenuItem><MenuItem value="Unpaid">Unpaid</MenuItem></TextField>
        <TextField label="Start date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="End date" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} multiline rows={3} />
      </Stack></DialogContent><DialogActions><Button onClick={() => setOpenForm(false)}>Cancel</Button><Button variant="contained" onClick={saveLeave}>Save</Button></DialogActions></Dialog>

      <Dialog open={!!decision} onClose={() => setDecision(null)} fullWidth maxWidth="sm"><DialogTitle>{decision?.action === "approve" ? "Approve leave request" : "Reject leave request"}</DialogTitle><DialogContent><TextField fullWidth label="Comment (optional)" value={comment} onChange={(event) => setComment(event.target.value)} multiline rows={3} sx={{ mt: 1 }} /></DialogContent><DialogActions><Button onClick={() => setDecision(null)}>Cancel</Button><Button variant="contained" color={decision?.action === "approve" ? "success" : "error"} onClick={submitDecision}>{decision?.action === "approve" ? "Approve" : "Reject"}</Button></DialogActions></Dialog>
    </Box>
  );
};

export default Leave;