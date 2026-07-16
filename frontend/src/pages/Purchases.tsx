import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
}

interface Purchase {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  costPerUnit: number;
  total: number;
  supplier: string;
  date: string;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    costPerUnit: '',
    supplier: '',
  });

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchases');
      if (response.data) {
        setPurchases(response.data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      if (response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
      const quantity = parseInt(formData.quantity);
      const costPerUnit = parseFloat(formData.costPerUnit);
      const total = quantity * costPerUnit;

      const data = {
        productId: parseInt(formData.productId),
        quantity: quantity,
        costPerUnit: costPerUnit,
        total: total,
        supplier: formData.supplier,
        date: new Date().toISOString(),
      };

      if (editingPurchase) {
        await api.put(`/purchases/${editingPurchase.id}`, data);
        setSuccess('تم تحديث المشتريات بنجاح');
      } else {
        await api.post('/purchases', data);
        setSuccess('تم إضافة المشتريات بنجاح');
      }
      setDialogOpen(false);
      fetchPurchases();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العملية؟')) {
      try {
        await api.delete(`/purchases/${id}`);
        setSuccess('تم الحذف بنجاح');
        fetchPurchases();
        fetchProducts();
      } catch (error) {
        setError('حدث خطأ أثناء الحذف');
      }
    }
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const filteredPurchases = purchases.filter(p => {
    if (startDate && new Date(p.date) < new Date(startDate)) return false;
    if (endDate && new Date(p.date) > new Date(endDate)) return false;
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">المشتريات</Typography>
        <Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPurchases} sx={{ mr: 1 }}>
            تحديث
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingPurchase(null); setFormData({ productId: '', quantity: '', costPerUnit: '', supplier: '' }); setDialogOpen(true); }}>
            عملية شراء جديدة
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }}>
            <Typography variant="body2">إجمالي المشتريات</Typography>
            <Typography variant="h5">{totalPurchases.toLocaleString()} ل.س</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
            <Typography variant="body2">عدد العمليات</Typography>
            <Typography variant="h5">{purchases.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth label="من تاريخ" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth label="إلى تاريخ" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>المنتج</TableCell>
              <TableCell>الكمية</TableCell>
              <TableCell>سعر الوحدة</TableCell>
              <TableCell>الإجمالي</TableCell>
              <TableCell>المورد</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPurchases.map((purchase, idx) => (
              <TableRow key={purchase.id} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{purchase.productName}</TableCell>
                <TableCell>{purchase.quantity}</TableCell>
                <TableCell>{purchase.costPerUnit.toLocaleString()} ل.س</TableCell>
                <TableCell>{purchase.total.toLocaleString()} ل.س</TableCell>
                <TableCell>{purchase.supplier}</TableCell>
                <TableCell>{new Date(purchase.date).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => handleDelete(purchase.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPurchase ? 'تعديل عملية شراء' : 'عملية شراء جديدة'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>المنتج</InputLabel>
                <Select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} label="المنتج">
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name} - المخزون: {p.quantity}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="الكمية" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="سعر الوحدة" type="number" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">ل.س</InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="المورد" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : (editingPurchase ? 'تحديث' : 'إضافة')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}