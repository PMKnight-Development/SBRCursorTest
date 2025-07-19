# ArcGIS Map Features

The SBR CAD system now uses ArcGIS maps with built-in modules and widgets for enhanced functionality.

## Built-in ArcGIS Widgets

### Navigation Widgets
- **Home Widget**: Returns to the default map extent
- **Zoom Widget**: Standard zoom in/out controls
- **Compass Widget**: Shows map rotation and allows resetting orientation

### Search and Location
- **Search Widget**: Advanced search with geocoding capabilities
  - Searches addresses, places, and coordinates
  - Includes suggestions and autocomplete
  - Integrated with ArcGIS World Geocoding Service
- **My Location**: Uses browser geolocation to center map on user's location

### Layer Management
- **LayerList Widget**: Built-in layer management with:
  - Layer visibility toggles
  - Layer ordering
  - Legend display
  - Layer information panels
- **Basemap Gallery**: Switch between different basemaps
- **Basemap Toggle**: Quick toggle between current and satellite basemaps

### Measurement and Analysis
- **Measurement Widget**: Measure distances and areas
- **Coordinate Conversion**: Convert between coordinate systems
- **Feature Table**: View and edit feature attributes

### Map Configuration
The map loads layers from the database `map_layers` table, supporting:
- **Feature Layers**: Point, line, and polygon features with attributes
- **Vector Tile Layers**: High-performance tile-based layers
- **Custom Search Fields**: Configurable searchable attributes per layer

## Real-time Features
- Live unit tracking with status-based color coding
- Active call display with priority-based symbols
- Real-time data refresh capabilities
- WebSocket integration for live updates

## Custom Controls
- **Refresh Data**: Manually refresh map data
- **Fullscreen Toggle**: Enter/exit fullscreen mode
- **Live Data Indicator**: Visual indicator for real-time data status

## Technical Implementation
- Uses ArcGIS JavaScript API 4.31
- Responsive design with Material-UI components
- TypeScript for type safety
- RESTful API integration for data management
- Database-driven layer configuration

## Configuration
Map layers are configured through the admin interface and stored in the database with:
- Layer name and type
- Service URL
- Visibility settings
- Opacity controls
- Search field configuration
- Display order

The system automatically loads and configures layers based on the database configuration, providing a flexible and maintainable mapping solution. 