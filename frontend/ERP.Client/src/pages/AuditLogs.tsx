import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../api/axios";

interface AuditLog {
  id: number;
  actorUsername: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details: string;
  createdAt: string;
}

const entityOptions = ["", "User", "Employee", "LeaveRequest", "Attendance"];

const formatDetails = (details: string) => {
  try {
    return Object.entries(JSON.parse(details) as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" | ");
  } catch {
    return details;
  }
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<AuditLog[]>("/Audit", {
        params: { entityType: entityType || undefined, limit: 250 },
      });
      setLogs(response.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [entityType]);

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4">Audit Log</Typography>
          <Typography color="text.secondary">A traceable record of changes across the HR system.</Typography>
        </Box>
        <Tooltip title="Refresh audit log">
          <IconButton onClick={() => void loadLogs()} color="primary" aria-label="Refresh audit log"><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField select label="Entity" value={entityType} onChange={(event) => setEntityType(event.target.value)} sx={{ minWidth: 190 }}>
            {entityOptions.map((option) => <MenuItem key={option || "all"} value={option}>{option || "All entities"}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary">{logs.length} events</Typography>
        </Box>
      </Card>

      {loading ? <CircularProgress /> : logs.length === 0 ? <Card><Box sx={{ p: 4 }}><Typography color="text.secondary">No audit events found.</Typography></Box></Card> :
        <TableContainer component={Card} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>When</TableCell><TableCell>Actor</TableCell><TableCell>Action</TableCell><TableCell>Entity</TableCell><TableCell>Details</TableCell></TableRow></TableHead>
            <TableBody>{logs.map((log) => <TableRow key={log.id} hover><TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</TableCell><TableCell><Typography sx={{ fontWeight: 700 }}>{log.actorUsername}</Typography></TableCell><TableCell><Chip size="small" label={log.action} color={log.action === "Deleted" ? "error" : log.action === "Created" ? "success" : "info"} /></TableCell><TableCell>{log.entityType} {log.entityId ? `#${log.entityId}` : ""}</TableCell><TableCell sx={{ minWidth: 280 }}>{formatDetails(log.details)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </TableContainer>}
    </Box>
  );
};

export default AuditLogs;
