import React, { useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Key, Lock, SettingsApplications, Terminal, Storage } from "@mui/icons-material";
import { api } from "../utils/api.js";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess("Administrative password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Console Settings
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Update your administrator credentials and inspect active cloud environment key variables.
          </Typography>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Update Password form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "rgba(0, 242, 254, 0.08)" }}>
                  <Lock style={{ color: "#00f2fe" }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
                    Change Admin Password
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Use high entropy passwords to safeguard portal configurations.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

              <form onSubmit={handlePasswordSubmit}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.2,
                    px: 3,
                    background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                    color: "#0d1117",
                    fontWeight: "bold",
                    borderRadius: 2,
                    "&:hover": {
                      background: "linear-gradient(135deg, #00d2de 0%, #3f8cfe 100%)",
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : "Save Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Environment credentials and Android connection strings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "rgba(255, 0, 127, 0.08)" }}>
                  <SettingsApplications style={{ color: "#ff007f" }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
                    Cloud System Credentials
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Verify configuration settings compiled for backend servers and Android API hooks.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                {/* Connection String for Android */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Terminal sx={{ color: "#00f2fe", fontSize: 18 }} />
                    <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#fff" }}>
                      Android App Base URL (CORS Endpoint)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", bgcolor: "#0d1117", p: 1.5, borderRadius: 2, color: "lightgreen" }}>
                    {window.location.origin}/api/v1/
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Use this constant as the base IP / Domain in your Android Kotlin codebase (Retrofit client).
                  </Typography>
                </Box>

                {/* Firestore Region / Firebase Configuration */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Storage sx={{ color: "#ffcc00", fontSize: 18 }} />
                    <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#fff" }}>
                      FCM Server Key Variables
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", bgcolor: "#0d1117", p: 1.5, borderRadius: 2, color: "gray" }}>
                    {process.env.FCM_SERVER_KEY ? "●●●●●●●●●● ACTIVE" : "NOT SET (Using simulator notifications)"}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Configure your <code>FCM_SERVER_KEY</code> in the Secrets Panel to connect standard Firebase cloud push pipelines.
                  </Typography>
                </Box>

                {/* Database adapter */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Key sx={{ color: "#a18cd1", fontSize: 18 }} />
                    <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#fff" }}>
                      Hybrid MongoDB Persistence Adapter
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", bgcolor: "#0d1117", p: 1.5, borderRadius: 2, color: "lightgreen" }}>
                    LOCAL STORAGE PATH: /src/db/db.json
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    The filesystem adapter guarantees durably saved items in the live preview sandboxes.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
