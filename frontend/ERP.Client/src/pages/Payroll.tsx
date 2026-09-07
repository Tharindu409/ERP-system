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
import { Add, Delete, Edit, Payments } from "@mui/icons-material";
import api from "../api/axios";

interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName?: string | null;
  year: number;
  month: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  generatedAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  salary: number;
  isActive: boolean;
}

const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });

const Payroll = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openGenerate, setOpenGenerate] = useState(false);
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [generateForm, setGenerateForm] = useState({ employeeId: "", year: new Date().getFullYear().toString(), month: (new Date().getMonth() + 1).toString(), allowances: "0", deductions: "0" });
  const [editForm, setEditForm] = useState({ allowances: "", deductions: "", status: "Generated" });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrollResponse, employeeResponse] = await Promise.all([
        api.get("/Payroll"),
        api.get("/Employee"),
      ]);
      setPayrolls(payrollResponse.data);
      setEmployees(employeeResponse.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredPayrolls = useMemo(() => payrolls.filter((payroll) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || (payroll.employeeName || `Employee #${payroll.employeeId}`).toLowerCase().includes(query);
    return matchesSearch && (!year || payroll.year.toString() === year) && (!month || payroll.month.toString() === month) && (!status || payroll.status === status);
  }), [payrolls, search, year, month, status]);

  const summary = useMemo(() => ({
    total: filteredPayrolls.length,
    gross: filteredPayrolls.reduce((sum, payroll) => sum + payroll.basicSalary + payroll.allowances, 0),
    deductions: filteredPayrolls.reduce((sum, payroll) => sum + payroll.deductions, 0),
    net: filteredPayrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0),
  }), [filteredPayrolls]);

  const generatePayroll = async () => {
    try {
      setError("");
      await api.post("/Payroll/generate", {
        employeeId: Number(generateForm.employeeId),
        year: Number(generateForm.year),
        month: Number(generateForm.month),
        allowances: Number(generateForm.allowances),
        deductions: Number(generateForm.deductions),
      });
      setOpenGenerate(false);
      setSuccess("Payroll generated successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to generate payroll.");
    }
  };

  const openEdit = (payroll: PayrollRecord) => {
    setEditing(payroll);
    setEditForm({ allowances: payroll.allowances.toString(), deductions: payroll.deductions.toString(), status: payroll.status });
  };

  const updatePayroll = async () => {
    if (!editing) return;
    try {
      await api.put(`/Payroll/${editing.id}`, {
        allowances: Number(editForm.allowances),
        deductions: Number(editForm.deductions),
        status: editForm.status,
      });
      setEditing(null);
      setSuccess("Payroll updated successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to update payroll.");
    }
  };

  const deletePayroll = async (id: number) => {
    if (!window.confirm("Delete this payroll record?")) return;
    try {
      await api.delete(`/Payroll/${id}`);
      setSuccess("Payroll deleted successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to delete payroll.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: "bold" }}>Payroll Management</Typography><Typography color="text.secondary">Generate, review, and manage employee payroll</Typography></Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenGenerate(true)}>Generate Payroll</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {[["Payroll records", summary.total], ["Gross salary", money(summary.gross)], ["Deductions", money(summary.deductions)], ["Net salary", money(summary.net)]].map(([label, value]) => <Card key={label} sx={{ flex: 1 }}><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>{value}</Typography></CardContent></Card>)}
      </Stack>

      <Card sx={{ mb: 3 }}><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField fullWidth label="Search employee" placeholder="Search by employee name..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <TextField fullWidth select label="Year" value={year} onChange={(event) => setYear(event.target.value)}><MenuItem value="">All years</MenuItem>{Array.from(new Set(payrolls.map((payroll) => payroll.year))).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField fullWidth select label="Month" value={month} onChange={(event) => setMonth(event.target.value)}><MenuItem value="">All months</MenuItem>{Array.from({ length: 12 }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{monthName(index + 1)}</MenuItem>)}</TextField>
        <TextField fullWidth select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="Generated">Generated</MenuItem><MenuItem value="Paid">Paid</MenuItem><MenuItem value="Pending">Pending</MenuItem></TextField>
      </Stack></CardContent></Card>

      {loading ? <Typography>Loading payroll...</Typography> : filteredPayrolls.length === 0 ? <Card><CardContent sx={{ textAlign: "center", py: 6 }}><Payments color="disabled" sx={{ fontSize: 52 }} /><Typography variant="h6">No payroll records found</Typography></CardContent></Card> :
        <TableContainer component={Card}><Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Period</TableCell><TableCell>Basic Salary</TableCell><TableCell>Allowances</TableCell><TableCell>Deductions</TableCell><TableCell>Net Salary</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{filteredPayrolls.map((payroll) => <TableRow key={payroll.id} hover><TableCell>{payroll.employeeName || `Employee #${payroll.employeeId}`}</TableCell><TableCell>{monthName(payroll.month)} {payroll.year}</TableCell><TableCell>{money(payroll.basicSalary)}</TableCell><TableCell>{money(payroll.allowances)}</TableCell><TableCell>{money(payroll.deductions)}</TableCell><TableCell sx={{ fontWeight: "bold" }}>{money(payroll.netSalary)}</TableCell><TableCell><Chip size="small" label={payroll.status} color={payroll.status === "Paid" ? "success" : payroll.status === "Generated" ? "info" : "warning"} /></TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}><IconButton color="primary" onClick={() => openEdit(payroll)} aria-label="Edit payroll"><Edit /></IconButton><IconButton color="error" onClick={() => deletePayroll(payroll.id)} aria-label="Delete payroll"><Delete /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer>}

      <Dialog open={openGenerate} onClose={() => setOpenGenerate(false)} fullWidth maxWidth="sm"><DialogTitle>Generate Payroll</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField select label="Employee" value={generateForm.employeeId} onChange={(event) => setGenerateForm({ ...generateForm, employeeId: event.target.value })}><MenuItem value="">Select employee</MenuItem>{employees.filter((employee) => employee.isActive).map((employee) => <MenuItem key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} - Basic salary {money(employee.salary)}</MenuItem>)}</TextField><TextField label="Year" type="number" value={generateForm.year} onChange={(event) => setGenerateForm({ ...generateForm, year: event.target.value })} /><TextField select label="Month" value={generateForm.month} onChange={(event) => setGenerateForm({ ...generateForm, month: event.target.value })}>{Array.from({ length: 12 }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{monthName(index + 1)}</MenuItem>)}</TextField><TextField label="Allowances" type="number" value={generateForm.allowances} onChange={(event) => setGenerateForm({ ...generateForm, allowances: event.target.value })} /><TextField label="Deductions" type="number" value={generateForm.deductions} onChange={(event) => setGenerateForm({ ...generateForm, deductions: event.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setOpenGenerate(false)}>Cancel</Button><Button variant="contained" onClick={generatePayroll}>Generate</Button></DialogActions></Dialog>
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm"><DialogTitle>Edit Payroll</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField label="Allowances" type="number" value={editForm.allowances} onChange={(event) => setEditForm({ ...editForm, allowances: event.target.value })} /><TextField label="Deductions" type="number" value={editForm.deductions} onChange={(event) => setEditForm({ ...editForm, deductions: event.target.value })} /><TextField select label="Status" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><MenuItem value="Generated">Generated</MenuItem><MenuItem value="Paid">Paid</MenuItem><MenuItem value="Pending">Pending</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={updatePayroll}>Save changes</Button></DialogActions></Dialog>
    </Box>
  );
};

export default Payroll;