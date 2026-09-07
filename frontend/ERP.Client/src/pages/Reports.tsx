import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import {
  People,
  PersonOff,
  EventAvailable,
  EventBusy,
  AccessTime,
  CheckCircle,
  PendingActions,
  Cancel,
  Payments,
  AccountBalance,
  Business,
} from "@mui/icons-material";

import api from "../api/axios";

// =========================================================
// Interfaces
// =========================================================

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  remarks?: string | null;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  managerComment?: string | null;
  createdAt: string;
}

interface Payroll {
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

// =========================================================
// Stat Card
// =========================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard = ({
  title,
  value,
  icon,
}: StatCardProps) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
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
              sx={{
                color: "#6b7280",
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// =========================================================
// Reports
// =========================================================

const Reports = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // Load Report Data
  // =========================================================

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
        api.get("/Employee"),
        api.get("/Department"),
        api.get("/Attendance"),
        api.get("/Leave"),
        api.get("/Payroll"),
      ]);

      setEmployees(employeesResponse.data);
      setDepartments(departmentsResponse.data);
      setAttendance(attendanceResponse.data);
      setLeaves(leaveResponse.data);
      setPayrolls(payrollResponse.data);
    } catch (error: any) {
      console.error("Reports loading error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // =========================================================
  // Employee Statistics
  // =========================================================

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.isActive
  ).length;

  const inactiveEmployees =
    totalEmployees - activeEmployees;

  // =========================================================
  // Attendance Statistics
  // =========================================================

  const presentCount = attendance.filter(
    (item) =>
      item.status?.toLowerCase() === "present"
  ).length;

  const absentCount = attendance.filter(
    (item) =>
      item.status?.toLowerCase() === "absent"
  ).length;

  const lateCount = attendance.filter(
    (item) =>
      item.status?.toLowerCase() === "late"
  ).length;

  // =========================================================
  // Leave Statistics
  // =========================================================

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "pending"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "approved"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "rejected"
  ).length;

  const cancelledLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "cancelled"
  ).length;

  // =========================================================
  // Payroll Statistics
  // =========================================================

  const totalPayroll = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.netSalary || 0),
    0
  );

  const totalBasicSalary = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.basicSalary || 0),
    0
  );

  const totalAllowances = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.allowances || 0),
    0
  );

  const totalDeductions = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.deductions || 0),
    0
  );

  // =========================================================
  // Employees By Department
  // =========================================================

  const employeesByDepartment = useMemo(() => {
    return departments.map((department) => ({
      name: department.name,
      count: employees.filter(
        (employee) =>
          employee.departmentId === department.id
      ).length,
    }));
  }, [departments, employees]);

  // =========================================================
  // Loading
  // =========================================================

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
        <CircularProgress />
      </Box>
    );
  }

  // =========================================================
  // Error
  // =========================================================

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <Box sx={{ p: 3 }}>

      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#111827",
          }}
        >
          Reports
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mt: 0.5,
          }}
        >
          HR and workforce analytics overview.
        </Typography>
      </Box>

      {/* ================================================= */}
      {/* Employee Statistics */}
      {/* ================================================= */}

      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          mb: 2,
        }}
      >
        Employee Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<People />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Active Employees"
            value={activeEmployees}
            icon={<CheckCircle />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Inactive Employees"
            value={inactiveEmployees}
            icon={<PersonOff />}
          />
        </Grid>

      </Grid>

      {/* ================================================= */}
      {/* Attendance */}
      {/* ================================================= */}

      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          mb: 2,
        }}
      >
        Attendance Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Present Records"
            value={presentCount}
            icon={<AccessTime />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Absent Records"
            value={absentCount}
            icon={<EventBusy />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Late Records"
            value={lateCount}
            icon={<EventAvailable />}
          />
        </Grid>

      </Grid>

      {/* ================================================= */}
      {/* Leave */}
      {/* ================================================= */}

      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          mb: 2,
        }}
      >
        Leave Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending"
            value={pendingLeaves}
            icon={<PendingActions />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Approved"
            value={approvedLeaves}
            icon={<CheckCircle />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Rejected"
            value={rejectedLeaves}
            icon={<Cancel />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Cancelled"
            value={cancelledLeaves}
            icon={<EventBusy />}
          />
        </Grid>

      </Grid>

      {/* ================================================= */}
      {/* Payroll */}
      {/* ================================================= */}

      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          mb: 2,
        }}
      >
        Payroll Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Payroll"
            value={`Rs. ${totalPayroll.toLocaleString()}`}
            icon={<Payments />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Basic Salary"
            value={`Rs. ${totalBasicSalary.toLocaleString()}`}
            icon={<AccountBalance />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Allowances"
            value={`Rs. ${totalAllowances.toLocaleString()}`}
            icon={<Payments />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Deductions"
            value={`Rs. ${totalDeductions.toLocaleString()}`}
            icon={<Payments />}
          />
        </Grid>

      </Grid>

      {/* ================================================= */}
      {/* Employees By Department */}
      {/* ================================================= */}

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <Business />

            <Typography
              variant="h6"
              sx={{ fontWeight: "bold" }}
            >
              Employees by Department
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {employeesByDepartment.length === 0 ? (
            <Typography sx={{ color: "#6b7280" }}>
              No departments found.
            </Typography>
          ) : (
            employeesByDepartment.map(
              (department) => (
                <Box
                  key={department.name}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom:
                      "1px solid #f3f4f6",
                  }}
                >
                  <Typography>
                    {department.name}
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "#2563eb",
                    }}
                  >
                    {department.count}
                  </Typography>
                </Box>
              )
            )
          )}

        </CardContent>
      </Card>

      {/* ================================================= */}
      {/* Report Summary */}
      {/* ================================================= */}

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: 3 }}>

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 2,
            }}
          >
            Report Summary
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="body2"
                sx={{ color: "#6b7280" }}
              >
                Departments
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mt: 0.5,
                }}
              >
                {departments.length}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="body2"
                sx={{ color: "#6b7280" }}
              >
                Attendance Records
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mt: 0.5,
                }}
              >
                {attendance.length}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="body2"
                sx={{ color: "#6b7280" }}
              >
                Payroll Records
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mt: 0.5,
                }}
              >
                {payrolls.length}
              </Typography>
            </Grid>

          </Grid>

        </CardContent>
      </Card>

    </Box>
  );
};

export default Reports;