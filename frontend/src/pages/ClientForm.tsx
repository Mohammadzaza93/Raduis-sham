import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import api from '../services/api';

interface Plan {
  id: number;
  name: string;
  speed: string;
  price: number;
}

interface ClientFormData {
  nationalId: string;
  fullName: string;
  phone: string;
  address: string;
  planId: number;
  paymentMethod: string;
}

export default function ClientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [successDialog, setSuccessDialog] = useState(false);
  const [newClient, setNewClient] = useState<any>(null);
  
  const [formData, setFormData] = useState<ClientFormData>({
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
      if (response.data) {
        setPlans(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, planId: response.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/clients', formData);
      if (response.data.success) {
        setNewClient(response.data.data.client);
        setSuccessDialog(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSuccessDialog(false);
    navigate('/clients');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        إضافة عميل جديد
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الرقم الوطني"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                required
                helperText="سيتم استخدام الرقم الوطني لإنشاء البريد الإلكتروني وكلمة المرور"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم الكامل"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الهاتف"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="الباقة"
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                required
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} - {plan.price.toLocaleString()} ل.س
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="طريقة الدفع"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <MenuItem value="Cash">كاش</MenuItem>
                <MenuItem value="Bank">تحويل بنكي</MenuItem>
                <MenuItem value="Card">بطاقة ائتمان</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button variant="outlined" onClick={() => navigate('/clients')}>
              إلغاء
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'إضافة عميل'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* نافذة عرض بيانات العميل الجديد */}
      <Dialog open={successDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>✅ تم إنشاء العميل بنجاح</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            يرجى حفظ هذه البيانات لأنها لن تظهر مرة أخرى:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
            <Typography><strong>اسم المستخدم:</strong> {newClient?.username}</Typography>
            <Typography><strong>كلمة المرور:</strong> <span style={{ color: 'red', fontSize: '20px' }}>{newClient?.password}</span></Typography>
            <Typography><strong>البريد الإلكتروني:</strong> {newClient?.email}</Typography>
            <Typography><strong>الاسم الكامل:</strong> {newClient?.fullName}</Typography>
            <Typography><strong>رقم الهاتف:</strong> {newClient?.phone}</Typography>
            <Typography><strong>الرقم الوطني:</strong> {newClient?.nationalId}</Typography>
            <Typography><strong>عنوان MAC:</strong> {newClient?.macAddress}</Typography>
            <Typography><strong>عنوان IP:</strong> {newClient?.ipAddress}</Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            حسناً
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}