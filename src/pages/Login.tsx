import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Air, Brightness4, Brightness7 } from "@mui/icons-material";
import { api, setAdminToken } from "../utils/api.js";

interface LoginProps {
  onLoginSuccess: () => void;
  darkMode: boolean;
  onToggleMode: () => void;
}

export default function Login({ onLoginSuccess, darkMode, onToggleMode }: LoginProps) {
  const [email, setEmail] = useState("admin@khurshidfans.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      if (data.token) {
        setAdminToken(data.token);
        onLoginSuccess();
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      id="login-page-container"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: darkMode 
          ? "linear-gradient(135deg, #00363a 0%, #0c1012 100%)" 
          : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
        p: 2,
        position: "relative",
      }}
    >
      {/* Floating Theme Switcher */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <IconButton onClick={onToggleMode} color="inherit">
          {darkMode ? <Brightness7 style={{ color: "#ffcc00" }} /> : <Brightness4 style={{ color: "#00838f" }} />}
        </IconButton>
      </Box>

      <Card
        id="login-card"
        sx={{
          maxWidth: 420,
          width: "100%",
          bgcolor: darkMode ? "rgba(22, 27, 34, 0.9)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                mb: 2,
                boxShadow: "0 0 20px rgba(79, 172, 254, 0.4)",
              }}
            >
              <Air sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "var(--font-display)",
                fontWeight: "bold",
                textAlign: "center",
                color: darkMode ? "#fff" : "#000",
              }}
              gutterBottom
            >
              Khurshid Fans
            </Typography>
            <Typography variant="body2" sx={{ color: darkMode ? "gray" : "rgba(0,0,0,0.6)" }} align="center">
              Enterprise Administration Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Admin Email Address"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: darkMode ? "#161b22" : "rgba(0, 0, 0, 0.04)",
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: darkMode ? "#161b22" : "rgba(0, 0, 0, 0.04)",
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        style={{ color: "gray" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                color: "#0d1117",
                "&:hover": {
                  background: "linear-gradient(135deg, #00d2de 0%, #3f8cfe 100%)",
                },
                boxShadow: "0 4px 15px rgba(79, 172, 254, 0.3)",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In to Console"}
            </Button>
          </form>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Typography variant="caption" color="textSecondary" align="center">
              Secure administrative access is monitored and logged under standard security policies.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
