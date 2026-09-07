import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import api from "../api/axios";

type ReportType = "employees" | "attendance" | "leave" | "payroll" | "departments";
type ReportRow = Record<string, string | number | boolean | null>;

const titles: Record<ReportType, string> = { employees: "Employee Report", attendance: "Attendance Report", leave: "Leave Report", payroll: "Payroll Report", departments: "Department Report" };

const Reports = () => {
  const [type, setType] = useState<ReportType>("employees");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/Reports/${type}`);
        setRows(response.data);
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [type]);

  const columns = rows.length ? Object.keys(rows[0]) : [];
  const formatHeader = (column: string) => column.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
  const formatValue = (value: ReportRow[string]) => typeof value === "boolean" ? (value ? "Active" : "Inactive") : value ?? "-";

  return <Box><Box sx={{ mb: 3 }}><Typography variant="h4" sx={{ fontWeight: "bold" }}>Reports</Typography><Typography color="text.secondary">Operational insight across your HR system</Typography></Box><Card sx={{ mb: 3 }}><CardContent><TextField select fullWidth label="Report type" value={type} onChange={(event) => setType(event.target.value as ReportType)}>{Object.entries(titles).map(([key, title]) => <MenuItem key={key} value={key}>{title}</MenuItem>)}</TextField></CardContent></Card>{error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}{loading ? <Typography>Loading report...</Typography> : <TableContainer component={Card}><Table size="small"><TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{formatHeader(column)}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row, index) => <TableRow key={index} hover>{columns.map((column) => <TableCell key={column}>{column.toLowerCase().includes("status") ? <Chip size="small" label={formatValue(row[column])} /> : formatValue(row[column])}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>}</Box>;
};

export default Reports;