import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';
export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ name: '', costPrice: '', sellPrice: '', quantity: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useEffect(() => { fetchProducts(); }, []);
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products');
            if (response.data)
                setProducts(response.data);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setLoading(false);
        }
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
            }
            else {
                await api.post('/products', data);
                setSuccess('تم إضافة المنتج');
            }
            setDialogOpen(false);
            fetchProducts();
        }
        catch (err) {
            setError('حدث خطأ');
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد؟')) {
            await api.delete(`/products/${id}`);
            fetchProducts();
        }
    };
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const lowStockProducts = products.filter(p => p.quantity <= 5);
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", mb: 3, children: [_jsx(Typography, { variant: "h4", children: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => { setEditingProduct(null); setFormData({ name: '', costPrice: '', sellPrice: '', quantity: '' }); setDialogOpen(true); }, children: "\u0645\u0646\u062A\u062C \u062C\u062F\u064A\u062F" })] }), _jsxs(Grid, { container: true, spacing: 2, mb: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }, children: [_jsx(Typography, { variant: "body2", children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646" }), _jsxs(Typography, { variant: "h5", children: [totalValue.toLocaleString(), " \u0644.\u0633"] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', bgcolor: lowStockProducts.length > 0 ? '#f44336' : '#4caf50', color: 'white' }, children: [_jsx(Typography, { variant: "body2", children: "\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646\u062E\u0641\u0636\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646" }), _jsx(Typography, { variant: "h5", children: lowStockProducts.length })] }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', bgcolor: '#ff9800', color: 'white' }, children: [_jsx(Typography, { variant: "body2", children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A" }), _jsx(Typography, { variant: "h5", children: products.length })] }) })] }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { sx: { bgcolor: '#f5f5f5' }, children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "#" }), _jsx(TableCell, { children: "\u0627\u0644\u0645\u0646\u062A\u062C" }), _jsx(TableCell, { children: "\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621" }), _jsx(TableCell, { children: "\u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639" }), _jsx(TableCell, { children: "\u0627\u0644\u0643\u0645\u064A\u0629" }), _jsx(TableCell, { children: "\u0627\u0644\u062D\u0627\u0644\u0629" }), _jsx(TableCell, { children: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })] }) }), _jsx(TableBody, { children: products.map((p, idx) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: idx + 1 }), _jsx(TableCell, { children: p.name }), _jsxs(TableCell, { children: [p.costPrice.toLocaleString(), " \u0644.\u0633"] }), _jsxs(TableCell, { children: [p.sellPrice.toLocaleString(), " \u0644.\u0633"] }), _jsx(TableCell, { children: p.quantity }), _jsx(TableCell, { children: _jsx(Chip, { label: p.quantity <= 5 ? 'منخفض' : 'متوفر', color: p.quantity <= 5 ? 'error' : 'success', size: "small" }) }), _jsxs(TableCell, { children: [_jsx(IconButton, { size: "small", onClick: () => { setEditingProduct(p); setFormData({ name: p.name, costPrice: p.costPrice.toString(), sellPrice: p.sellPrice.toString(), quantity: p.quantity.toString() }); setDialogOpen(true); }, children: _jsx(EditIcon, {}) }), _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDelete(p.id), children: _jsx(DeleteIcon, {}) })] })] }, p.id))) })] }) }), _jsxs(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingProduct ? 'تعديل منتج' : 'منتج جديد' }), _jsxs(DialogContent, { children: [_jsx(TextField, { fullWidth: true, label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), margin: "normal" }), _jsx(TextField, { fullWidth: true, label: "\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621", type: "number", value: formData.costPrice, onChange: (e) => setFormData({ ...formData, costPrice: e.target.value }), margin: "normal" }), _jsx(TextField, { fullWidth: true, label: "\u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639", type: "number", value: formData.sellPrice, onChange: (e) => setFormData({ ...formData, sellPrice: e.target.value }), margin: "normal" }), _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0643\u0645\u064A\u0629", type: "number", value: formData.quantity, onChange: (e) => setFormData({ ...formData, quantity: e.target.value }), margin: "normal" })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDialogOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { onClick: handleSubmit, variant: "contained", children: "\u062D\u0641\u0638" })] })] })] }));
}
