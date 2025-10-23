// Location type
export interface Location {
    abbreviation: string;
    name: string;
}

export interface HomePageData {
  jobCount: number;
  locations: Location[];
}


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