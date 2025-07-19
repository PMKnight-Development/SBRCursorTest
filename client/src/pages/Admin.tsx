import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
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
  Button,
  Alert,
  Tabs,
  Tab,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Phone,
  LocalShipping,
  People,
  Assessment,
  Settings,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Layers,
  DragIndicator,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';

interface CallType {
  id: string;
  name: string;
  description: string;
  priority: number;
  color: string;
}

interface UnitGroup {
  id: string;
  group_name: string;
  description: string;
  group_type: string;
  color: string;
}

interface MapLayer {
  id: string;
  name: string;
  type: 'feature' | 'vectortile';
  url: string;
  layer_id?: string;
  opacity: number;
  visible: boolean;
  order: number;
  description?: string;
}

interface Stats {
  totalCalls: number;
  activeCalls: number;
  totalUnits: number;
  availableUnits: number;
  totalUsers: number;
}

const Admin: React.FC = () => {
  const [callTypes, setCallTypes] = useState<CallType[]>([]);
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { token } = useAuth();

  // Modal states
  const [openCallTypeModal, setOpenCallTypeModal] = useState(false);
  const [openUnitGroupModal, setOpenUnitGroupModal] = useState(false);
  const [openMapLayerModal, setOpenMapLayerModal] = useState(false);
  const [editingCallType, setEditingCallType] = useState<CallType | null>(null);
  const [editingUnitGroup, setEditingUnitGroup] = useState<UnitGroup | null>(null);
  const [editingMapLayer, setEditingMapLayer] = useState<MapLayer | null>(null);

  // Form states
  const [callTypeForm, setCallTypeForm] = useState({
    name: '',
    description: '',
    priority: 3,
    color: '#1976d2',
  });

  const [unitGroupForm, setUnitGroupForm] = useState({
    group_name: '',
    description: '',
    group_type: '',
    color: '#1976d2',
  });

  const [mapLayerForm, setMapLayerForm] = useState({
    name: '',
    type: 'feature' as 'feature' | 'vectortile',
    url: '',
    layer_id: '',
    opacity: 0.8,
    visible: true,
    description: '',
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [callTypesRes, unitGroupsRes, mapLayersRes, statsRes] = await Promise.all([
        axios.get('/api/admin/call-types', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/unit-groups', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/map-layers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCallTypes(callTypesRes.data);
      setUnitGroups(unitGroupsRes.data);
      setMapLayers(mapLayersRes.data);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      setError(error.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCallType = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/admin/call-types', callTypeForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCallTypes([...callTypes, response.data]);
      setOpenCallTypeModal(false);
      resetCallTypeForm();
    } catch (error: any) {
      console.error('Error creating call type:', error);
      setError(error.response?.data?.error || 'Failed to create call type');
    }
  };

  const handleUpdateCallType = async () => {
    if (!editingCallType) return;
    
    try {
      setError(null);
      const response = await axios.patch(`/api/admin/call-types/${editingCallType.id}`, callTypeForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCallTypes(callTypes.map(ct => ct.id === editingCallType.id ? response.data : ct));
      setOpenCallTypeModal(false);
      setEditingCallType(null);
      resetCallTypeForm();
    } catch (error: any) {
      console.error('Error updating call type:', error);
      setError(error.response?.data?.error || 'Failed to update call type');
    }
  };

  const handleCreateUnitGroup = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/admin/unit-groups', unitGroupForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUnitGroups([...unitGroups, response.data]);
      setOpenUnitGroupModal(false);
      resetUnitGroupForm();
    } catch (error: any) {
      console.error('Error creating unit group:', error);
      setError(error.response?.data?.error || 'Failed to create unit group');
    }
  };

  const handleUpdateUnitGroup = async () => {
    if (!editingUnitGroup) return;
    
    try {
      setError(null);
      const response = await axios.patch(`/api/admin/unit-groups/${editingUnitGroup.id}`, unitGroupForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUnitGroups(unitGroups.map(ug => ug.id === editingUnitGroup.id ? response.data : ug));
      setOpenUnitGroupModal(false);
      setEditingUnitGroup(null);
      resetUnitGroupForm();
    } catch (error: any) {
      console.error('Error updating unit group:', error);
      setError(error.response?.data?.error || 'Failed to update unit group');
    }
  };

  const handleCreateMapLayer = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/admin/map-layers', mapLayerForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMapLayers([...mapLayers, response.data]);
      setOpenMapLayerModal(false);
      resetMapLayerForm();
    } catch (error: any) {
      console.error('Error creating map layer:', error);
      setError(error.response?.data?.error || 'Failed to create map layer');
    }
  };

  const handleUpdateMapLayer = async () => {
    if (!editingMapLayer) return;
    
    try {
      setError(null);
      const response = await axios.patch(`/api/admin/map-layers/${editingMapLayer.id}`, mapLayerForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMapLayers(mapLayers.map(ml => ml.id === editingMapLayer.id ? response.data : ml));
      setOpenMapLayerModal(false);
      setEditingMapLayer(null);
      resetMapLayerForm();
    } catch (error: any) {
      console.error('Error updating map layer:', error);
      setError(error.response?.data?.error || 'Failed to update map layer');
    }
  };

  const handleDeleteMapLayer = async (layerId: string) => {
    try {
      await axios.delete(`/api/admin/map-layers/${layerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMapLayers(mapLayers.filter(ml => ml.id !== layerId));
    } catch (error: any) {
      console.error('Error deleting map layer:', error);
      setError(error.response?.data?.error || 'Failed to delete map layer');
    }
  };

  const handleReorderMapLayers = async (fromIndex: number, toIndex: number) => {
    const newLayers = [...mapLayers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    
    // Update order property
    const updatedLayers = newLayers.map((layer, index) => ({
      ...layer,
      order: index + 1
    }));
    
    setMapLayers(updatedLayers);
    
    // Save the new order to the server
    try {
      await axios.patch('/api/admin/map-layers/reorder', {
        layers: updatedLayers.map(l => ({ id: l.id, order: l.order }))
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error reordering map layers:', error);
    }
  };

  const handleEditCallType = (callType: CallType) => {
    setEditingCallType(callType);
    setCallTypeForm({
      name: callType.name,
      description: callType.description,
      priority: callType.priority,
      color: callType.color,
    });
    setOpenCallTypeModal(true);
  };

  const handleEditUnitGroup = (unitGroup: UnitGroup) => {
    setEditingUnitGroup(unitGroup);
    setUnitGroupForm({
      group_name: unitGroup.group_name,
      description: unitGroup.description,
      group_type: unitGroup.group_type,
      color: unitGroup.color,
    });
    setOpenUnitGroupModal(true);
  };

  const handleEditMapLayer = (mapLayer: MapLayer) => {
    setEditingMapLayer(mapLayer);
    setMapLayerForm({
      name: mapLayer.name,
      type: mapLayer.type,
      url: mapLayer.url,
      layer_id: mapLayer.layer_id || '',
      opacity: mapLayer.opacity,
      visible: mapLayer.visible,
      description: mapLayer.description || '',
    });
    setOpenMapLayerModal(true);
  };

  const resetCallTypeForm = () => {
    setCallTypeForm({
      name: '',
      description: '',
      priority: 3,
      color: '#1976d2',
    });
    setEditingCallType(null);
  };

  const resetUnitGroupForm = () => {
    setUnitGroupForm({
      group_name: '',
      description: '',
      group_type: '',
      color: '#1976d2',
    });
    setEditingUnitGroup(null);
  };

  const resetMapLayerForm = () => {
    setMapLayerForm({
      name: '',
      type: 'feature',
      url: '',
      layer_id: '',
      opacity: 0.8,
      visible: true,
      description: '',
    });
    setEditingMapLayer(null);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading admin data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System administration and configuration
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{stats?.totalCalls || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Calls
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{stats?.availableUnits || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Units
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4">{stats?.totalUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4">{stats?.activeCalls || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Calls
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Call Types" />
          <Tab label="Unit Groups" />
          <Tab label="Map Layers" />
        </Tabs>
      </Box>

      {/* Call Types Tab */}
      {activeTab === 0 && (
        <Card>
          <CardHeader
            title="Call Types"
            action={
              <IconButton onClick={() => setOpenCallTypeModal(true)}>
                <AddIcon />
              </IconButton>
            }
          />
          <Divider />
          <List>
            {callTypes.map((callType) => (
              <ListItem key={callType.id}>
                <ListItemIcon>
                  <Phone sx={{ color: callType.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={callType.name}
                  secondary={callType.description}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Priority ${callType.priority}`}
                    size="small"
                    color={callType.priority === 1 ? 'error' : 'default'}
                  />
                  <IconButton size="small" onClick={() => handleEditCallType(callType)}>
                    <EditIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {/* Unit Groups Tab */}
      {activeTab === 1 && (
        <Card>
          <CardHeader
            title="Unit Groups"
            action={
              <IconButton onClick={() => setOpenUnitGroupModal(true)}>
                <AddIcon />
              </IconButton>
            }
          />
          <Divider />
          <List>
            {unitGroups.map((group) => (
              <ListItem key={group.id}>
                <ListItemIcon>
                  <LocalShipping sx={{ color: group.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={group.group_name}
                  secondary={group.description}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={group.group_type.replace('_', ' ').toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                  <IconButton size="small" onClick={() => handleEditUnitGroup(group)}>
                    <EditIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {/* Map Layers Tab */}
      {activeTab === 2 && (
        <Card>
          <CardHeader
            title="Map Layers"
            action={
              <IconButton onClick={() => setOpenMapLayerModal(true)}>
                <AddIcon />
              </IconButton>
            }
          />
          <Divider />
          <List>
            {mapLayers.sort((a, b) => a.order - b.order).map((layer, index) => (
              <ListItem key={layer.id}>
                <ListItemIcon>
                  <DragIndicator />
                </ListItemIcon>
                <ListItemText
                  primary={layer.name}
                  secondary={`${layer.type} layer - ${layer.url}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={layer.type}
                    size="small"
                    variant="outlined"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layer.visible}
                        onChange={async (e) => {
                          const updatedLayer = { ...layer, visible: e.target.checked };
                          setMapLayers(mapLayers.map(ml => ml.id === layer.id ? updatedLayer : ml));
                          try {
                            await axios.patch(`/api/admin/map-layers/${layer.id}`, { visible: e.target.checked }, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                          } catch (error) {
                            console.error('Error updating layer visibility:', error);
                          }
                        }}
                      />
                    }
                    label=""
                  />
                  <IconButton size="small" onClick={() => handleEditMapLayer(layer)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteMapLayer(layer.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {/* Create/Edit Call Type Modal */}
      <Dialog open={openCallTypeModal} onClose={() => setOpenCallTypeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCallType ? 'Edit Call Type' : 'Create New Call Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={callTypeForm.name}
              onChange={(e) => setCallTypeForm({ ...callTypeForm, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={callTypeForm.description}
              onChange={(e) => setCallTypeForm({ ...callTypeForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={callTypeForm.priority}
                onChange={(e) => setCallTypeForm({ ...callTypeForm, priority: e.target.value as number })}
                label="Priority"
              >
                <MenuItem value={1}>1 - Emergency</MenuItem>
                <MenuItem value={2}>2 - High</MenuItem>
                <MenuItem value={3}>3 - Medium</MenuItem>
                <MenuItem value={4}>4 - Low</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={callTypeForm.color}
              onChange={(e) => setCallTypeForm({ ...callTypeForm, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCallTypeModal(false)}>Cancel</Button>
          <Button 
            onClick={editingCallType ? handleUpdateCallType : handleCreateCallType} 
            variant="contained"
          >
            {editingCallType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Unit Group Modal */}
      <Dialog open={openUnitGroupModal} onClose={() => setOpenUnitGroupModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUnitGroup ? 'Edit Unit Group' : 'Create New Unit Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={unitGroupForm.group_name}
              onChange={(e) => setUnitGroupForm({ ...unitGroupForm, group_name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={unitGroupForm.description}
              onChange={(e) => setUnitGroupForm({ ...unitGroupForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Group Type</InputLabel>
              <Select
                value={unitGroupForm.group_type}
                onChange={(e) => setUnitGroupForm({ ...unitGroupForm, group_type: e.target.value })}
                label="Group Type"
              >
                <MenuItem value="ems">EMS</MenuItem>
                <MenuItem value="fire">Fire</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="law_enforcement">Law Enforcement</MenuItem>
                <MenuItem value="search_rescue">Search & Rescue</MenuItem>
                <MenuItem value="support">Support</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={unitGroupForm.color}
              onChange={(e) => setUnitGroupForm({ ...unitGroupForm, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUnitGroupModal(false)}>Cancel</Button>
          <Button 
            onClick={editingUnitGroup ? handleUpdateUnitGroup : handleCreateUnitGroup} 
            variant="contained"
          >
            {editingUnitGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Map Layer Modal */}
      <Dialog open={openMapLayerModal} onClose={() => setOpenMapLayerModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMapLayer ? 'Edit Map Layer' : 'Create New Map Layer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Layer Name"
              value={mapLayerForm.name}
              onChange={(e) => setMapLayerForm({ ...mapLayerForm, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={mapLayerForm.description}
              onChange={(e) => setMapLayerForm({ ...mapLayerForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Layer Type</InputLabel>
              <Select
                value={mapLayerForm.type}
                onChange={(e) => setMapLayerForm({ ...mapLayerForm, type: e.target.value as 'feature' | 'vectortile' })}
                label="Layer Type"
              >
                <MenuItem value="feature">Feature Layer (WMS)</MenuItem>
                <MenuItem value="vectortile">Vector Tile Layer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Service URL"
              value={mapLayerForm.url}
              onChange={(e) => setMapLayerForm({ ...mapLayerForm, url: e.target.value })}
              sx={{ mb: 2 }}
              required
              placeholder="https://services.arcgis.com/..."
            />
            {mapLayerForm.type === 'feature' && (
              <TextField
                fullWidth
                label="Layer ID"
                value={mapLayerForm.layer_id}
                onChange={(e) => setMapLayerForm({ ...mapLayerForm, layer_id: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="0,1,2 or layer name"
              />
            )}
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Opacity</Typography>
              <Slider
                value={mapLayerForm.opacity}
                onChange={(_, value) => setMapLayerForm({ ...mapLayerForm, opacity: value as number })}
                min={0}
                max={1}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={mapLayerForm.visible}
                  onChange={(e) => setMapLayerForm({ ...mapLayerForm, visible: e.target.checked })}
                />
              }
              label="Visible by default"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMapLayerModal(false)}>Cancel</Button>
          <Button 
            onClick={editingMapLayer ? handleUpdateMapLayer : handleCreateMapLayer} 
            variant="contained"
          >
            {editingMapLayer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin; 