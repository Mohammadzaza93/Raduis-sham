import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, Button, Chip, IconButton, InputAdornment, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, Grid, Alert, CircularProgress, } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, MoreVert as MoreVertIcon, PlayArrow as ActivateIcon, Close as CloseIcon, } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
export default function Clients() {
    const [clients, setClients] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    // حالة نوافذ الحوار
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // حالة النماذج
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(0);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        fetchClients();
        fetchPlans();
    }, [page, rowsPerPage, search]);
    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await api.get('/clients', {
                params: {
                    page: page + 1,
                    pageSize: rowsPerPage,
                    search,
                },
            });
            if (response.data.success) {
                setClients(response.data.data.data);
                setTotal(response.data.data.total);
            }
        }
        catch (error) {
            console.error('Error fetching clients:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');
            if (Array.isArray(response.data)) {
    setPlans(response.data);
} else if (Array.isArray(response.data.data)) {
    setPlans(response.data.data);
} else {
    setPlans([]);
}
        }
        catch (error) {
            console.error('Error fetching plans:', error);
        }
    };
    // فتح القائمة المنسدلة
    const handleMenuOpen = (event, client) => {
        setAnchorEl(event.currentTarget);
        setSelectedClient(client);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    // فتح نافذة التعديل
    const handleEditClick = () => {
        if (selectedClient) {
            setEditFormData({
                fullName: selectedClient.fullName,
                phone: selectedClient.phone,
                email: selectedClient.email || '',
                address: selectedClient.address || '',
            });
            setEditDialogOpen(true);
        }
        handleMenuClose();
    };
    // فتح نافذة التفعيل
    const handleActivateClick = () => {
        if (selectedClient) {
            setSelectedPlanId(selectedClient.activeSubscription?.planId || plans[0]?.id || 0);
            setActivateDialogOpen(true);
        }
        handleMenuClose();
    };
    // فتح نافذة الحذف
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };
    // حفظ التعديلات
    const handleSaveEdit = async () => {
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/clients/${selectedClient?.id}`, editFormData);
            setSuccess('تم تحديث بيانات العميل بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setEditDialogOpen(false);
            fetchClients();
        }
        catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
        }
        finally {
            setSubmitting(false);
        }
    };
    // تفعيل الاشتراك
    const handleActivateSubscription = async () => {
        setSubmitting(true);
        setError('');
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            if (!selectedPlan) {
                setError('الرجاء اختيار باقة صحيحة');
                setSubmitting(false);
                return;
            }
            // إنشاء اشتراك جديد للعميل
            await api.post('/subscriptions', {
                userId: selectedClient?.id,
                planId: selectedPlanId,
                days: selectedPlan.durationDays,
            });
            setSuccess('تم تفعيل الاشتراك بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setActivateDialogOpen(false);
            fetchClients();
        }
        catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء التفعيل');
        }
        finally {
            setSubmitting(false);
        }
    };
    // حذف العميل
    const handleDeleteClient = async () => {
        setSubmitting(true);
        try {
            await api.delete(`/clients/${selectedClient?.id}`);
            setSuccess('تم حذف العميل بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setDeleteDialogOpen(false);
            fetchClients();
        }
        catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء الحذف');
        }
        finally {
            setSubmitting(false);
        }
    };
    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG');
    };
    // حساب الأيام المتبقية
    const getDaysRemaining = (endDate) => {
        if (!endDate)
            return null;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", children: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621" }), _jsxs(Box, { children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: fetchClients, sx: { mr: 1 }, children: "\u062A\u062D\u062F\u064A\u062B" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/clients/new'), children: "\u0639\u0645\u064A\u0644 \u062C\u062F\u064A\u062F" })] })] }), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, onClose: () => setSuccess(''), children: success })), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsx(TextField, { fullWidth: true, variant: "outlined", placeholder: "\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u060C \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644\u060C \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641\u060C \u0623\u0648 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0648\u0637\u0646\u064A...", value: search, onChange: (e) => setSearch(e.target.value), InputProps: {
                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                    } }) }), _jsxs(TableContainer, { component: Paper, children: [_jsxs(Table, { children: [_jsx(TableHead, { sx: { backgroundColor: '#f5f5f5' }, children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "#" }), _jsx(TableCell, { children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" }), _jsx(TableCell, { children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644" }), _jsx(TableCell, { children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), _jsx(TableCell, { children: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" }), _jsx(TableCell, { children: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621" }), _jsx(TableCell, { children: "\u0627\u0644\u062D\u0627\u0644\u0629" }), _jsx(TableCell, { align: "center", children: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })] }) }), _jsx(TableBody, { children: clients.map((client, idx) => {
                                    const daysRemaining = getDaysRemaining(client.activeSubscription?.endDate || '');
                                    const isExpired = daysRemaining !== null && daysRemaining <= 0;
                                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
                                    return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: idx + 1 + page * rowsPerPage }), _jsx(TableCell, { children: client.username }), _jsx(TableCell, { children: client.fullName }), _jsx(TableCell, { children: client.phone }), _jsx(TableCell, { children: client.activeSubscription?.planName || (_jsx(Chip, { label: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0627\u0634\u062A\u0631\u0627\u0643", size: "small", color: "warning" })) }), _jsx(TableCell, { children: client.activeSubscription?.endDate ? (_jsxs(Box, { children: [formatDate(client.activeSubscription.endDate), daysRemaining !== null && daysRemaining > 0 && (_jsx(Chip, { label: `${daysRemaining} يوم متبقي`, size: "small", color: daysRemaining <= 3 ? 'warning' : 'info', sx: { ml: 1 } })), isExpired && (_jsx(Chip, { label: "\u0645\u0646\u062A\u0647\u064A", size: "small", color: "error", sx: { ml: 1 } }))] })) : '-' }), _jsxs(TableCell, { children: [_jsx(Chip, { label: client.status === 'Active' ? 'نشط' : 'غير نشط', color: client.status === 'Active' ? 'success' : 'default', size: "small" }), !client.activeSubscription?.isActive && client.status === 'Active' && (_jsx(Chip, { label: "\u0628\u062F\u0648\u0646 \u0627\u0634\u062A\u0631\u0627\u0643", size: "small", color: "warning", sx: { ml: 1 } }))] }), _jsx(TableCell, { align: "center", children: _jsx(IconButton, { size: "small", onClick: (e) => handleMenuOpen(e, client), children: _jsx(MoreVertIcon, {}) }) })] }, client.id));
                                }) })] }), _jsx(TablePagination, { rowsPerPageOptions: [5, 10, 25, 50], component: "div", count: total, rowsPerPage: rowsPerPage, page: page, onPageChange: (_, newPage) => setPage(newPage), onRowsPerPageChange: (e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        } })] }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: [_jsxs(MenuItem, { onClick: handleEditClick, children: [_jsx(ListItemIcon, { children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" })] }), _jsxs(MenuItem, { onClick: handleActivateClick, children: [_jsx(ListItemIcon, { children: _jsx(ActivateIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 / \u062A\u062C\u062F\u064A\u062F" })] }), _jsxs(MenuItem, { onClick: handleDeleteClick, sx: { color: 'error.main' }, children: [_jsx(ListItemIcon, { children: _jsx(DeleteIcon, { fontSize: "small", color: "error" }) }), _jsx(ListItemText, { children: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0634\u062A\u0631\u0643" })] })] }), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { children: ["\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644", _jsx(IconButton, { "aria-label": "close", onClick: () => setEditDialogOpen(false), sx: { position: 'absolute', right: 8, top: 8 }, children: _jsx(CloseIcon, {}) })] }), _jsxs(DialogContent, { children: [error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }), _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644", value: editFormData.fullName, onChange: (e) => setEditFormData({ ...editFormData, fullName: e.target.value }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", value: editFormData.phone, onChange: (e) => setEditFormData({ ...editFormData, phone: e.target.value }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", type: "email", value: editFormData.email, onChange: (e) => setEditFormData({ ...editFormData, email: e.target.value }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646", multiline: true, rows: 2, value: editFormData.address, onChange: (e) => setEditFormData({ ...editFormData, address: e.target.value }) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { onClick: handleSaveEdit, variant: "contained", disabled: submitting, children: submitting ? _jsx(CircularProgress, { size: 24 }) : 'حفظ التغييرات' })] })] }), _jsxs(Dialog, { open: activateDialogOpen, onClose: () => setActivateDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { children: ["\u062A\u0641\u0639\u064A\u0644 \u0627\u0634\u062A\u0631\u0627\u0643 / \u062A\u062C\u062F\u064A\u062F", _jsx(IconButton, { "aria-label": "close", onClick: () => setActivateDialogOpen(false), sx: { position: 'absolute', right: 8, top: 8 }, children: _jsx(CloseIcon, {}) })] }), _jsxs(DialogContent, { children: [error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }), _jsxs(Paper, { variant: "outlined", sx: { p: 2, mb: 3, mt: 2, bgcolor: '#f9f9f9' }, children: [_jsx(Typography, { variant: "subtitle2", color: "textSecondary", children: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644" }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0644\u0627\u0633\u0645:" }), " ", selectedClient?.fullName] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:" }), " ", selectedClient?.username] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641:" }), " ", selectedClient?.phone] }), selectedClient?.activeSubscription?.planName && (_jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:" }), " ", selectedClient.activeSubscription.planName, _jsx("br", {}), _jsx("strong", { children: "\u062A\u0646\u062A\u0647\u064A \u0641\u064A:" }), " ", formatDate(selectedClient.activeSubscription.endDate)] }))] }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0628\u0627\u0642\u0629" }), _jsx(Select, { value: selectedPlanId, onChange: (e) => setSelectedPlanId(Number(e.target.value)), label: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0628\u0627\u0642\u0629", children: plans.map((plan) => (_jsxs(MenuItem, { value: plan.id, children: [plan.name, " - ", plan.speed, " - ", plan.price.toLocaleString(), " \u0644.\u0633"] }, plan.id))) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setActivateDialogOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { onClick: handleActivateSubscription, variant: "contained", color: "success", disabled: submitting, children: submitting ? _jsx(CircularProgress, { size: 24 }) : 'تفعيل الاشتراك' })] })] }), _jsxs(Dialog, { open: deleteDialogOpen, onClose: () => setDeleteDialogOpen(false), children: [_jsx(DialogTitle, { children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 \u0627\u0644\u0639\u0645\u064A\u0644 ", _jsx("strong", { children: selectedClient?.fullName }), "\u061F", _jsx("br", {}), "\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646\u0647."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteDialogOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { onClick: handleDeleteClient, color: "error", variant: "contained", disabled: submitting, children: submitting ? _jsx(CircularProgress, { size: 24 }) : 'حذف' })] })] })] }));
}
