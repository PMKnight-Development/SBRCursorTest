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
interface GeocodingResult {
    latitude: number;
    longitude: number;
    address: string;
    score: number;
}
declare class ArcGISService {
    private apiKey;
    private baseUrl;
    private layers;
    constructor();
    private initializeLayers;
    getLayers(): Promise<ArcGISLayer[]>;
    getLayerFeatures(layerId: string, bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    }): Promise<ArcGISFeature[]>;
    geocodeAddress(address: string): Promise<GeocodingResult[]>;
    reverseGeocode(latitude: number, longitude: number): Promise<string | null>;
    searchFeatures(query: string, layerId?: string): Promise<ArcGISFeature[]>;
    getLayerInfo(layerId: string): Promise<ArcGISLayer | null>;
    updateLayerVisibility(layerId: string, visible: boolean): Promise<void>;
    updateLayerScale(layerId: string, minScale?: number, maxScale?: number): Promise<void>;
    updateLayerLabel(layerId: string, labelField: string): Promise<void>;
    updateLayerSymbol(layerId: string, symbol: {
        type: string;
        color: string;
        size: number;
    }): Promise<void>;
    getFeaturesByAttribute(layerId: string, attributeName: string, attributeValue: string): Promise<ArcGISFeature[]>;
}
export declare const arcgisService: ArcGISService;
export default arcgisService;
//# sourceMappingURL=arcgisService.d.ts.map