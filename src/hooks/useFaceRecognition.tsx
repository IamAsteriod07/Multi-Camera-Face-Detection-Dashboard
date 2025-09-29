import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FaceRecognitionConfig {
  id?: string;
  user_id?: string;
  confidence_threshold: number;
  age_detection_enabled: boolean;
  gender_detection_enabled: boolean;
  telegram_notifications_enabled: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  visual_alerts_enabled: boolean;
  audio_alerts_enabled: boolean;
  auto_evidence_capture: boolean;
}

export interface KnownFace {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  face_encoding: string;
  photo_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FaceDetectionEvent {
  id?: string;
  user_id?: string;
  camera_id: string;
  camera_name: string;
  known_face_id?: string;
  detected_name?: string;
  confidence_score: number;
  estimated_age?: number;
  estimated_gender?: string;
  bounding_box?: any; // Use any for JSON type compatibility
  screenshot_url?: string;
  event_timestamp: string;
  notification_sent: boolean;
}

export const useFaceRecognition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<FaceRecognitionConfig>({
    confidence_threshold: 0.7,
    age_detection_enabled: true,
    gender_detection_enabled: true,
    telegram_notifications_enabled: false,
    visual_alerts_enabled: true,
    audio_alerts_enabled: true,
    auto_evidence_capture: true,
  });
  
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [recentDetections, setRecentDetections] = useState<FaceDetectionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load configuration
  const loadConfig = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('face_recognition_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading face recognition config:', error);
    }
  }, [user]);

  // Save configuration
  const saveConfig = useCallback(async (newConfig: Partial<FaceRecognitionConfig>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const configData = { ...config, ...newConfig, user_id: user.id };
      
      const { error } = await supabase
        .from('face_recognition_config')
        .upsert(configData, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setConfig(configData);
      toast({
        title: "Configuration Saved",
        description: "Face recognition settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, config, toast]);

  // Load known faces
  const loadKnownFaces = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('known_faces')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setKnownFaces(data || []);
    } catch (error) {
      console.error('Error loading known faces:', error);
    }
  }, [user]);

  // Add known face
  const addKnownFace = useCallback(async (face: Omit<KnownFace, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('known_faces')
        .insert({ ...face, user_id: user.id });

      if (error) {
        throw error;
      }

      await loadKnownFaces();
      toast({
        title: "Face Added",
        description: `${face.name} has been added to known faces.`,
      });
    } catch (error) {
      console.error('Error adding known face:', error);
      toast({
        title: "Error",
        description: "Failed to add known face. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, loadKnownFaces, toast]);

  // Load recent detections
  const loadRecentDetections = useCallback(async (limit = 50) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('face_detection_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      setRecentDetections(data || []);
    } catch (error) {
      console.error('Error loading recent detections:', error);
    }
  }, [user]);

  // Process face detection (to be called from camera streams)
  const processFaceDetection = useCallback(async (detection: Omit<FaceDetectionEvent, 'id' | 'user_id'>) => {
    if (!user) return;
    
    try {
      // Store detection event
      const { data, error } = await supabase
        .from('face_detection_events')
        .insert({ ...detection, user_id: user.id })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update recent detections
      setRecentDetections(prev => [data, ...prev.slice(0, 49)]);

      // Trigger notifications if enabled
      if (config.visual_alerts_enabled) {
        toast({
          title: detection.detected_name ? "Known Person Detected" : "Person Detected",
          description: `${detection.detected_name || 'Unknown person'} detected on ${detection.camera_name}`,
        });
      }

      // Play audio alert if enabled
      if (config.audio_alerts_enabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);
      }

      // Send Telegram notification if enabled
      if (config.telegram_notifications_enabled && config.telegram_bot_token) {
        await sendTelegramNotification(data);
      }

    } catch (error) {
      console.error('Error processing face detection:', error);
    }
  }, [user, config, toast]);

  // Send Telegram notification
  const sendTelegramNotification = useCallback(async (detection: FaceDetectionEvent) => {
    try {
      await supabase.functions.invoke('send-telegram-notification', {
        body: { detection }
      });
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }, []);

  // Upload face image
  const uploadFaceImage = useCallback(async (file: File, faceId: string) => {
    if (!user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${faceId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('face-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('face-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading face image:', error);
      return null;
    }
  }, [user]);

  // Initialize
  useEffect(() => {
    if (user) {
      loadConfig();
      loadKnownFaces();
      loadRecentDetections();
    }
  }, [user, loadConfig, loadKnownFaces, loadRecentDetections]);

  return {
    config,
    knownFaces,
    recentDetections,
    isLoading,
    saveConfig,
    addKnownFace,
    loadKnownFaces,
    loadRecentDetections,
    processFaceDetection,
    uploadFaceImage,
  };
};