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
        backgroundColor: "#f4f7fb",
      }}
    >
      <Card
        sx={{
          width: 400,
          maxWidth: "90%",
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            HR ERP
          </Typography>

          <Typography
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Sign in to your account
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
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              margin="normal"
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;