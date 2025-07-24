"use client";
import { useEffect, useState } from "react";
import { getConsent, giveConsent } from "../../api";
import { Consent } from "../../types";

// For demo, use a hardcoded userId. In real app, get from auth state.
const userId = "demo-user-id";

export default function ConsentPage() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConsent(userId)
      .then(setConsent)
      .catch(() => setError("Failed to fetch consent"))
      .finally(() => setLoading(false));
  }, []);

  const handleConsent = async (consentGiven: boolean) => {
    setUpdating(true);
    setError("");
    try {
      const updated = await giveConsent(userId, { consentGiven });
      setConsent(updated);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update consent";
      setError(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Consent Management</h2>
      <div>
        Current consent: <b>{consent?.consentGiven ? "Given" : "Not Given"}</b>
      </div>
      <button
        onClick={() => handleConsent(!consent?.consentGiven)}
        disabled={updating}
        style={{ marginTop: 16 }}
      >
        {updating
          ? "Updating..."
          : consent?.consentGiven
          ? "Revoke Consent"
          : "Give Consent"}
      </button>
    </div>
  );
}
