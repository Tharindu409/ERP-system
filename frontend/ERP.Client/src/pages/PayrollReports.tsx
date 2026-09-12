import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWallet,
  AttachMoney,
  Payments,
  ReceiptLong,
} from "@mui/icons-material";

import api from "../api/axios";

interface PayrollReport {
  year: number;
  month: number;
  records: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
}

const PayrollReports = () => {
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayrollReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Reports/payroll");

      setReports(response.data);
    } catch (err: any) {
      console.error("Payroll report error:", err);

      if (err.response?.status === 401) {
        setError("You are not authorized. Please login again.");
      } else if (err.response?.status === 403) {
        setError(
          "You do not have permission to view payroll reports."
        );
      } else {
        setError("Unable to load payroll reports.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollReports();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getMonthName = (month: number) => {
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

    return months[month - 1] || "Unknown";
  };

  const totalRecords = reports.reduce(
    (sum, report) => sum + report.records,
    0
  );

  const totalBasicSalary = reports.reduce(
    (sum, report) => sum + report.totalBasicSalary,
    0
  );

  const totalAllowances = reports.reduce(
    (sum, report) => sum + report.totalAllowances,
    0
  );

  const totalDeductions = reports.reduce(
    (sum, report) => sum + report.totalDeductions,
    0
  );

  const totalNetSalary = reports.reduce(
    (sum, report) => sum + report.totalNetSalary,
    0
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
            mb: 0.5,
          }}
        >
          Payroll Reports
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
          }}
        >
          View payroll summaries and salary information for the
          latest payroll periods.
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
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
                    sx={{ color: "#6b7280", mb: 1 }}
                  >
                    Total Net Payroll
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {formatCurrency(totalNetSalary)}
                  </Typography>
                </Box>

                <AccountBalanceWallet
                  sx={{
                    fontSize: 36,
                    color: "#2563eb",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
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
                    sx={{ color: "#6b7280", mb: 1 }}
                  >
                    Basic Salary
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {formatCurrency(totalBasicSalary)}
                  </Typography>
                </Box>

                <Payments
                  sx={{
                    fontSize: 36,
                    color: "#2563eb",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
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
                    sx={{ color: "#6b7280", mb: 1 }}
                  >
                    Total Allowances
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {formatCurrency(totalAllowances)}
                  </Typography>
                </Box>

                <AttachMoney
                  sx={{
                    fontSize: 36,
                    color: "#2563eb",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
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
                    sx={{ color: "#6b7280", mb: 1 }}
                  >
                    Total Deductions
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {formatCurrency(totalDeductions)}
                  </Typography>
                </Box>

                <ReceiptLong
                  sx={{
                    fontSize: 36,
                    color: "#dc2626",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Records Summary */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Payroll Overview
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#6b7280" }}
          >
            Total payroll records across the available reporting
            periods:{" "}
            <strong>{totalRecords}</strong>
          </Typography>
        </CardContent>
      </Card>

      {/* Table */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Payroll Summary
          </Typography>
        </CardContent>

        {reports.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              No payroll records found.
            </Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>
                    Period
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700 }}
                  >
                    Records
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    Basic Salary
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    Allowances
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    Deductions
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    Net Salary
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={`${report.year}-${report.month}`}
                    hover
                  >
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        {getMonthName(report.month)}{" "}
                        {report.year}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      {report.records}
                    </TableCell>

                    <TableCell align="right">
                      {formatCurrency(
                        report.totalBasicSalary
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {formatCurrency(
                        report.totalAllowances
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {formatCurrency(
                        report.totalDeductions
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(
                          report.totalNetSalary
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default PayrollReports;