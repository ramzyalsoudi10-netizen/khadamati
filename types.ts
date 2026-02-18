
export type UserRole = 'technician' | 'client' | 'admin' | 'requester' | 'donor';

export interface Profile {
  id: string;
  username?: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  avatar_path?: string;
  city?: string; // المحافظة في الأردن
  country?: string; 
  role: UserRole;
  reviews_count: number; // تم التغيير من completed_jobs لتطابق DB
  rating: number;
  is_verified: boolean;
  meals_given: number; 
  meals_received: number; 
  created_at: string;
  last_seen_at?: string;
}

export interface ServiceRequest {
  id: string;
  client_id?: string; 
  requester_id?: string; 
  service_type: string;
  num_people?: number; 
  note?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'delivered'; 
  technician_id?: string;
  created_at: string;
  profiles?: Profile;
}

export type IftarRequest = ServiceRequest;

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  image_url?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  request_id: string;
  technician_id?: string;
  client_id?: string;
  donor_id?: string; 
  requester_id?: string; 
  last_message_at: string;
  request?: ServiceRequest;
  donor_profile?: Profile; 
  requester_profile?: Profile; 
}
