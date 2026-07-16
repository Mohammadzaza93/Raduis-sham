import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Alert, CircularProgress, MenuItem, FormControl, InputLabel, Select, InputAdornment, } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon, } from '@mui/icons-material';
import api from '../services/api';
export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
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
        }
        catch (error) {
            console.error('Error fetching purchases:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            if (response.data) {
                setProducts(response.data);
            }
        }
        catch (error) {
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
            }
            else {
                await api.post('/purchases', data);
                setSuccess('تم إضافة المشتريات بنجاح');
            }
            setDialogOpen(false);
            fetchPurchases();
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه العملية؟')) {
            try {
                await api.delete(`/purchases/${id}`);
                setSuccess('تم الحذف بنجاح');
                fetchPurchases();
                fetchProducts();
            }
            catch (error) {
                setError('حدث خطأ أثناء الحذف');
            }
        }
    };
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const filteredPurchases = purchases.filter(p => {
        if (startDate && new Date(p.date) < new Date(startDate))
            return false;
        if (endDate && new Date(p.date) > new Date(endDate))
            return false;
        return true;
    });
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", children: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A" }), _jsxs(Box, { children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: fetchPurchases, sx: { mr: 1 }, children: "\u062A\u062D\u062F\u064A\u062B" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => { setEditingPurchase(null); setFormData({ productId: '', quantity: '', costPerUnit: '', supplier: '' }); setDialogOpen(true); }, children: "\u0639\u0645\u0644\u064A\u0629 \u0634\u0631\u0627\u0621 \u062C\u062F\u064A\u062F\u0629" })] })] }), success && _jsx(Alert, { severity: "success", sx: { mb: 2 }, onClose: () => setSuccess(''), children: success }), error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, onClose: () => setError(''), children: error }), _jsxs(Grid, { container: true, spacing: 2, mb: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }, children: [_jsx(Typography, { variant: "body2", children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A" }), _jsxs(Typography, { variant: "h5", children: [totalPurchases.toLocaleString(), " \u0644.\u0633"] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }, children: [_jsx(Typography, { variant: "body2", children: "\u0639\u062F\u062F \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A" }), _jsx(Typography, { variant: "h5", children: purchases.length })] }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { fullWidth: true, label: "\u0645\u0646 \u062A\u0627\u0631\u064A\u062E", type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { fullWidth: true, label: "\u0625\u0644\u0649 \u062A\u0627\u0631\u064A\u062E", type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), InputLabelProps: { shrink: true } }) })] }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { sx: { bgcolor: '#f5f5f5' }, children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "#" }), _jsx(TableCell, { children: "\u0627\u0644\u0645\u0646\u062A\u062C" }), _jsx(TableCell, { children: "\u0627\u0644\u0643\u0645\u064A\u0629" }), _jsx(TableCell, { children: "\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629" }), _jsx(TableCell, { children: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A" }), _jsx(TableCell, { children: "\u0627\u0644\u0645\u0648\u0631\u062F" }), _jsx(TableCell, { children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E" }), _jsx(TableCell, { children: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })] }) }), _jsx(TableBody, { children: filteredPurchases.map((purchase, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: idx + 1 }), _jsx(TableCell, { children: purchase.productName }), _jsx(TableCell, { children: purchase.quantity }), _jsxs(TableCell, { children: [purchase.costPerUnit.toLocaleString(), " \u0644.\u0633"] }), _jsxs(TableCell, { children: [purchase.total.toLocaleString(), " \u0644.\u0633"] }), _jsx(TableCell, { children: purchase.supplier }), _jsx(TableCell, { children: new Date(purchase.date).toLocaleDateString('ar-EG') }), _jsx(TableCell, { children: _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDelete(purchase.id), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }, purchase.id))) })] }) }), _jsxs(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingPurchase ? 'تعديل عملية شراء' : 'عملية شراء جديدة' }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "\u0627\u0644\u0645\u0646\u062A\u062C" }), _jsx(Select, { value: formData.productId, onChange: (e) => setFormData({ ...formData, productId: e.target.value }), label: "\u0627\u0644\u0645\u0646\u062A\u062C", children: products.map((p) => (_jsxs(MenuItem, { value: p.id, children: [p.name, " - \u0627\u0644\u0645\u062E\u0632\u0648\u0646: ", p.quantity] }, p.id))) })] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0643\u0645\u064A\u0629", type: "number", value: formData.quantity, onChange: (e) => setFormData({ ...formData, quantity: e.target.value }) }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(TextField, { fullWidth: true, label: "\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629", type: "number", value: formData.costPerUnit, onChange: (e) => setFormData({ ...formData, costPerUnit: e.target.value }), InputProps: { startAdornment: _jsx(InputAdornment, { position: "start", children: "\u0644.\u0633" }) } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0645\u0648\u0631\u062F", value: formData.supplier, onChange: (e) => setFormData({ ...formData, supplier: e.target.value }) }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDialogOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { onClick: handleSubmit, variant: "contained", disabled: submitting, children: submitting ? _jsx(CircularProgress, { size: 24 }) : (editingPurchase ? 'تحديث' : 'إضافة') })] })] })] }));
}
