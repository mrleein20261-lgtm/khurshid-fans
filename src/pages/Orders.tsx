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
  CircularProgress,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { ShoppingBag, LocalShipping, CheckCircle, Block, Schedule } from "@mui/icons-material";
import { api } from "../utils/api.js";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await api.getOrders(statusFilter);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, paymentStatus?: string) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api.updateOrderStatus(orderId, { status: newStatus, paymentStatus });
      setSuccess(`Order ${orderId} successfully set to '${newStatus.toUpperCase()}'. Push notification sent to customer.`);
      
      // Update selected modal details if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated.order);
      }
      
      loadOrders();
    } catch (err: any) {
      setError(err.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  // Badge stylings
  const getStatusChip = (status: string) => {
    switch (status) {
      case "pending":
        return <Chip label="Pending" icon={<Schedule />} style={{ backgroundColor: "rgba(255, 204, 0, 0.15)", color: "#ffcc00", fontWeight: "bold" }} />;
      case "confirmed":
        return <Chip label="Confirmed" icon={<CheckCircle />} style={{ backgroundColor: "rgba(0, 242, 254, 0.15)", color: "#00f2fe", fontWeight: "bold" }} />;
      case "shipped":
        return <Chip label="Shipped" icon={<LocalShipping />} style={{ backgroundColor: "rgba(161, 140, 209, 0.15)", color: "#a18cd1", fontWeight: "bold" }} />;
      case "delivered":
        return <Chip label="Delivered" icon={<CheckCircle />} style={{ backgroundColor: "rgba(46, 125, 50, 0.15)", color: "#2e7d32", fontWeight: "bold" }} />;
      case "cancelled":
        return <Chip label="Cancelled" icon={<Block />} style={{ backgroundColor: "rgba(198, 40, 40, 0.15)", color: "#c62828", fontWeight: "bold" }} />;
      default:
        return <Chip label={status} />;
    }
  };

  const getPaymentChip = (status: string) => {
    switch (status) {
      case "paid":
        return <Chip label="Paid" size="small" style={{ backgroundColor: "rgba(46, 125, 50, 0.2)", color: "lightgreen", fontWeight: "bold" }} />;
      case "pending":
        return <Chip label="Unpaid" size="small" style={{ backgroundColor: "rgba(255, 152, 0, 0.2)", color: "#ff9800", fontWeight: "bold" }} />;
      case "failed":
        return <Chip label="Failed" size="small" style={{ backgroundColor: "rgba(198, 40, 40, 0.2)", color: "#ff5252", fontWeight: "bold" }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Orders Fulfillment Desk
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review orders, capture online payments, and trigger cellular FCM push notifications upon shipping.
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
              <MenuItem value="">All Orders</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>ID</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Customer</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Date Placed</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Order Total</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Fulfillment Status</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Payment Status</TableCell>
                  <TableCell align="right" style={{ color: "#fff", fontWeight: "bold" }}>Fulfill Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" style={{ color: "gray" }}>
                      No orders found under current status filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((ord) => (
                    <TableRow key={ord.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell style={{ color: "#00f2fe", fontWeight: "bold" }}>#{ord.id}</TableCell>
                      <TableCell>
                        <Box style={{ color: "#fff", fontWeight: "500" }}>{ord.customerName}</Box>
                        <Box style={{ color: "gray", fontSize: 11 }}>{ord.customerEmail}</Box>
                      </TableCell>
                      <TableCell style={{ color: "gray" }}>
                        {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell style={{ color: "#ff007f", fontWeight: "bold" }}>
                        {ord.totalAmount.toLocaleString()} PKR
                      </TableCell>
                      <TableCell>{getStatusChip(ord.status)}</TableCell>
                      <TableCell>{getPaymentChip(ord.paymentStatus)}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenDetail(ord)}
                          sx={{ textTransform: "none", color: "#fff", borderColor: "rgba(255,255,255,0.1)", mr: 1 }}
                        >
                          Details
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

      {/* DETAILED EXPANSION DRAWER DIALOG */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
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
        {selectedOrder && (
          <>
            <DialogTitle sx={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
              Fulfillment Ticket: #{selectedOrder.id}
            </DialogTitle>
            <DialogContent dividers style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="gray">
                    Shipping Details
                  </Typography>
                  <Typography variant="body1" style={{ fontWeight: 600, color: "#fff", marginTop: 4 }}>
                    Customer: {selectedOrder.customerName || selectedOrder.userId}
                  </Typography>
                  <Typography variant="body2" style={{ color: "#e0e0e0", marginTop: 4 }}>
                    Address: {selectedOrder.shippingAddress}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                  <Typography variant="subtitle2" color="gray" style={{ marginTop: 12, marginBottom: 8 }}>
                    Items Ordered
                  </Typography>
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" style={{ color: "#fff" }}>
                        {item.name} <span style={{ color: "gray" }}>x{item.quantity}</span>
                      </Typography>
                      <Typography variant="body2" style={{ color: "#00f2fe", fontWeight: "bold" }}>
                        {(item.price * item.quantity).toLocaleString()} PKR
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                    <Typography variant="subtitle1" style={{ fontWeight: "bold", color: "#fff" }}>
                      Total Bill Amount
                    </Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: "bold", color: "#ff007f" }}>
                      {selectedOrder.totalAmount.toLocaleString()} PKR
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                  <Typography variant="subtitle2" color="gray" style={{ marginTop: 12, marginBottom: 8 }}>
                    Workflow Action Console
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    {selectedOrder.status === "pending" && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "confirmed")}
                        disabled={actionLoading}
                        sx={{ textTransform: "none", fontWeight: "bold" }}
                      >
                        Confirm Order
                      </Button>
                    )}
                    {selectedOrder.status === "confirmed" && (
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "shipped", "paid")}
                        disabled={actionLoading}
                        sx={{ textTransform: "none", fontWeight: "bold" }}
                      >
                        Dispatch / Ship (FCM)
                      </Button>
                    )}
                    {selectedOrder.status === "shipped" && (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "delivered", "paid")}
                        disabled={actionLoading}
                        sx={{ textTransform: "none", fontWeight: "bold" }}
                      >
                        Complete / Deliver
                      </Button>
                    )}
                    {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                        disabled={actionLoading}
                        sx={{ textTransform: "none" }}
                      >
                        Cancel Ticket
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions style={{ padding: 24 }}>
              <Button onClick={() => setDetailOpen(false)} style={{ color: "gray" }}>
                Close Ticket
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
