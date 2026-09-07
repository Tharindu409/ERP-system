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
  TextField,
  Typography,
} from "@mui/material";

import {
  Assessment,
  CheckCircle,
  EventAvailable,
  Schedule,
} from "@mui/icons-material";

import { isAxiosError } from "axios";
import api from "../api/axios";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  remarks: string | null;
}

interface Summary {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  completedCount: number;
  notCheckedOutCount: number;
}

interface ReportResponse {
  fromDate: string | null;
  toDate: string | null;
  employeeId: number | null;
  summary: Summary;
  records: AttendanceRecord[];
}

interface ApiErrorResponse {
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message || fallback
    : fallback;
};

const AttendanceReports = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmployees();
    loadReport();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/Employee");

      setEmployees(response.data);
    } catch (error: unknown) {
      console.error("Employee loading error:", error);
      setError(getErrorMessage(error, "Failed to load employees."));
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = {};

      if (fromDate) {
        params.fromDate = fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

      if (employeeId) {
        params.employeeId = Number(employeeId);
      }

      const response = await api.get(
        "/Attendance/report",
        {
          params,
        }
      );

      setReport(response.data);
    } catch (error: unknown) {
      console.error("Attendance report error:", error);
      setError(getErrorMessage(error, "Failed to load attendance report."));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setEmployeeId("");

    setTimeout(() => {
      loadReport();
    }, 0);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";

    return time.substring(0, 5);
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status.toLowerCase()) {
      case "present": return "success";
      case "late": return "warning";
      case "absent": return "error";
      case "leave": return "info";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#111827",
            mb: 1,
          }}
        >
          Attendance Reports
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: "#6b7280" }}
        >
          View and analyze employee attendance records.
        </Typography>
      </Box>

      {/* FILTER CARD */}

      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
          boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 3,
            }}
          >
            Report Filters
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Employee"
                value={employeeId}
                onChange={(e) =>
                  setEmployeeId(e.target.value)
                }
              >
                <MenuItem value="">
                  All Employees
                </MenuItem>

                {employees.map((employee) => (
                  <MenuItem
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.firstName}{" "}
                    {employee.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Button
                variant="contained"
                onClick={loadReport}
                disabled={loading}
                startIcon={<Assessment />}
                sx={{
                  height: 56,
                  flex: 1,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Generate
              </Button>

              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 5,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* REPORT */}

      {!loading && report && (
        <>
          {/* SUMMARY CARDS */}

          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
          >
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                        }}
                      >
                        Total Working Days
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          mt: 1,
                        }}
                      >
                        {report.summary.totalRecords}
                      </Typography>
                    </Box>

                    <Assessment
                      sx={{
                        fontSize: 40,
                        color: "#2563eb",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                        }}
                      >
                        Present
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          mt: 1,
                        }}
                      >
                        {report.summary.presentCount}
                      </Typography>
                    </Box>

                    <CheckCircle
                      sx={{
                        fontSize: 40,
                        color: "#16a34a",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                        }}
                      >
                        Late
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          mt: 1,
                        }}
                      >
                        {report.summary.lateCount}
                      </Typography>
                    </Box>

                    <Schedule
                      sx={{
                        fontSize: 40,
                        color: "#f59e0b",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                        }}
                      >
                        Leave
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          mt: 1,
                        }}
                      >
                        {report.summary.leaveCount}
                      </Typography>
                    </Box>

                    <EventAvailable
                      sx={{
                        fontSize: 40,
                        color: "#7c3aed",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* SECONDARY SUMMARY */}

          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
          >
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Absent
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                      color: "#dc2626",
                    }}
                  >
                    {report.summary.absentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Completed Check-outs
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                      color: "#16a34a",
                    }}
                  >
                    {report.summary.completedCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
                  >
                    Not Checked-out
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 1,
                      color: "#f59e0b",
                    }}
                  >
                    {report.summary.notCheckedOutCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* TABLE */}

          <Card
            sx={{
              borderRadius: 3,
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.06)",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold" }}
                  >
                    Attendance Records
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      mt: 0.5,
                    }}
                  >
                    {report.records.length} records found
                  </Typography>
                </Box>
              </Box>

              {report.records.length === 0 ? (
                <Alert severity="info">
                  No attendance records found
                  for the selected filters.
                </Alert>
              ) : (
                <Box
                  sx={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse:
                        "collapse",
                      minWidth: "900px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor:
                            "#f9fafb",
                        }}
                      >
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Employee
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Department
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Date
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Check In
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Check Out
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Status
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.records.map(
                        (record, index) => {
                          return (
                            <tr
                              key={`${record.id}-${record.date}-${index}`}
                              style={{
                                borderBottom:
                                  "1px solid #f3f4f6",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                {
                                  record.employeeName
                                }
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                  color: "#6b7280",
                                }}
                              >
                                {
                                  record.departmentName
                                }
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                }}
                              >
                                {formatDate(
                                  record.date
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                }}
                              >
                                {formatTime(
                                  record.checkIn
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                }}
                              >
                                {formatTime(
                                  record.checkOut
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                }}
                              >
                                <Chip size="small" color={getStatusColor(record.status)} label={record.status} />
                              </td>

                              <td
                                style={{
                                  padding: "14px",
                                  color: "#6b7280",
                                }}
                              >
                                {record.remarks ||
                                  "-"}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AttendanceReports;