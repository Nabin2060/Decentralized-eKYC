import axios from "axios";
import type { User, Credential, Consent } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

// Axios instance with credentials
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// Auth
export async function login(email: string, password: string) {
  try {
    const res = await api.post("/api/auth/login", { email, password });
    // token सुरक्षित राख्नुहोस्
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Login failed";
    throw new Error(errorMsg || "Login failed");
  }
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  try {
    const res = await api.post("/api/auth/register", {
      username,
      email,
      password
    });
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message ||
        err.response?.data?.error ||
        JSON.stringify(err.response?.data)
      : "Registration failed";
    throw new Error(errorMsg || "Registration failed");
  }
}

// Consent
export async function getConsent(userId: string) {
  try {
    const res = await api.get(`/consent/${userId}`);
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to fetch consent";
    throw new Error(errorMsg || "Failed to fetch consent");
  }
}

export async function giveConsent(
  userId: string,
  consentData: Partial<Consent>
) {
  try {
    const res = await api.post(`/consent/${userId}`, consentData);
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to give consent";
    throw new Error(errorMsg || "Failed to give consent");
  }
}

// Credentials
export async function getCredentials(userId: string) {
  try {
    const res = await api.get(`/credentials/${userId}`);
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to fetch credentials";
    throw new Error(errorMsg || "Failed to fetch credentials");
  }
}

export async function issueCredential(
  userId: string,
  credentialData: Partial<Credential>
) {
  try {
    // Map frontend fields to backend expected fields
    const payload = {
      holderId: userId,
      type: credentialData.type || "document",
      credentialSubject: credentialData.data || {}
      // Add expirationDate, metadata if needed
    };
    const token = localStorage.getItem("token");

    const res = await api.post("/credentials/issue", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to issue credential";
    throw new Error(errorMsg || "Failed to issue credential");
  }
}

// Admin: Get all credentials
export async function getAllCredentials() {
  try {
    const res = await api.get("/credentials");
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to fetch all credentials";
    throw new Error(errorMsg || "Failed to fetch all credentials");
  }
}

// Admin: Approve credential
export async function approveCredential(credentialId: string) {
  try {
    const res = await api.post(`/credentials/${credentialId}/approve`);
    return res.data;
  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message
      : "Failed to approve credential";
    throw new Error(errorMsg || "Failed to approve credential");
  }
}
