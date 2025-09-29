import { supabase } from "@/integrations/supabase/client";
import { FaceDetectionResult } from "./faceDetection";

export interface AlertNotification {
  id: string;
  type: 'face_detection' | 'unknown_person' | 'known_person' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  data?: Record<string, any>;
  acknowledged: boolean;
  evidenceUrl?: string;
}

export class AlertSystem {
  private audioContext?: AudioContext;
  private notificationSound?: AudioBuffer;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      
      // Load notification sound
      const response = await fetch('/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.notificationSound = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  async processDetection(detection: FaceDetectionResult, cameraName: string): Promise<void> {
    // Get user settings for alerts
    const { data: config } = await supabase
      .from('face_recognition_config')
      .select('*')
      .single();

    if (!config) return;

    const unknownFaces = detection.faces.filter(face => !face.knownPersonId);
    const knownFaces = detection.faces.filter(face => face.knownPersonId);

    // Process unknown faces
    if (unknownFaces.length > 0 && config.visual_alerts_enabled) {
      await this.createAlert({
        type: 'unknown_person',
        severity: unknownFaces.some(f => f.confidence > 0.9) ? 'high' : 'medium',
        message: `${unknownFaces.length} unknown ${unknownFaces.length === 1 ? 'person' : 'people'} detected`,
        cameraId: detection.cameraId,
        cameraName,
        timestamp: detection.timestamp,
        data: { faces: unknownFaces, screenshot: detection.imageData },
        acknowledged: false,
      });
    }

    // Process known faces
    if (knownFaces.length > 0 && config.visual_alerts_enabled) {
      for (const face of knownFaces) {
        await this.createAlert({
          type: 'known_person',
          severity: 'low',
          message: `${face.knownPersonName} detected`,
          cameraId: detection.cameraId,
          cameraName,
          timestamp: detection.timestamp,
          data: { face, screenshot: detection.imageData },
          acknowledged: false,
        });
      }
    }

    // Store detection event
    await this.storeDetectionEvent(detection, cameraName);

    // Play sound notification if enabled
    if (config.audio_alerts_enabled && (unknownFaces.length > 0 || knownFaces.length > 0)) {
      this.playNotificationSound();
    }

    // Send Telegram notification if enabled and configured
    if (config.telegram_notifications_enabled && config.telegram_bot_token && config.telegram_chat_id) {
      await this.sendTelegramNotification(detection, cameraName, config);
    }
  }

  private async createAlert(alert: Omit<AlertNotification, 'id'>): Promise<void> {
    try {
      // Store evidence screenshot if provided
      let evidenceUrl: string | undefined;
      if (alert.data?.screenshot) {
        evidenceUrl = await this.storeEvidence(alert.data.screenshot, alert.cameraId);
      }

      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First create a detection event
      const { data: eventData, error: eventError } = await supabase
        .from('face_detection_events')
        .insert({
          user_id: user.id,
          camera_id: alert.cameraId,
          camera_name: alert.cameraName,
          event_timestamp: alert.timestamp.toISOString(),
          confidence_score: 0.8, // Default confidence
        })
        .select('id')
        .single();

      if (eventError || !eventData) {
        console.error('Failed to create detection event:', eventError);
        return;
      }


      // Store alert in database
      const { error } = await supabase
        .from('alert_notifications')
        .insert({
          detection_event_id: eventData.id,
          user_id: user.id,
          notification_type: alert.type,
          notification_data: {
            severity: alert.severity,
            message: alert.message,
            cameraId: alert.cameraId,
            cameraName: alert.cameraName,
            timestamp: alert.timestamp.toISOString(),
            data: alert.data,
            evidenceUrl,
          },
          notification_status: 'pending',
        });

      if (error) {
        console.error('Failed to store alert:', error);
      }

      // Show browser notification if permission granted
      this.showBrowserNotification(alert);

    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  private async storeEvidence(screenshot: string, cameraId: string): Promise<string | undefined> {
    try {
      // Convert base64 to blob
      const response = await fetch(screenshot);
      const blob = await response.blob();
      
      const fileName = `evidence/${cameraId}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Failed to store evidence:', error);
        return undefined;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('evidence')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to store evidence:', error);
      return undefined;
    }
  }

  private async storeDetectionEvent(detection: FaceDetectionResult, cameraName: string): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const face of detection.faces) {
        await supabase
          .from('face_detection_events')
          .insert({
            user_id: user.id,
            camera_id: detection.cameraId,
            camera_name: cameraName,
            event_timestamp: detection.timestamp.toISOString(),
            detected_name: face.knownPersonName,
            confidence_score: face.confidence,
            estimated_age: face.ageEstimate,
            estimated_gender: face.genderEstimate,
            bounding_box: {
              x: face.x,
              y: face.y,
              width: face.width,
              height: face.height,
            },
          });
      }
    } catch (error) {
      console.error('Failed to store detection event:', error);
    }
  }

  private playNotificationSound(): void {
    if (!this.audioContext || !this.notificationSound) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.notificationSound;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private showBrowserNotification(alert: Omit<AlertNotification, 'id'>): void {
    if (Notification.permission === 'granted') {
      new Notification(`Skylark Security Alert`, {
        body: `${alert.message} at ${alert.cameraName}`,
        icon: '/favicon.png',
        tag: alert.cameraId,
      });
    }
  }

  private async sendTelegramNotification(
    detection: FaceDetectionResult, 
    cameraName: string, 
    config: any
  ): Promise<void> {
    try {
      await supabase.functions.invoke('send-telegram-notification', {
        body: {
          botToken: config.telegram_bot_token,
          chatId: config.telegram_chat_id,
          message: `🚨 Face Detection Alert\n\n📍 Camera: ${cameraName}\n👥 Faces detected: ${detection.faces.length}\n⏰ Time: ${detection.timestamp.toLocaleString()}\n\nConfidence levels: ${detection.faces.map(f => `${Math.round(f.confidence * 100)}%`).join(', ')}`,
          imageData: detection.imageData,
        },
      });
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('alert_notifications')
        .update({ notification_status: 'acknowledged' })
        .eq('id', alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  async getRecentAlerts(limit = 50): Promise<AlertNotification[]> {
    try {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch alerts:', error);
        return [];
      }

      return data.map(alert => {
        const notificationData = alert.notification_data as any || {};
        return {
          id: alert.id,
          type: alert.notification_type as any,
          severity: notificationData.severity || 'medium',
          message: notificationData.message || 'Face detected',
          cameraId: notificationData.cameraId || '',
          cameraName: notificationData.cameraName || 'Unknown Camera',
          timestamp: new Date(notificationData.timestamp || alert.created_at),
          data: notificationData.data,
          acknowledged: alert.notification_status === 'acknowledged',
          evidenceUrl: notificationData.evidenceUrl,
        };
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  }
}

export const alertSystem = new AlertSystem();