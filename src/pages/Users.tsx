import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { Search, Person, PowerSettingsNew, CheckCircle, Warning, Speed } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../utils/api.js";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.getUsers(search);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleOpenDetail = async (user: any) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await api.getUserDetail(user.uid);
      setUserDetail(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user complete file");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleBan = async (uid: string) => {
    if (!window.confirm("Are you sure you want to change this user's ban status?")) return;
    try {
      const res = await api.toggleUserBan(uid);
      setSuccess(`User login status changed. User is now ${res.isBanned ? "banned" : "active"}.`);
      
      // Update local state lists
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({ ...selectedUser, isBanned: res.isBanned });
      }
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to change user status");
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            App User Directory
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review registered accounts, inspect IoT-enabled smart fan models, analyze energy charts, and apply bans.
          </Typography>
        </Box>

        <Box sx={{ width: 300 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Search style={{ color: "gray", marginRight: 8 }} />,
                style: { color: "#fff", backgroundColor: "rgba(255,255,255,0.02)" },
              }
            }}
          />
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3 }}>
          <TableContainer component={Paper} sx={{ bgcolor: "transparent", backgroundImage: "none" }}>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                <TableRow>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>User Profile</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Location City</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Cell Phone</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Fans Linked</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Joined Date</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell align="right" style={{ color: "#fff", fontWeight: "bold" }}>Audit File</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" style={{ color: "gray" }}>
                      No registered app users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.uid} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "rgba(0, 242, 254, 0.08)", mr: 1.5 }}>
                            <Person sx={{ color: "#00f2fe", fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Box style={{ color: "#fff", fontWeight: "bold" }}>{u.name}</Box>
                            <Box style={{ color: "gray", fontSize: 11 }}>{u.email}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell style={{ color: "#fff" }}>{u.city || "N/A"}</TableCell>
                      <TableCell style={{ color: "gray" }}>{u.phone || "N/A"}</TableCell>
                      <TableCell style={{ color: "#00f2fe", fontWeight: "bold" }}>{u.fanDetails?.length || 0} fans</TableCell>
                      <TableCell style={{ color: "gray" }}>
                        {new Date(u.registeredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {u.isBanned ? (
                          <Chip label="Banned" size="small" style={{ backgroundColor: "rgba(198, 40, 40, 0.2)", color: "#ff5252", fontWeight: "bold" }} />
                        ) : (
                          <Chip label="Active" size="small" style={{ backgroundColor: "rgba(46, 125, 50, 0.2)", color: "lightgreen", fontWeight: "bold" }} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenDetail(u)}
                          sx={{ textTransform: "none", color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* USER COMPLETE DOSSIER FILE MODAL */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#fff",
              borderRadius: "12px",
            }
          }
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>Dossier: {selectedUser.name}</Typography>
                <Button
                  variant="contained"
                  color={selectedUser.isBanned ? "success" : "error"}
                  startIcon={<PowerSettingsNew />}
                  size="small"
                  onClick={() => handleToggleBan(selectedUser.uid)}
                  sx={{ textTransform: "none" }}
                >
                  {selectedUser.isBanned ? "Unban Account" : "Ban Account"}
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent dividers style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
              {detailLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* Left Column Profile info */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="gray" sx={{ mb: 1, fontWeight: "600" }}>
                      Profile Metadata
                    </Typography>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>UID:</strong> {selectedUser.uid}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {selectedUser.email}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Phone:</strong> {selectedUser.phone || "N/A"}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>City:</strong> {selectedUser.city || "Unknown"}</Typography>
                      <Typography variant="body2"><strong>Registered:</strong> {new Date(selectedUser.registeredAt).toLocaleString()}</Typography>
                    </Box>
                  </Grid>

                  {/* Registered Fans List */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="subtitle2" color="gray" sx={{ mb: 1, fontWeight: "600" }}>
                      Registered IoT Hardware Fans
                    </Typography>
                    {userDetail?.user?.fanDetails?.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                        No hardware registered yet.
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {userDetail?.user?.fanDetails?.map((fan: any) => (
                          <Box
                            key={fan.fanId}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "rgba(0, 242, 254, 0.02)",
                              border: "1px solid rgba(0, 242, 254, 0.1)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: "bold", color: "#fff" }}>
                                {fan.model} ({fan.location})
                              </Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                                Serial: <strong>{fan.serial}</strong> | Added: {fan.addedAt}
                              </Typography>
                            </Box>
                            {fan.lastOnline ? (
                              <Chip
                                size="small"
                                label={`Online: ${new Date(fan.lastOnline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                style={{ backgroundColor: "rgba(46, 125, 50, 0.2)", color: "lightgreen" }}
                              />
                            ) : (
                              <Chip size="small" label="Offline" />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Grid>

                  {/* Energy Consumption Charts */}
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.06)" }} />
                    <Typography variant="subtitle2" color="gray" sx={{ mb: 1, mt: 1, fontWeight: "600" }}>
                      Interactive Fan Daily Energy Drawing (kWh)
                    </Typography>
                    {userDetail?.user?.usageStats?.daily?.length > 0 ? (
                      <Box sx={{ height: 200, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userDetail.user.usageStats.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="#718096" style={{ fontSize: 10 }} />
                            <YAxis stroke="#718096" style={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                            <Bar dataKey="kwh" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                        No energy draw aggregated yet.
                      </Typography>
                    )}
                  </Grid>

                  {/* Orders and Complaints lists */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="gray" sx={{ mb: 1, fontWeight: "600" }}>
                      Order history
                    </Typography>
                    {userDetail?.orders?.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">No order receipts.</Typography>
                    ) : (
                      userDetail?.orders?.map((ord: any) => (
                        <Box key={ord.id} sx={{ mb: 1, p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <Typography variant="caption" sx={{ color: "#00f2fe", fontWeight: "bold" }}>#{ord.id}</Typography>
                          <Typography variant="body2" color="#fff">{ord.items?.[0]?.name} x{ord.items?.[0]?.quantity}</Typography>
                          <Typography variant="caption" color="gray">Value: {ord.totalAmount.toLocaleString()} PKR | {ord.status.toUpperCase()}</Typography>
                        </Box>
                      ))
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="gray" sx={{ mb: 1, fontWeight: "600" }}>
                      Complaint History
                    </Typography>
                    {userDetail?.complaints?.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">No tickets filled.</Typography>
                    ) : (
                      userDetail?.complaints?.map((c: any) => (
                        <Box key={c.id} sx={{ mb: 1, p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: "#ff007f", fontWeight: "bold" }}>{c.subject}</Typography>
                            <Chip size="small" label={c.status} color={c.status === "resolved" ? "success" : "warning"} sx={{ fontSize: 8, height: 16 }} />
                          </Box>
                          <Typography variant="body2" color="gray" sx={{ my: 0.5 }}>{c.description}</Typography>
                        </Box>
                      ))
                    )}
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions style={{ padding: 24 }}>
              <Button onClick={() => setDetailOpen(false)} style={{ color: "gray" }}>
                Close Dossier
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
