import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { arcgisService } from '../services/arcgisService';
import knex from '../../config/database';

const router = Router();

// Get map configuration
router.get('/config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const mapLayers = await knex('map_layers')
      .select('*')
      .orderBy('order', 'asc')
      .orderBy('name', 'asc');

    // Separate layers by type
    const vectorTileLayers = mapLayers
      .filter(layer => layer.type === 'vectortile' || layer.type === 'vector-tile')
      .map(layer => ({
        id: layer.id,
        name: layer.name,
        type: 'vector-tile',
        url: layer.url,
        opacity: layer.opacity,
        visible: layer.visible,
        order: layer.order,
        hideByDefault: !layer.visible
      }));

    const featureLayers = mapLayers
      .filter(layer => layer.type === 'feature')
      .map(layer => ({
        id: layer.id,
        name: layer.name,
        type: 'feature',
        url: layer.url,
        opacity: layer.opacity,
        visible: layer.visible,
        order: layer.order,
        hideByDefault: !layer.visible,
        labelsHiddenByDefault: false,
        searchFields: layer.layer_id ? [layer.layer_id] : []
      }));

    const config = {
      vectorTileLayers,
      featureLayers
    };

    console.log('ArcGIS config response:', {
      totalLayers: mapLayers.length,
      vectorTileCount: vectorTileLayers.length,
      featureLayerCount: featureLayers.length
    });

    return res.json(config);
  } catch (error) {
    console.error('ArcGIS config error:', error);
    return res.status(500).json({ error: 'Failed to get map configuration' });
  }
});

// Search features
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { q, layer_id } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await arcgisService.searchFeatures(q as string, layer_id as string);
    return res.json(results);
  } catch (error) {
    console.error('ArcGIS search error:', error);
    return res.status(500).json({ error: 'Failed to search features' });
  }
});

// Geocode address
router.get('/geocode', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const results = await arcgisService.geocodeAddress(address as string);
    return res.json(results);
  } catch (error) {
    console.error('ArcGIS geocoding error:', error);
    return res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Get available layers
router.get('/layers', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const layers = await arcgisService.getLayers();
    return res.json(layers);
  } catch (error) {
    console.error('ArcGIS layers error:', error);
    return res.status(500).json({ error: 'Failed to get layers' });
  }
});

// Get layer features
router.get('/layers/:layerId/features', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { north, south, east, west } = req.query;
    
    if (!layerId) {
      return res.status(400).json({ error: 'Layer ID is required' });
    }
    
    const bounds = north && south && east && west ? {
      north: parseFloat(north as string),
      south: parseFloat(south as string),
      east: parseFloat(east as string),
      west: parseFloat(west as string)
    } : undefined;
    
    const features = await arcgisService.getLayerFeatures(layerId, bounds);
    return res.json(features);
  } catch (error) {
    console.error('ArcGIS layer features error:', error);
    return res.status(500).json({ error: 'Failed to get layer features' });
  }
});

// Reverse geocoding
router.get('/geocode/reverse', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const address = await arcgisService.reverseGeocode(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );
    
    return res.json({ address });
  } catch (error) {
    console.error('ArcGIS reverse geocoding error:', error);
    return res.status(500).json({ error: 'Failed to reverse geocode' });
  }
});

// Get layer info
router.get('/layers/:layerId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    
    if (!layerId) {
      return res.status(400).json({ error: 'Layer ID is required' });
    }
    
    const layer = await arcgisService.getLayerInfo(layerId);
    
    if (!layer) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    return res.json(layer);
  } catch (error) {
    console.error('ArcGIS layer info error:', error);
    return res.status(500).json({ error: 'Failed to get layer info' });
  }
});

// Update layer visibility
router.patch('/layers/:layerId/visibility', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { visible } = req.body;
    
    if (!layerId || typeof visible !== 'boolean') {
      return res.status(400).json({ error: 'Layer ID and visible flag are required' });
    }
    
    await arcgisService.updateLayerVisibility(layerId, visible);
    return res.json({ success: true });
  } catch (error) {
    console.error('ArcGIS layer visibility update error:', error);
    return res.status(500).json({ error: 'Failed to update layer visibility' });
  }
});

// Update layer scale
router.patch('/layers/:layerId/scale', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { minScale, maxScale } = req.body;
    
    if (!layerId) {
      return res.status(400).json({ error: 'Layer ID is required' });
    }
    
    await arcgisService.updateLayerScale(layerId, minScale, maxScale);
    return res.json({ success: true });
  } catch (error) {
    console.error('ArcGIS layer scale update error:', error);
    return res.status(500).json({ error: 'Failed to update layer scale' });
  }
});

// Update layer label
router.patch('/layers/:layerId/label', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { labelField } = req.body;
    
    if (!layerId || !labelField) {
      return res.status(400).json({ error: 'Layer ID and label field are required' });
    }
    
    await arcgisService.updateLayerLabel(layerId, labelField);
    return res.json({ success: true });
  } catch (error) {
    console.error('ArcGIS layer label update error:', error);
    return res.status(500).json({ error: 'Failed to update layer label' });
  }
});

// Update layer symbol
router.patch('/layers/:layerId/symbol', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { symbol } = req.body;
    
    if (!layerId || !symbol) {
      return res.status(400).json({ error: 'Layer ID and symbol are required' });
    }
    
    await arcgisService.updateLayerSymbol(layerId, symbol);
    return res.json({ success: true });
  } catch (error) {
    console.error('ArcGIS layer symbol update error:', error);
    return res.status(500).json({ error: 'Failed to update layer symbol' });
  }
});

// Get features by attribute
router.get('/layers/:layerId/features/attribute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { attributeName, attributeValue } = req.query;
    
    if (!layerId || !attributeName || !attributeValue) {
      return res.status(400).json({ error: 'Layer ID, attribute name, and attribute value are required' });
    }
    
    const features = await arcgisService.getFeaturesByAttribute(
      layerId,
      attributeName as string,
      attributeValue as string
    );
    
    return res.json(features);
  } catch (error) {
    console.error('ArcGIS attribute query error:', error);
    return res.status(500).json({ error: 'Failed to query features by attribute' });
  }
});

export default router; 