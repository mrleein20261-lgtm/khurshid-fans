import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  Speed,
  ElectricBolt,
  Download,
  Psychology,
  ArrowForward,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../utils/api.js";

const COLORS = ["#00f2fe", "#ff007f", "#ffcc00", "#4facfe", "#a18cd1"];

export default function Analytics() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);

  // Gemini AI recommendation form
  const [aiQuery, setAiQuery] = useState("I need an ultra energy efficient fan for a hot 14x16 master bedroom in Punjab");
  const [roomSize, setRoomSize] = useState("Medium (14x16)");
  const [locationType, setLocationType] = useState("Bedroom");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");

  // Statistics datasets
  const [speedData, setSpeedData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await api.getProducts();
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedModel(prods[0].name);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Recalculate statistics when selectedModel changes
  useEffect(() => {
    if (!selectedModel) return;

    // Simulate custom analytics distributions based on model selection to showcase rich visualizations
    let speedDist = [];
    let cityDist = [];

    if (selectedModel.includes("Ceiling")) {
      speedDist = [
        { name: "Speed 1", percentage: 12 },
        { name: "Speed 2", percentage: 15 },
        { name: "Speed 3", percentage: 22 },
        { name: "Speed 4", percentage: 31 },
        { name: "Speed 5 (Max)", percentage: 20 },
      ];
      cityDist = [
        { city: "Lahore", kwh: 1450, users: 110 },
        { city: "Karachi", kwh: 980, users: 80 },
        { city: "Islamabad", kwh: 720, users: 45 },
        { city: "Faisalabad", kwh: 1210, users: 95 },
        { city: "Gujranwala", kwh: 890, users: 70 },
      ];
    } else if (selectedModel.includes("Pedestal")) {
      speedDist = [
        { name: "Speed 1", percentage: 5 },
        { name: "Speed 2", percentage: 10 },
        { name: "Speed 3", percentage: 35 },
        { name: "Speed 4", percentage: 40 },
        { name: "Speed 5 (Max)", percentage: 10 },
      ];
      cityDist = [
        { city: "Multan", kwh: 850, users: 60 },
        { city: "Lahore", kwh: 610, users: 50 },
        { city: "Peshawar", kwh: 490, users: 35 },
        { city: "Sargodha", kwh: 320, users: 20 },
      ];
    } else if (selectedModel.includes("Bracket")) {
      speedDist = [
        { name: "Speed 1", percentage: 8 },
        { name: "Speed 2", percentage: 18 },
        { name: "Speed 3", percentage: 54 },
        { name: "Speed 4 (Max)", percentage: 20 },
      ];
      cityDist = [
        { city: "Karachi", kwh: 410, users: 30 },
        { city: "Rawalpindi", kwh: 320, users: 25 },
        { city: "Sialkot", kwh: 280, users: 20 },
      ];
    } else {
      // exhaust or other
      speedDist = [
        { name: "Off", percentage: 40 },
        { name: "Active Run", percentage: 60 },
      ];
      cityDist = [
        { city: "Lahore", kwh: 240, users: 35 },
        { city: "Karachi", kwh: 190, users: 28 },
        { city: "Islamabad", kwh: 120, users: 18 },
      ];
    }

    setSpeedData(speedDist);
    setCityData(cityDist);
  }, [selectedModel]);

  const handleAskGemini = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setAiError("");
    try {
      const data = await api.getAIRecommendation({
        query: aiQuery,
        roomSize,
        locationType,
      });
      setAiResponse(data.recommendation);
    } catch (err: any) {
      setAiError(err.message || "Consultation request failed");
    } finally {
      setAiLoading(false);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category Name,Aggregate City,Consumption (kWh),Active Users\n";
    
    cityData.forEach((row) => {
      csvContent += `"${selectedModel}","${row.city}",${row.kwh},${row.users}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `khurshid_fans_analytics_${selectedModel.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Advanced Analytics Portal
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review live fan speed distributions, cellular localized energy draw, and evaluate Gemini consulting predictions.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV} style={{ color: "#00f2fe", borderColor: "rgba(0, 242, 254, 0.3)" }}>
          Export Report (CSV)
        </Button>
      </Box>

      {/* Selector banner */}
      <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 2, mb: 4 }}>
        <CardContent sx={{ py: "16px !important" }}>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
              Deep-Dive Model Selection:
            </Typography>
            <FormControl sx={{ minWidth: 280 }} size="small">
              <InputLabel style={{ color: "gray" }}>Khurshid Fan Model</InputLabel>
              <Select
                value={selectedModel}
                label="Khurshid Fan Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ color: "#fff" }}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Visual Charts Grid */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Speed Distribution bar chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
                <Speed style={{ color: "#00f2fe" }} />
                <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
                  Active Speed Distribution (%)
                </Typography>
              </Box>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#718096" style={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" stroke="#718096" style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                    <Bar dataKey="percentage" fill="#00f2fe" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Localized Energy Draw by City */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
                <ElectricBolt style={{ color: "#ff007f" }} />
                <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
                  Energy Drawing (kWh) & Users by City
                </Typography>
              </Box>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="city" stroke="#718096" style={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#00f2fe" style={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff007f" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="kwh" name="Energy Draw (kWh)" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="users" name="Active Link Accounts" fill="#ff007f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* GEMINI AI RECOMMENDATION LAB AREA */}
      <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3, p: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "rgba(161, 140, 209, 0.15)" }}>
              <Psychology style={{ color: "#a18cd1", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
                Gemini AI Consultant Sandbox
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Fine-tune, test, and preview the real-time AI consultant recommendations compiled for Android app integration.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

          <Grid container spacing={4}>
            {/* Form */}
            <Grid size={{ xs: 12, sm: 5 }}>
              <Typography variant="subtitle2" color="gray" sx={{ mb: 1.5, fontWeight: "600" }}>
                AI Consultation Simulator
              </Typography>
              
              <TextField
                fullWidth
                label="Room Description or Query"
                multiline
                rows={3}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                sx={{ mb: 2, "& .MuiInputBase-root": { color: "#fff" }, label: { color: "gray" } }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel style={{ color: "gray" }}>Room Size</InputLabel>
                    <Select
                      value={roomSize}
                      label="Room Size"
                      onChange={(e) => setRoomSize(e.target.value)}
                      style={{ color: "#fff" }}
                    >
                      <MenuItem value="Small (10x10)">Small (10x10)</MenuItem>
                      <MenuItem value="Medium (14x16)">Medium (14x16)</MenuItem>
                      <MenuItem value="Large (18x20)">Large (18x20)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel style={{ color: "gray" }}>Room Type</InputLabel>
                    <Select
                      value={locationType}
                      label="Room Type"
                      onChange={(e) => setLocationType(e.target.value)}
                      style={{ color: "#fff" }}
                    >
                      <MenuItem value="Bedroom">Bedroom</MenuItem>
                      <MenuItem value="Drawing Room">Drawing Room</MenuItem>
                      <MenuItem value="Kitchen">Kitchen</MenuItem>
                      <MenuItem value="Office / Shop">Office / Shop</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                fullWidth
                endIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                disabled={aiLoading}
                onClick={handleAskGemini}
                sx={{
                  py: 1.2,
                  background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: "#0d1117",
                  fontWeight: "bold",
                  borderRadius: 2,
                  "&:hover": {
                    background: "linear-gradient(135deg, #917cc1 0%, #ebc2eb 100%)",
                  },
                }}
              >
                Run Consultant Sandbox
              </Button>
            </Grid>

            {/* Recommendation Display Box */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <Typography variant="subtitle2" color="gray" sx={{ mb: 1.5, fontWeight: "600" }}>
                FCM Response Feed
              </Typography>
              <Box
                sx={{
                  minHeight: 240,
                  bgcolor: "#0d1117",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  p: 3,
                  color: "#e0e0e0",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiLoading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyItems: "center", alignItems: "center", py: 8 }}>
                    <CircularProgress size={30} style={{ color: "#a18cd1" }} />
                    <Typography variant="caption" color="textSecondary">Gemini model analysis starting...</Typography>
                  </Box>
                ) : aiResponse ? (
                  aiResponse
                ) : aiError ? (
                  <Alert severity="error">{aiError}</Alert>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", textAlign: "center", py: 8 }}>
                    Run the simulation on the left to review the consultant recommendations.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
