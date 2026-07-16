import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Avatar, Menu, MenuItem, Badge, Tooltip, Divider, useTheme, alpha, Stack, } from '@mui/material';
import { Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon, AttachMoney as MoneyIcon, Receipt as ReceiptIcon, TrendingUp as TrendingUpIcon, Logout as LogoutIcon, Notifications as NotificationsIcon, Settings as SettingsIcon, Inventory as InventoryIcon, ShoppingCart as ShoppingCartIcon, LocalMall as LocalMallIcon, Description as DescriptionIcon, Help as HelpIcon, AccountCircle as AccountCircleIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';
const drawerWidth = 280;
const menuItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: _jsx(DashboardIcon, {}) },
    { path: '/clients', label: 'العملاء', icon: _jsx(PeopleIcon, {}) },
    { path: '/users', label: 'المستخدمين', icon: _jsx(PeopleIcon, {}) },
    { path: '/financial', label: 'المالية', icon: _jsx(MoneyIcon, {}) },
    { path: '/plans', label: 'الباقات', icon: _jsx(ReceiptIcon, {}) },
    { path: '/inventory', label: 'المخزون', icon: _jsx(InventoryIcon, {}) },
    { path: '/purchases', label: 'المشتريات', icon: _jsx(ShoppingCartIcon, {}) },
    { path: '/sales', label: 'المبيعات', icon: _jsx(LocalMallIcon, {}) },
    { path: '/invoices', label: 'الفواتير', icon: _jsx(DescriptionIcon, {}) },
    { path: '/tickets', label: 'تذاكر الدعم', icon: _jsx(HelpIcon, {}) },
    { path: '/client-portal', label: 'بوابة العميل', icon: _jsx(AccountCircleIcon, {}) },
    { path: '/reports', label: 'التقارير', icon: _jsx(TrendingUpIcon, {}) },
    { path: '/settings', label: 'الإعدادات', icon: _jsx(SettingsIcon, {}) },
];
export default function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchor, setNotifAnchor] = useState(null);
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useAppTheme();
    const theme = useTheme();
    const navigate = useNavigate();
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleNotifOpen = (e) => setNotifAnchor(e.currentTarget);
    const handleNotifClose = () => setNotifAnchor(null);
    const handleLogout = () => { logout(); navigate('/login'); };
    const drawer = (_jsxs(Box, { sx: { height: '100%', bgcolor: theme.palette.background.paper }, children: [_jsx(Toolbar, { sx: { justifyContent: 'center', py: 3 }, children: _jsx(Typography, { variant: "h5", fontWeight: "800", sx: {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }, children: "\u0634\u0631\u0643\u0629 \u0634\u0627\u0645 STC" }) }), _jsx(List, { sx: { px: 2 }, children: menuItems.map((item) => (_jsx(ListItem, { disablePadding: true, sx: { mb: 0.5 }, children: _jsxs(ListItemButton, { onClick: () => navigate(item.path), sx: {
                            borderRadius: 3,
                            py: 1,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                        }, children: [_jsx(ListItemIcon, { sx: { color: 'inherit', minWidth: 40 }, children: item.icon }), _jsx(ListItemText, { primary: item.label, primaryTypographyProps: { fontSize: '0.9rem', fontWeight: 500 } })] }) }, item.path))) })] }));
    return (_jsxs(Box, { sx: { display: 'flex', minHeight: '100vh' }, children: [_jsx(AppBar, { position: "fixed", elevation: 0, sx: {
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(12px)',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { edge: "start", onClick: handleDrawerToggle, sx: { mr: 2, display: { sm: 'none' } }, children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h3", sx: {
                                flexGrow: 1,
                                fontWeight: 800,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                cursor: 'pointer',
                            }, onClick: () => navigate('/dashboard'), children: "\u0634\u0631\u0643\u0629 \u0634\u0627\u0645 S T C" }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: isDarkMode ? 'الوضع الفاتح' : 'الوضع المظلم', children: _jsx(IconButton, { onClick: toggleTheme, children: isDarkMode ? _jsx(LightModeIcon, {}) : _jsx(DarkModeIcon, {}) }) }), _jsx(Tooltip, { title: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", children: _jsx(IconButton, { onClick: handleNotifOpen, children: _jsx(Badge, { badgeContent: 3, color: "error", children: _jsx(NotificationsIcon, {}) }) }) }), _jsx(Tooltip, { title: "\u0627\u0644\u062D\u0633\u0627\u0628", children: _jsx(IconButton, { onClick: handleMenuOpen, children: _jsx(Avatar, { sx: { bgcolor: theme.palette.primary.main, width: 35, height: 35 }, children: user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U' }) }) })] })] }) }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, transformOrigin: { horizontal: 'left', vertical: 'top' }, anchorOrigin: { horizontal: 'left', vertical: 'bottom' }, PaperProps: { sx: { mt: 1, minWidth: 200, borderRadius: 3 } }, children: [_jsx(MenuItem, { children: _jsxs(Box, { children: [_jsx(Typography, { fontWeight: "bold", children: user?.fullName }), _jsx(Typography, { variant: "caption", color: "textSecondary", children: user?.role })] }) }), _jsx(Divider, {}), _jsxs(MenuItem, { onClick: () => { navigate('/settings'); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(SettingsIcon, { fontSize: "small" }) }), "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A"] }), _jsxs(MenuItem, { onClick: handleLogout, sx: { color: 'error.main' }, children: [_jsx(ListItemIcon, { children: _jsx(LogoutIcon, { fontSize: "small", sx: { color: 'error.main' } }) }), "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C"] })] }), _jsxs(Menu, { anchorEl: notifAnchor, open: Boolean(notifAnchor), onClose: handleNotifClose, PaperProps: { sx: { width: 320, maxHeight: 400, borderRadius: 3 } }, children: [_jsx(Box, { p: 2, borderBottom: "1px solid", borderColor: "divider", children: _jsx(Typography, { variant: "h6", children: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" }) }), _jsx(MenuItem, { onClick: handleNotifClose, children: _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: "bold", children: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643" }), _jsx(Typography, { variant: "caption", color: "textSecondary", children: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D" })] }) }), _jsx(Divider, {}), _jsx(Box, { p: 2, textAlign: "center", children: _jsx(Typography, { variant: "caption", color: "textSecondary", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062C\u062F\u064A\u062F\u0629" }) })] }), _jsxs(Box, { component: "nav", sx: { width: { sm: drawerWidth }, flexShrink: { sm: 0 } }, children: [_jsx(Drawer, { variant: "temporary", open: mobileOpen, onClose: handleDrawerToggle, ModalProps: { keepMounted: true }, sx: { display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }, children: drawer }), _jsx(Drawer, { variant: "permanent", sx: { display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none', bgcolor: 'transparent' } }, open: true, children: drawer })] }), _jsxs(Box, { component: "main", sx: {
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: theme.palette.background.default,
                    minHeight: '100vh',
                }, children: [_jsx(Toolbar, {}), _jsx(Outlet, {})] })] }));
}
