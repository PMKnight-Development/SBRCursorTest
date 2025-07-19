interface Active911Device {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
    lastSeen: string;
}
interface Active911Alert {
    id: string;
    type: string;
    message: string;
    recipients: string[];
    metadata?: Record<string, any>;
}
interface Active911Call {
    id: string;
    callNumber: string;
    callType: string;
    priority: number;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    description: string;
    units: string[];
    status: string;
}
declare class Active911Service {
    private apiKey;
    private baseUrl;
    private isEnabled;
    constructor();
    sendCallAlert(call: Active911Call): Promise<boolean>;
    sendStatusUpdate(unitId: string, status: string, location?: {
        latitude: number;
        longitude: number;
    }): Promise<boolean>;
    sendEmergencyAlert(alert: Active911Alert): Promise<boolean>;
    getDevices(): Promise<Active911Device[]>;
    getDeviceStatus(deviceId: string): Promise<Active911Device | null>;
    sendBulkNotification(recipients: string[], message: string, type?: string): Promise<boolean>;
    acknowledgeCall(callId: string, unitId: string): Promise<boolean>;
    clearCall(callId: string, unitId: string, notes?: string): Promise<boolean>;
    isServiceEnabled(): boolean;
    testConnection(): Promise<boolean>;
}
export declare const active911Service: Active911Service;
export default active911Service;
//# sourceMappingURL=active911Service.d.ts.map