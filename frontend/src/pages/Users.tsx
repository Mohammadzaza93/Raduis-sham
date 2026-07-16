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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

const rolePermissions = {
  Admin: ['all'],
  Accountant: ['financial', 'reports', 'invoices'],
  Employee: ['clients', 'subscriptions'],
  Support: ['clients', 'tickets'],
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    email: '',
    role: 'Employee',
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: { page: page + 1, pageSize: rowsPerPage, search },
      });
      if (response.data.success) {
        setUsers(response.data.data.data);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        fullName: user.fullName,
        phone: user.phone,
        email: user.email || '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'Employee',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
        });
        setSuccess('تم تحديث المستخدم بنجاح');
      } else {
        await api.post('/users', formData);
        setSuccess('تم إضافة المستخدم بنجاح');
      }
      setTimeout(() => setSuccess(''), 3000);
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await api.delete(`/users/${id}`);
        setSuccess('تم حذف المستخدم بنجاح');
        fetchUsers();
      } catch (error) {
        setError('حدث خطأ أثناء الحذف');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'error';
      case 'Accountant': return 'warning';
      case 'Employee': return 'info';
      case 'Support': return 'success';
      default: return 'default';
    }
  };

  const getRoleName = (role: string) => {
    switch(role) {
      case 'Admin': return 'مدير';
      case 'Accountant': return 'محاسب';
      case 'Employee': return 'موظف';
      case 'Support': return 'دعم فني';
      default: return role;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">المستخدمين والصلاحيات</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          مستخدم جديد
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="بحث باسم المستخدم، الاسم الكامل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>اسم المستخدم</TableCell>
              <TableCell>الاسم الكامل</TableCell>
              <TableCell>رقم الهاتف</TableCell>
              <TableCell>الصلاحية</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>آخر تسجيل دخول</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={user.id} hover>
                <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Chip label={getRoleName(user.role)} color={getRoleColor(user.role) as any} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={user.status === 'Active' ? 'نشط' : 'غير نشط'} color={user.status === 'Active' ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(user)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="اسم المستخدم" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={!!editingUser} required />
            </Grid>
            {!editingUser && (
              <Grid item xs={12}>
                <TextField fullWidth label="كلمة المرور" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="الاسم الكامل" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="البريد الإلكتروني" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>الصلاحية</InputLabel>
                <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} label="الصلاحية">
                  <MenuItem value="Admin">مدير (كل الصلاحيات)</MenuItem>
                  <MenuItem value="Accountant">محاسب (مالية، تقارير، فواتير)</MenuItem>
                  <MenuItem value="Employee">موظف (عملاء، اشتراكات)</MenuItem>
                  <MenuItem value="Support">دعم فني (عملاء، تذاكر)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : (editingUser ? 'تحديث' : 'إضافة')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}