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
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
}

interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  total: number;
  customer: string;
  date: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    customer: '',
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales');
      if (response.data) {
        setSales(response.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
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
      if (!selectedProduct) {
        setError('المنتج غير موجود');
        setSubmitting(false);
        return;
      }

      const quantity = parseInt(formData.quantity);
      if (quantity > selectedProduct.quantity) {
        setError(`الكمية المطلوبة (${quantity}) أكبر من المتوفر (${selectedProduct.quantity})`);
        setSubmitting(false);
        return;
      }

      const total = quantity * selectedProduct.sellPrice;

      const data = {
        productId: parseInt(formData.productId),
        quantity: quantity,
        total: total,
        customer: formData.customer,
        date: new Date().toISOString(),
      };

      await api.post('/sales', data);
      setSuccess('تم إضافة عملية البيع بنجاح');
      setDialogOpen(false);
      fetchSales();
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
        await api.delete(`/sales/${id}`);
        setSuccess('تم الحذف بنجاح');
        fetchSales();
        fetchProducts();
      } catch (error) {
        setError('حدث خطأ أثناء الحذف');
      }
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const filteredSales = sales.filter(s => {
    if (startDate && new Date(s.date) < new Date(startDate)) return false;
    if (endDate && new Date(s.date) > new Date(endDate)) return false;
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">المبيعات</Typography>
        <Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSales} sx={{ mr: 1 }}>
            تحديث
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData({ productId: '', quantity: '', customer: '' }); setDialogOpen(true); }}>
            عملية بيع جديدة
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
            <Typography variant="body2">إجمالي المبيعات</Typography>
            <Typography variant="h5">{totalSales.toLocaleString()} ل.س</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#2196f3', color: 'white' }}>
            <Typography variant="body2">عدد العمليات</Typography>
            <Typography variant="h5">{sales.length}</Typography>
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
              <TableCell>سعر البيع</TableCell>
              <TableCell>الإجمالي</TableCell>
              <TableCell>العميل</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale, idx) => (
              <TableRow key={sale.id} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{(sale.total / sale.quantity).toLocaleString()} ل.س</TableCell>
                <TableCell>{sale.total.toLocaleString()} ل.س</TableCell>
                <TableCell>{sale.customer}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => handleDelete(sale.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>عملية بيع جديدة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>المنتج</InputLabel>
                <Select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} label="المنتج">
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} - السعر: {p.sellPrice.toLocaleString()} ل.س - المتوفر: {p.quantity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="الكمية" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="العميل" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained" color="success" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'تأكيد البيع'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}