import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Assessment } from "@mui/icons-material";
import { AxiosError } from "axios";
import api from "../api/axios";

interface EmployeeSummaryRecord {
  employeeId: number;
  employeeName: string;
  departmentName: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  completedDays: number;
}

interface EmployeeSummaryResponse {
  fromDate: string | null;
  toDate: string | null;
  employees: EmployeeSummaryRecord[];
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const getPercentage = (record: EmployeeSummaryRecord) => {
  if (record.totalDays === 0) return 0;
  return Math.round(((record.presentDays + record.lateDays) / record.totalDays) * 10000) / 100;
};

const getPercentageColor = (percentage: number): "success" | "warning" | "error" => {
  if (percentage >= 90) return "success";
  if (percentage >= 75) return "warning";
  return "error";
};

const EmployeeAttendanceSummary = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState<EmployeeSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<EmployeeSummaryResponse>("/Attendance/report/employee-summary", {
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      });
      setSummary(response.data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Failed to load employee attendance summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>Employee Attendance Summary</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Review working-day attendance performance by employee.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="From Date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="To Date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button fullWidth variant="contained" startIcon={<Assessment />} onClick={() => void loadSummary()} disabled={loading} sx={{ minHeight: 56 }}>
                Generate Summary
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && summary && summary.employees.length === 0 && (
        <Card><CardContent><Typography>No employee attendance data found for the selected dates.</Typography></CardContent></Card>
      )}

      {!loading && summary && summary.employees.length > 0 && (
        <TableContainer component={Card} sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Working Days</TableCell>
                <TableCell align="right">Present</TableCell>
                <TableCell align="right">Late</TableCell>
                <TableCell align="right">Absent</TableCell>
                <TableCell align="right">Leave</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell>Attendance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.employees.map((record) => {
                const percentage = getPercentage(record);
                return (
                  <TableRow key={record.employeeId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{record.employeeName}</TableCell>
                    <TableCell>{record.departmentName}</TableCell>
                    <TableCell align="right">{record.totalDays}</TableCell>
                    <TableCell align="right">{record.presentDays}</TableCell>
                    <TableCell align="right">{record.lateDays}</TableCell>
                    <TableCell align="right">{record.absentDays}</TableCell>
                    <TableCell align="right">{record.leaveDays}</TableCell>
                    <TableCell align="right">{record.completedDays}</TableCell>
                    <TableCell><Chip size="small" color={getPercentageColor(percentage)} label={`${percentage.toFixed(2)}%`} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EmployeeAttendanceSummary;
