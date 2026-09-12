
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";

import api from "../api/axios";

interface EmployeeReport {
  id: number;
  name: string;
  department: string | null;
  hireDate: string;
  salary: number;
  isActive: boolean;
}

interface DepartmentReport {
  id: number;
  name: string;
  employeeCount: number;
  activeEmployees: number;
}

interface StatusReport {
  status: string;
  count: number;
}

interface PayrollReport {
  year: number;
  month: number;
  records: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatMonth = (month: number) => {
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

  return months[month - 1] || `Month ${month}`;
};

const getStatusColor = (
  status: string
): "success" | "warning" | "error" | "info" | "default" => {
  const value = status.toLowerCase();

  if (value === "approved" || value === "present") return "success";
  if (value === "pending" || value === "absent") return "warning";
  if (value === "rejected") return "error";

  return "info";
};

export default function HRReports() {
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [departments, setDepartments] = useState<DepartmentReport[]>([]);
  const [attendance, setAttendance] = useState<StatusReport[]>([]);
  const [leave, setLeave] = useState<StatusReport[]>([]);
  const [payroll, setPayroll] = useState<PayrollReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeesResponse,
        departmentsResponse,
        attendanceResponse,
        leaveResponse,
        payrollResponse,
      ] = await Promise.all([
        api.get("/Reports/employees"),
        api.get("/Reports/departments"),
        api.get("/Reports/attendance"),
        api.get("/Reports/leave"),
        api.get("/Reports/payroll"),
      ]);

