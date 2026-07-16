import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import { globalStyles } from './theme/globalStyles';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { ThemeContext } from './context/ThemeContext';
// Lazy loading �������
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientForm = lazy(() => import('./pages/ClientForm'));
const Users = lazy(() => import('./pages/Users'));
const Financial = lazy(() => import('./pages/Financial'));
const Plans = lazy(() => import('./pages/Plans'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Sales = lazy(() => import('./pages/Sales'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Tickets = lazy(() => import('./pages/Tickets'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const LoadingFallback = () => (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-16 h-16 border-4 border-indigo-200 rounded-full animate-pulse" }), _jsx("div", { className: "absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" })] }) }));
function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });
    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);
    const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);
    return (_jsx(ThemeContext.Provider, { value: { isDarkMode, toggleTheme }, children: _jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(GlobalStyles, { styles: globalStyles(theme) }), _jsx(AuthProvider, { children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "clients", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Clients, {}) }) }), _jsx(Route, { path: "clients/new", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(ClientForm, {}) }) }), _jsx(Route, { path: "clients/edit/:id", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(ClientForm, {}) }) }), _jsx(Route, { path: "users", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Users, {}) }) }), _jsx(Route, { path: "financial", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Financial, {}) }) }), _jsx(Route, { path: "plans", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Plans, {}) }) }), _jsx(Route, { path: "inventory", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Inventory, {}) }) }), _jsx(Route, { path: "purchases", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Purchases, {}) }) }), _jsx(Route, { path: "sales", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Sales, {}) }) }), _jsx(Route, { path: "invoices", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Invoices, {}) }) }), _jsx(Route, { path: "tickets", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Tickets, {}) }) }), _jsx(Route, { path: "client-portal", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(ClientPortal, {}) }) }), _jsx(Route, { path: "reports", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Reports, {}) }) }), _jsx(Route, { path: "settings", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Settings, {}) }) })] })] }) }) })] }) }));
}
export default App;
