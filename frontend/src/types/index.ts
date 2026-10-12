export interface MenuItem {
  id: number;
  name: string;
  price_vnd: number;
  is_signature: boolean;
}

export interface Province {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  best_months?: string;
}

export interface Location {
  id: number;
  province_id: number;
  name: string;
  category: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  opening_hours?: string;
  avg_duration_minutes?: number;
  avg_cost_vnd: number;
  rating: number;
  is_indoor?: boolean;
  tips?: string;
  transport_info?: string;
  province_name?: string;
  menu_items?: MenuItem[];
}

export interface ItineraryItem {
  id: number;
  day_number: number;
  time_slot: string;
  order_in_day: number;
  note?: string;
  travel_distance_km?: number;
  travel_time_minutes?: number;
  location: Location;
}

export interface ItineraryDay {
  day_number: number;
  title: string;
  items: ItineraryItem[];
}

export interface Itinerary {
  id?: number;
  title: string;
  province: Province;
  num_days: number;
  num_nights: number;
  status: string;
  total_cost: number;
  days: ItineraryDay[];
  share_code?: string;
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  is_vip?: number;
  vip_expiry?: string;
}

