import React, { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import MyLocation from '@mui/icons-material/MyLocation';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import Refresh from '@mui/icons-material/Refresh';
import Layers from '@mui/icons-material/Layers';
import Close from '@mui/icons-material/Close';
import axios from 'axios';
import { useAuth } from './AuthProvider';
// Add this import for CSS module types
// @ts-ignore
import styles from '../styles/ArcGISMap.module.css';

// ArcGIS types
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
  assigned_units: string[];
  created_at: string;
}

interface MapLayer {
  id: string;
  name: string;
  type: 'feature' | 'vector-tile';
  url: string;
  visible: boolean;
  opacity: number;
  order: number;
  searchFields?: string[];
  labelsHiddenByDefault?: boolean;
}

declare global {
  interface Window {
    require: any;
  }
}

const SBR_CENTER = [-81.1196, 37.9150];

const basemapOptions = [
  { id: 'satellite', name: 'Satellite' },
  { id: 'streets-vector', name: 'Streets' },
  { id: 'topo-vector', name: 'Topographic' },
  { id: 'hybrid', name: 'Hybrid' },
  { id: 'dark-gray-vector', name: 'Dark Gray' },
  { id: 'gray-vector', name: 'Gray' },
  { id: 'oceans', name: 'Oceans' },
  { id: 'terrain', name: 'Terrain' }
];

