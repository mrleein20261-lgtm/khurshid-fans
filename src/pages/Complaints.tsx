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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Warning, CheckCircle, Sync, Reply } from "@mui/icons-material";
import { api } from "../utils/api.js";

export default function Complaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [newStatus, setNewStatus] = useState<"open" | "in-progress" | "resolved">("in-progress");
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadComplaints() {
    setLoading(true);
    try {
      const data = await api.getComplaints(statusFilter);
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const handleOpenReply = (comp: any) => {
    setSelectedComplaint(comp);
    setAdminReply(comp.adminReply || "");
    setNewStatus(comp.status);
    setReplyDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim()) {
      setError("Reply body cannot be blank.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.replyToComplaint(selectedComplaint.id, {
        adminReply,
        status: newStatus,
      });
      setSuccess(`Successfully replied to ticket #${selectedComplaint.id} and set to '${newStatus.toUpperCase()}'.`);
      setReplyDialogOpen(false);
      loadComplaints();
    } catch (err: any) {
      setError(err.message || "Failed to post support response");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "open":
        return <Chip label="Open" size="small" style={{ backgroundColor: "rgba(198, 40, 40, 0.15)", color: "#ff5252", fontWeight: "bold" }} />;
      case "in-progress":
        return <Chip label="In Progress" size="small" icon={<Sync />} style={{ backgroundColor: "rgba(255, 152, 0, 0.15)", color: "#ff9800", fontWeight: "bold" }} />;
      case "resolved":
        return <Chip label="Resolved" size="small" icon={<CheckCircle />} style={{ backgroundColor: "rgba(46, 125, 50, 0.15)", color: "lightgreen", fontWeight: "bold" }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Support Helpdesk Complaints
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review product claims, electrical warranty tickets, and customer complaints synced directly from the Android application.
          </Typography>
        </Box>

        <Box sx={{ minWidth: 180 }}>
          <FormControl fullWidth size="small">
            <InputLabel style={{ color: "gray" }}>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <MenuItem value="">All Complaints</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in-progress">In-Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
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
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Ticket ID</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>User</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Subject</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Filing Date</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell align="right" style={{ color: "#fff", fontWeight: "bold" }}>Console Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" style={{ color: "gray" }}>
                      No support tickets found. Excellent job!
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((comp) => (
                    <TableRow key={comp.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell style={{ color: "#ff007f", fontWeight: "bold" }}>#{comp.id}</TableCell>
                      <TableCell>
                        <Box style={{ color: "#fff", fontWeight: "bold" }}>{comp.customerName}</Box>
                        <Box style={{ color: "gray", fontSize: 11 }}>{comp.customerEmail}</Box>
                      </TableCell>
                      <TableCell style={{ color: "#fff", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {comp.subject}
                      </TableCell>
                      <TableCell style={{ color: "gray" }}>
                        {new Date(comp.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusChip(comp.status)}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<Reply />}
                          onClick={() => handleOpenReply(comp)}
                          sx={{ textTransform: "none", bgcolor: "rgba(0, 242, 254, 0.1)", color: "#00f2fe", border: "1px solid rgba(0,242,254,0.2)", "&:hover": { bgcolor: "rgba(0,242,254,0.2)" } }}
                        >
                          Respond
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

      {/* COMPLAINT RESPOND DIALOG */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#fff",
              borderRadius: 3,
            }
          }
        }}
      >
        {selectedComplaint && (
          <form onSubmit={handleFormSubmit}>
            <DialogTitle sx={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
              Resolve Ticket: #{selectedComplaint.id}
            </DialogTitle>
            <DialogContent dividers style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="gray" sx={{ display: "block" }}>
                    Filer: {selectedComplaint.customerName} ({selectedComplaint.customerEmail})
                  </Typography>
                  <Typography variant="subtitle1" style={{ color: "#00f2fe", fontWeight: "bold", margin: "4px 0" }}>
                    Subject: {selectedComplaint.subject}
                  </Typography>
                  <Typography variant="body2" style={{ color: "#e0e0e0", backgroundColor: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, marginTop: 8 }}>
                    {selectedComplaint.description}
                  </Typography>
                  
                  {selectedComplaint.imageUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="gray" sx={{ display: "block", mb: 1 }}>Attachment</Typography>
                      <img
                        src={selectedComplaint.imageUrl}
                        alt="Warranty attachment"
                        style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider style={{ borderColor: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                  <FormControl fullWidth size="small" style={{ marginBottom: 16 }}>
                    <InputLabel style={{ color: "gray" }}>Fulfillment Status</InputLabel>
                    <Select
                      value={newStatus}
                      label="Fulfillment Status"
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      style={{ color: "#fff" }}
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in-progress">In-Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Official Admin Support Reply"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    required
                    sx={{ "& .MuiInputBase-root": { color: "#fff" }, label: { color: "gray" } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions style={{ padding: 24 }}>
              <Button onClick={() => setReplyDialogOpen(false)} style={{ color: "gray" }}>
                Discard
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading}
                sx={{
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  color: "#0d1117",
                  fontWeight: "bold",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": {
                    background: "linear-gradient(135deg, #00d2de 0%, #3f8cfe 100%)",
                  },
                }}
              >
                {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Post Support Ticket"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
