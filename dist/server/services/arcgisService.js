"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arcgisService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config/config");
const logger_1 = require("../utils/logger");
class ArcGISService {
    constructor() {
        this.layers = [];
        this.apiKey = config_1.config.arcgis.apiKey || '';
        this.baseUrl = config_1.config.arcgis.baseUrl;
        this.initializeLayers();
    }
    initializeLayers() {
        this.layers = [
            {
                id: 'buildings',
                name: 'Buildings',
                type: 'feature',
                url: `${this.baseUrl}/buildings/FeatureServer/0`,
                visible: true,
                minScale: 1000,
                maxScale: 0,
                labelField: 'NAME',
                symbol: {
                    type: 'point',
                    color: '#4CAF50',
                    size: 8
                }
            },
            {
                id: 'trails',
                name: 'Trails',
                type: 'feature',
                url: `${this.baseUrl}/trails/FeatureServer/0`,
                visible: true,
                minScale: 5000,
                maxScale: 0,
                labelField: 'TRAIL_NAME',
                symbol: {
                    type: 'line',
                    color: '#2196F3',
                    size: 2
                }
            },
            {
                id: 'camp_sites',
                name: 'Camp Sites',
                type: 'feature',
                url: `${this.baseUrl}/camp_sites/FeatureServer/0`,
                visible: true,
                minScale: 2000,
                maxScale: 0,
                labelField: 'SITE_NAME',
                symbol: {
                    type: 'point',
                    color: '#FF9800',
                    size: 10
                }
            },
            {
                id: 'emergency_exits',
                name: 'Emergency Exits',
                type: 'feature',
                url: `${this.baseUrl}/emergency_exits/FeatureServer/0`,
                visible: true,
                minScale: 1000,
                maxScale: 0,
                labelField: 'EXIT_NAME',
                symbol: {
                    type: 'point',
                    color: '#F44336',
                    size: 12
                }
            },
            {
                id: 'water_sources',
                name: 'Water Sources',
                type: 'feature',
                url: `${this.baseUrl}/water_sources/FeatureServer/0`,
                visible: true,
                minScale: 2000,
                maxScale: 0,
                labelField: 'SOURCE_NAME',
                symbol: {
                    type: 'point',
                    color: '#00BCD4',
                    size: 8
                }
            },
            {
                id: 'base_map',
                name: 'Base Map',
                type: 'vector-tile',
                url: `${this.baseUrl}/base_map/VectorTileServer`,
                visible: true
            }
        ];
    }
    async getLayers() {
        return this.layers;
    }
    async getLayerFeatures(layerId, bounds) {
        try {
            const layer = this.layers.find(l => l.id === layerId);
            if (!layer) {
                throw new Error(`Layer ${layerId} not found`);
            }
            if (layer.type === 'vector-tile') {
                return [];
            }
            const queryUrl = `${layer.url}/query`;
            const params = {
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
            const response = await axios_1.default.get(queryUrl, { params });
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
        }
        catch (error) {
            logger_1.logger.error('ArcGIS layer features fetch failed:', error);
            return [];
        }
    }
    async geocodeAddress(address) {
        try {
            const geocodeUrl = `${this.baseUrl}/geocode`;
            const params = {
                f: 'json',
                token: this.apiKey,
                singleLine: address,
                outFields: 'Match_addr,Addr_type,Score',
                maxLocations: 10
            };
            const response = await axios_1.default.get(geocodeUrl, { params });
            if (response.data.candidates && response.data.candidates.length > 0) {
                return response.data.candidates.map((candidate) => ({
                    latitude: candidate.location.y,
                    longitude: candidate.location.x,
                    address: candidate.address,
                    score: candidate.score
                }));
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('ArcGIS geocoding failed:', error);
            return [];
        }
    }
    async reverseGeocode(latitude, longitude) {
        try {
            const geocodeUrl = `${this.baseUrl}/geocode/reverse`;
            const params = {
                f: 'json',
                token: this.apiKey,
                location: JSON.stringify({ x: longitude, y: latitude }),
                outFields: 'Address,City,State,Zip'
            };
            const response = await axios_1.default.get(geocodeUrl, { params });
            if (response.data.address) {
                return response.data.address.Match_addr || response.data.address.Address;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('ArcGIS reverse geocoding failed:', error);
            return null;
        }
    }
    async searchFeatures(query, layerId) {
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
            const response = await axios_1.default.get(searchUrl, { params });
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
        }
        catch (error) {
            logger_1.logger.error('ArcGIS feature search failed:', error);
            return [];
        }
    }
    async getLayerInfo(layerId) {
        return this.layers.find(l => l.id === layerId) || null;
    }
    async updateLayerVisibility(layerId, visible) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = visible;
        }
    }
    async updateLayerScale(layerId, minScale, maxScale) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            if (minScale !== undefined)
                layer.minScale = minScale;
            if (maxScale !== undefined)
                layer.maxScale = maxScale;
        }
    }
    async updateLayerLabel(layerId, labelField) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.labelField = labelField;
        }
    }
    async updateLayerSymbol(layerId, symbol) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.symbol = symbol;
        }
    }
    async getFeaturesByAttribute(layerId, attributeName, attributeValue) {
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
            const response = await axios_1.default.get(queryUrl, { params });
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
        }
        catch (error) {
            logger_1.logger.error('ArcGIS attribute query failed:', error);
            return [];
        }
    }
}
exports.arcgisService = new ArcGISService();
exports.default = exports.arcgisService;
//# sourceMappingURL=arcgisService.js.map