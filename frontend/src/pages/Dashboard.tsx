import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  useTheme,
    alpha,
    Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Wifi as WifiIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

interface DashboardData {
  clients: {
    total: number;
    active: number;
    online: number;
    expiringToday: number;
    expiringSoon: number;
    expired: number;
  };
  plans: Array<{ name: string; count: number }>;
  financial: {
    todayRevenue: number;
    monthRevenue: number;
    monthExpenses: number;
    monthProfit: number;
    overdueInvoices: number;
    overdueAmount: number;
  };
  recent: {
    expiredClientsList: any[];
    expiringSoonList: any[];
  };
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboard();
    fetchMonthlyData();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard');
      console.log('Dashboard response:', response.data);
      
      if (response.data && response.data.success !== false) {
        setData(response.data.data || response.data);
      } else if (response.data && response.data.data) {
        setData(response.data.data);
      } else {
        // بيانات تجريبية إذا لم تكن هناك بيانات حقيقية
        setData({
          clients: { total: 11, active: 1, online: 0, expiringToday: 0, expiringSoon: 0, expired: 0 },
          plans: [{ name: '4Mb/s', count: 4 }, { name: '2Mb/s', count: 2 }],
          financial: { todayRevenue: 0, monthRevenue: 75000, monthExpenses: 0, monthProfit: 75000, overdueInvoices: 0, overdueAmount: 0 },
          recent: { expiredClientsList: [], expiringSoonList: [] },
        });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      // بيانات تجريبية
      setData({
        clients: { total: 11, active: 1, online: 0, expiringToday: 0, expiringSoon: 0, expired: 0 },
        plans: [{ name: '4Mb/s', count: 4 }, { name: '2Mb/s', count: 2 }],
        financial: { todayRevenue: 0, monthRevenue: 75000, monthExpenses: 0, monthProfit: 75000, overdueInvoices: 0, overdueAmount: 0 },
        recent: { expiredClientsList: [], expiringSoonList: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await api.get('/financial/dashboard');
      if (response.data && response.data.success && response.data.data?.monthlyRevenue) {
        setMonthlyData(response.data.data.monthlyRevenue);
      } else {
        setMonthlyData([
          { month: 'يناير', revenue: 45000, expenses: 32000, profit: 13000 },
          { month: 'فبراير', revenue: 52000, expenses: 35000, profit: 17000 },
          { month: 'مارس', revenue: 58000, expenses: 33000, profit: 25000 },
          { month: 'أبريل', revenue: 75000, expenses: 38000, profit: 37000 },
        ]);
      }
    } catch (err) {
      setMonthlyData([
        { month: 'يناير', revenue: 45000, expenses: 32000, profit: 13000 },
        { month: 'فبراير', revenue: 52000, expenses: 35000, profit: 17000 },
        { month: 'مارس', revenue: 58000, expenses: 33000, profit: 25000 },
        { month: 'أبريل', revenue: 75000, expenses: 38000, profit: 37000 },
      ]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'إجمالي العملاء',
      value: data?.clients.total || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#6366f1',
      bgColor: alpha('#6366f1', 0.1),
    },
    {
      title: 'عملاء نشطين',
      value: data?.clients.active || 0,
      icon: <WifiIcon sx={{ fontSize: 40 }} />,
      color: '#10b981',
      bgColor: alpha('#10b981', 0.1),
    },
    {
      title: 'إيرادات الشهر',
      value: `${(data?.financial.monthRevenue || 0).toLocaleString()} ل.س`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      bgColor: alpha('#f59e0b', 0.1),
    },
    {
      title: 'فواتير متأخرة',
      value: data?.financial.overdueInvoices || 0,
      icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
      color: '#ef4444',
      bgColor: alpha('#ef4444', 0.1),
    },
  ];

  const planDistribution = data?.plans?.map(plan => ({
    name: plan.name,
    value: plan.count,
  })) || [];

  return (
    <Box className="animate-fade-in">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        لوحة التحكم
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              borderRadius: 4,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: card.bgColor, 
                    borderRadius: '50%', 
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* الرسوم البيانية */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                الإيرادات والمصروفات الشهرية
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6366f1" name="الإيرادات" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="profit" fill="#10b981" name="الأرباح" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                توزيع الباقات
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* الملخص المالي */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                الملخص المالي
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">إيرادات الشهر:</Typography>
                <Typography fontWeight="bold" color="success.main">
                  {(data?.financial.monthRevenue || 0).toLocaleString()} ل.س
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">مصروفات الشهر:</Typography>
                <Typography fontWeight="bold" color="error.main">
                  {(data?.financial.monthExpenses || 0).toLocaleString()} ل.س
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">أرباح الشهر:</Typography>
                <Typography fontWeight="bold" color="success.main">
                  {(data?.financial.monthProfit || 0).toLocaleString()} ل.س
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">فواتير متأخرة:</Typography>
                <Chip label={`${data?.financial.overdueInvoices || 0} فاتورة`} color="error" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                إحصائيات العملاء
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">إجمالي العملاء:</Typography>
                <Typography fontWeight="bold">{data?.clients.total || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">عملاء نشطين:</Typography>
                <Typography fontWeight="bold" color="success.main">{data?.clients.active || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="textSecondary">عملاء متصلين:</Typography>
                <Typography fontWeight="bold" color="info.main">{data?.clients.online || 0}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">اشتراكات منتهية:</Typography>
                <Chip label={data?.clients.expired || 0} color="warning" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}