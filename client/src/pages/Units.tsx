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
  Tabs,
  Tab,
  Badge,
  AppBar,
  Toolbar,
  Snackbar,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  LocalShipping,
  LocationOn,
  Schedule,
  Refresh,
  VolumeUp,
  VolumeOff,
  ExpandMore,
  DirectionsCar,
  LocalHospital,
  Security,
  Warning,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';
import { formatCoordinates } from '../utils/coordinates';
import { io } from 'socket.io-client';
import UnitsTable from '../components/UnitsTable';

interface Unit {
  id: string;
  unit_number: string;
  unit_name: string;
  unit_type: string;
  group_id: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  assigned_call_id?: string;
  is_active: boolean;
  created_at: string;
  group_name?: string;
  last_status_update: string;
}

interface UnitGroup {
  id: string;
  group_name: string;
  description: string;
  group_type: string;
  color: string;
}

const Units: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const { token } = useAuth();
  const refreshInterval = useRef<NodeJS.Timeout>();
  const [search, setSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    unit_number: '',
    unit_name: '',
    unit_type: '',
    group_id: '',
    status: 'available',
  });

  type UnitsTableColumn = 'unit_number' | 'unit_name' | 'unit_type' | 'status' | 'last_status_update';
  const [sortBy, setSortBy] = useState<UnitsTableColumn>('unit_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const unitsTableData = React.useMemo(() => {
    return units.map((unit) => ({
      id: unit.id,
      unit_number: unit.unit_number,
      unit_name: unit.unit_name,
      unit_type: unit.unit_type,
      status: unit.status,
      last_status_update: unit.last_status_update,
      group_name: unit.group_name,
    }));
  }, [units]);

  const filteredUnits = React.useMemo(() => {
    if (!search.trim()) return unitsTableData;
    const lower = search.toLowerCase();
    return unitsTableData.filter(unit =>
      (unit.unit_number && unit.unit_number.toLowerCase().includes(lower)) ||
      (unit.unit_name && unit.unit_name.toLowerCase().includes(lower)) ||
      (unit.unit_type && unit.unit_type.toLowerCase().includes(lower)) ||
      (unit.status && unit.status.toLowerCase().includes(lower)) ||
      (unit.last_status_update && unit.last_status_update.toLowerCase().includes(lower)) ||
      (unit.group_name && unit.group_name.toLowerCase().includes(lower))
    );
  }, [unitsTableData, search]);

  const sortedUnits = React.useMemo(() => {
    const sorted = [...filteredUnits].sort((a, b) => {
      let aValue = a[sortBy] ?? '';
      let bValue = b[sortBy] ?? '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUnits, sortBy, sortOrder]);

  const pagedUnits = React.useMemo(() => {
    const start = page * rowsPerPage;
    return sortedUnits.slice(start, start + rowsPerPage);
  }, [sortedUnits, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
    setupRealTimeUpdates();

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
    socket.on('units:update', (units) => setUnits(units));
    return () => { socket.disconnect(); };
  }, []);

  const fetchData = async () => {
    try {
      const [unitsRes, unitGroupsRes] = await Promise.all([
        axios.get('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/unit-groups', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setUnits(unitsRes.data);
      setUnitGroups(unitGroupsRes.data);
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
    }, 5000); // Refresh every 5 seconds
  };

  const handleCreateUnit = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/units', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUnits([...units, response.data]);
      setOpenCreateModal(false);
      resetForm();
      setSnackbar({ open: true, message: 'Unit created successfully', severity: 'success' });
    } catch (error: any) {
      console.error('Error creating unit:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create unit', severity: 'error' });
    }
  };

  const handleStatusUpdate = async (unitId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/units/${unitId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUnits(units.map(unit => unit.id === unitId ? response.data : unit));
      setSnackbar({ open: true, message: 'Unit status updated', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update unit status', severity: 'error' });
    }
  };

  const handleViewUnitDetails = (unit: Unit) => {
    setSelectedUnit(unit);
    setOpenDetailsDrawer(true);
  };

  const resetForm = () => {
    setFormData({
      unit_number: '',
      unit_name: '',
      unit_type: '',
      group_id: '',
      status: 'available',
    });
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'dispatched': return 'warning';
      case 'enroute': return 'info';
      case 'on_scene': return 'secondary';
      case 'transporting': return 'primary';
      case 'out_of_service': return 'error';
      case 'maintenance': return 'warning';
      case 'training': return 'info';
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

  const getUnitTypeColor = (type: string) => {
    switch (type) {
      case 'ems': return 'error';
      case 'fire': return 'warning';
      case 'security': return 'info';
      case 'law_enforcement': return 'primary';
      case 'search_rescue': return 'secondary';
      case 'support': return 'success';
      default: return 'default';
    }
  };

  const availableUnits = units.filter(unit => unit.status === 'available');
  const dispatchedUnits = units.filter(unit => unit.status === 'dispatched');
  const enrouteUnits = units.filter(unit => unit.status === 'enroute');
  const onSceneUnits = units.filter(unit => unit.status === 'on_scene');
  const outOfServiceUnits = units.filter(unit => ['out_of_service', 'maintenance', 'training'].includes(unit.status));

  if (loading) {
    return (
      <Container>
        <Typography>Loading units...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Unit Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetchData}>
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
            >
              New Unit
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Grid container spacing={3}>
        {/* Unit Status Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Unit Status Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="success.main" variant="h4">
                      {availableUnits.length}
                    </Typography>
                    <Typography variant="body2">Available</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="warning.main" variant="h4">
                      {dispatchedUnits.length}
                    </Typography>
                    <Typography variant="body2">Dispatched</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="info.main" variant="h4">
                      {enrouteUnits.length + onSceneUnits.length}
                    </Typography>
                    <Typography variant="body2">En Route/On Scene</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="error.main" variant="h4">
                      {outOfServiceUnits.length}
                    </Typography>
                    <Typography variant="body2">Out of Service</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Units List */}
        <Grid item xs={12}>
          <Paper sx={{ height: '60vh', overflow: 'hidden' }}>
            <UnitsTable
              units={pagedUnits}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(col) => {
                if (sortBy === col) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(col as UnitsTableColumn);
                  setSortOrder('asc');
                }
              }}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={filteredUnits.length}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              onStatusUpdate={handleStatusUpdate}
              onViewUnitDetails={(unit) => {
                // Find the full unit object from the original units array
                const fullUnit = units.find(u => u.id === unit.id);
                if (fullUnit) handleViewUnitDetails(fullUnit);
              }}
              getStatusColor={getStatusColor}
              getUnitTypeColor={getUnitTypeColor}
              search={search}
              onSearchChange={setSearch}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Unit Details Drawer */}
      <Drawer
        anchor="right"
        open={openDetailsDrawer}
        onClose={() => setOpenDetailsDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        {selectedUnit && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Unit Details - {selectedUnit.unit_number}
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Unit Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Unit Number</Typography>
                  <Typography variant="body1">{selectedUnit.unit_number}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Unit Name</Typography>
                  <Typography variant="body1">{selectedUnit.unit_name}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Type</Typography>
                  <Chip
                    label={selectedUnit.unit_type.replace('_', ' ').toUpperCase()}
                    color={getUnitTypeColor(selectedUnit.unit_type) as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedUnit.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedUnit.status) as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Group</Typography>
                  <Typography variant="body1">{selectedUnit.group_name || 'No group'}</Typography>
                </Box>
                {(() => {
                  const coords = formatCoordinates(selectedUnit.current_latitude, selectedUnit.current_longitude);
                  return coords && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Location</Typography>
                      <Typography variant="body1">{coords}</Typography>
                    </Box>
                  );
                })()}
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

      {/* New Unit Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Unit</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Unit Number"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Unit Name"
                  value={formData.unit_name}
                  onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Unit Type</InputLabel>
                  <Select
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  >
                    <MenuItem value="ems">EMS</MenuItem>
                    <MenuItem value="fire">Fire</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="law_enforcement">Law Enforcement</MenuItem>
                    <MenuItem value="search_rescue">Search & Rescue</MenuItem>
                    <MenuItem value="support">Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Group</InputLabel>
                  <Select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  >
                    {unitGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.group_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreateUnit} variant="contained">Create Unit</Button>
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

export default Units; 