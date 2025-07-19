"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.active911Service = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config/config");
const logger_1 = require("../utils/logger");
class Active911Service {
    constructor() {
        this.apiKey = config_1.config.active911.apiKey || '';
        this.baseUrl = config_1.config.active911.baseUrl;
        this.isEnabled = !!this.apiKey;
    }
    async sendCallAlert(call) {
        if (!this.isEnabled) {
            logger_1.logger.warn('Active911 integration is disabled - no API key configured');
            return false;
        }
        try {
            const alertData = {
                call_id: call.id,
                call_number: call.callNumber,
                call_type: call.callType,
                priority: call.priority,
                location: call.location,
                description: call.description,
                units: call.units,
                status: call.status,
                timestamp: new Date().toISOString()
            };
            const response = await axios_1.default.post(`${this.baseUrl}/alerts/call`, alertData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 call alert sent successfully: ${call.callNumber}`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to send Active911 call alert:', error);
            return false;
        }
    }
    async sendStatusUpdate(unitId, status, location) {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const updateData = {
                unit_id: unitId,
                status,
                location,
                timestamp: new Date().toISOString()
            };
            const response = await axios_1.default.post(`${this.baseUrl}/units/status`, updateData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 status update sent for unit ${unitId}: ${status}`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to send Active911 status update:', error);
            return false;
        }
    }
    async sendEmergencyAlert(alert) {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/alerts/emergency`, alert, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 emergency alert sent: ${alert.id}`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to send Active911 emergency alert:', error);
            return false;
        }
    }
    async getDevices() {
        if (!this.isEnabled) {
            return [];
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/devices`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data.devices || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch Active911 devices:', error);
            return [];
        }
    }
    async getDeviceStatus(deviceId) {
        if (!this.isEnabled) {
            return null;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/devices/${deviceId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch Active911 device status for ${deviceId}:`, error);
            return null;
        }
    }
    async sendBulkNotification(recipients, message, type = 'general') {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const notificationData = {
                recipients,
                message,
                type,
                timestamp: new Date().toISOString()
            };
            const response = await axios_1.default.post(`${this.baseUrl}/notifications/bulk`, notificationData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 bulk notification sent to ${recipients.length} recipients`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to send Active911 bulk notification:', error);
            return false;
        }
    }
    async acknowledgeCall(callId, unitId) {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const ackData = {
                call_id: callId,
                unit_id: unitId,
                timestamp: new Date().toISOString()
            };
            const response = await axios_1.default.post(`${this.baseUrl}/calls/acknowledge`, ackData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 call acknowledgment sent: ${callId} by ${unitId}`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to send Active911 call acknowledgment:', error);
            return false;
        }
    }
    async clearCall(callId, unitId, notes) {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const clearData = {
                call_id: callId,
                unit_id: unitId,
                notes,
                timestamp: new Date().toISOString()
            };
            const response = await axios_1.default.post(`${this.baseUrl}/calls/clear`, clearData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info(`Active911 call cleared: ${callId} by ${unitId}`);
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Failed to clear Active911 call:', error);
            return false;
        }
    }
    isServiceEnabled() {
        return this.isEnabled;
    }
    async testConnection() {
        if (!this.isEnabled) {
            return false;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Active911 connection test failed:', error);
            return false;
        }
    }
}
exports.active911Service = new Active911Service();
exports.default = exports.active911Service;
//# sourceMappingURL=active911Service.js.map