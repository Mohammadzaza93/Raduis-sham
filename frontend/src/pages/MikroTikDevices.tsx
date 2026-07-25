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
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    NetworkCheck as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface MikroTikDevice {
    id: number;
    name: string;
    ipAddress: string;
    username: string;
    password?: string;
    apiPort: number;
    isEnabled: boolean;
    isOnline: boolean;
    lastCheckedAt?: string;
    lastError?: string;
    location?: string;
    notes?: string;
}

const emptyForm = {
    name: '',
    ipAddress: '',
    username: 'admin',
    password: '',
    apiPort: 8728,
    isEnabled: true,
    location: '',
    notes: '',
};

export default function MikroTikDevices() {
    const [devices, setDevices] = useState<MikroTikDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [selectedDevice, setSelectedDevice] = useState<MikroTikDevice | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/mikrotik-devices');
            if (res.data.success) {
                setDevices(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAll = async () => {
        setChecking(true);
        try {
            const res = await api.post('/mikrotik-devices/check-all');
            if (res.data.success) {
                setDevices(res.data.data);
                setSuccess(' „ ›Õ’ Ã„Ì⁄ «·√ÃÂ“…');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || '›‘· ›Õ’ «·√ÃÂ“…');
        } finally {
            setChecking(false);
        }
    };

    const handleCheckOne = async (id: number) => {
        try {
            const res = await api.post(`/mikrotik-devices/${id}/check`);
            if (res.data.success) {
                setDevices((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, ...res.data.data } : d))
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (device: MikroTikDevice) => {
        setEditingId(device.id);
        setForm({
            name: device.name,
            ipAddress: device.ipAddress,
            username: device.username,
            password: '',
            apiPort: device.apiPort,
            isEnabled: device.isEnabled,
            location: device.location || '',
            notes: device.notes || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.ipAddress) {
            setError('«·«”„ Ê⁄‰Ê«‰ IP „ÿ·Ê»«‰');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/mikrotik-devices/${editingId}`, form);
                setSuccess(' „  ÕœÌÀ «·ÃÂ«“ »‰Ã«Õ');
            } else {
                await api.post('/mikrotik-devices', form);
                setSuccess(' „ ≈÷«›… «·ÃÂ«“ »‰Ã«Õ');
            }
            setTimeout(() => setSuccess(''), 3000);
            setDialogOpen(false);
            fetchDevices();
        } catch (err: any) {
            setError(err.response?.data?.message || 'ÕœÀ Œÿ√');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDevice) return;
        setSubmitting(true);
        try {
            await api.delete(`/mikrotik-devices/${selectedDevice.id}`);
            setSuccess(' „ Õ–› «·ÃÂ«“');
            setTimeout(() => setSuccess(''), 3000);
            setDeleteDialogOpen(false);
            fetchDevices();
        } catch (err: any) {
            setError(err.response?.data?.message || '›‘· «·Õ–›');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">√ÃÂ“… MikroTik</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={checking ? <CircularProgress size={18} /> : <CheckIcon />}
                        onClick={handleCheckAll}
                        disabled={checking}
                        sx={{ mr: 1 }}
                    >
                        ›Õ’ «·ﬂ·
          </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDevices} sx={{ mr: 1 }}>
                         ÕœÌÀ
          </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        ≈÷«›… ÃÂ«“
          </Button>
                </Box>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>«·«”„</TableCell>
                            <TableCell>IP</TableCell>
                            <TableCell>«·„‰›–</TableCell>
                            <TableCell>«·„Êﬁ⁄</TableCell>
                            <TableCell>«·Õ«·…</TableCell>
                            <TableCell>¬Œ— ›Õ’</TableCell>
                            <TableCell>„›⁄¯·</TableCell>
                            <TableCell align="center">≈Ã—«¡« </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center"><CircularProgress /></TableCell>
                            </TableRow>
                        ) : devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">·«  ÊÃœ √ÃÂ“… „”Ã·…</TableCell>
                            </TableRow>
                        ) : (
                                    devices.map((device) => (
                                        <TableRow key={device.id} hover>
                                            <TableCell>{device.name}</TableCell>
                                            <TableCell>{device.ipAddress}</TableCell>
                                            <TableCell>{device.apiPort}</TableCell>
                                            <TableCell>{device.location || '-'}</TableCell>
                                            <TableCell>
                                                <Tooltip title={device.lastError || ''}>
                                                    <Chip
                                                        icon={device.isOnline ? <WifiIcon /> : <WifiOffIcon />}
                                                        label={device.isOnline ? '„ ’·' : '€Ì— „ ’·'}
                                                        color={device.isOnline ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                {device.lastCheckedAt
                                                    ? new Date(device.lastCheckedAt).toLocaleString('ar-EG')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={device.isEnabled ? '‰⁄„' : '·«'}
                                                    color={device.isEnabled ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="›Õ’ «·« ’«·">
                                                    <IconButton size="small" onClick={() => handleCheckOne(device.id)}>
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" onClick={() => openEdit(device)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                        setSelectedDevice(device);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? ' ⁄œÌ· ÃÂ«“' : '≈÷«›… ÃÂ«“ MikroTik'}</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="«”„ «·ÃÂ«“" margin="normal" required
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField fullWidth label="⁄‰Ê«‰ IP" margin="normal" required
                        value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
                    <TextField fullWidth label="«”„ «·„” Œœ„" margin="normal"
                        value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    <TextField fullWidth label="ﬂ·„… «·„—Ê—" type="password" margin="normal"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        helperText={editingId ? '« —ﬂÂ ›«—€« ≈–« ·„  —œ  €ÌÌ—Â' : ''} />
                    <TextField fullWidth label="„‰›– API" type="number" margin="normal"
                        value={form.apiPort} onChange={(e) => setForm({ ...form, apiPort: parseInt(e.target.value) || 8728 })} />
                    <TextField fullWidth label="«·„Êﬁ⁄ / «·›—⁄" margin="normal"
                        value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    <TextField fullWidth label="„·«ÕŸ« " margin="normal" multiline rows={2}
                        value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <FormControlLabel
                        control={
                            <Switch checked={form.isEnabled}
                                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
                        }
                        label="„›⁄¯·"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>≈·€«¡</Button>
                    <Button onClick={handleSave} variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Õ›Ÿ'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle> √ﬂÌœ «·Õ–›</DialogTitle>
                <DialogContent>
                    Â·  —Ìœ Õ–› «·ÃÂ«“ <strong>{selectedDevice?.name}</strong>ø
        </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>≈·€«¡</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={submitting}>
                        Õ–›
          </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}