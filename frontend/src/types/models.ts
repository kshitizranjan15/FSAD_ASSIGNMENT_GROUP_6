// src/types/models.ts
export type RoleType = 'Student' | 'Staff' | 'Admin';

// Matches the response from POST /users/login (with assumed user details enrichment)
export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  role: RoleType;
  user_id: number;
  full_name: string;
}

// Matches EquipmentDB from equipment_api.py
export interface Equipment {
  equipment_id: number;
  name: string;
  category_id: number;
  total_quantity: number;
  available_quantity: number;
}

// Matches LendingRequestDB from lending_api.py (example)
export interface LendingRequestDB {
  request_id: number;
  equipment_id: number;
  requester_id: number;
  request_date: string; // YYYY-MM-DD
  expected_return_date: string; // YYYY-MM-DD
  quantity: number;
  status: 'Pending' | 'Approved' | 'Issued' | 'Returned' | 'Rejected';
  // Other fields...
}

export interface LendingRequest extends LendingRequestDB {
  requester_name?: string;
  equipment_name?: string;
}

// Data model for POST /lending/request
export interface LendingRequestCreate {
    equipment_id: number;
    quantity: number;
    expected_return_date: string; // YYYY-MM-DD
}

// ... Add more models as you build out other features (e.g., User, RepairLog, etc.)