      setEmployees(employeesResponse.data);
      setDepartments(departmentsResponse.data);
      setAttendance(attendanceResponse.data);
      setLeave(leaveResponse.data);
      setPayroll(payrollResponse.data);
    } catch (err: any) {
      console.error("HR Reports error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load HR reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.isActive).length,
    [employees]
  );

  const inactiveEmployees = useMemo(
    () => employees.filter((employee) => !employee.isActive).length,
    [employees]
  );

  const totalDepartments = departments.length;

  const totalAttendanceRecords = useMemo(
    () => attendance.reduce((sum, item) => sum + item.count, 0),
    [attendance]
  );

  const presentAttendance = useMemo(() => {
    return attendance
      .filter((item) => item.status?.toLowerCase() === "present")
      .reduce((sum, item) => sum + item.count, 0);
  }, [attendance]);

  const attendanceRate =
    totalAttendanceRecords > 0
      ? (presentAttendance / totalAttendanceRecords) * 100
      : 0;

  const totalLeaveRequests = useMemo(
    () => leave.reduce((sum, item) => sum + item.count, 0),
    [leave]
  );

  const totalPayrollRecords = useMemo(
    () => payroll.reduce((sum, item) => sum + item.records, 0),
    [payroll]
  );

  const totalBasicSalary = useMemo(
    () => payroll.reduce((sum, item) => sum + item.totalBasicSalary, 0),
    [payroll]
  );

  const totalAllowances = useMemo(
    () => payroll.reduce((sum, item) => sum + item.totalAllowances, 0),
    [payroll]
  );

  const totalDeductions = useMemo(
    () => payroll.reduce((sum, item) => sum + item.totalDeductions, 0),
    [payroll]
  );

  const totalNetSalary = useMemo(
    () => payroll.reduce((sum, item) => sum + item.totalNetSalary, 0),
    [payroll]
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Loading HR reports...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            HR Reports
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Overall human resources performance and management overview
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadReports}
        >
          Refresh Reports
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PeopleIcon fontSize="large" color="primary" />

                <Box>
                  <Typography color="text.secondary">
                    Total Employees
                  </Typography>

                  <Typography variant="h4" fontWeight={700}>
                    {employees.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonIcon fontSize="large" color="success" />

                <Box>
                  <Typography color="text.secondary">
                    Active Employees
                  </Typography>

                  <Typography variant="h4" fontWeight={700}>
                    {activeEmployees}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <BusinessIcon fontSize="large" color="info" />

                <Box>
                  <Typography color="text.secondary">
                    Departments
                  </Typography>

                  <Typography variant="h4" fontWeight={700}>
                    {totalDepartments}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <BeachAccessIcon fontSize="large" color="warning" />

                <Box>
                  <Typography color="text.secondary">
                    Leave Requests
                  </Typography>

                  <Typography variant="h4" fontWeight={700}>
                    {totalLeaveRequests}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* EMPLOYEE OVERVIEW */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Employee Overview
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon color="success" />
                    <Typography>Active Employees</Typography>
                  </Stack>

                  <Chip
                    label={activeEmployees}
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon color="error" />
                    <Typography>Inactive Employees</Typography>
                  </Stack>

                  <Chip
                    label={inactiveEmployees}
                    color="error"
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon color="primary" />
                    <Typography>Total Departments</Typography>
                  </Stack>

                  <Chip
                    label={totalDepartments}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography fontWeight={600} sx={{ mb: 1 }}>
                Employee Distribution by Department
              </Typography>

              {departments.length === 0 ? (
                <Typography color="text.secondary">
                  No department data available.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {departments.map((department) => (
                    <Box key={department.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography>{department.name}</Typography>

                        <Typography fontWeight={600}>
                          {department.employeeCount}
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          bgcolor: "action.hover",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width:
                              employees.length > 0
                                ? `${Math.min(
                                    (department.employeeCount /
                                      employees.length) *
                                      100,
                                    100
                                  )}%`
                                : "0%",
                            bgcolor: "primary.main",
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ATTENDANCE + LEAVE */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Attendance Overview
                </Typography>

                <EventAvailableIcon color="success" />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total Records</Typography>
                  <Chip label={totalAttendanceRecords} />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Present</Typography>

                  <Chip
                    label={presentAttendance}
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                {attendance.map((item) => (
                  <Stack
                    key={item.status}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>{item.status}</Typography>

                    <Chip
                      label={item.count}
                      color={getStatusColor(item.status)}
                      variant="outlined"
                    />
                  </Stack>
                ))}

                <Divider />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontWeight={700}>
                    Attendance Rate
                  </Typography>

                  <Typography variant="h6" fontWeight={700}>
                    {attendanceRate.toFixed(1)}%
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Leave Overview
                </Typography>

                <BeachAccessIcon color="warning" />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total Requests</Typography>

                  <Chip label={totalLeaveRequests} />
                </Stack>

                {leave.map((item) => (
                  <Stack
                    key={item.status}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>{item.status}</Typography>

                    <Chip
                      label={item.count}
                      color={getStatusColor(item.status)}
                      variant="outlined"
                    />
                  </Stack>
                ))}

                {leave.length === 0 && (
                  <Typography color="text.secondary">
                    No leave data available.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PAYROLL OVERVIEW */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Payroll Overview
            </Typography>

            <PaymentsIcon color="primary" />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography color="text.secondary">
                  Payroll Records
                </Typography>

                <Typography variant="h6" fontWeight={700}>
                  {totalPayrollRecords}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography color="text.secondary">
                  Basic Salary
                </Typography>

                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(totalBasicSalary)}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography color="text.secondary">
                  Allowances
                </Typography>

                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(totalAllowances)}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography color="text.secondary">
                  Net Salary
                </Typography>

                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(totalNetSalary)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Typography fontWeight={600} sx={{ mb: 1.5 }}>
            Recent Monthly Payroll
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell>Allowances</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payroll.slice(0, 6).map((item) => (
                  <TableRow key={`${item.year}-${item.month}`}>
                    <TableCell>
                      {formatMonth(item.month)} {item.year}
                    </TableCell>

                    <TableCell>{item.records}</TableCell>

                    <TableCell>
                      {formatCurrency(item.totalBasicSalary)}
                    </TableCell>

                    <TableCell>
                      {formatCurrency(item.totalAllowances)}
                    </TableCell>

                    <TableCell>
                      {formatCurrency(item.totalDeductions)}
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>
                        {formatCurrency(item.totalNetSalary)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {payroll.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No payroll data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DEPARTMENT TABLE */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Department Overview
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Total Employees</TableCell>
                  <TableCell>Active Employees</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {department.name}
                      </Typography>
                    </TableCell>

                    <TableCell>{department.employeeCount}</TableCell>

                    <TableCell>{department.activeEmployees}</TableCell>

                    <TableCell>
                      <Chip
                        label={
                          department.employeeCount > 0
                            ? "Active"
                            : "No Employees"
                        }
                        color={
                          department.employeeCount > 0
                            ? "success"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No department data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}