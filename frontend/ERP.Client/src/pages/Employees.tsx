import { useEffect, useState } from "react";
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
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  PersonAdd,
} from "@mui/icons-material";

import api from "../api/axios";

interface Employee {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  hireDate: string;
  salary: number;
  departmentId: number;
  isActive: boolean;
  departmentName: string;
}

interface Department {
  id: number;
  name: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    hireDate: "",
    salary: "",
    departmentId: "",
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const response = await api.get("/Employee");

      setEmployees(response.data);
    } catch (error) {
      console.error("Employee loading error:", error);
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get("/Departments");

      setDepartments(response.data);
    } catch (error) {
      console.error("Department loading error:", error);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      userId: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      hireDate: "",
      salary: "",
      departmentId: "",
    });
  };

  const handleAdd = () => {
    setEditMode(false);
    setSelectedEmployee(null);
    resetForm();
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditMode(true);
    setSelectedEmployee(employee);

    setForm({
      userId: employee.userId.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone || "",
      address: employee.address || "",
      hireDate: employee.hireDate,
      salary: employee.salary.toString(),
      departmentId: employee.departmentId.toString(),
    });

    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      const data = {
        userId: Number(form.userId),
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        address: form.address || null,
        hireDate: form.hireDate,
        salary: Number(form.salary),
        departmentId: Number(form.departmentId),
      };

      if (editMode && selectedEmployee) {
        await api.put(
          `/Employee/${selectedEmployee.id}`,
          data
        );

        setSuccess("Employee updated successfully.");
      } else {
        await api.post("/Employee", data);

        setSuccess("Employee added successfully.");
      }

      setOpenDialog(false);
      resetForm();

      await loadEmployees();
    } catch (error: any) {
      console.error("Employee save error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to save employee."
      );
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/Employee/${id}`);

      setSuccess("Employee deleted successfully.");

      await loadEmployees();
    } catch (error: any) {
      console.error("Employee delete error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to delete employee."
      );
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const fullName =
      `${employee.firstName} ${employee.lastName}`.toLowerCase();

    return (
      fullName.includes(search.toLowerCase()) ||
      employee.phone
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          < Typography
            variant="h4"
            fontWeight="bold"
          >
            Employees
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Manage your organization's employees
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Employee
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Search */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>
          <TextField
            fullWidth
            label="Search employees"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </CardContent>
      </Card>

      {/* Employee list */}
      {loading ? (
        <Typography>
          Loading employees...
        </Typography>
      ) : filteredEmployees.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <CardContent
            sx={{
              textAlign: "center",
              py: 6,
            }}
          >
            <PersonAdd
              sx={{
                fontSize: 50,
                color: "text.secondary",
              }}
            />

            <Typography
              variant="h6"
              sx={{ mt: 1 }}
            >
              No employees found
            </Typography>

            <Typography color="text.secondary">
              Add your first employee to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredEmployees.map((employee) => (
            <Grid
              key={employee.id}
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 3,
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                      >
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        {employee.departmentName}
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        employee.isActive
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        employee.isActive
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>Phone:</strong>{" "}
                      {employee.phone || "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      <strong>Hire Date:</strong>{" "}
                      {employee.hireDate}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      <strong>Salary:</strong>{" "}
                      {employee.salary.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 3,
                      gap: 1,
                    }}
                  >
                    <IconButton
                      color="primary"
                      onClick={() =>
                        handleEdit(employee)
                      }
                    >
                      <Edit />
                    </IconButton>

                    <IconButton
                      color="error"
                      onClick={() =>
                        handleDelete(employee.id)
                      }
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editMode
            ? "Edit Employee"
            : "Add Employee"}
        </DialogTitle>

        <DialogContent>
          <Grid
            container
            spacing={2}
            sx={{ mt: 0.5 }}
          >
            <Grid size={{ xs: 12, sm: 6 }}>
  <TextField
    fullWidth
    select
    label="Department"
    name="departmentId"
    value={form.departmentId}
    onChange={handleInputChange}
    required
  >
    <MenuItem value="">
      Select Department
    </MenuItem>

    {departments.map((department) => (
      <MenuItem
        key={department.id}
        value={department.id}
      >
        {department.name}
      </MenuItem>
    ))}
  </TextField>
</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Department ID"
                name="departmentId"
                type="number"
                value={form.departmentId}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={form.hireDate}
                onChange={handleInputChange}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Salary"
                name="salary"
                type="number"
                value={form.salary}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={
              editMode ? <Edit /> : <Add />
            }
          >
            {editMode ? "Update" : "Add Employee"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;