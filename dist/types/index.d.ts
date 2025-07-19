export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    unitId?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    DISPATCHER = "dispatcher",
    ADMIN = "admin",
    SUPERVISOR = "supervisor",
    FIELD_UNIT = "field_unit",
    VIEWER = "viewer"
}
export interface Unit {
    id: string;
    unitNumber: string;
    unitName: string;
    unitType: UnitType;
    groupId: string;
    status: UnitStatus;
    currentLocation?: GPSLocation;
    assignedCallId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastStatusUpdate?: Date;
    lastLocationUpdate?: Date;
}
export declare enum UnitType {
    EMS = "ems",
    FIRE = "fire",
    SECURITY = "security",
    LAW_ENFORCEMENT = "law_enforcement",
    SEARCH_RESCUE = "search_rescue",
    SUPPORT = "support"
}
export declare enum UnitStatus {
    AVAILABLE = "available",
    DISPATCHED = "dispatched",
    ENROUTE = "enroute",
    ON_SCENE = "on_scene",
    TRANSPORTING = "transporting",
    OUT_OF_SERVICE = "out_of_service",
    MAINTENANCE = "maintenance",
    TRAINING = "training"
}
export interface UnitGroup {
    id: string;
    groupName: string;
    groupType: UnitType;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Call {
    id: string;
    callNumber: string;
    callTypeId: string;
    priority: CallPriority;
    status: CallStatus;
    location: CallLocation;
    callerInfo: CallerInfo;
    description: string;
    assignedUnits: string[];
    dispatcherId: string;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
    estimatedArrivalTime?: Date;
    actualArrivalTime?: Date;
    clearedTime?: Date;
}
export declare enum CallPriority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    EMERGENCY = 4
}
export declare enum CallStatus {
    PENDING = "pending",
    DISPATCHED = "dispatched",
    ENROUTE = "enroute",
    ON_SCENE = "on_scene",
    CLEARED = "cleared",
    CANCELLED = "cancelled"
}
export interface CallLocation {
    latitude: number;
    longitude: number;
    address?: string;
    poiId?: string;
    notes?: string;
}
export interface CallerInfo {
    name?: string;
    phoneNumber?: string;
    callbackNumber?: string;
    isAnonymous: boolean;
}
export interface CallType {
    id: string;
    name: string;
    description?: string;
    defaultPriority: CallPriority;
    responsePlan?: string;
    protocolQuestions?: ProtocolQuestion[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProtocolQuestion {
    id: string;
    question: string;
    type: QuestionType;
    required: boolean;
    options?: string[];
    order: number;
}
export declare enum QuestionType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    SELECT = "select",
    MULTI_SELECT = "multi_select"
}
export interface GPSLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Date;
}
export interface PointOfInterest {
    id: string;
    name: string;
    type: POIType;
    location: GPSLocation;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum POIType {
    BUILDING = "building",
    TRAIL = "trail",
    CAMP_SITE = "camp_site",
    ACTIVITY_AREA = "activity_area",
    PARKING = "parking",
    EMERGENCY_EXIT = "emergency_exit",
    WATER_SOURCE = "water_source",
    OTHER = "other"
}
export interface CallUpdate {
    id: string;
    callId: string;
    userId: string;
    updateType: UpdateType;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare enum UpdateType {
    STATUS_CHANGE = "status_change",
    UNIT_ASSIGNMENT = "unit_assignment",
    LOCATION_UPDATE = "location_update",
    DESCRIPTION_UPDATE = "description_update",
    PRIORITY_CHANGE = "priority_change",
    GENERAL_UPDATE = "general_update"
}
export interface SystemConfig {
    id: string;
    key: string;
    value: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    recipientId?: string;
    recipientGroup?: string;
    metadata?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}
export declare enum NotificationType {
    CALL_ASSIGNED = "call_assigned",
    STATUS_UPDATE = "status_update",
    UNIT_AVAILABLE = "unit_available",
    SYSTEM_ALERT = "system_alert",
    MAINTENANCE = "maintenance"
}
export interface Report {
    id: string;
    name: string;
    type: ReportType;
    parameters: ReportParameters;
    generatedBy: string;
    status: ReportStatus;
    filePath?: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare enum ReportType {
    CALL_VOLUME = "call_volume",
    RESPONSE_TIMES = "response_times",
    UNIT_PERFORMANCE = "unit_performance",
    INCIDENT_SUMMARY = "incident_summary",
    CUSTOM = "custom"
}
export declare enum ReportStatus {
    PENDING = "pending",
    GENERATING = "generating",
    COMPLETED = "completed",
    FAILED = "failed"
}
export interface ReportParameters {
    startDate: Date;
    endDate: Date;
    unitIds?: string[];
    callTypeIds?: string[];
    statuses?: CallStatus[];
    format: ReportFormat;
}
export declare enum ReportFormat {
    PDF = "pdf",
    EXCEL = "excel",
    CSV = "csv",
    JSON = "json"
}
export interface CreateCallRequest {
    callTypeId: string;
    priority: CallPriority;
    location: CallLocation;
    callerInfo: CallerInfo;
    description: string;
    assignedUnits?: string[];
}
export interface UpdateCallRequest {
    callTypeId?: string;
    priority?: CallPriority;
    location?: CallLocation;
    callerInfo?: CallerInfo;
    description?: string;
    assignedUnits?: string[];
    status?: CallStatus;
}
export interface CreateUnitRequest {
    unitNumber: string;
    unitName: string;
    unitType: UnitType;
    groupId: string;
}
export interface UpdateUnitRequest {
    unitNumber?: string;
    unitName?: string;
    unitType?: UnitType;
    groupId?: string;
    status?: UnitStatus;
    isActive?: boolean;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: Date;
}
export interface WebSocketEvent {
    type: string;
    data: any;
    timestamp: Date;
}
export interface CallEvent extends WebSocketEvent {
    type: 'call_created' | 'call_updated' | 'call_closed';
    data: Call;
}
export interface UnitEvent extends WebSocketEvent {
    type: 'unit_status_changed' | 'unit_location_updated';
    data: Unit;
}
export interface NotificationEvent extends WebSocketEvent {
    type: 'notification';
    data: Notification;
}
export interface DashboardStats {
    activeCalls: number;
    availableUnits: number;
    totalUnits: number;
    callsToday: number;
    averageResponseTime: number;
    unitsByStatus: Record<UnitStatus, number>;
    callsByPriority: Record<CallPriority, number>;
}
export interface MapData {
    units: Unit[];
    activeCalls: Call[];
    pois: PointOfInterest[];
}
export interface CallSearchParams {
    startDate?: Date;
    endDate?: Date;
    status?: CallStatus[];
    priority?: CallPriority[];
    callTypeIds?: string[];
    unitIds?: string[];
    dispatcherId?: string;
    limit?: number;
    offset?: number;
}
export interface UnitSearchParams {
    status?: UnitStatus[];
    unitType?: UnitType[];
    groupId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=index.d.ts.map