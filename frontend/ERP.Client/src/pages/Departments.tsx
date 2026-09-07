import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import api from "../api/axios";

interface Department {
  id: number;
  name: string;
  description?: string;
}

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Department");
      setDepartments(response.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(
    () => departments.filter((department) =>
      department.name.toLowerCase().includes(search.toLowerCase())
    ),
    [departments, search]
  );

  const openCreateDialog = () => {
    setSelectedDepartment(null);
    setName("");
    setDescription("");
    setError("");
    setOpenDialog(true);
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setName(department.name);
    setDescription(department.description || "");
    setError("");
    setOpenDialog(true);
  };

  const saveDepartment = async () => {
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }

    try {
      setError("");
      const data = { name: name.trim(), description: description.trim() || null };

      if (selectedDepartment) {
        await api.put(`/Department/${selectedDepartment.id}`, data);
        setSuccess("Department updated successfully.");
      } else {
        await api.post("/Department", data);
        setSuccess("Department created successfully.");
      }

      setOpenDialog(false);
      await loadDepartments();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to save department.");
    }
  };

  const deleteDepartment = async (department: Department) => {
    if (!window.confirm(`Delete ${department.name}?`)) {
      return;
    }

    try {
      setError("");
      await api.delete(`/Department/${department.id}`);
      setSuccess("Department deleted successfully.");
      await loadDepartments();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Cannot delete this department because it has employees."
      );
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>Departments</Typography>
          <Typography color="text.secondary">Create and manage company departments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add Department
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <TextField
        fullWidth
        label="Search departments"
        placeholder="Search by name..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Typography>Loading departments...</Typography>
      ) : filteredDepartments.length === 0 ? (
        <Card><CardContent><Typography>No departments found.</Typography></CardContent></Card>
      ) : (
        filteredDepartments.map((department) => (
          <Card key={department.id} sx={{ mb: 2 }}>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6">{department.name}</Typography>
                <Typography color="text.secondary">{department.description || "No description"}</Typography>
              </Box>
              <Box>
                <IconButton color="primary" onClick={() => openEditDialog(department)}><Edit /></IconButton>
                <IconButton color="error" onClick={() => deleteDepartment(department)}><Delete /></IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedDepartment ? "Edit Department" : "Add Department"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus label="Department name" value={name} onChange={(event) => setName(event.target.value)} sx={{ mt: 1, mb: 2 }} required />
          <TextField fullWidth label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveDepartment}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;