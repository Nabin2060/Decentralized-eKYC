export interface User {
  _id: string;
  email: string;
  role?: string; // user, admin, etc.
  // Add more fields as needed
}

export interface Consent {
  _id: string;
  userId: string;
  consentGiven: boolean;
  // Add more fields as needed
}

export interface Credential {
  _id: string;
  userId: string;
  type: string;
  data: any;
  status?: string; // e.g., pending, verified
  ipfsUrl?: string;
  // Add more fields as needed
}
