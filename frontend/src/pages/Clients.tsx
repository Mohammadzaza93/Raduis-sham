// frontend/src/pages/Clients.tsx
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
    TablePagination,
    TextField,
    Button,
    Chip,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
    PlayArrow as ActivateIcon,
    Pause as SuspendIcon,
    DeleteForever as DeleteForeverIcon,
    Save as SaveIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Plan {
    id: number;
    name: string;
    speed: string;
    price: number;
    durationDays: number;
}

interface Subscription {
    id: number;
    planId?: number;
    planName: string;
    endDate: string;
    isActive: boolean;
    daysRemaining?: number;
}

interface Client {
    id: number;
    username: string;
    fullName: string;
    phone: string;
    email: string;
    status: string;
    nationalId: string;
    macAddress: string;
    ipAddress: string;
    address?: string;
    activeSubscription?: Subscription;
}

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Dialogs
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
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
                params: { page: page + 1, pageSize: rowsPerPage, search },
            });
            if (response.data.success) {
                setClients(response.data.data.data);
                setTotal(response.data.data.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');
            if (response.data?.success && Array.isArray(response.data.data)) {
                setPlans(response.data.data);
            }
        } catch {
            setPlans([]);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: Client) => {
        setAnchorEl(event.currentTarget);
        setSelectedClient(client);
    };

    const handleMenuClose = () => setAnchorEl(null);

    // ========== Edit ==========
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

    const handleSaveEdit = async () => {
        if (!selectedClient) return;
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/clients/${selectedClient.id}`, editFormData);
            setSuccess('تم تحديث بيانات العميل بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setEditDialogOpen(false);
            fetchClients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== Suspend ==========
    const handleSuspendClick = () => {
        setSuspendDialogOpen(true);
        handleMenuClose();
    };

    const handleSuspendConfirm = async () => {
        if (!selectedClient) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/clients/${selectedClient.id}/suspend`);
            setSuccess('تم إيقاف العميل وتعطيله في RADIUS بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setSuspendDialogOpen(false);
            fetchClients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل إيقاف العميل');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== Activate ==========
    const handleActivateClick = () => {
        setActivateDialogOpen(true);
        handleMenuClose();
    };

    const handleActivateConfirm = async () => {
        if (!selectedClient) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/clients/${selectedClient.id}/activate`);
            setSuccess('تم تفعيل العميل في النظام وRADIUS بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setActivateDialogOpen(false);
            fetchClients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل تفعيل العميل');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== Delete (soft) ==========
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedClient) return;
        setSubmitting(true);
        try {
            await api.delete(`/clients/${selectedClient.id}`);
            setSuccess('تم حذف العميل بنجاح');
            setTimeout(() => setSuccess(''), 3000);
            setDeleteDialogOpen(false);
            fetchClients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل الحذف');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== Permanent Delete ==========
    const handlePermanentDeleteClick = () => {
        setPermanentDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handlePermanentDeleteConfirm = async () => {
        if (!selectedClient) return;
        setSubmitting(true);
        try {
            await api.delete(`/clients/${selectedClient.id}/permanent`);
            setSuccess('تم حذف العميل نهائياً من النظام وRADIUS');
            setTimeout(() => setSuccess(''), 3000);
            setPermanentDeleteDialogOpen(false);
            fetchClients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل الحذف النهائي');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG');
    };

    const getDaysRemaining = (endDate?: string) => {
        if (!endDate) return null;
        const diff = new Date(endDate).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'Active':
                return <Chip label="نشط" color="success" size="small" />;
            case 'Suspended':
                return <Chip label="موقوف" color="warning" size="small" />;
            case 'Expired':
                return <Chip label="منتهي" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">العملاء</Typography>
                <Box>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchClients} sx={{ mr: 1 }}>
                        تحديث
          </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/clients/new')}>
                        عميل جديد
          </Button>
                </Box>
            </Box>

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="بحث باسم المستخدم، الاسم، الهاتف، أو الرقم الوطني..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>اسم المستخدم</TableCell>
                            <TableCell>الاسم الكامل</TableCell>
                            <TableCell>الهاتف</TableCell>
                            <TableCell>الباقة</TableCell>
                            <TableCell>تاريخ الانتهاء</TableCell>
                            <TableCell>الحالة</TableCell>
                            <TableCell align="center">الإجراءات</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    لا يوجد عملاء
                </TableCell>
                            </TableRow>
                        ) : (
                                    clients.map((client, idx) => {
                                        const days = getDaysRemaining(client.activeSubscription?.endDate);
                                        return (
                                            <TableRow key={client.id} hover>
                                                <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                                                <TableCell>{client.username}</TableCell>
                                                <TableCell>{client.fullName}</TableCell>
                                                <TableCell>{client.phone}</TableCell>
                                                <TableCell>
                                                    {client.activeSubscription?.planName || (
                                                        <Chip label="لا يوجد" size="small" color="warning" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {client.activeSubscription?.endDate ? (
                                                        <Box>
                                                            {formatDate(client.activeSubscription.endDate)}
                                                            {days !== null && days > 0 && (
                                                                <Chip
                                                                    label={`${days} يوم`}
                                                                    size="small"
                                                                    color={days <= 3 ? 'warning' : 'info'}
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            )}
                                                            {days !== null && days <= 0 && (
                                                                <Chip label="منتهي" size="small" color="error" sx={{ ml: 1 }} />
                                                            )}
                                                        </Box>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>{getStatusChip(client.status)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, client)}>
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                    </TableBody>
                </Table>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="عدد الصفوف:"
                />
            </TableContainer>

            {/* ========== Menu ========== */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>تعديل البيانات</ListItemText>
                </MenuItem>

                {selectedClient?.status !== 'Active' && (
                    <MenuItem onClick={handleActivateClick}>
                        <ListItemIcon><ActivateIcon fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText>تفعيل العميل</ListItemText>
                    </MenuItem>
                )}

                {selectedClient?.status === 'Active' && (
                    <MenuItem onClick={handleSuspendClick}>
                        <ListItemIcon><SuspendIcon fontSize="small" color="warning" /></ListItemIcon>
                        <ListItemText>إيقاف العميل</ListItemText>
                    </MenuItem>
                )}

                <Divider />

                <MenuItem onClick={handleDeleteClick}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>حذف</ListItemText>
                </MenuItem>

                <MenuItem onClick={handlePermanentDeleteClick}>
                    <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>حذف نهائي (من RADIUS أيضاً)</ListItemText>
                </MenuItem>
            </Menu>

            {/* ========== Edit Dialog ========== */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>تعديل بيانات العميل</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="الاسم الكامل" margin="normal"
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} />
                    <TextField fullWidth label="الهاتف" margin="normal"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
                    <TextField fullWidth label="البريد" margin="normal"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                    <TextField fullWidth label="العنوان" margin="normal"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} startIcon={<CloseIcon />}>إلغاء</Button>
                    <Button onClick={handleSaveEdit} variant="contained" disabled={submitting} startIcon={<SaveIcon />}>
                        {submitting ? <CircularProgress size={20} /> : 'حفظ'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== Suspend Dialog ========== */}
            <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)}>
                <DialogTitle>تأكيد إيقاف العميل</DialogTitle>
                <DialogContent>
                    هل تريد إيقاف العميل <strong>{selectedClient?.fullName}</strong>؟
          <br />
          سيتم تعطيله في RADIUS ولن يتمكن من الاتصال.
        </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSuspendDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleSuspendConfirm} color="warning" variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'إيقاف'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== Activate Dialog ========== */}
            <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)}>
                <DialogTitle>تأكيد تفعيل العميل</DialogTitle>
                <DialogContent>
                    هل تريد تفعيل العميل <strong>{selectedClient?.fullName}</strong>؟
          <br />
          يجب أن يكون لديه اشتراك نشط.
        </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActivateDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleActivateConfirm} color="success" variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'تفعيل'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== Delete Dialog ========== */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>تأكيد الحذف</DialogTitle>
                <DialogContent>
                    هل تريد حذف العميل <strong>{selectedClient?.fullName}</strong>؟
        </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'حذف'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== Permanent Delete Dialog ========== */}
            <Dialog open={permanentDeleteDialogOpen} onClose={() => setPermanentDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main' }}>حذف نهائي</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        هذا الإجراء لا يمكن التراجع عنه!
          </Alert>
          سيتم حذف العميل <strong>{selectedClient?.fullName}</strong> نهائياً من:
          <ul>
                        <li>قاعدة بيانات النظام</li>
                        <li>خادم RADIUS</li>
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPermanentDeleteDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handlePermanentDeleteConfirm} color="error" variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'حذف نهائي'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}