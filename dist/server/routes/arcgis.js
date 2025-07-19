"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const arcgisService_1 = require("../services/arcgisService");
const router = (0, express_1.Router)();
router.get('/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q, layer_id } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const results = await arcgisService_1.arcgisService.searchFeatures(q, layer_id);
        return res.json(results);
    }
    catch (error) {
        console.error('ArcGIS search error:', error);
        return res.status(500).json({ error: 'Failed to search features' });
    }
});
router.get('/geocode', auth_1.authenticateToken, async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }
        const results = await arcgisService_1.arcgisService.geocodeAddress(address);
        return res.json(results);
    }
    catch (error) {
        console.error('ArcGIS geocoding error:', error);
        return res.status(500).json({ error: 'Failed to geocode address' });
    }
});
router.get('/layers', auth_1.authenticateToken, async (_req, res) => {
    try {
        const layers = await arcgisService_1.arcgisService.getLayers();
        return res.json(layers);
    }
    catch (error) {
        console.error('ArcGIS layers error:', error);
        return res.status(500).json({ error: 'Failed to get layers' });
    }
});
router.get('/layers/:layerId/features', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { north, south, east, west } = req.query;
        if (!layerId) {
            return res.status(400).json({ error: 'Layer ID is required' });
        }
        const bounds = north && south && east && west ? {
            north: parseFloat(north),
            south: parseFloat(south),
            east: parseFloat(east),
            west: parseFloat(west)
        } : undefined;
        const features = await arcgisService_1.arcgisService.getLayerFeatures(layerId, bounds);
        return res.json(features);
    }
    catch (error) {
        console.error('ArcGIS layer features error:', error);
        return res.status(500).json({ error: 'Failed to get layer features' });
    }
});
router.get('/geocode/reverse', auth_1.authenticateToken, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        const address = await arcgisService_1.arcgisService.reverseGeocode(parseFloat(lat), parseFloat(lng));
        return res.json({ address });
    }
    catch (error) {
        console.error('ArcGIS reverse geocoding error:', error);
        return res.status(500).json({ error: 'Failed to reverse geocode' });
    }
});
router.get('/layers/:layerId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        if (!layerId) {
            return res.status(400).json({ error: 'Layer ID is required' });
        }
        const layer = await arcgisService_1.arcgisService.getLayerInfo(layerId);
        if (!layer) {
            return res.status(404).json({ error: 'Layer not found' });
        }
        return res.json(layer);
    }
    catch (error) {
        console.error('ArcGIS layer info error:', error);
        return res.status(500).json({ error: 'Failed to get layer info' });
    }
});
router.patch('/layers/:layerId/visibility', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { visible } = req.body;
        if (!layerId || typeof visible !== 'boolean') {
            return res.status(400).json({ error: 'Layer ID and visible flag are required' });
        }
        await arcgisService_1.arcgisService.updateLayerVisibility(layerId, visible);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('ArcGIS layer visibility update error:', error);
        return res.status(500).json({ error: 'Failed to update layer visibility' });
    }
});
router.patch('/layers/:layerId/scale', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { minScale, maxScale } = req.body;
        if (!layerId) {
            return res.status(400).json({ error: 'Layer ID is required' });
        }
        await arcgisService_1.arcgisService.updateLayerScale(layerId, minScale, maxScale);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('ArcGIS layer scale update error:', error);
        return res.status(500).json({ error: 'Failed to update layer scale' });
    }
});
router.patch('/layers/:layerId/label', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { labelField } = req.body;
        if (!layerId || !labelField) {
            return res.status(400).json({ error: 'Layer ID and label field are required' });
        }
        await arcgisService_1.arcgisService.updateLayerLabel(layerId, labelField);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('ArcGIS layer label update error:', error);
        return res.status(500).json({ error: 'Failed to update layer label' });
    }
});
router.patch('/layers/:layerId/symbol', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { symbol } = req.body;
        if (!layerId || !symbol) {
            return res.status(400).json({ error: 'Layer ID and symbol are required' });
        }
        await arcgisService_1.arcgisService.updateLayerSymbol(layerId, symbol);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('ArcGIS layer symbol update error:', error);
        return res.status(500).json({ error: 'Failed to update layer symbol' });
    }
});
router.get('/layers/:layerId/features/attribute', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layerId } = req.params;
        const { attributeName, attributeValue } = req.query;
        if (!layerId || !attributeName || !attributeValue) {
            return res.status(400).json({ error: 'Layer ID, attribute name, and attribute value are required' });
        }
        const features = await arcgisService_1.arcgisService.getFeaturesByAttribute(layerId, attributeName, attributeValue);
        return res.json(features);
    }
    catch (error) {
        console.error('ArcGIS attribute query error:', error);
        return res.status(500).json({ error: 'Failed to query features by attribute' });
    }
});
exports.default = router;
//# sourceMappingURL=arcgis.js.map