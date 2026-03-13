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
  query?: string;
  location?: string;
  position?: string[];
  workstyle?: string[];
  minSalary?: number;
  maxSalary?: number;
  tags?: string[];
  companyID?: number;
}

export interface Tag {
  tag: string;
  count: number;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  description: string | null;
  address: string | null;
  location: {
    abbreviation: string;
    name: string;
  } | null;
  model: string | null;
  scale: string | null;
  startWork: string | null;
  endWork: string | null;
  hasOvertime: boolean;
  jobCount?: number;
}