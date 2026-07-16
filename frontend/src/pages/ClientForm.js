import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Grid, MenuItem, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, } from '@mui/material';
import api from '../services/api';
export default function ClientForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState('');
    const [successDialog, setSuccessDialog] = useState(false);
    const [newClient, setNewClient] = useState(null);
    const [formData, setFormData] = useState({
        nationalId: '',
        fullName: '',
        phone: '',
        address: '',
        planId: 0,
        paymentMethod: 'Cash',
    });
    useEffect(() => {
        fetchPlans();
    }, []);
    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');

            console.log('Plans Response:', response.data);

            if (Array.isArray(response.data)) {
                setPlans(response.data);
            }
            else if (response.data?.success && Array.isArray(response.data.data)) {
                setPlans(response.data.data);
            }
            else {
                setPlans([]);
                console.error('Unexpected plans format:', response.data);
            }
        }
        catch (error) {
            console.error('Error fetching plans:', error);
            setPlans([]);
        }
    };
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/clients', formData);
            if (response.data.success) {
                setNewClient(response.data.data.client);
                setSuccessDialog(true);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCloseDialog = () => {
        setSuccessDialog(false);
        navigate('/clients');
    };
    return (_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064A\u0644 \u062C\u062F\u064A\u062F" }), _jsxs(Paper, { sx: { p: 3 }, children: [error && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0648\u0637\u0646\u064A", name: "nationalId", value: formData.nationalId, onChange: handleChange, required: true, helperText: "\u0633\u064A\u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0648\u0637\u0646\u064A \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644", name: "fullName", value: formData.fullName, onChange: handleChange, required: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", name: "phone", value: formData.phone, onChange: handleChange, required: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, select: true, label: "\u0627\u0644\u0628\u0627\u0642\u0629", name: "planId", value: formData.planId, onChange: handleChange, required: true, children: plans.map((plan) => (_jsxs(MenuItem, { value: plan.id, children: [plan.name, " - ", plan.price.toLocaleString(), " \u0644.\u0633"] }, plan.id))) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(TextField, { fullWidth: true, select: true, label: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639", name: "paymentMethod", value: formData.paymentMethod, onChange: handleChange, children: [_jsx(MenuItem, { value: "Cash", children: "\u0643\u0627\u0634" }), _jsx(MenuItem, { value: "Bank", children: "\u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0643\u064A" }), _jsx(MenuItem, { value: "Card", children: "\u0628\u0637\u0627\u0642\u0629 \u0627\u0626\u062A\u0645\u0627\u0646" })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646", name: "address", value: formData.address, onChange: handleChange, multiline: true, rows: 2 }) })] }), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 2, mt: 4, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/clients'), children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx(Button, { type: "submit", variant: "contained", disabled: loading, children: loading ? _jsx(CircularProgress, { size: 24 }) : 'إضافة عميل' })] })] })] }), _jsxs(Dialog, { open: successDialog, onClose: handleCloseDialog, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "\u2705 \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u0646\u062C\u0627\u062D" }), _jsxs(DialogContent, { children: [_jsx(Typography, { variant: "body2", gutterBottom: true, children: "\u064A\u0631\u062C\u0649 \u062D\u0641\u0638 \u0647\u0630\u0647 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0623\u0646\u0647\u0627 \u0644\u0646 \u062A\u0638\u0647\u0631 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649:" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2, mt: 2, bgcolor: '#f5f5f5' }, children: [_jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:" }), " ", newClient?.username] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631:" }), " ", _jsx("span", { style: { color: 'red', fontSize: '20px' }, children: newClient?.password })] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A:" }), " ", newClient?.email] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644:" }), " ", newClient?.fullName] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641:" }), " ", newClient?.phone] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0648\u0637\u0646\u064A:" }), " ", newClient?.nationalId] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0639\u0646\u0648\u0627\u0646 MAC:" }), " ", newClient?.macAddress] }), _jsxs(Typography, { children: [_jsx("strong", { children: "\u0639\u0646\u0648\u0627\u0646 IP:" }), " ", newClient?.ipAddress] })] })] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: handleCloseDialog, variant: "contained", children: "\u062D\u0633\u0646\u0627\u064B" }) })] })] }));
}
