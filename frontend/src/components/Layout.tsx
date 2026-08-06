import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalMall as LocalMallIcon,
  Description as DescriptionIcon,
  Help as HelpIcon,
  AccountCircle as AccountCircleIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { notificationService, Notification } from '../services/notificationService';
import { signalRService } from '../services/signalRService';

const drawerWidth = 280;

const menuItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: <DashboardIcon /> },
  { path: '/clients', label: 'العملاء', icon: <PeopleIcon /> },
  { path: '/users', label: 'المستخدمين', icon: <PeopleIcon />, roles: ['Admin'] },
  { path: '/financial', label: 'المالية', icon: <MoneyIcon /> },
  { path: '/plans', label: 'الباقات', icon: <ReceiptIcon /> },
  { path: '/inventory', label: 'المخزون', icon: <InventoryIcon /> },
  { path: '/purchases', label: 'المشتريات', icon: <ShoppingCartIcon /> },
  { path: '/sales', label: 'المبيعات', icon: <LocalMallIcon /> },
  { path: '/invoices', label: 'الفواتير', icon: <DescriptionIcon /> },
  { path: '/tickets', label: 'تذاكر الدعم', icon: <HelpIcon /> },
  { path: '/client-portal', label: 'بوابة العميل', icon: <AccountCircleIcon /> },
  { path: '/reports', label: 'التقارير', icon: <TrendingUpIcon /> },
  { path: '/settings', label: 'الإعدادات', icon: <SettingsIcon /> },
  { path: '/mikrotik-devices', label: 'أجهزة MikroTik', icon: <SettingsIcon /> },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();

  // ربط خدمة الإشعارات + SignalR
  useEffect(() => {
    // الاشتراك في تحديثات الإشعارات
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    });

    // جلب الإشعارات فوراً
    notificationService.fetchNotifications();

    // تشغيل SignalR إذا كان هناك توكن
    const token = localStorage.getItem('token');
    if (token) {
      signalRService.startConnection(token).catch(console.error);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  const handleLogout = () => {
    signalRService.stopConnection();
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleNotificationClick = (id: string | number) => {
    notificationService.markAsRead(id);
  };

  // تصفية القائمة حسب الصلاحية
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'success':
        return 'success.main';
      default:
        return 'info.main';
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: theme.palette.background.paper }}>
      <Toolbar sx={{ justifyContent: 'center', py: 3 }}>
        <Typography
          variant="h5"
          fontWeight="800"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          شركة شام STC
        </Typography>
      </Toolbar>
      <List sx={{ px: 2 }}>
        {visibleMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 3,
                py: 1.2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            نظام إدارة ISP
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={toggleTheme} color="inherit">
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton onClick={handleNotifOpen} color="inherit">
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: 14,
                }}
              >
                {(user?.fullName || user?.username || 'U').charAt(0)}
              </Avatar>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* قائمة المستخدم */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{ sx: { mt: 1, minWidth: 220, borderRadius: 3 } }}
      >
        <MenuItem>
          <Box>
            <Typography fontWeight="bold">{user?.fullName || user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            navigate('/settings');
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          الإعدادات
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          تسجيل الخروج
        </MenuItem>
      </Menu>

      {/* قائمة الإشعارات */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={handleNotifClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 420,
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          px={2}
          py={1.5}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom={1}
          borderColor="divider"
        >
          <Typography variant="h6" fontWeight={600}>
            الإشعارات
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={handleMarkAllRead}
            >
              تعليم الكل كمقروء
            </Typography>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              لا توجد إشعارات حالياً
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleNotificationClick(n.id)}
              sx={{
                alignItems: 'flex-start',
                py: 1.5,
                bgcolor: n.read ? 'transparent' : alpha(theme.palette.primary.main, 0.06),
                borderRight: n.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={n.read ? 400 : 700}
                  color={getTypeColor(n.type)}
                >
                  {n.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                  {n.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* القائمة الجانبية */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: 'none',
              bgcolor: 'transparent',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* المحتوى الرئيسي */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
