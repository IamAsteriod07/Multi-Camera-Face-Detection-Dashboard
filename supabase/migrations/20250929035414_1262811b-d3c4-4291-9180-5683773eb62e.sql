-- Create face recognition tables and supporting structures

-- Face recognition configuration
CREATE TABLE public.face_recognition_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence_threshold FLOAT NOT NULL DEFAULT 0.7 CHECK (confidence_threshold >= 0.0 AND confidence_threshold <= 1.0),
  age_detection_enabled BOOLEAN NOT NULL DEFAULT true,
  gender_detection_enabled BOOLEAN NOT NULL DEFAULT true,
  telegram_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  visual_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  audio_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_evidence_capture BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Known faces database
CREATE TABLE public.known_faces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  face_encoding TEXT NOT NULL, -- Base64 encoded face features
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Face detection events
CREATE TABLE public.face_detection_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_id TEXT NOT NULL,
  camera_name TEXT NOT NULL,
  known_face_id UUID REFERENCES public.known_faces(id) ON DELETE SET NULL,
  detected_name TEXT, -- Name if recognized, null if unknown
  confidence_score FLOAT NOT NULL,
  estimated_age INTEGER,
  estimated_gender TEXT,
  bounding_box JSONB, -- {x, y, width, height}
  screenshot_url TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN NOT NULL DEFAULT false
);

-- Alert notifications log
CREATE TABLE public.alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detection_event_id UUID NOT NULL REFERENCES public.face_detection_events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'telegram', 'visual', 'audio'
  notification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  notification_data JSONB, -- Additional data specific to notification type
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Evidence storage for screenshots and videos
CREATE TABLE public.evidence_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detection_event_id UUID NOT NULL REFERENCES public.face_detection_events(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- 'screenshot', 'video_clip'
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.face_recognition_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_storage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for face_recognition_config
CREATE POLICY "Users can view their own face recognition config" 
ON public.face_recognition_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own face recognition config" 
ON public.face_recognition_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face recognition config" 
ON public.face_recognition_config 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for known_faces
CREATE POLICY "Users can view their own known faces" 
ON public.known_faces 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own known faces" 
ON public.known_faces 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own known faces" 
ON public.known_faces 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own known faces" 
ON public.known_faces 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for face_detection_events
CREATE POLICY "Users can view their own face detection events" 
ON public.face_detection_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own face detection events" 
ON public.face_detection_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for alert_notifications
CREATE POLICY "Users can view their own alert notifications" 
ON public.alert_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert notifications" 
ON public.alert_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for evidence_storage
CREATE POLICY "Users can view their own evidence storage" 
ON public.evidence_storage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evidence storage" 
ON public.evidence_storage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_face_detection_events_user_timestamp ON public.face_detection_events(user_id, event_timestamp DESC);
CREATE INDEX idx_face_detection_events_camera_timestamp ON public.face_detection_events(camera_id, event_timestamp DESC);
CREATE INDEX idx_known_faces_user_active ON public.known_faces(user_id, is_active);
CREATE INDEX idx_alert_notifications_user_status ON public.alert_notifications(user_id, notification_status);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_face_recognition_config_updated_at
BEFORE UPDATE ON public.face_recognition_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_known_faces_updated_at
BEFORE UPDATE ON public.known_faces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for face images and evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('face-images', 'face-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false);

-- Create storage policies for face images
CREATE POLICY "Users can view their own face images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'face-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own face images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'face-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own face images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'face-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own face images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'face-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for evidence
CREATE POLICY "Users can view their own evidence" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own evidence" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);