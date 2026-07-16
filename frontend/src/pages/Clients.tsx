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
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as ActivateIcon,
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
  planId: number;
  planName: string;
  endDate: string;
  isActive: boolean;
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
  address: string;
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
  
  // حالة نوافذ الحوار
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // حالة النماذج
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
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');

            console.log('Plans Response:', response.data);

            if (
                response.data &&
                response.data.success &&
                Array.isArray(response.data.data)
            ) {
                setPlans(response.data.data);
            } else {
                setPlans([]);
            }
        } catch (error) {
            console.error(error);
            setPlans([]);
        }
    };

  // فتح القائمة المنسدلة
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: Client) => {
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
            // التأكد من أن plans مصفوفة وغير فارغة قبل الوصول لأول عنصر
            const initialPlanId = selectedClient.activeSubscription?.planId
                || (Array.isArray(plans) && plans.length > 0 ? plans[0].id : 0);

            setSelectedPlanId(initialPlanId);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    } finally {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التفعيل');
    } finally {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setSubmitting(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
  };

  // حساب الأيام المتبقية
  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">العملاء</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchClients}
            sx={{ mr: 1 }}
          >
            تحديث
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clients/new')}
          >
            عميل جديد
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="بحث باسم المستخدم، الاسم الكامل، رقم الهاتف، أو الرقم الوطني..."
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
              <TableCell>رقم الهاتف</TableCell>
              <TableCell>الباقة الحالية</TableCell>
              <TableCell>تاريخ الانتهاء</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell align="center">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client, idx) => {
              const daysRemaining = getDaysRemaining(client.activeSubscription?.endDate || '');
              const isExpired = daysRemaining !== null && daysRemaining <= 0;
              const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
              
              return (
                <TableRow key={client.id} hover>
                  <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                  <TableCell>{client.username}</TableCell>
                  <TableCell>{client.fullName}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    {client.activeSubscription?.planName || (
                      <Chip label="لا يوجد اشتراك" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    {client.activeSubscription?.endDate ? (
                      <Box>
                        {formatDate(client.activeSubscription.endDate)}
                        {daysRemaining !== null && daysRemaining > 0 && (
                          <Chip
                            label={`${daysRemaining} يوم متبقي`}
                            size="small"
                            color={daysRemaining <= 3 ? 'warning' : 'info'}
                            sx={{ ml: 1 }}
                          />
                        )}
                        {isExpired && (
                          <Chip label="منتهي" size="small" color="error" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.status === 'Active' ? 'نشط' : 'غير نشط'}
                      color={client.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                    {!client.activeSubscription?.isActive && client.status === 'Active' && (
                      <Chip label="بدون اشتراك" size="small" color="warning" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, client)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
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
        />
      </TableContainer>

      {/* القائمة المنسدلة (3 نقاط) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>تعديل البيانات</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActivateClick}>
          <ListItemIcon>
            <ActivateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>تفعيل الاشتراك / تجديد</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>حذف المشترك</ListItemText>
        </MenuItem>
      </Menu>

      {/* نافذة تعديل البيانات */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          تعديل بيانات العميل
          <IconButton
            aria-label="close"
            onClick={() => setEditDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الاسم الكامل"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="رقم الهاتف"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                multiline
                rows={2}
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تفعيل الاشتراك */}
      <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          تفعيل اشتراك / تجديد
          <IconButton
            aria-label="close"
            onClick={() => setActivateDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Paper variant="outlined" sx={{ p: 2, mb: 3, mt: 2, bgcolor: '#f9f9f9' }}>
            <Typography variant="subtitle2" color="textSecondary">بيانات العميل</Typography>
            <Typography><strong>الاسم:</strong> {selectedClient?.fullName}</Typography>
            <Typography><strong>اسم المستخدم:</strong> {selectedClient?.username}</Typography>
            <Typography><strong>رقم الهاتف:</strong> {selectedClient?.phone}</Typography>
            {selectedClient?.activeSubscription?.planName && (
              <Typography>
                <strong>الباقة الحالية:</strong> {selectedClient.activeSubscription.planName}
                <br />
                <strong>تنتهي في:</strong> {formatDate(selectedClient.activeSubscription.endDate)}
              </Typography>
            )}
          </Paper>

                  <FormControl fullWidth>
                      <InputLabel id="plan-select-label">اختر الباقة</InputLabel>

                      <Select
                          labelId="plan-select-label"
                          id="plan-select"
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                          label="اختر الباقة"
                      >
                          {Array.isArray(plans) &&
                              plans.map((plan) => (
                                  <MenuItem key={plan.id} value={plan.id}>
                                      {plan.name} - {plan.speed} - {(plan.price || 0).toLocaleString()} ل.س
                                  </MenuItem>
                              ))}
                      </Select>
                  </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleActivateSubscription} variant="contained" color="success" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'تفعيل الاشتراك'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف العميل <strong>{selectedClient?.fullName}</strong>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteClient} color="error" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}