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
  employmentType?: string[];
  status?: string[];
  minSalary?: number;
  maxSalary?: number;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  tags?: string[];
  category?: string;
  industry?: string;
  salaryNegotiable?: boolean;
  urgent?: boolean;
  featured?: boolean;
  deadlineFrom?: string;
  deadlineTo?: string;
  sortBy?: "newest" | "salary" | "deadline" | "applied" | "featured";
  sortDirection?: "asc" | "desc";
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
  coverImage?: string | null;
  phone: string | null;
  website?: string | null;
  taxCode?: string | null;
  industry?: string | null;
  foundedYear?: number | null;
  verified?: boolean | null;
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

export type UserRole = "ROLE_USER" | "ROLE_COMPANY" | "ROLE_ADMIN";
export type JobPosition = "intern" | "fresher" | "junior" | "middle" | "senior" | "manager";
export type JobWorkstyle = "onsite" | "remote" | "hybrid";
export type JobEmploymentType = "full_time" | "part_time" | "internship" | "contract" | "freelance";
export type JobStatus = "draft" | "published" | "paused" | "closed" | "expired";

export interface JobCard {
  id: number;
  name: string;
  companyID: number;
  companyName: string;
  companyAvatar: string | null;
  category?: string | null;
  industry?: string | null;
  salaryCurrency?: string | null;
  salaryNegotiable?: boolean | null;
  minSalary: number;
  maxSalary: number;
  minExperienceYears?: number | null;
  vacancies?: number | null;
  deadline?: string | null;
  urgent?: boolean | null;
  featured?: boolean | null;
  position: JobPosition;
  workstyle: JobWorkstyle;
  employmentType?: JobEmploymentType | null;
  status?: JobStatus | null;
  location: Location | null;
  tags: string[];
}

export interface JobDetail extends JobCard {
  createdAt?: string;
  address?: string | null;
  images: string[];
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  workingTime?: string | null;
  appliedCount?: number;
}

export interface SavedJobResponse {
  id: number;
  createdAt: string;
  job: JobCard;
}

export interface UserJobStateResponse {
  jobId: number;
  saved: boolean;
  applied: boolean;
}

export interface CompanyFollowResponse {
  id: number;
  createdAt: string;
  company: Company;
}

export interface JobAlertRequest {
  name: string;
  query?: string;
  location?: string;
  category?: string;
  industry?: string;
  minSalary?: number;
  maxSalary?: number;
  position?: JobPosition;
  workstyle?: JobWorkstyle;
  employmentType?: JobEmploymentType;
  tags?: string[];
  active?: boolean;
}

export interface JobAlertResponse extends JobAlertRequest {
  id: number;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatsResponse {
  jobId: number;
  totalViews: number;
  viewsLast7Days: number;
  savedCount: number;
  appliedCount: number;
}
