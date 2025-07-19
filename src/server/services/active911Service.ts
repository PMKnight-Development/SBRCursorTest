import axios from 'axios';
import { config } from '../../config/config';
import { logger } from '../utils/logger';

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

class Active911Service {
  private apiKey: string;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = config.active911.apiKey || '';
    this.baseUrl = config.active911.baseUrl;
    this.isEnabled = !!this.apiKey;
  }

  async sendCallAlert(call: Active911Call): Promise<boolean> {
    if (!this.isEnabled) {
      logger.warn('Active911 integration is disabled - no API key configured');
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

      const response = await axios.post(
        `${this.baseUrl}/alerts/call`,
        alertData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 call alert sent successfully: ${call.callNumber}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send Active911 call alert:', error);
      return false;
    }
  }

  async sendStatusUpdate(unitId: string, status: string, location?: { latitude: number; longitude: number }): Promise<boolean> {
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

      const response = await axios.post(
        `${this.baseUrl}/units/status`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 status update sent for unit ${unitId}: ${status}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send Active911 status update:', error);
      return false;
    }
  }

  async sendEmergencyAlert(alert: Active911Alert): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/alerts/emergency`,
        alert,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 emergency alert sent: ${alert.id}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send Active911 emergency alert:', error);
      return false;
    }
  }

  async getDevices(): Promise<Active911Device[]> {
    if (!this.isEnabled) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/devices`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.devices || [];
    } catch (error) {
      logger.error('Failed to fetch Active911 devices:', error);
      return [];
    }
  }

  async getDeviceStatus(deviceId: string): Promise<Active911Device | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/devices/${deviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Active911 device status for ${deviceId}:`, error);
      return null;
    }
  }

  async sendBulkNotification(recipients: string[], message: string, type: string = 'general'): Promise<boolean> {
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

      const response = await axios.post(
        `${this.baseUrl}/notifications/bulk`,
        notificationData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 bulk notification sent to ${recipients.length} recipients`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send Active911 bulk notification:', error);
      return false;
    }
  }

  async acknowledgeCall(callId: string, unitId: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const ackData = {
        call_id: callId,
        unit_id: unitId,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseUrl}/calls/acknowledge`,
        ackData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 call acknowledgment sent: ${callId} by ${unitId}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send Active911 call acknowledgment:', error);
      return false;
    }
  }

  async clearCall(callId: string, unitId: string, notes?: string): Promise<boolean> {
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

      const response = await axios.post(
        `${this.baseUrl}/calls/clear`,
        clearData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Active911 call cleared: ${callId} by ${unitId}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to clear Active911 call:', error);
      return false;
    }
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error('Active911 connection test failed:', error);
      return false;
    }
  }
}

export const active911Service = new Active911Service();
export default active911Service; 