const ArcGISMap: React.FC = () => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapViewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const resultsLayerRef = useRef<any>(null);
  const searchWidgetRef = useRef<any>(null);
  const layerListRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [basemapDialogOpen, setBasemapDialogOpen] = useState(false);
  const [arcgisReady, setArcgisReady] = useState(false);
  const { token } = useAuth();

  // Load ArcGIS API
  useEffect(() => {
    if (window.require) {
      setArcgisReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.arcgis.com/4.31/';
    script.async = true;
    script.id = 'arcgis-js-api';
    script.onload = () => {
      let tries = 0;
      const check = setInterval(() => {
        if (window.require) {
          setArcgisReady(true);
          clearInterval(check);
        } else if (++tries > 100) {
          setError('ArcGIS API failed to load.');
          clearInterval(check);
        }
      }, 100);
    };
    script.onerror = () => setError('ArcGIS API script failed to load.');
    document.head.appendChild(script);
    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!arcgisReady || !mapDiv.current) return;
    setLoading(true);
    window.require([
      'esri/Map',
      'esri/views/MapView',
      'esri/layers/GraphicsLayer',
      'esri/widgets/Search',
      'esri/widgets/LayerList',
      'esri/widgets/Home',
      'esri/widgets/Zoom',
      'esri/widgets/Compass',
    ], (
      Map: any, MapView: any, GraphicsLayer: any, Search: any, LayerList: any, Home: any, Zoom: any, Compass: any
    ) => {
      const map = new Map({ basemap: 'satellite' });
      const resultsLayer = new GraphicsLayer({ title: 'Results' });
      map.add(resultsLayer);
      const view = new MapView({
        container: mapDiv.current,
        map,
        center: SBR_CENTER,
        zoom: 13,
        constraints: { rotationEnabled: false },
        popup: { dockEnabled: true, dockOptions: { position: 'auto' } },
      });
      mapRef.current = map;
      mapViewRef.current = view;
      resultsLayerRef.current = resultsLayer;

      // Widgets
      view.ui.add(new Home({ view }), 'top-left');
      view.ui.add(new Zoom({ view }), 'top-left');
      view.ui.add(new Compass({ view }), 'top-left');
      const layerList = new LayerList({ view });
      view.ui.add(layerList, 'top-right');
      layerListRef.current = layerList;

      // Search
      const search = new Search({
        view,
        includeDefaultSources: true,
        popupEnabled: true,
        maxSuggestions: 10,
        minSuggestCharacters: 2,
        sources: [{
          url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
          name: 'World Geocoding',
          placeholder: 'Search address or place',
          maxResults: 6,
          maxSuggestions: 6,
          countryCode: 'USA',
        }],
      });
      view.ui.add(search, { position: 'top-left', index: 0 });
      searchWidgetRef.current = search;

      setLoading(false);
      // Load data and layers
      loadMapData();
      loadMapLayers();
    });
    // eslint-disable-next-line
  }, [arcgisReady]);

  // Load units and calls
  const loadMapData = useCallback(async () => {
    if (!resultsLayerRef.current) return;
    resultsLayerRef.current.removeAll();
    try {
      const [unitsRes, callsRes] = await Promise.all([
        axios.get('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/calls', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      addUnitsToMap(unitsRes.data);
      addCallsToMap(callsRes.data);
    } catch (err) {
      setError('Failed to load map data.');
    }
  }, [token]);

  // Load map layers
  const loadMapLayers = useCallback(async () => {
    if (!mapRef.current || !window.require) return;
    try {
      const { data } = await axios.get('/api/arcgis/config', { headers: { Authorization: `Bearer ${token}` } });
      const allLayers: MapLayer[] = [
        ...(data.vectorTileLayers || []).map((l: any) => ({ ...l, type: 'vector-tile' as const })),
        ...(data.featureLayers || []).map((l: any) => ({ ...l, type: 'feature' as const })),
      ].sort((a, b) => (a.order || 0) - (b.order || 0));
      window.require([
        'esri/layers/FeatureLayer',
        'esri/layers/VectorTileLayer',
      ], (FeatureLayer: any, VectorTileLayer: any) => {
        // Remove all except results layer
        mapRef.current.layers
          .filter((l: any) => l.title !== 'Results')
          .forEach((l: any) => mapRef.current.remove(l));
        // Add layers
        allLayers.forEach((cfg) => {
          let layer;
          if (cfg.type === 'vector-tile') {
            layer = new VectorTileLayer({
              url: cfg.url,
              title: cfg.name,
              opacity: cfg.opacity,
              visible: cfg.visible,
            });
          } else {
            layer = new FeatureLayer({
              url: cfg.url,
              title: cfg.name,
              outFields: ['*'],
              visible: cfg.visible,
              opacity: cfg.opacity,
              labelsVisible: !cfg.labelsHiddenByDefault,
            });
          }
          mapRef.current.add(layer);
          // Add to search if feature layer with searchFields
          if (cfg.type === 'feature' && cfg.searchFields && searchWidgetRef.current) {
            searchWidgetRef.current.sources.push({
              layer,
              searchFields: cfg.searchFields,
              name: cfg.name,
              placeholder: `Search ${cfg.name}`,
              maxResults: 6,
              maxSuggestions: 6,
            });
          }
        });
      });
    } catch (err) {
      setError('Failed to load map layers.');
    }
  }, [token]);

  // Add units to map
  const addUnitsToMap = (units: Unit[]) => {
    if (!resultsLayerRef.current || !window.require) return;
    window.require(['esri/Graphic'], (Graphic: any) => {
      units.forEach(unit => {
        if (unit.current_latitude && unit.current_longitude) {
          const point = { type: 'point', longitude: unit.current_longitude, latitude: unit.current_latitude };
          const popupContent = `
            <b>Unit Number:</b> ${unit.unit_number}<br>
            <b>Unit Name:</b> ${unit.unit_name}<br>
            <b>Unit Type:</b> ${unit.unit_type}<br>
            <b>Status:</b> ${unit.status}<br>
            <b>Last Update:</b> ${unit.last_status_update}<br>
            ${unit.assigned_call_id ? `<b>Assigned Call:</b> ${unit.assigned_call_id}<br>` : ''}
          `;
          const unitGraphic = new Graphic({
            geometry: point,
            symbol: {
              type: 'simple-marker',
              color: getUnitColor(unit.status),
              size: '12px',
              outline: { color: 'white', width: 1 }
            },
            popupTemplate: { title: `Unit ${unit.unit_number}`, content: popupContent },
            attributes: { type: 'unit', unitId: unit.id }
          });
          resultsLayerRef.current.add(unitGraphic);
        }
      });
    });
  };

  // Add calls to map
  const addCallsToMap = (calls: Call[]) => {
    if (!resultsLayerRef.current || !window.require) return;
    window.require(['esri/Graphic'], (Graphic: any) => {
      calls.forEach(call => {
        const point = { type: 'point', longitude: call.longitude, latitude: call.latitude };
        const popupContent = `
          <b>Call Number:</b> ${call.call_number}<br>
          <b>Call Type:</b> ${call.call_type}<br>
          <b>Priority:</b> ${call.priority}<br>
          <b>Status:</b> ${call.status}<br>
          <b>Address:</b> ${call.address}<br>
          <b>Description:</b> ${call.description}<br>
          <b>Created:</b> ${call.created_at}<br>
          ${call.assigned_units.length > 0 ? `<b>Assigned Units:</b> ${call.assigned_units.join(', ')}<br>` : ''}
        `;
        const callGraphic = new Graphic({
          geometry: point,
          symbol: {
            type: 'simple-marker',
            color: getCallColor(call.priority),
            size: '16px',
            outline: { color: 'white', width: 2 }
          },
          popupTemplate: { title: `Call ${call.call_number}`, content: popupContent },
          attributes: { type: 'call', callId: call.id }
        });
        resultsLayerRef.current.add(callGraphic);
      });
    });
  };

  // Color helpers
  const getUnitColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'available': return '#4caf50';
      case 'busy': return '#ff9800';
      case 'responding': return '#2196f3';
      case 'on scene': return '#9c27b0';
      case 'transporting': return '#ff5722';
      default: return '#757575';
    }
  };
  const getCallColor = (priority: number): string => {
    switch (priority) {
      case 1: return '#f44336';
      case 2: return '#ff9800';
      case 3: return '#ffeb3b';
      case 4: return '#4caf50';
      default: return '#757575';
    }
  };

  // Controls
  const handleGoToLocation = () => {
    if (mapViewRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapViewRef.current.goTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 });
        },
        () => setError('Failed to get current location.')
      );
    }
  };
  const handleRefresh = () => loadMapData();
  const toggleFullscreen = () => setIsFullscreen(f => !f);
  const handleBasemapChange = (id: string) => {
    if (mapRef.current) mapRef.current.basemap = id;
    setBasemapDialogOpen(false);
  };

  return (
    <Box className={styles.mapContainer} sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
      {loading && (
        <Box className={styles.loadingOverlay}>
          <CircularProgress />
          <Typography sx={{ mt: 1 }}>Loading map...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" className={styles.errorAlert}>{error}</Alert>
      )}
      <div ref={mapDiv} style={{ height: '100%', width: '100%', flex: 1, minHeight: 0 }} />
      <Box className={styles.controlButtons}>
        <Tooltip title="My Location"><Fab size="small" onClick={handleGoToLocation} color="primary"><MyLocation /></Fab></Tooltip>
        <Tooltip title="Refresh Data"><Fab size="small" onClick={handleRefresh} color="secondary"><Refresh /></Fab></Tooltip>
        <Tooltip title="Change Basemap"><Fab size="small" onClick={() => setBasemapDialogOpen(true)} color="default"><Layers /></Fab></Tooltip>
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}><Fab size="small" onClick={toggleFullscreen}>{isFullscreen ? <FullscreenExit /> : <Fullscreen />}</Fab></Tooltip>
      </Box>
      <Dialog open={basemapDialogOpen} onClose={() => setBasemapDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select Basemap
          <IconButton aria-label="close" onClick={() => setBasemapDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {basemapOptions.map((option) => (
              <ListItem key={option.id} disablePadding>
                <ListItemButton onClick={() => handleBasemapChange(option.id)}>
                  <ListItemText primary={option.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ArcGISMap; 