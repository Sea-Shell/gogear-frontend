export interface AuthUserPayload {
  id?: number;
  email?: string;
  name?: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  expires_at?: number;
  expires_in?: number;
  state?: string;
  user?: AuthUserPayload | null;
}

export interface ErrorResponse {
  error?: string;
}

export interface StatusResponse {
  status?: string;
}

export interface ResponsePayload<T> {
  current_page?: number;
  item_limit?: number;
  items: T[];
  next_page?: string | null;
  prev_page?: string | null;
  total_item_count?: number;
  total_pages?: number;
}

export interface GearCategory {
  category_id?: number;
  category_name?: string;
  category_top_category_id?: number;
}

export interface GearTopCategory {
  top_category_id?: number;
  top_category_name?: string;
  top_category_icon?: string;
}

export interface Gear {
  gear_category_id?: number;
  gear_height?: number;
  gear_id?: number;
  gear_length?: number;
  gear_manufacture_id?: number;
  gear_name?: string;
  gear_size_definition?: string;
  gear_status?: boolean;
  gear_top_category_id?: number;
  gear_weight?: number;
  gear_width?: number;
}

export interface GearListItem extends Gear {
  category_id?: number;
  category_name?: string;
  category_top_category_id?: number;
  manufacture_id?: number;
  manufacture_name?: string;
  top_category_id?: number;
  top_category_name?: string;
  top_category_icon?: string;
}

export interface FullGear extends GearListItem {
  gear_size_definition?: string;
}

export interface Manufacture {
  manufacture_id?: number;
  manufacture_name?: string;
}

export interface User {
  user_email?: string;
  user_is_admin?: boolean;
  user_id?: number;
  user_name?: string;
  user_username?: string;
}

export interface UserWithPass extends User {
  user_password?: string;
}

export interface UserGear {
  category_id?: number;
  category_name?: string;
  category_top_category_id?: number;
  container_link_id?: number | null;
  container_registration_id?: number | null;
  gear_category_id?: number;
  gear_height?: number;
  gear_id?: number;
  gear_length?: number;
  gear_manufacture_id?: number;
  gear_name?: string;
  gear_status?: boolean;
  gear_is_container?: boolean;
  gear_top_category_id?: number;
  gear_weight?: number;
  gear_width?: number;
  manufacture_id?: number;
  manufacture_name?: string;
  max_container_weight?: number | null;
  top_category_id?: number;
  top_category_name?: string;
  top_category_icon?: string;
  user_id?: number;
  user_name?: string;
  user_username?: string;
  usergear_gear_id?: number;
  usergear_registration_id?: number;
  usergear_user_id?: number;
}

export interface UserGearLink {
  max_container_weight?: number | null;
  usergear_gear_id?: number;
  usergear_registration_id?: number;
  usergear_user_id?: number;
}

export interface UserGearLinkNoID {
  max_container_weight?: number | null;
  usergear_gear_id?: number;
  usergear_user_id?: number;
}

export interface UserContainerLink {
  container_registration_id?: number;
  user_container_id?: number;
  user_gear_registration_id?: number;
}

export interface UserContainerLinkNoID {
  user_container_id: number;
  user_gear_registration_id: number;
}

export interface HealthResponse {
  documentation?: string;
  name?: string;
  status?: string;
  updated?: string;
}

export interface Loadout {
  loadout_id: number;
  loadout_name: string;
  loadout_description: string;
  loadout_is_public: boolean;
  loadout_slug: string;
  total_weight: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface LoadoutNoID {
  loadout_name: string;
  loadout_description: string;
  loadout_is_public: boolean;
  loadout_slug: string;
  user_id: number;
}

export interface LoadoutUpdate {
  loadout_id: number;
  loadout_name: string;
  loadout_description: string;
  loadout_is_public: boolean;
  loadout_slug: string;
}

export interface LoadoutItem {
  loadout_item_id: number;
  loadout_id: number;
  gear_id: number;
  quantity: number;
  notes: string;
}

export interface LoadoutItemNoID {
  loadout_id: number;
  gear_id: number;
  quantity: number;
  notes: string;
}

export interface LoadoutItemUpdate {
  loadout_item_id: number;
  quantity: number;
  notes: string;
}

export interface LoadoutPublic {
  loadout_id: number;
  loadout_name: string;
  loadout_description: string;
  loadout_slug: string;
  total_weight: number;
  created_at: string;
  updated_at: string;
}

/** Extended loadout item with joined gear data for the Pack Tree UI. */
export interface LoadoutTreeNode extends LoadoutItem {
  gear_name: string;
  gear_weight: number;
  category_name?: string;
  top_category_name?: string;
  /** Client-side tree fields */
  parent_item_id?: number | null;
  children?: LoadoutTreeNode[];
  depth?: number;
  is_container?: boolean;
  packed: boolean;
}
