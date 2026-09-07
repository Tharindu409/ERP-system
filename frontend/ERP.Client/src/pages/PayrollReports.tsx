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
import { Assessment, Payments } from "@mui/icons-material";
import { isAxiosError } from "axios";
import api from "../api/axios";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface PayrollReportSummary {
  totalRecords: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  generatedCount: number;
  paidCount: number;
  pendingCount: number;
}

interface PayrollReportRecord {
  id: number;
  employeeId: number;
  employeeName: string | null;
  year: number;
  month: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  generatedAt: string;
}

interface PayrollReportResponse {
  year: number | null;
  month: number | null;
  employeeId: number | null;
  summary: PayrollReportSummary;
  records: PayrollReportRecord[];
}

interface ApiErrorResponse {
  message?: string;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const years = Array.from({ length: 7 }, (_, index) => 2024 + index);
const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const formatPeriod = (month: number, year: number) =>
  `${months[month - 1] || "Unknown month"} ${year}`;

const formatGeneratedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getStatusColor = (
  status: string,
): "success" | "warning" | "info" | "error" | "default" => {
  switch (status.toLowerCase()) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "generated":
      return "info";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.status === 401) return "Please sign in to view payroll reports.";
    if (error.response?.status === 403) return "You do not have permission to view payroll reports.";
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const PayrollReports = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [report, setReport] = useState<PayrollReportResponse | null>(null);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = async () => {
    const response = await api.get<Employee[]>("/Employee");
    setEmployees(response.data);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<PayrollReportResponse>("/Payroll/report", {
        params: {
          year: year || undefined,
          month: month || undefined,
          employeeId: employeeId || undefined,
        },
      });
      setReport(response.data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Unable to load payroll report."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setError("");
        await Promise.all([loadEmployees(), loadReport()]);
      } catch (requestError: unknown) {
        setError(getErrorMessage(requestError, "Unable to load payroll report."));
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Payroll Reports
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View and analyze employee payroll records and salary summaries.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField
              fullWidth
              select
              label="Year"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              <MenuItem value="">All Years</MenuItem>
              {years.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              select
              label="Month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              <MenuItem value="">All Months</MenuItem>
              {months.map((value, index) => <MenuItem key={value} value={index + 1}>{value}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              select
              label="Employee"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <MenuItem value="">All Employees</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={() => void loadReport()}
              disabled={loading}
              sx={{ minHeight: 56, minWidth: { md: 190 } }}
            >
              Generate Report
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && report && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              ["Total Net Payroll", formatCurrency(report.summary.totalNetSalary)],
              ["Total Basic Salary", formatCurrency(report.summary.totalBasicSalary)],
              ["Total Allowances", formatCurrency(report.summary.totalAllowances)],
              ["Total Deductions", formatCurrency(report.summary.totalDeductions)],
              ["Total Records", report.summary.totalRecords],
            ].map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {report.records.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 7 }}>
                <Payments color="disabled" sx={{ fontSize: 52 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>No payroll records found for the selected filters.</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Card} sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1050 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Basic Salary</TableCell>
                    <TableCell align="right">Allowances</TableCell>
                    <TableCell align="right">Deductions</TableCell>
                    <TableCell align="right">Net Salary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.records.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{record.employeeName || `Employee #${record.employeeId}`}</TableCell>
                      <TableCell>{formatPeriod(record.month, record.year)}</TableCell>
                      <TableCell align="right">{formatCurrency(record.basicSalary)}</TableCell>
                      <TableCell align="right">{formatCurrency(record.allowances)}</TableCell>
                      <TableCell align="right">{formatCurrency(record.deductions)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>{formatCurrency(record.netSalary)}</TableCell>
                      <TableCell><Chip size="small" label={record.status || "Unknown"} color={getStatusColor(record.status || "")} /></TableCell>
                      <TableCell>{formatGeneratedAt(record.generatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default PayrollReports;
