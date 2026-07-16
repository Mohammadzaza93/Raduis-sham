import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Alert, Chip, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', costPrice: '', sellPrice: '', quantity: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      if (response.data) setProducts(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        costPrice: parseFloat(formData.costPrice),
        sellPrice: parseFloat(formData.sellPrice),
        quantity: parseInt(formData.quantity),
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
        setSuccess('تم تحديث المنتج');
      } else {
        await api.post('/products', data);
        setSuccess('تم إضافة المنتج');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) { setError('حدث خطأ'); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد؟')) {
      await api.delete(`/products/${id}`);
      fetchProducts();
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
  const lowStockProducts = products.filter(p => p.quantity <= 5);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">المخزون</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingProduct(null); setFormData({ name: '', costPrice: '', sellPrice: '', quantity: '' }); setDialogOpen(true); }}>
          منتج جديد
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }}>
            <Typography variant="body2">إجمالي قيمة المخزون</Typography>
            <Typography variant="h5">{totalValue.toLocaleString()} ل.س</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: lowStockProducts.length > 0 ? '#f44336' : '#4caf50', color: 'white' }}>
            <Typography variant="body2">منتجات منخفضة المخزون</Typography>
            <Typography variant="h5">{lowStockProducts.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ff9800', color: 'white' }}>
            <Typography variant="body2">إجمالي المنتجات</Typography>
            <Typography variant="h5">{products.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>#</TableCell><TableCell>المنتج</TableCell><TableCell>سعر الشراء</TableCell>
              <TableCell>سعر البيع</TableCell><TableCell>الكمية</TableCell><TableCell>الحالة</TableCell><TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p, idx) => (
              <TableRow key={p.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.costPrice.toLocaleString()} ل.س</TableCell>
                <TableCell>{p.sellPrice.toLocaleString()} ل.س</TableCell>
                <TableCell>{p.quantity}</TableCell>
                <TableCell><Chip label={p.quantity <= 5 ? 'منخفض' : 'متوفر'} color={p.quantity <= 5 ? 'error' : 'success'} size="small" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditingProduct(p); setFormData({ name: p.name, costPrice: p.costPrice.toString(), sellPrice: p.sellPrice.toString(), quantity: p.quantity.toString() }); setDialogOpen(true); }}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'تعديل منتج' : 'منتج جديد'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="اسم المنتج" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" />
          <TextField fullWidth label="سعر الشراء" type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} margin="normal" />
          <TextField fullWidth label="سعر البيع" type="number" value={formData.sellPrice} onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })} margin="normal" />
          <TextField fullWidth label="الكمية" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSubmit} variant="contained">حفظ</Button></DialogActions>
      </Dialog>
    </Box>
  );
}