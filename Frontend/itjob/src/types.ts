// Location type
export interface Location {
    abbreviation: string;
    name: string;
}

// User interface
export interface User {
    id: number;
    name: string;
    email: string;
    role: "ROLE_USER" | "ROLE_COMPANY" | "ROLE_ADMIN";
    avatar: string | null;
    phone: string | null;
    description: string | null;
    status: "EMPLOYED" | "FREELANCER" | "INACTIVE" | null;
    lookingfor: string | null;
    address: string | null;
    location: string | null;
}

// Validation type
export type ValidationResult = {
  status: true | false,
  reason: string
}

export type ValidationRule = (value: any) => ValidationResult

export interface JobFilterParams {
  query: string;
  region: string;
  levels: string[];
  workStyles: string[];
  minSalary: number;
  maxSalary: number;
  skills: string[];
}