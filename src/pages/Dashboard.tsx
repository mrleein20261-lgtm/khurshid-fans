import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  People,
  ShoppingCart,
  AttachMoney,
  Power,
  Chat,
  TrendingUp,
  Settings,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { api } from "../utils/api.js";

// Distinct visual colors for Recharts
const COLORS = ["#00f2fe", "#ff007f", "#ffcc00", "#4facfe", "#a18cd1"];

interface DashboardProps {
  onNavigateToChats: () => void;
}

export default function Dashboard({ onNavigateToChats }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboardStats();
        setStats(data.stats);
        setCharts(data.charts);

        const chatData = await api.getChats();
        setChatsList(chatData.slice(0, 5)); // show latest 5
      } catch (err) {
        console.error("Error loading stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Setup an interval to refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Cards layout
  const statCards = [
    {
      title: "Total App Users",
      value: stats?.totalUsers || 0,
      icon: <People sx={{ fontSize: 32, color: "#00f2fe" }} />,
      desc: "Registered in Android app",
      bg: "rgba(0, 242, 254, 0.05)",
    },
    {
      title: "Total Revenue",
      value: `${(stats?.revenue || 0).toLocaleString()} PKR`,
      icon: <AttachMoney sx={{ fontSize: 32, color: "#ff007f" }} />,
      desc: "Accumulated sales value",
      bg: "rgba(255, 0, 127, 0.05)",
    },
    {
      title: "Today's Orders",
      value: stats?.totalOrdersToday || 0,
      icon: <ShoppingCart sx={{ fontSize: 32, color: "#ffcc00" }} />,
      desc: "Placed in last 24h",
      bg: "rgba(255, 204, 0, 0.05)",
    },
    {
      title: "Active Fans Online",
      value: stats?.activeFansOnline || 0,
      icon: <Power sx={{ fontSize: 32, color: "#4facfe" }} />,
      desc: "Simulated app telemetry",
      bg: "rgba(79, 172, 254, 0.05)",
    },
  ];

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Live operations, customer charts, and remote telemetry stats for Khurshid Fans.
          </Typography>
        </Box>
        <Chip
          icon={<TrendingUp />}
          label="Live Telemetry Sync Active"
          color="success"
          variant="outlined"
          sx={{ py: 1 }}
        />
      </Box>

      {/* KPI Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                bgcolor: "rgba(22, 27, 34, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 3,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "4px",
                  background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]} 0%, #121212 100%)`,
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "600" }}>
                    {card.title}
                  </Typography>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: card.bg }}>{card.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Graphs & Charts Grid */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* User Growth Line Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              bgcolor: "rgba(22, 27, 34, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
              p: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff", mb: 3 }}>
                User Registration Growth
              </Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.userGrowthChart || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#718096" style={{ fontSize: 12 }} />
                    <YAxis stroke="#718096" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#00f2fe"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fan energy usage breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor: "rgba(22, 27, 34, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
              p: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff", mb: 2 }}>
                Model Energy Draw (Aggregated kWh)
              </Typography>
              <Box sx={{ height: 250, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {charts?.fanModelsChart && charts.fanModelsChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts?.fanModelsChart || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts?.fanModelsChart.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">No energy logs yet</Typography>
                )}
              </Box>
              {/* Legend labels */}
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 1 }}>
                {charts?.fanModelsChart?.map((entry: any, index: number) => (
                  <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: COLORS[index % COLORS.length], mr: 1 }} />
                    <Typography variant="caption" color="textSecondary" style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.name.replace("Khurshid ", "")}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Grid for orders status & real-time chat widgets */}
      <Grid container spacing={4}>
        {/* Order status summary bar chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              bgcolor: "rgba(22, 27, 34, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
              p: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff", mb: 3 }}>
                Order Volume by Current Status
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.ordersStatusChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#718096" style={{ fontSize: 11 }} />
                    <YAxis stroke="#718096" style={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                    <Bar dataKey="value" fill="#ff007f" radius={[4, 4, 0, 0]}>
                      {charts?.ordersStatusChart?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === "DELIVERED" ? "#2e7d32" : COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time chat widget */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              bgcolor: "rgba(22, 27, 34, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
              p: 2,
              height: "100%",
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
                  Active Support Chats
                </Typography>
                <Button variant="text" color="primary" onClick={onNavigateToChats} sx={{ textTransform: "none" }}>
                  Launch Messenger
                </Button>
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                {chatsList.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
                    No support chats initiated yet.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {chatsList.map((chat: any) => (
                      <ListItem
                        key={chat.roomId}
                        sx={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          px: 1,
                          py: 1.5,
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Chat sx={{ color: "#00f2fe" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{chat.customerName}</Typography>}
                          secondary={<Typography sx={{ color: "gray", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.lastMessage}</Typography>}
                        />
                        <Chip
                          label="Message Received"
                          size="small"
                          sx={{
                            bgcolor: "rgba(0, 242, 254, 0.15)",
                            color: "#00f2fe",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
