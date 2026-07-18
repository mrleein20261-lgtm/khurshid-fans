import React, { useEffect, useState, useRef } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  TextField,
  IconButton,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  Send,
  Chat,
  Person,
  DoneAll,
  Image,
  NotificationsActive,
} from "@mui/icons-material";
import { io, Socket } from "socket.io-client";
import { api } from "../utils/api.js";

export default function ChatSupport() {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [imageInputUrl, setImageInputUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load chat rooms sidebar list
  async function loadRooms() {
    try {
      const data = await api.getChats();
      setChatRooms(data);
      if (data.length > 0 && !activeRoom) {
        handleSelectRoom(data[0]);
      }
    } catch (err) {
      console.error("Error loading chat sessions", err);
    }
  }

  useEffect(() => {
    loadRooms();

    // Initialize support notification tone
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav"); // friendly chime
    
    // Connect to Socket.io namespace
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Chat namespace socket");
    });

    // Receive global chat updates to refresh sidebar
    newSocket.on("admin:chat-updated", () => {
      loadRooms();
    });

    // Receive sound alert when users write messages
    newSocket.on("admin:chat-notify", (notify) => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      loadRooms();
      
      // If we are currently viewing this room, refresh its messages
      if (activeRoom && activeRoom.roomId === notify.roomId) {
        loadMessages(notify.roomId);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Sync scrollbar to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(roomId: string) {
    try {
      const chat = await api.getChatMessages(roomId);
      setMessages(chat.messages || []);
    } catch (err) {
      console.error("Failed to load conversation history", err);
    }
  }

  const handleSelectRoom = (room: any) => {
    setActiveRoom(room);
    loadMessages(room.roomId);
    
    // Tell socket to join room
    if (socket) {
      socket.emit("chat:join", { roomId: room.roomId });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageInputUrl.trim()) return;

    const msgContent = inputText.trim() || imageInputUrl.trim();
    const msgType = imageInputUrl.trim() ? "image" : "text";

    try {
      // Post to REST API for persistence
      const savedMsg = await api.sendChatMessage(activeRoom.roomId, {
        message: msgContent,
        type: msgType,
      });

      // Emit on socket.io to update clients instantly
      if (socket) {
        socket.emit("chat:send", {
          roomId: activeRoom.roomId,
          senderId: "admin",
          message: msgContent,
          type: msgType,
        });
      }

      // Append locally for instantaneous rendering
      setMessages((prev) => [...prev, savedMsg]);
      setInputText("");
      setImageInputUrl("");
      setShowImageField(false);
      loadRooms();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Trigger quick simulated incoming user response helper to test alert sound and badges
  const handleSimulateUserMessage = () => {
    if (!activeRoom) return;
    
    if (socket) {
      socket.emit("chat:send", {
        roomId: activeRoom.roomId,
        senderId: activeRoom.userId,
        message: "Assalam o Alaikum! This is a mock response from my Khurshid Fans Android application.",
        type: "text",
      });
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Live Support Messenger
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time support dashboard connected with Android client apps via Socket.io. Supports sound chimes.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<NotificationsActive />}
          onClick={handleSimulateUserMessage}
          disabled={!activeRoom}
          sx={{ textTransform: "none", borderColor: "rgba(255,0,127,0.3)", color: "#ff007f", "&:hover": { borderColor: "#ff007f" } }}
        >
          Simulate User Reply (Test Sound)
        </Button>
      </Box>

      <Grid container spacing={0} sx={{ flexGrow: 1, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, bgcolor: "rgba(22, 27, 34, 0.4)" }}>
        {/* Left pane: WhatsApp style list of conversations */}
        <Grid size={{ xs: 12, sm: 4 }} sx={{ borderRight: "1px solid rgba(255,255,255,0.08)", height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(0,0,0,0.15)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
              Conversations ({chatRooms.length})
            </Typography>
          </Box>
          <List sx={{ flexGrow: 1, overflowY: "auto", py: 0 }}>
            {chatRooms.map((room) => {
              const isSelected = activeRoom && activeRoom.roomId === room.roomId;
              return (
                <ListItem
                  key={room.roomId}
                  onClick={() => handleSelectRoom(room)}
                  sx={{
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    bgcolor: isSelected ? "rgba(0, 242, 254, 0.08)" : "transparent",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: isSelected ? "rgba(0, 242, 254, 0.08)" : "rgba(255,255,255,0.02)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Avatar sx={{ bgcolor: isSelected ? "#00f2fe" : "#333", color: isSelected ? "#0d1117" : "#fff" }}>
                      <Person />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold", color: isSelected ? "#00f2fe" : "#fff", fontSize: 13 }}>{room.customerName}</Typography>}
                    secondary={<Typography sx={{ color: "gray", fontSize: 11, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", mt: 0.5 }}>{room.lastMessage}</Typography>}
                  />
                </ListItem>
              );
            })}
          </List>
        </Grid>

        {/* Right pane: Chat box active feed */}
        <Grid size={{ xs: 12, sm: 8 }} sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0d1117" }}>
          {activeRoom ? (
            <>
              {/* Active room header */}
              <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(0,0,0,0.15)" }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
                    {activeRoom.customerName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Customer Account: {activeRoom.customerEmail}
                  </Typography>
                </Box>
                <Chip label="ONLINE SUPPORT" size="small" style={{ backgroundColor: "rgba(46, 125, 50, 0.15)", color: "lightgreen", fontWeight: "bold", fontSize: 10 }} />
              </Box>

              {/* Messages viewport */}
              <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                {messages.map((msg, idx) => {
                  const isAdmin = msg.senderId === "admin";
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: isAdmin ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: "75%",
                          p: 1.5,
                          borderRadius: isAdmin ? "14px 14px 0 14px" : "14px 14px 14px 0",
                          bgcolor: isAdmin ? "#005a70" : "rgba(255,255,255,0.04)",
                          border: isAdmin ? "none" : "1px solid rgba(255,255,255,0.06)",
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        {msg.type === "image" ? (
                          <img
                            src={msg.message}
                            alt="uploaded support reference"
                            style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, display: "block", marginBottom: 4 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{msg.message}</Typography>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 0.5, gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                          {isAdmin && <DoneAll sx={{ fontSize: 12, color: "#00f2fe" }} />}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {/* Typing area inputs */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(0,0,0,0.1)" }}
              >
                {showImageField && (
                  <Box sx={{ display: "flex", gap: 1, mb: 1.5, animation: "fadeIn 0.2s" }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Paste Image URL (e.g. https://domain.com/picture.jpg)"
                      value={imageInputUrl}
                      onChange={(e) => setImageInputUrl(e.target.value)}
                      sx={{ input: { color: "#fff", fontSize: 12 }, label: { color: "gray" } }}
                    />
                    <Button variant="text" size="small" onClick={() => setShowImageField(false)}>
                      Cancel
                    </Button>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <IconButton onClick={() => setShowImageField(!showImageField)} color="primary">
                    <Image sx={{ color: "#00f2fe" }} />
                  </IconButton>
                  
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type official support message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                  />

                  <IconButton type="submit" sx={{ bgcolor: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)", color: "#0d1117" }}>
                    <Send sx={{ color: "#00f2fe" }} />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 2 }}>
              <Chat sx={{ fontSize: 80, color: "rgba(255,255,255,0.03)" }} />
              <Typography variant="body2" color="textSecondary">
                Select an active customer thread from the sidebar to launch chat communications.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
