import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Divider,
} from "@mui/material";
import { Save, LibraryBooks, HelpOutlined, ContactMail } from "@mui/icons-material";
import { api } from "../utils/api.js";

type PageType = "about" | "contact" | "faqs";

export default function ContentCMS() {
  const [activeTab, setActiveTab] = useState<PageType>("about");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadPageContent(page: PageType) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.getContent(page);
      setBody(data.body || "");
    } catch (err: any) {
      setError(`Failed to load page content for '${page}'`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageContent(activeTab);
  }, [activeTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: PageType) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.editContent(activeTab, { body });
      setSuccess(`CMS Page '${activeTab.toUpperCase()}' successfully saved to database! Live in Android app.`);
    } catch (err: any) {
      setError(err.message || "Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  const getPageIcon = (page: PageType) => {
    switch (page) {
      case "about":
        return <LibraryBooks sx={{ fontSize: 40, color: "#00f2fe" }} />;
      case "contact":
        return <ContactMail sx={{ fontSize: 40, color: "#ff007f" }} />;
      case "faqs":
        return <HelpOutlined sx={{ fontSize: 40, color: "#ffcc00" }} />;
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Mobile App Content Management (CMS)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Edit and format informative rich pages. Changes save instantly and compile into the app's side drawers.
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

      {/* Tabs list */}
      <Box sx={{ borderBottom: 1, borderColor: "rgba(255, 255, 255, 0.08)", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab value="about" label="About Us Page" style={{ color: activeTab === "about" ? "#00f2fe" : "gray" }} />
          <Tab value="contact" label="Contact Us Page" style={{ color: activeTab === "contact" ? "#ff007f" : "gray" }} />
          <Tab value="faqs" label="Frequently Asked Questions (FAQs)" style={{ color: activeTab === "faqs" ? "#ffcc00" : "gray" }} />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Editor Column */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ bgcolor: "rgba(22, 27, 34, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
                  {getPageIcon(activeTab)}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", textTransform: "capitalize" }}>
                      Editing {activeTab} Content
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Standard HTML tags are accepted for layout alignments, lists, paragraphs and headers.
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={14}
                  variant="outlined"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<h1>Enter Title</h1><p>Enter paragraphs here...</p>"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "#fff",
                      bgcolor: "#0d1117",
                      borderRadius: 2,
                      borderColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    disabled={saving}
                    onClick={handleSave}
                    sx={{
                      background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                      color: "#0d1117",
                      fontWeight: "bold",
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      "&:hover": {
                        background: "linear-gradient(135deg, #00d2de 0%, #3f8cfe 100%)",
                      },
                    }}
                  >
                    Save Changes Live
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Real-time Preview Column */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                bgcolor: "rgba(22, 27, 34, 0.3)",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: 3,
                height: "100%",
                minHeight: 450,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="gray" sx={{ mb: 2, fontWeight: "600" }}>
                  Interactive Mobile App Screen Preview
                </Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />
                
                {/* Mock Phone Frame Wrapper */}
                <Box
                  sx={{
                    border: "8px solid #2d3748",
                    borderRadius: 4,
                    height: 480,
                    overflowY: "auto",
                    bgcolor: "#fff",
                    color: "#2d3748",
                    p: 3,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <Box sx={{ borderBottom: "1.5px solid #edf2f7", pb: 1, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#4facfe" }} />
                    <Typography variant="caption" sx={{ fontWeight: "bold", textTransform: "uppercase", color: "#4facfe", letterSpacing: 1.5 }}>
                      Khurshid Fans
                    </Typography>
                  </Box>
                  
                  {/* Dynamic HTML Preview */}
                  <div
                    style={{ fontSize: 13, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: body || "<p style='color:gray'>Write some HTML on the left to inspect mobile screen preview here.</p>" }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
