import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import {
  Person,
  Email,
  Phone,
  Home,
  Business,
  CalendarMonth,
  Badge,
  Payments,
} from "@mui/icons-material";

import api from "../api/axios";

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  role: string | null;
}

interface EmployeeProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  hireDate: string;
  salary: number;
  isActive: boolean;
  department: Department | null;
  user: User | null;
}

const Profile = () => {
  const [profile, setProfile] =
    useState<EmployeeProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // Load Profile
  // =========================================================

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Employee/me");

      setProfile(response.data);
    } catch (error: any) {
      console.error("Profile loading error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
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
  // No Profile
  // =========================================================

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Employee profile not found.
        </Alert>
      </Box>
    );
  }

  // =========================================================
  // Values
  // =========================================================

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim();

  const initials =
    `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase();

  const formattedHireDate = profile.hireDate
    ? new Date(profile.hireDate).toLocaleDateString()
    : "Not available";

  const formattedSalary =
    profile.salary !== undefined && profile.salary !== null
      ? `Rs. ${Number(profile.salary).toLocaleString()}`
      : "Not available";

  // =========================================================
  // UI
  // =========================================================

  return (
    <Box sx={{ p: 3 }}>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#111827",
          }}
        >
          My Profile
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#6b7280",
            mt: 0.5,
          }}
        >
          View your personal and employment information.
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ================================================= */}
        {/* Profile Summary */}
        {/* ================================================= */}

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: 4,
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  margin: "0 auto",
                  fontSize: 36,
                  fontWeight: "bold",
                  backgroundColor: "#2563eb",
                }}
              >
                {initials}
              </Avatar>

              <Typography
                variant="h5"
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                }}
              >
                {fullName}
              </Typography>

              <Typography
                sx={{
                  color: "#6b7280",
                  mt: 0.5,
                }}
              >
                @{profile.user?.username || "N/A"}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.7,
                    borderRadius: 5,
                    backgroundColor: profile.isActive
                      ? "#dcfce7"
                      : "#fee2e2",
                    color: profile.isActive
                      ? "#166534"
                      : "#991b1b",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold" }}
                  >
                    {profile.isActive
                      ? "Active"
                      : "Inactive"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="body2"
                sx={{ color: "#6b7280" }}
              >
                Role
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  mt: 0.5,
                }}
              >
                {profile.user?.role || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================= */}
        {/* Personal Information */}
        {/* ================================================= */}

        <Grid size={{ xs: 12, md: 8 }}>
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
                Personal Information
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ProfileItem
                    icon={<Person />}
                    label="First Name"
                    value={profile.firstName}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ProfileItem
                    icon={<Person />}
                    label="Last Name"
                    value={profile.lastName}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ProfileItem
                    icon={<Email />}
                    label="Email"
                    value={profile.user?.email || "N/A"}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ProfileItem
                    icon={<Phone />}
                    label="Phone"
                    value={profile.phone || "Not provided"}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <ProfileItem
                    icon={<Home />}
                    label="Address"
                    value={
                      profile.address || "Not provided"
                    }
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================= */}
        {/* Employment Information */}
        {/* ================================================= */}

        <Grid size={{ xs: 12 }}>
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
                Employment Information
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProfileItem
                    icon={<Badge />}
                    label="Employee ID"
                    value={String(profile.id)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProfileItem
                    icon={<Business />}
                    label="Department"
                    value={
                      profile.department?.name ||
                      "Not assigned"
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProfileItem
                    icon={<CalendarMonth />}
                    label="Hire Date"
                    value={formattedHireDate}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProfileItem
                    icon={<Payments />}
                    label="Salary"
                    value={formattedSalary}
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

// =========================================================
// Profile Item Component
// =========================================================

interface ProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const ProfileItem = ({
  icon,
  label,
  value,
}: ProfileItemProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          backgroundColor: "#eff6ff",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            mb: 0.3,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default Profile;