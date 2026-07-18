import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
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
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload, Key } from "@mui/icons-material";
import { api } from "../utils/api.js";

interface SpecPair {
  key: string;
  value: string;
}

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState<"ceiling" | "pedestal" | "bracket" | "exhaust">("ceiling");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(8500);
  const [stock, setStock] = useState<number>(50);
  const [isActive, setIsActive] = useState(true);
  const [specPairs, setSpecPairs] = useState<SpecPair[]>([{ key: "", value: "" }]);
  const [manualUrls, setManualUrls] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setCurrentId("");
    setName("");
    setType("ceiling");
    setDescription("");
    setPrice(8500);
    setStock(50);
    setIsActive(true);
    setSpecPairs([{ key: "", value: "" }]);
    setManualUrls("");
    setFiles(null);
    setError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditMode(true);
    setCurrentId(prod.id);
    setName(prod.name);
    setType(prod.type);
    setDescription(prod.description || "");
    setPrice(prod.price);
    setStock(prod.stock);
    setIsActive(prod.isActive);
    
    // Map existing specs back into pair array
    const pairs = Object.entries(prod.specs || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setSpecPairs(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
    
    setManualUrls(JSON.stringify(prod.images || []));
    setFiles(null);
    setError("");
    setDialogOpen(true);
  };

  const handleToggleActive = async (prod: any) => {
    try {
      const form = new FormData();
      form.append("isActive", String(!prod.isActive));
      await api.editProduct(prod.id, form);
      setSuccess(`Product '${prod.name}' status toggled.`);
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setSuccess("Product deleted successfully");
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  // Specs form management
  const addSpecPair = () => {
    setSpecPairs([...specPairs, { key: "", value: "" }]);
  };

  const removeSpecPair = (index: number) => {
    const updated = [...specPairs];
    updated.splice(index, 1);
    setSpecPairs(updated.length > 0 ? updated : [{ key: "", value: "" }]);
  };

  const handleSpecChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...specPairs];
    updated[index][field] = val;
    setSpecPairs(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !price) {
      setError("Name and Price are required");
      return;
    }

    // Assemble specs object
    const finalSpecs: Record<string, string> = {};
    specPairs.forEach((p) => {
      if (p.key.trim() && p.value.trim()) {
        finalSpecs[p.key.trim()] = p.value.trim();
      }
    });

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("description", description);
    formData.append("price", String(price));
    formData.append("stock", String(stock));
    formData.append("isActive", String(isActive));
    formData.append("specs", JSON.stringify(finalSpecs));

    // Handle manual url list parsing
    if (manualUrls.trim()) {
      try {
        let parsedUrls = [];
        if (manualUrls.trim().startsWith("[")) {
          parsedUrls = JSON.parse(manualUrls);
        } else {
          parsedUrls = manualUrls.split(",").map(u => u.trim()).filter(Boolean);
        }
        formData.append("imageUrls", JSON.stringify(parsedUrls));
      } catch (err) {
        formData.append("imageUrls", JSON.stringify([manualUrls]));
      }
    }

    // Handle uploaded files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        formData.append("imagesFiles", files[i]);
      }
    }

    try {
      if (editMode) {
        await api.editProduct(currentId, formData);
        setSuccess("Product updated successfully");
      } else {
        await api.addProduct(formData);
        setSuccess("Product created successfully");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.4s ease-out" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: "bold", color: "#fff" }}>
            Product Catalog Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review, edit, publish or deactivate products that users can browse and order from the Android application.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
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
          Add New Fan
        </Button>
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
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Preview</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Product Name</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Category Type</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Unit Price</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Available Stock</TableCell>
                  <TableCell style={{ color: "#fff", fontWeight: "bold" }}>Status (Active)</TableCell>
                  <TableCell align="right" style={{ color: "#fff", fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" style={{ color: "gray" }}>
                      No products found. Click Add New Fan to seed items.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((prod) => (
                    <TableRow key={prod.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>
                        <img
                          src={prod.images?.[0] || "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=100&q=80"}
                          alt={prod.name}
                          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}
                          referrerPolicy="no-referrer"
                        />
                      </TableCell>
                      <TableCell style={{ color: "#fff", fontWeight: "bold" }}>{prod.name}</TableCell>
                      <TableCell style={{ color: "gray" }}>
                        <Box sx={{ textTransform: "capitalize" }}>{prod.type}</Box>
                      </TableCell>
                      <TableCell style={{ color: "#00f2fe", fontWeight: "600" }}>{prod.price.toLocaleString()} PKR</TableCell>
                      <TableCell style={{ color: prod.stock < 10 ? "#ff007f" : "lightgreen" }}>
                        {prod.stock} units
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={prod.isActive}
                          onChange={() => handleToggleActive(prod)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenEdit(prod)} color="primary" sx={{ mr: 1 }}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(prod.id)} color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE & EDIT FORM DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
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
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
            {editMode ? "Edit Product Details" : "Register New Fan Variant"}
          </DialogTitle>
          <DialogContent dividers style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Product Name / Title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel style={{ color: "gray" }}>Category Type</InputLabel>
                  <Select
                    value={type}
                    label="Category Type"
                    onChange={(e: any) => setType(e.target.value)}
                    style={{ color: "#fff" }}
                  >
                    <MenuItem value="ceiling">Ceiling Fan</MenuItem>
                    <MenuItem value="pedestal">Pedestal Fan</MenuItem>
                    <MenuItem value="bracket">Bracket Fan</MenuItem>
                    <MenuItem value="exhaust">Exhaust Fan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Price (PKR)"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Stock Units"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  required
                  margin="normal"
                  sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description (HTML/RichText Supported)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="<p>Include rich specifications and selling points here.</p>"
                  margin="normal"
                  sx={{ "& .MuiInputBase-root": { color: "#fff" }, label: { color: "gray" } }}
                />
              </Grid>

              {/* Multiple image attachments */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="gray" sx={{ mb: 1, fontWeight: "600" }}>
                  Product Presentation Images
                </Typography>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      fullWidth
                      sx={{ py: 1.5, borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                    >
                      Upload Image Files
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={(e) => setFiles(e.target.files)}
                      />
                    </Button>
                    {files && files.length > 0 && (
                      <Typography variant="caption" color="lightgreen" sx={{ mt: 1, display: "block" }}>
                        Selected: {files.length} images to upload on submit.
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Image URLs (Comma separated list)"
                      value={manualUrls}
                      onChange={(e) => setManualUrls(e.target.value)}
                      placeholder="https://example.com/fan.png"
                      sx={{ input: { color: "#fff" }, label: { color: "gray" } }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Dynamic specs key value form */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.06)" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: "#00f2fe", fontWeight: "600" }}>
                    Technical Specifications (Specs)
                  </Typography>
                  <Button variant="text" size="small" onClick={addSpecPair} startIcon={<Add />}>
                    Add Spec Item
                  </Button>
                </Box>
                {specPairs.map((pair, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 2, mb: 1.5, alignItems: "center" }}>
                    <TextField
                      size="small"
                      label="Spec Key (e.g., Sweep Size)"
                      value={pair.key}
                      onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                      sx={{ flexGrow: 1, input: { color: "#fff" }, label: { color: "gray" } }}
                    />
                    <TextField
                      size="small"
                      label="Spec Value (e.g., 56 inches)"
                      value={pair.value}
                      onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                      sx={{ flexGrow: 1, input: { color: "#fff" }, label: { color: "gray" } }}
                    />
                    <IconButton size="small" onClick={() => removeSpecPair(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions style={{ padding: 24 }}>
            <Button onClick={() => setDialogOpen(false)} style={{ color: "gray" }}>
              Discard
            </Button>
            <Button
              type="submit"
              variant="contained"
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
              {editMode ? "Save Changes" : "Create Fan"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
