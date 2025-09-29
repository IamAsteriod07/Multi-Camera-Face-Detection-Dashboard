import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotificationRequest {
  detection: {
    id: string;
    camera_name: string;
    detected_name?: string;
    confidence_score: number;
    estimated_age?: number;
    estimated_gender?: string;
    event_timestamp: string;
    screenshot_url?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { detection }: TelegramNotificationRequest = await req.json();

    // Get user's Telegram configuration
    const { data: config, error: configError } = await supabaseClient
      .from('face_recognition_config')
      .select('telegram_bot_token, telegram_chat_id')
      .eq('user_id', user.id)
      .single();

    if (configError || !config?.telegram_bot_token || !config?.telegram_chat_id) {
      throw new Error('Telegram configuration not found');
    }

    // Format the notification message
    const personName = detection.detected_name || 'Unknown Person';
    const confidence = Math.round(detection.confidence_score * 100);
    const timestamp = new Date(detection.event_timestamp).toLocaleString();
    
    let message = `🔔 *Face Detection Alert*\n\n`;
    message += `👤 *Person:* ${personName}\n`;
    message += `📹 *Camera:* ${detection.camera_name}\n`;
    message += `📊 *Confidence:* ${confidence}%\n`;
    message += `⏰ *Time:* ${timestamp}\n`;
    
    if (detection.estimated_age) {
      message += `🎂 *Estimated Age:* ~${detection.estimated_age}\n`;
    }
    
    if (detection.estimated_gender) {
      message += `⚥ *Gender:* ${detection.estimated_gender}\n`;
    }

    // Send text message
    const telegramApiUrl = `https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${errorText}`);
    }

    // Send photo if available
    if (detection.screenshot_url) {
      const photoApiUrl = `https://api.telegram.org/bot${config.telegram_bot_token}/sendPhoto`;
      await fetch(photoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.telegram_chat_id,
          photo: detection.screenshot_url,
          caption: `Detection from ${detection.camera_name}`,
        }),
      });
    }

    // Log the notification
    await supabaseClient
      .from('alert_notifications')
      .insert({
        user_id: user.id,
        detection_event_id: detection.id,
        notification_type: 'telegram',
        notification_status: 'sent',
        notification_data: {
          chat_id: config.telegram_chat_id,
          message_sent: true,
          photo_sent: !!detection.screenshot_url,
        },
        sent_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Telegram notification sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});