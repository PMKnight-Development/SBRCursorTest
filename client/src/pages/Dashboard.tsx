import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Button,
  Alert,
  Badge,
  Divider,
  Tabs,
  Tab,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, Tooltip
} from '@mui/material';
import {
  Phone,
  LocalShipping,
  Warning,
  CheckCircle,
  Schedule,
  LocationOn,
  Add,
  Visibility,
  Edit,
  VolumeUp,
  VolumeOff,
  Refresh,
  Keyboard,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';
import { io } from 'socket.io-client';
import CallsTable, { Call as CallsTableCall } from '../components/CallsTable';
import UnitsTable from '../components/UnitsTable';

interface Unit {
  id: string;
  unit_number: string;
  unit_name: string;
  unit_type: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  assigned_call_id?: string;
  last_status_update: string;
}

interface DashboardStats {
  total_calls: number;
  active_calls: number;
  pending_calls: number;
  total_units: number;
  available_units: number;
  dispatched_units: number;
}

const Dashboard: React.FC = () => {
  const [calls, setCalls] = useState<CallsTableCall[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_calls: 0,
    active_calls: 0,
    pending_calls: 0,
    total_units: 0,
    available_units: 0,
    dispatched_units: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openCallModal, setOpenCallModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallsTableCall | null>(null);
  const [newCallForm, setNewCallForm] = useState({
    call_type: '',
    priority: 3,
    address: '',
    description: '',
    caller_name: '',
    caller_phone: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const { token } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const refreshInterval = useRef<NodeJS.Timeout>();
  const [sortBy, setSortBy] = useState<keyof CallsTableCall>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Units table state for search, sort, and pagination
  type UnitsTableColumn = 'unit_number' | 'unit_name' | 'unit_type' | 'status' | 'last_status_update';
  const [unitSortBy, setUnitSortBy] = useState<UnitsTableColumn>('unit_number');
  const [unitSortOrder, setUnitSortOrder] = useState<'asc' | 'desc'>('asc');
  const [unitPage, setUnitPage] = useState(0);
  const [unitRowsPerPage, setUnitRowsPerPage] = useState(10);
  const [unitSearch, setUnitSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
    setupRealTimeUpdates();
    setupKeyboardShortcuts();
    const socket = io(`http://${window.location.hostname}:3000`, {
      transports: ['websocket'],
      reconnection: true,
    });
    socket.on('calls:update', (calls) => setCalls(calls));
    socket.on('units:update', (units) => setUnits(units));
    return () => { socket.disconnect(); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [callsRes, unitsRes, statsRes] = await Promise.all([
        axios.get('/api/calls', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setCalls(callsRes.data);
      setUnits(unitsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    refreshInterval.current = setInterval(() => {
      fetchDashboardData();
    }, 5000); // Refresh every 5 seconds
  };

  const setupKeyboardShortcuts = () => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            setOpenCallModal(true);
            break;
          case 'r':
            event.preventDefault();
            fetchDashboardData();
            break;
          case 'm':
            event.preventDefault();
            setAudioEnabled(!audioEnabled);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  };

  const handleCreateCall = async () => {
    try {
      const response = await axios.post('/api/calls', newCallForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCalls([...calls, response.data]);
      setOpenCallModal(false);
      setNewCallForm({
        call_type: '',
        priority: 3,
        address: '',
        description: '',
        caller_name: '',
        caller_phone: '',
      });
      
      // if (audioEnabled && audioRef.current) {
      //   audioRef.current.play();
      // }
      
      setSnackbar({ open: true, message: 'New call created successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create call', severity: 'error' });
    }
  };

  const handleCallStatusUpdate = async (callId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/calls/${callId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCalls(calls.map(call => call.id === callId ? response.data : call));
      setSnackbar({ open: true, message: 'Call status updated', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update call status', severity: 'error' });
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'dispatched': return 'info';
      case 'en-route': return 'primary';
      case 'on-scene': return 'secondary';
      case 'cleared': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const pendingCalls = calls.filter(call => call.status === 'pending');
  const activeCalls = calls.filter(call => ['dispatched', 'en-route', 'on-scene'].includes(call.status));
  const displayedCalls = [...pendingCalls, ...activeCalls];

  const handleSort = (column: keyof CallsTableCall) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedCalls = [...displayedCalls].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === 'created_at') {
      aValue = aValue ? new Date(aValue as string).getTime() : 0;
      bValue = bValue ? new Date(bValue as string).getTime() : 0;
    } else {
      aValue = aValue ?? '';
      bValue = bValue ?? '';
    }
    if (aValue === bValue) return 0;
    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  // Pagination logic
  const paginatedCalls = sortedCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const unitsTableData = React.useMemo(() => {
    return units.map((unit) => ({
      id: unit.id,
      unit_number: unit.unit_number,
      unit_name: unit.unit_name,
      unit_type: unit.unit_type,
      status: unit.status,
      last_status_update: unit.last_status_update,
    }));
  }, [units]);

  const filteredUnits = React.useMemo(() => {
    if (!unitSearch.trim()) return unitsTableData;
    const lower = unitSearch.toLowerCase();
    return unitsTableData.filter(unit =>
      (unit.unit_number && unit.unit_number.toLowerCase().includes(lower)) ||
      (unit.unit_name && unit.unit_name.toLowerCase().includes(lower)) ||
      (unit.unit_type && unit.unit_type.toLowerCase().includes(lower)) ||
      (unit.status && unit.status.toLowerCase().includes(lower)) ||
      (unit.last_status_update && unit.last_status_update.toLowerCase().includes(lower))
    );
  }, [unitsTableData, unitSearch]);

  const sortedUnits = React.useMemo(() => {
    const sorted = [...filteredUnits].sort((a, b) => {
      let aValue = a[unitSortBy] ?? '';
      let bValue = b[unitSortBy] ?? '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return unitSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return unitSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUnits, unitSortBy, unitSortOrder]);

  const pagedUnits = React.useMemo(() => {
    const start = unitPage * unitRowsPerPage;
    return sortedUnits.slice(start, start + unitRowsPerPage);
  }, [sortedUnits, unitPage, unitRowsPerPage]);

  // Helper to format call number as YEAR-INCIDENT NUMBER
  const formatCallNumber = (call: CallsTableCall) => {
    // Split the call_number into year and incident number
    const [year, incident] = call.call_number.split('-');
    // Pad the incident number to 4 digits if desired
    const paddedIncident = incident ? incident.padStart(4, '0') : '';
    return `${year}-${paddedIncident}`;
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* <audio ref={audioRef} src="/audio/new-call.mp3" preload="auto" /> */}
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            CAD Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setAudioEnabled(!audioEnabled)} color={audioEnabled ? 'primary' : 'default'}>
              {audioEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            <IconButton onClick={fetchDashboardData}>
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCallModal(true)}
            >
              New Call
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Keyboard shortcuts: Ctrl+N (New Call), Ctrl+R (Refresh), Ctrl+M (Toggle Audio)
          </Typography>
        </Alert>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Calls
              </Typography>
              <Typography variant="h4">
                {stats.total_calls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Calls
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.active_calls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available Units
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.available_units}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Dispatched Units
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.dispatched_units}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calls Table */}
      <CallsTable
        calls={paginatedCalls}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sortedCalls.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onCallStatusUpdate={handleCallStatusUpdate}
        onViewCallDetails={setSelectedCall}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        formatCallNumber={formatCallNumber}
      />

      {/* Units Table */}
      {units.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Units</Typography>
          <UnitsTable
            units={pagedUnits}
            sortBy={unitSortBy}
            sortOrder={unitSortOrder}
            onSort={(col) => {
              if (unitSortBy === col) {
                setUnitSortOrder(unitSortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setUnitSortBy(col as UnitsTableColumn);
                setUnitSortOrder('asc');
              }
            }}
            page={unitPage}
            rowsPerPage={unitRowsPerPage}
            totalCount={filteredUnits.length}
            onPageChange={setUnitPage}
            onRowsPerPageChange={setUnitRowsPerPage}
            onStatusUpdate={() => {}} // No status update in dashboard
            onViewUnitDetails={() => {}} // No details in dashboard
            getStatusColor={() => 'default'}
            getUnitTypeColor={() => 'default'}
            search={unitSearch}
            onSearchChange={setUnitSearch}
          />
        </Box>
      )}

      {/* New Call Modal */}
      <Dialog open={openCallModal} onClose={() => setOpenCallModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Call</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Call Type"
                  value={newCallForm.call_type}
                  onChange={(e) => setNewCallForm({ ...newCallForm, call_type: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newCallForm.priority}
                    onChange={(e) => setNewCallForm({ ...newCallForm, priority: e.target.value as number })}
                  >
                    <MenuItem value={1}>Priority 1 - Emergency</MenuItem>
                    <MenuItem value={2}>Priority 2 - High</MenuItem>
                    <MenuItem value={3}>Priority 3 - Medium</MenuItem>
                    <MenuItem value={4}>Priority 4 - Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={newCallForm.address}
                  onChange={(e) => setNewCallForm({ ...newCallForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newCallForm.description}
                  onChange={(e) => setNewCallForm({ ...newCallForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Name"
                  value={newCallForm.caller_name}
                  onChange={(e) => setNewCallForm({ ...newCallForm, caller_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Phone"
                  value={newCallForm.caller_phone}
                  onChange={(e) => setNewCallForm({ ...newCallForm, caller_phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCallModal(false)}>Cancel</Button>
          <Button onClick={handleCreateCall} variant="contained">Create Call</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard; 