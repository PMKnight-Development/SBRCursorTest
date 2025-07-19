# ArcGIS Integration

This document describes the new ArcGIS-based map integration that replaces the previous Leaflet implementation.

## Overview

The new `ArcGISMap` component provides a full-featured mapping solution using the ArcGIS JavaScript API 4.31. It includes:

- **Interactive Map**: Satellite basemap with zoom, pan, and location controls
- **Layer Management**: Toggle visibility of different map layers
- **Search Functionality**: Search for features across all layers
- **Unit Tracking**: Display units with status-based colors
- **Call Management**: Show active calls with priority-based colors
- **Popup Information**: Click on features to view detailed information

## Features

### Map Controls
- **Zoom In/Out**: Standard zoom controls
- **My Location**: Center map on user's current location
- **Refresh**: Reload map data
- **Fullscreen**: Toggle fullscreen mode
- **Layer Control**: Toggle layer visibility panel

### Layer Types
- **Vector Tile Layers**: High-performance tile-based layers
- **Feature Layers**: Interactive feature layers with popups and search

### Unit Display
Units are displayed with color-coded markers based on status:
- 🟢 Green: Available
- 🟠 Orange: Busy
- 🔵 Blue: Responding
- 🟣 Purple: On Scene
- 🔴 Red: Transporting
- ⚫ Gray: Unknown/Other

### Call Display
Calls are displayed with color-coded markers based on priority:
- 🔴 Red: Emergency (Priority 1)
- 🟠 Orange: High (Priority 2)
- 🟡 Yellow: Medium (Priority 3)
- 🟢 Green: Low (Priority 4)

## Configuration

### Adding Map Layers

Map layers can be configured through the admin interface or by adding them directly to the database.

#### Via Admin Interface
1. Navigate to Admin → Map Layers
2. Click "Add Layer"
3. Fill in the required information:
   - **Name**: Display name for the layer
   - **Type**: Choose between "feature" or "vectortile"
   - **URL**: ArcGIS service URL
   - **Layer ID**: Field name for search/labels (feature layers only)
   - **Opacity**: Layer transparency (0.0 - 1.0)
   - **Visible**: Whether layer is visible by default
   - **Description**: Optional description

#### Via Database
```sql
INSERT INTO map_layers (name, type, url, layer_id, opacity, visible, description, "order")
VALUES ('My Layer', 'feature', 'https://services.arcgis.com/...', 'NAME', 0.8, true, 'Description', 1);
```

### Layer Configuration Examples

#### Vector Tile Layer
```json
{
  "name": "OpenStreetMap",
  "type": "vectortile",
  "url": "https://tiles.arcgis.com/tiles/nGt4QxSblgDfuJn0/arcgis/rest/services/OpenStreetMap/VectorTileServer",
  "opacity": 1.0,
  "visible": true,
  "order": 1
}
```

#### Feature Layer
```json
{
  "name": "Trail Routes",
  "type": "feature",
  "url": "https://services1.arcgis.com/nGt4QxSblgDfuJn0/arcgis/rest/services/Trail_Routes/FeatureServer/0",
  "layer_id": "TRAIL_NAME",
  "opacity": 0.8,
  "visible": true,
  "order": 2
}
```

## API Endpoints

### Get Map Configuration
```
GET /api/arcgis/config
```
Returns the complete map configuration including all layers.

### Search Features
```
GET /api/arcgis/search?q={query}&layer_id={layer_id}
```
Search for features across map layers.

### Geocode Address
```
GET /api/arcgis/geocode?address={address}
```
Convert address to coordinates.

### Reverse Geocode
```
GET /api/arcgis/geocode/reverse?lat={latitude}&lng={longitude}
```
Convert coordinates to address.

## Technical Details

### Dependencies
- ArcGIS JavaScript API 4.31 (loaded via CDN)
- React 18+
- Material-UI components

### Browser Compatibility
- Modern browsers with ES6+ support
- HTTPS required for ArcGIS services (except localhost)

### Performance
- Vector tile layers provide smooth performance
- Feature layers support clustering for large datasets
- Lazy loading of layer data

## Troubleshooting

### Common Issues

1. **Layers not loading**
   - Check if the ArcGIS service URL is accessible
   - Verify CORS settings on the service
   - Check browser console for errors

2. **Search not working**
   - Ensure layer has search fields configured
   - Check if the layer supports query operations

3. **Map not displaying**
   - Verify ArcGIS JavaScript API is loading
   - Check network connectivity
   - Ensure HTTPS is used (except localhost)

### Debug Mode
Enable debug logging by setting `localStorage.setItem('arcgis-debug', 'true')` in the browser console.

## Migration from Leaflet

The new ArcGIS implementation replaces the previous Leaflet-based map. Key differences:

- **Better Performance**: Vector tiles and optimized rendering
- **Enhanced Search**: Built-in search across all layers
- **Improved Popups**: Rich popup content with formatting
- **Layer Management**: Better layer control and organization
- **Mobile Support**: Touch-optimized controls

## Future Enhancements

- [ ] Real-time layer updates
- [ ] Custom symbology configuration
- [ ] Advanced filtering options
- [ ] Layer grouping
- [ ] Export functionality
- [ ] Offline support 