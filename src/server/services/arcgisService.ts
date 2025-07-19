import axios from 'axios';
import { config } from '../../config/config';
import { logger } from '../utils/logger';

interface ArcGISFeature {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  description?: string;
  attributes: Record<string, any>;
}

interface ArcGISLayer {
  id: string;
  name: string;
  type: 'feature' | 'vector-tile';
  url: string;
  visible: boolean;
  minScale?: number;
  maxScale?: number;
  labelField?: string;
  symbol?: {
    type: string;
    color: string;
    size: number;
  };
}

interface ArcGISSearchResult {
  features: Array<{
    attributes: Record<string, any>;
    geometry: {
      x: number;
      y: number;
    };
  }>;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  score: number;
}

class ArcGISService {
  private apiKey: string;
  private baseUrl: string;
  private layers: ArcGISLayer[] = [];

  constructor() {
    this.apiKey = config.arcgis.apiKey || '';
    this.baseUrl = config.arcgis.baseUrl;
    this.initializeLayers();
  }

  private initializeLayers() {
    // Initialize empty layers array - layers will be added via admin interface
    this.layers = [];
  }

  async getLayers(): Promise<ArcGISLayer[]> {
    return this.layers;
  }

  async getLayerFeatures(layerId: string, bounds?: { north: number; south: number; east: number; west: number }): Promise<ArcGISFeature[]> {
    try {
      const layer = this.layers.find(l => l.id === layerId);
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`);
      }

      if (layer.type === 'vector-tile') {
        // Vector tile layers don't support feature queries
        return [];
      }

      const queryUrl = `${layer.url}/query`;
      const params: any = {
        f: 'json',
        token: this.apiKey,
        returnGeometry: true,
        outFields: '*'
      };

      if (bounds) {
        params.geometry = JSON.stringify({
          xmin: bounds.west,
          ymin: bounds.south,
          xmax: bounds.east,
          ymax: bounds.north,
          spatialReference: { wkid: 4326 }
        });
        params.geometryType = 'esriGeometryEnvelope';
        params.spatialRel = 'esriSpatialRelIntersects';
      }

      const response = await axios.get<ArcGISSearchResult>(queryUrl, { params });
      
      return response.data.features.map(feature => {
        const attributes = feature.attributes;
        return {
          id: attributes['OBJECTID'] || attributes['FID'] || `${feature.geometry.x}_${feature.geometry.y}`,
          name: attributes['NAME'] || attributes['NAME_1'] || attributes['TRAIL_NAME'] || attributes['SITE_NAME'] || attributes['EXIT_NAME'] || attributes['SOURCE_NAME'] || 'Unknown',
          type: layer.name.toLowerCase(),
          latitude: feature.geometry.y,
          longitude: feature.geometry.x,
          description: attributes['DESCRIPTION'] || attributes['COMMENTS'] || '',
          attributes: attributes
        };
      });
    } catch (error) {
      logger.error('ArcGIS layer features fetch failed:', error);
      return [];
    }
  }

  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    try {
      const geocodeUrl = `${this.baseUrl}/geocode`;
      const params = {
        f: 'json',
        token: this.apiKey,
        singleLine: address,
        outFields: 'Match_addr,Addr_type,Score',
        maxLocations: 10
      };

      const response = await axios.get(geocodeUrl, { params });
      
      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates.map((candidate: any) => ({
          latitude: candidate.location.y,
          longitude: candidate.location.x,
          address: candidate.address,
          score: candidate.score
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('ArcGIS geocoding failed:', error);
      return [];
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const geocodeUrl = `${this.baseUrl}/geocode/reverse`;
      const params = {
        f: 'json',
        token: this.apiKey,
        location: JSON.stringify({ x: longitude, y: latitude }),
        outFields: 'Address,City,State,Zip'
      };

      const response = await axios.get(geocodeUrl, { params });
      
      if (response.data.address) {
        return response.data.address.Match_addr || response.data.address.Address;
      }
      
      return null;
    } catch (error) {
      logger.error('ArcGIS reverse geocoding failed:', error);
      return null;
    }
  }

  async searchFeatures(query: string, layerId?: string): Promise<ArcGISFeature[]> {
    try {
      const searchUrl = `${this.baseUrl}/search`;
      const params = {
        f: 'json',
        token: this.apiKey,
        q: query,
        layers: layerId || 'all',
        returnGeometry: true,
        outFields: '*'
      };

      const response = await axios.get<ArcGISSearchResult>(searchUrl, { params });
      
      return response.data.features.map(feature => {
        const attributes = feature.attributes;
        return {
          id: attributes['OBJECTID'] || attributes['FID'] || `${feature.geometry.x}_${feature.geometry.y}`,
          name: attributes['NAME'] || attributes['NAME_1'] || attributes['TRAIL_NAME'] || attributes['SITE_NAME'] || attributes['EXIT_NAME'] || attributes['SOURCE_NAME'] || 'Unknown',
          type: 'feature',
          latitude: feature.geometry.y,
          longitude: feature.geometry.x,
          description: attributes['DESCRIPTION'] || attributes['COMMENTS'] || '',
          attributes: attributes
        };
      });
    } catch (error) {
      logger.error('ArcGIS feature search failed:', error);
      return [];
    }
  }

  async getLayerInfo(layerId: string): Promise<ArcGISLayer | null> {
    return this.layers.find(l => l.id === layerId) || null;
  }

  async updateLayerVisibility(layerId: string, visible: boolean): Promise<void> {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = visible;
    }
  }

  async updateLayerScale(layerId: string, minScale?: number, maxScale?: number): Promise<void> {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      if (minScale !== undefined) layer.minScale = minScale;
      if (maxScale !== undefined) layer.maxScale = maxScale;
    }
  }

  async updateLayerLabel(layerId: string, labelField: string): Promise<void> {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.labelField = labelField;
    }
  }

  async updateLayerSymbol(layerId: string, symbol: { type: string; color: string; size: number }): Promise<void> {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.symbol = symbol;
    }
  }

  async getFeaturesByAttribute(layerId: string, attributeName: string, attributeValue: string): Promise<ArcGISFeature[]> {
    try {
      const layer = this.layers.find(l => l.id === layerId);
      if (!layer || layer.type === 'vector-tile') {
        return [];
      }

      const queryUrl = `${layer.url}/query`;
      const params = {
        f: 'json',
        token: this.apiKey,
        where: `${attributeName} = '${attributeValue}'`,
        returnGeometry: true,
        outFields: '*'
      };

      const response = await axios.get<ArcGISSearchResult>(queryUrl, { params });
      
      return response.data.features.map(feature => {
        const attributes = feature.attributes;
        return {
          id: attributes['OBJECTID'] || attributes['FID'] || `${feature.geometry.x}_${feature.geometry.y}`,
          name: attributes['NAME'] || attributes['NAME_1'] || attributes['TRAIL_NAME'] || attributes['SITE_NAME'] || attributes['EXIT_NAME'] || attributes['SOURCE_NAME'] || 'Unknown',
          type: layer.name.toLowerCase(),
          latitude: feature.geometry.y,
          longitude: feature.geometry.x,
          description: attributes['DESCRIPTION'] || attributes['COMMENTS'] || '',
          attributes: attributes
        };
      });
    } catch (error) {
      logger.error('ArcGIS attribute query failed:', error);
      return [];
    }
  }
}

export const arcgisService = new ArcGISService();
export default arcgisService; 