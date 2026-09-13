import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Divider,
} from "@mui/material";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(username, password);

      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(
          "Unable to login. Please check your username and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 2, sm: 4 },
        background: "linear-gradient(135deg, #eaf3f3 0%, #f8faf8 52%, #fff4e6 100%)",
      }}
    >
      <Card
        sx={{
          width: 430,
          maxWidth: "100%",
          borderRadius: 3,
          boxShadow: "0 24px 70px rgba(23, 43, 50, 0.16)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
            <Box sx={{ width: 12, height: 42, borderRadius: 1, bgcolor: "secondary.main" }} />
            <Box>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                HR ERP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                People operations, clearly organized
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "text.primary" }}
            gutterBottom
          >
            Welcome back
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Sign in to access your workforce workspace.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              margin="normal"
              autoComplete="username"
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              margin="normal"
              autoComplete="current-password"
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
            <Divider sx={{ mt: 4, mb: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Authorized access only. Contact your administrator if your account is inactive.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;