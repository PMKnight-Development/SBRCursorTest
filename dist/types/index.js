"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportFormat = exports.ReportStatus = exports.ReportType = exports.NotificationType = exports.UpdateType = exports.POIType = exports.QuestionType = exports.CallStatus = exports.CallPriority = exports.UnitStatus = exports.UnitType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["DISPATCHER"] = "dispatcher";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPERVISOR"] = "supervisor";
    UserRole["FIELD_UNIT"] = "field_unit";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var UnitType;
(function (UnitType) {
    UnitType["EMS"] = "ems";
    UnitType["FIRE"] = "fire";
    UnitType["SECURITY"] = "security";
    UnitType["LAW_ENFORCEMENT"] = "law_enforcement";
    UnitType["SEARCH_RESCUE"] = "search_rescue";
    UnitType["SUPPORT"] = "support";
})(UnitType || (exports.UnitType = UnitType = {}));
var UnitStatus;
(function (UnitStatus) {
    UnitStatus["AVAILABLE"] = "available";
    UnitStatus["DISPATCHED"] = "dispatched";
    UnitStatus["ENROUTE"] = "enroute";
    UnitStatus["ON_SCENE"] = "on_scene";
    UnitStatus["TRANSPORTING"] = "transporting";
    UnitStatus["OUT_OF_SERVICE"] = "out_of_service";
    UnitStatus["MAINTENANCE"] = "maintenance";
    UnitStatus["TRAINING"] = "training";
})(UnitStatus || (exports.UnitStatus = UnitStatus = {}));
var CallPriority;
(function (CallPriority) {
    CallPriority[CallPriority["LOW"] = 1] = "LOW";
    CallPriority[CallPriority["MEDIUM"] = 2] = "MEDIUM";
    CallPriority[CallPriority["HIGH"] = 3] = "HIGH";
    CallPriority[CallPriority["EMERGENCY"] = 4] = "EMERGENCY";
})(CallPriority || (exports.CallPriority = CallPriority = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["PENDING"] = "pending";
    CallStatus["DISPATCHED"] = "dispatched";
    CallStatus["ENROUTE"] = "enroute";
    CallStatus["ON_SCENE"] = "on_scene";
    CallStatus["CLEARED"] = "cleared";
    CallStatus["CANCELLED"] = "cancelled";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["TEXT"] = "text";
    QuestionType["NUMBER"] = "number";
    QuestionType["BOOLEAN"] = "boolean";
    QuestionType["SELECT"] = "select";
    QuestionType["MULTI_SELECT"] = "multi_select";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var POIType;
(function (POIType) {
    POIType["BUILDING"] = "building";
    POIType["TRAIL"] = "trail";
    POIType["CAMP_SITE"] = "camp_site";
    POIType["ACTIVITY_AREA"] = "activity_area";
    POIType["PARKING"] = "parking";
    POIType["EMERGENCY_EXIT"] = "emergency_exit";
    POIType["WATER_SOURCE"] = "water_source";
    POIType["OTHER"] = "other";
})(POIType || (exports.POIType = POIType = {}));
var UpdateType;
(function (UpdateType) {
    UpdateType["STATUS_CHANGE"] = "status_change";
    UpdateType["UNIT_ASSIGNMENT"] = "unit_assignment";
    UpdateType["LOCATION_UPDATE"] = "location_update";
    UpdateType["DESCRIPTION_UPDATE"] = "description_update";
    UpdateType["PRIORITY_CHANGE"] = "priority_change";
    UpdateType["GENERAL_UPDATE"] = "general_update";
})(UpdateType || (exports.UpdateType = UpdateType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["CALL_ASSIGNED"] = "call_assigned";
    NotificationType["STATUS_UPDATE"] = "status_update";
    NotificationType["UNIT_AVAILABLE"] = "unit_available";
    NotificationType["SYSTEM_ALERT"] = "system_alert";
    NotificationType["MAINTENANCE"] = "maintenance";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ReportType;
(function (ReportType) {
    ReportType["CALL_VOLUME"] = "call_volume";
    ReportType["RESPONSE_TIMES"] = "response_times";
    ReportType["UNIT_PERFORMANCE"] = "unit_performance";
    ReportType["INCIDENT_SUMMARY"] = "incident_summary";
    ReportType["CUSTOM"] = "custom";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["GENERATING"] = "generating";
    ReportStatus["COMPLETED"] = "completed";
    ReportStatus["FAILED"] = "failed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["PDF"] = "pdf";
    ReportFormat["EXCEL"] = "excel";
    ReportFormat["CSV"] = "csv";
    ReportFormat["JSON"] = "json";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
//# sourceMappingURL=index.js.map