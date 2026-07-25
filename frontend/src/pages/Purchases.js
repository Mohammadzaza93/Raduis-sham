import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Grid, Alert, CircularProgress, MenuItem, FormControl, InputLabel, Select, InputAdornment,
    FormControlLabel, Checkbox, TablePagination,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../services/api';

interface Product {
    id: number;
    name: string;
    modelNumber?: string;
    costPrice: number;
    quantity: number;
}

interface Purchase {
    id: number;
    productId: number;
    productName: string;
    modelNumber?: string;
    quantity: number;
    costPerUnit: number;
    total: number;
    supplier?: string;
    invoiceNumber?: string;
    date: string;
    notes?: string;
}

export default function Purchases() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        productId: '',
        productName: '',
        modelNumber: '',
        quantity: '',
        costPerUnit: '',
        supplier: '',
        invoiceNumber: '',
        notes: '',
        isNewProduct: false,
        updateProductCostPrice: true,
    });

    useEffect(() => {
        fetchPurchases();
        fetchProducts();
    }, [page, rowsPerPage]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await api.get('/purchases', { params: { page: page + 1, pageSize: rowsPerPage } });
            if (res.data?.success) {
                setPurchases(res.data.data.data || []);
                setTotal(res.data.data.total || 0);
            } else if (Array.isArray(res.data)) {
                setPurchases(res.data);
                setTotal(res.data.length);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products', { params: { pageSize: 500 } });
            const list = res.data?.success ? res.data.data.data : res.data;
            setProducts(Array.isArray(list) ? list : []);
        } catch {
            setProducts([]);
        }
    };

    const handleProductChange = (productId: string) => {
        const p = products.find((x) => x.id === parseInt(productId));
        setFormData({
            ...formData,
            productId,
            costPerUnit: p ? p.costPrice.toString() : formData.costPerUnit,
            modelNumber: p?.modelNumber || formData.modelNumber,
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const qty = parseInt(formData.quantity);
            const cost = parseFloat(formData.costPerUnit);

            if (!qty || qty <= 0) throw new Error('الكمية يجب أن تكون أكبر من صفر');
            if (cost < 0) throw new Error('سعر الوحدة غير صالح');

            const data: any = {
                quantity: qty,
                costPerUnit: cost,
                supplier: formData.supplier || null,
                invoiceNumber: formData.invoiceNumber || null,
                notes: formData.notes || null,
                updateProductCostPrice: formData.updateProductCostPrice,
            };

            if (formData.isNewProduct) {
                if (!formData.productName.trim()) throw new Error('اسم المنتج مطلوب');
                data.productName = formData.productName.trim();
                data.modelNumber = formData.modelNumber || null;
            } else {
                if (!formData.productId) throw new Error('اختر منتجاً');
                data.productId = parseInt(formData.productId);
            }

            await api.post('/purchases', data);
            setSuccess('تم تسجيل عملية الشراء بنجاح');
            setDialogOpen(false);
            fetchPurchases();
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'حدث خطأ');
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = purchases.reduce((s, p) => s + p.total, 0);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">المشتريات</Typography>
                <Box>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPurchases} sx={{ mr: 1 }}>تحديث</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                        setFormData({
                            productId: '', productName: '', modelNumber: '', quantity: '', costPerUnit: '',
                            supplier: '', invoiceNumber: '', notes: '', isNewProduct: false, updateProductCostPrice: true,
                        });
                        setDialogOpen(true);
                    }}>
                        عملية شراء جديدة
          </Button>
                </Box>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }}>
                        <Typography variant="body2">إجمالي المشتريات</Typography>
                        <Typography variant="h5">{totalAmount.toLocaleString()} ل.س</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
                        <Typography variant="body2">عدد العمليات</Typography>
                        <Typography variant="h5">{total}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>اسم المنتج</TableCell>
                            <TableCell>الموديل</TableCell>
                            <TableCell>الكمية</TableCell>
                            <TableCell>سعر الوحدة</TableCell>
                            <TableCell>الإجمالي</TableCell>
                            <TableCell>المورد</TableCell>
                            <TableCell>رقم الفاتورة</TableCell>
                            <TableCell>التاريخ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center">لا توجد مشتريات</TableCell></TableRow>
                        ) : (
                                    purchases.map((p, idx) => (
                                        <TableRow key={p.id} hover>
                                            <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                                            <TableCell>{p.productName}</TableCell>
                                            <TableCell>{p.modelNumber || '-'}</TableCell>
                                            <TableCell>{p.quantity}</TableCell>
                                            <TableCell>{p.costPerUnit.toLocaleString()} ل.س</TableCell>
                                            <TableCell>{p.total.toLocaleString()} ل.س</TableCell>
                                            <TableCell>{p.supplier || '-'}</TableCell>
                                            <TableCell>{p.invoiceNumber || '-'}</TableCell>
                                            <TableCell>{new Date(p.date).toLocaleDateString('ar-EG')}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div" count={total} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                    labelRowsPerPage="صفوف:"
                />
            </TableContainer>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>عملية شراء جديدة</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={<Checkbox checked={formData.isNewProduct}
                            onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })} />}
                        label="منتج جديد (غير موجود في المخزون)"
                    />

                    {formData.isNewProduct ? (
                        <>
                            <TextField fullWidth label="اسم المنتج *" margin="normal" value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
                            <TextField fullWidth label="رقم الموديل" margin="normal" value={formData.modelNumber}
                                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })} />
                        </>
                    ) : (
                            <FormControl fullWidth margin="normal">
                                <InputLabel>المنتج *</InputLabel>
                                <Select value={formData.productId} label="المنتج *" onChange={(e) => handleProductChange(e.target.value as string)}>
                                    {products.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name} {p.modelNumber ? `(${p.modelNumber})` : ''} — المخزون: {p.quantity}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField fullWidth label="الكمية *" type="number" margin="normal" value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="سعر الوحدة *" type="number" margin="normal" value={formData.costPerUnit}
                                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                InputProps={{ endAdornment: <InputAdornment position="end">ل.س</InputAdornment> }} />
                        </Grid>
                    </Grid>

                    <TextField fullWidth label="المورد" margin="normal" value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                    <TextField fullWidth label="رقم فاتورة المورد" margin="normal" value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                    <TextField fullWidth label="ملاحظات" margin="normal" multiline rows={2} value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

                    <FormControlLabel
                        control={<Checkbox checked={formData.updateProductCostPrice}
                            onChange={(e) => setFormData({ ...formData, updateProductCostPrice: e.target.checked })} />}
                        label="تحديث سعر الشراء في المنتج من هذه العملية"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : 'حفظ'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}