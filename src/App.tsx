import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from "@mui/material";
import {
  Menu,
  Dashboard as DashIcon,
  ShoppingBag,
  ShoppingCart,
  People,
  Warning,
  LibraryBooks,
  Chat,
  TrendingUp,
  Settings as SettingsIcon,
  Brightness4,
  Brightness7,
  Logout,
  Air,
} from "@mui/icons-material";
import { api, getAdminToken, setAdminToken } from "./utils/api";

// Import all subpages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Complaints from "./pages/Complaints";
import ContentCMS from "./pages/ContentCMS";
import ChatSupport from "./pages/ChatSupport";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const drawerWidth = 260;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAdminToken());
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ complaints: 0, orders: 0 });

  // Update real-time notifications badge
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadBadges() {
      try {
        const complaintsData = await api.getComplaints("open");
        const ordersData = await api.getOrders("pending");
        setBadgeCounts({
          complaints: complaintsData.length,
          orders: ordersData.length,
        });
      } catch (err) {
        console.error("Failed to sync navigation badges", err);
      }
    }
    loadBadges();
    const interval = setInterval(loadBadges, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

  // Create customized MUI themes
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#00f2fe" : "#00838f",
      },
      secondary: {
        main: "#ff007f",
      },
      background: {
        default: darkMode ? "#0a1114" : "#e0f7fa",
        paper: darkMode ? "#161b22" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#000000",
        secondary: darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
      },
    },
    typography: {
      fontFamily: '"Inter", "sans-serif"',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: darkMode 
              ? "linear-gradient(135deg, #00363a 0%, #0c1012 100%) !important" 
              : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%) !important",
            color: darkMode ? "#ffffff !important" : "#000000 !important",
            transition: "background 0.3s ease, color 0.3s ease",
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            backgroundColor: darkMode ? "rgba(22, 27, 34, 0.6) !important" : "rgba(255, 255, 255, 0.8) !important",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.08) !important" : "1px solid rgba(0, 0, 0, 0.08) !important",
            color: darkMode ? "#ffffff !important" : "#000000 !important",
            transition: "all 0.3s ease",
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: ({ ownerState, theme }: any) => {
            const isWhite = 
              ownerState.color === "#fff" || 
              ownerState.color === "#ffffff" || 
              ownerState.color === "white" || 
              ownerState.sx?.color === "#fff" || 
              ownerState.sx?.color === "#ffffff" || 
              ownerState.sx?.color === "white";
            
            if (isWhite) {
              return {
                color: theme.palette.mode === "dark" ? "#ffffff !important" : "#000000 !important"
              };
            }
            return {};
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? "#161b22 !important" : "#ffffff !important",
            color: darkMode ? "#ffffff !important" : "#000000 !important",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.08) !important" : "1px solid rgba(0, 0, 0, 0.08) !important",
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color: darkMode ? "#ffffff !important" : "#000000 !important",
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            color: darkMode ? "#ffffff !important" : "#000000 !important",
            borderColor: darkMode ? "rgba(255, 255, 255, 0.08) !important" : "rgba(0, 0, 0, 0.08) !important",
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: darkMode ? "rgba(255, 255, 255, 0.02) !important" : "rgba(0, 0, 0, 0.02) !important",
              color: darkMode ? "#ffffff !important" : "#000000 !important",
              "& fieldset": {
                borderColor: darkMode ? "rgba(255, 255, 255, 0.1) !important" : "rgba(0, 0, 0, 0.1) !important",
              },
              "&:hover fieldset": {
                borderColor: darkMode ? "rgba(255, 255, 255, 0.2) !important" : "rgba(0, 0, 0, 0.2) !important",
              },
            },
            "& .MuiInputLabel-root": {
              color: darkMode ? "rgba(255, 255, 255, 0.5) !important" : "rgba(0, 0, 0, 0.5) !important",
            },
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: darkMode ? "#ffffff !important" : "#000000 !important",
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: darkMode ? "rgba(255, 255, 255, 0.08) !important" : "rgba(0, 0, 0, 0.08) !important",
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: darkMode ? "#ffffff !important" : "#000000 !important",
          },
          secondary: {
            color: darkMode ? "rgba(255, 255, 255, 0.7) !important" : "rgba(0, 0, 0, 0.7) !important",
          }
        }
      }
    },
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    setAdminToken("");
    setIsAuthenticated(false);
  };

  // Define sidebar navigation items
  const menuItems = [
    { id: "dashboard", text: "Overview Dashboard", icon: <DashIcon /> },
    { id: "products", text: "Product Catalog", icon: <ShoppingBag /> },
    { id: "orders", text: "Orders fulfillment", icon: <ShoppingCart />, badge: badgeCounts.orders },
    { id: "users", text: "App User Directory", icon: <People /> },
    { id: "complaints", text: "Support Helpdesk", icon: <Warning />, badge: badgeCounts.complaints },
    { id: "cms", text: "App CMS Content", icon: <LibraryBooks /> },
    { id: "chat", text: "Live Support Chat", icon: <Chat /> },
    { id: "analytics", text: "Advanced Analytics", icon: <TrendingUp /> },
    { id: "settings", text: "Console Settings", icon: <SettingsIcon /> },
  ];

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login 
          onLoginSuccess={() => setIsAuthenticated(true)} 
          darkMode={darkMode}
          onToggleMode={() => setDarkMode(!darkMode)}
        />
      </ThemeProvider>
    );
  }

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sidebar Header Brand block */}
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
            boxShadow: "0 0 12px rgba(79, 172, 254, 0.4)",
          }}
        >
          <Air sx={{ color: "#0d1117" }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" style={{ fontWeight: 800, color: darkMode ? "#fff" : "#000", letterSpacing: 0.5 }}>
            Khurshid Fans
          </Typography>
          <Typography variant="caption" style={{ color: darkMode ? "gray" : "rgba(0,0,0,0.6)", fontSize: 10, display: "block" }}>
            ADMINISTRATION CONSOLE
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

      {/* Navigation Links list */}
      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const isSelected = activeTab === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isSelected 
                    ? (darkMode ? "rgba(0, 242, 254, 0.08)" : "rgba(0, 131, 143, 0.08)") 
                    : "transparent",
                  color: isSelected 
                    ? (darkMode ? "#00f2fe" : "#00838f") 
                    : (darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"),
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: isSelected 
                      ? (darkMode ? "rgba(0, 242, 254, 0.1)" : "rgba(0, 131, 143, 0.1)") 
                      : (darkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)"),
                    color: isSelected 
                      ? (darkMode ? "#00f2fe" : "#00838f") 
                      : (darkMode ? "#fff" : "#000"),
                  },
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? (darkMode ? "#00f2fe" : "#00838f") : (darkMode ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.54)"), minWidth: 40 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="secondary" overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: "inherit" }}>{item.text}</Typography>}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
      {/* Session Action bottom list */}
      <List sx={{ px: 1.5, py: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: "#ff5252",
              "&:hover": {
                bgcolor: "rgba(255, 82, 82, 0.08)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#ff5252", minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Sign Out Session</Typography>} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: "flex", 
          minHeight: "100vh",
          background: darkMode 
            ? "linear-gradient(135deg, #00363a 0%, #0c1012 100%)" 
            : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
          color: darkMode ? "#ffffff" : "#000000",
        }}
      >
        {/* Navigation Appbar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: darkMode ? "rgba(10, 17, 20, 0.85)" : "rgba(224, 247, 250, 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
            boxShadow: "none",
            color: "inherit",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <Menu style={{ color: darkMode ? "#fff" : "#0d1117" }} />
            </IconButton>

            <Typography variant="body2" sx={{ color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
              {activeTab === "dashboard" ? "System Core / Telemetry" : `Management / ${activeTab}`}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                {darkMode ? <Brightness7 style={{ color: "#ffcc00" }} /> : <Brightness4 style={{ color: "#00838f" }} />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Responsive Side Drawer component */}
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                background: darkMode 
                  ? "linear-gradient(135deg, #00363a 0%, #0c1012 100%)" 
                  : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
                borderRight: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                color: darkMode ? "#ffffff" : "#000000",
              },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                background: darkMode 
                  ? "linear-gradient(135deg, #00363a 0%, #0c1012 100%)" 
                  : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
                borderRight: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                color: darkMode ? "#ffffff" : "#000000",
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Work Area View viewport */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, sm: 4 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: "64px",
            minHeight: "calc(100vh - 64px)",
            bgcolor: "transparent",
          }}
        >
          {activeTab === "dashboard" && <Dashboard onNavigateToChats={() => setActiveTab("chat")} />}
          {activeTab === "products" && <Products />}
          {activeTab === "orders" && <Orders />}
          {activeTab === "users" && <Users />}
          {activeTab === "complaints" && <Complaints />}
          {activeTab === "cms" && <ContentCMS />}
          {activeTab === "chat" && <ChatSupport />}
          {activeTab === "analytics" && <Analytics />}
          {activeTab === "settings" && <Settings />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
