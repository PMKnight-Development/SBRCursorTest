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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Tabs,
  Tab,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  AppBar,
  Toolbar,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Phone,
  LocalShipping,
  LocationOn,
  Schedule,
  Person,
  Warning,
  CheckCircle,
  Cancel,
  ExpandMore,
  Refresh,
  VolumeUp,
  VolumeOff,
  Keyboard,
  Assignment,
  DirectionsCar,
  LocalHospital,
  Security,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';
import { io } from 'socket.io-client';
import CallsTable from '../components/CallsTable';

interface Call {
  id: string;
  call_number: string;
  call_type: string;
  priority: number;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  caller_name?: string;
  caller_phone?: string;
  created_at: string;
  assigned_units: string[];
  updated_at: string;
  notes?: string;
  timeline?: CallEvent[];
}

interface CallEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  user_id: string;
  user_name: string;
}

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

interface CallType {
  id: string;
  name: string;
  description: string;
  priority: number;
  color: string;
}

const Calls: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [callTypes, setCallTypes] = useState<CallType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const { token } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const refreshInterval = useRef<NodeJS.Timeout>();
  const [sortBy, setSortBy] = useState<keyof Call>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    call_type_id: '',
    priority: 3,
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    caller_name: '',
    caller_phone: '',
  });

  useEffect(() => {
    fetchData();
    setupRealTimeUpdates();
    setupKeyboardShortcuts();

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    const socket = io(`http://${window.location.hostname}:3000`, {
      transports: ['websocket'],
      reconnection: true,
    });
    socket.on('calls:update', (calls) => setCalls(calls));
    return () => { socket.disconnect(); };
  }, []);

  const fetchData = async () => {
    try {
      const [callsRes, unitsRes, callTypesRes] = await Promise.all([
        axios.get('/api/calls', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/call-types', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setCalls(callsRes.data);
      setUnits(unitsRes.data);
      setCallTypes(callTypesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    refreshInterval.current = setInterval(() => {
      fetchData();
    }, 3000); // Refresh every 3 seconds
  };

  const setupKeyboardShortcuts = () => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            setOpenCreateModal(true);
            break;
          case 'r':
            event.preventDefault();
            fetchData();
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
      setError(null);
      const response = await axios.post('/api/calls', {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCalls([...calls, response.data]);
      setOpenCreateModal(false);
      resetForm();
      
      if (audioEnabled && audioRef.current) {
        audioRef.current.play();
      }
      
      setSnackbar({ open: true, message: 'Call created successfully', severity: 'success' });
    } catch (error: any) {
      console.error('Error creating call:', error);
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

  const handleUnitAssignment = async (callId: string, unitId: string, assign: boolean) => {
    try {
      const action = assign ? 'assign' : 'unassign';
      const response = await axios.post(`/api/calls/${callId}/units`, {
        unit_id: unitId,
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCalls(calls.map(call => call.id === callId ? response.data : call));
      setSnackbar({ open: true, message: `Unit ${assign ? 'assigned' : 'unassigned'} successfully`, severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update unit assignment', severity: 'error' });
    }
  };

  const handleViewCallDetails = async (call: Call) => {
    try {
      const response = await axios.get(`/api/calls/${call.id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSelectedCall(response.data);
      setOpenDetailsDrawer(true);
    } catch (error) {
      console.error('Error fetching call details:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      call_type_id: '',
      priority: 3,
      latitude: '',
      longitude: '',
      address: '',
      description: '',
      caller_name: '',
      caller_phone: '',
    });
    setError(null);
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

  const getUnitTypeIcon = (type: string) => {
    switch (type) {
      case 'ems': return <LocalHospital />;
      case 'fire': return <Warning />;
      case 'security': return <Security />;
      case 'law_enforcement': return <Security />;
      case 'search_rescue': return <DirectionsCar />;
      default: return <LocalShipping />;
    }
  };

  const pendingCalls = calls.filter(call => call.status === 'pending');
  const activeCalls = calls.filter(call => ['dispatched', 'en-route', 'on-scene'].includes(call.status));
  const displayedCalls = [...pendingCalls, ...activeCalls];

  const handleSort = (column: keyof Call) => {
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

  // Helper to format call number as YEAR-INCIDENT NUMBER
  const formatCallNumber = (call: Call) => {
    // Split the call_number into year and incident number
    const [year, incident] = call.call_number.split('-');
    // Pad the incident number to 4 digits if desired
    const paddedIncident = incident ? incident.padStart(4, '0') : '';
    return `${year}-${paddedIncident}`;
  };

  const availableUnits = units.filter(unit => unit.status === 'available');

  if (loading) {
    return (
      <Container>
        <Typography>Loading calls...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <audio ref={audioRef} src="/audio/new-call.mp3" preload="auto" />
      
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Call Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setAudioEnabled(!audioEnabled)} color={audioEnabled ? 'primary' : 'default'}>
              {audioEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            <IconButton onClick={fetchData}>
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
            >
              New Call
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Keyboard shortcuts: Ctrl+N (New Call), Ctrl+R (Refresh), Ctrl+M (Toggle Audio)
        </Typography>
      </Alert>

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
        onViewCallDetails={handleViewCallDetails}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        formatCallNumber={formatCallNumber}
      />

      {/* Available Units */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ height: '70vh', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Available Units ({availableUnits.length})
            </Typography>
          </Box>
          
          <Box sx={{ height: 'calc(70vh - 64px)', overflow: 'auto' }}>
            <List>
              {availableUnits.map((unit) => (
                <ListItem key={unit.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{unit.unit_number}</Typography>
                        {getUnitTypeIcon(unit.unit_type)}
                        <Chip label={unit.unit_type.toUpperCase()} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" component="div">
                          {unit.unit_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" component="div">
                          Last update: {new Date(unit.last_status_update).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small">
                      <LocationOn />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {availableUnits.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="textSecondary">No available units</Typography>
                  <Typography variant="body2" color="textSecondary">All units are busy</Typography>
                </Box>
              )}
            </List>
          </Box>
        </Paper>
      </Grid>

      {/* Call Details Drawer */}
      <Drawer
        anchor="right"
        open={openDetailsDrawer}
        onClose={() => setOpenDetailsDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        {selectedCall && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Call Details - {selectedCall.call_number}
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Call Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Type</Typography>
                  <Typography variant="body1">{selectedCall.call_type}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Priority</Typography>
                  <Chip
                    label={`Priority ${selectedCall.priority}`}
                    color={getPriorityColor(selectedCall.priority) as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Address</Typography>
                  <Typography variant="body1">{selectedCall.address}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedCall.description}</Typography>
                </Box>
                {selectedCall.caller_name && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Caller</Typography>
                    <Typography variant="body1">
                      {selectedCall.caller_name} - {selectedCall.caller_phone}
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Assigned Units</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {selectedCall.assigned_units.length > 0 ? (
                  <List dense>
                    {selectedCall.assigned_units.map((unitId) => {
                      const unit = units.find(u => u.id === unitId);
                      return unit ? (
                        <ListItem key={unit.id}>
                          <ListItemText
                            primary={unit.unit_number}
                            secondary={unit.unit_name}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleUnitAssignment(selectedCall.id, unit.id, false)}
                          >
                            <Cancel />
                          </IconButton>
                        </ListItem>
                      ) : null;
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">No units assigned</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Call Timeline</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {selectedCall.timeline?.map((event) => (
                    <ListItem key={event.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {event.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        by {event.user_name}
                      </Typography>
                    </ListItem>
                  )) || (
                    <ListItem>
                      <Typography variant="body2" color="textSecondary">No timeline events</Typography>
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setOpenDetailsDrawer(false)}
              >
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* New Call Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Call</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Call Type</InputLabel>
                  <Select
                    value={formData.call_type_id}
                    onChange={(e) => setFormData({ ...formData, call_type_id: e.target.value })}
                  >
                    {callTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as number })}
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Name"
                  value={formData.caller_name}
                  onChange={(e) => setFormData({ ...formData, caller_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Phone"
                  value={formData.caller_phone}
                  onChange={(e) => setFormData({ ...formData, caller_phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateModal(false)}>Cancel</Button>
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

export default Calls; 