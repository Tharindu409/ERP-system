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
import { Delete, Edit, ManageAccounts } from "@mui/icons-material";
import api from "../api/axios";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role?: string | null;
  isActive: boolean;
}

const roles = ["Admin", "HR", "Manager", "Employee"];

const Users = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Users");
      setUsers(response.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const query = search.toLowerCase();
    return (!query || `${user.username} ${user.email}`.toLowerCase().includes(query)) &&
      (!roleFilter || user.role === roleFilter) &&
      (!statusFilter || (statusFilter === "Active" ? user.isActive : !user.isActive));
  }), [users, search, roleFilter, statusFilter]);

  const changeRole = async () => {
    if (!editing || !selectedRole) return;
    try {
      await api.put(`/Users/${editing.id}/role`, { role: selectedRole });
      setEditing(null);
      setSuccess("User role updated successfully.");
      await loadUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to update user role.");
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    try {
      await api.put(`/Users/${user.id}/activate`, { isActive: !user.isActive });
      setSuccess(user.isActive ? "User deactivated successfully." : "User activated successfully.");
      await loadUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to update user status.");
    }
  };

  const deleteUser = async (user: UserRecord) => {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    try {
      await api.delete(`/Users/${user.id}`);
      setSuccess("User deleted successfully.");
      await loadUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Failed to delete user.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: "bold" }}>User Management</Typography><Typography color="text.secondary">Manage accounts, roles, and access status</Typography></Box>
        <ManageAccounts color="primary" sx={{ fontSize: 40 }} />
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
      <Card sx={{ mb: 3 }}><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField fullWidth label="Search users" placeholder="Username or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <TextField fullWidth select label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><MenuItem value="">All roles</MenuItem>{roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField>
        <TextField fullWidth select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField>
      </Stack></CardContent></Card>
      {loading ? <Typography>Loading users...</Typography> : <TableContainer component={Card}><Table><TableHead><TableRow><TableCell>Username</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
        {filteredUsers.map((user) => <TableRow key={user.id} hover><TableCell>{user.username}</TableCell><TableCell>{user.email}</TableCell><TableCell><Chip size="small" label={user.role || "Unknown"} /></TableCell><TableCell><Chip size="small" label={user.isActive ? "Active" : "Inactive"} color={user.isActive ? "success" : "default"} /></TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}><Button size="small" onClick={() => toggleStatus(user)}>{user.isActive ? "Deactivate" : "Activate"}</Button><IconButton color="primary" onClick={() => { setEditing(user); setSelectedRole(user.role || "Employee"); }} aria-label="Change role"><Edit /></IconButton><IconButton color="error" onClick={() => deleteUser(user)} aria-label="Delete user"><Delete /></IconButton></TableCell></TableRow>)}
        {filteredUsers.length === 0 && <TableRow><TableCell colSpan={5} align="center">No users found.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs"><DialogTitle>Change user role</DialogTitle><DialogContent><TextField fullWidth select label="Role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} sx={{ mt: 1 }}>{roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={changeRole}>Save</Button></DialogActions></Dialog>
    </Box>
  );
};

export default Users;