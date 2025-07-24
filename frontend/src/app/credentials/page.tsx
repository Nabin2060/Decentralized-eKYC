"use client";
import { useEffect, useState } from "react";
import { getCredentials, issueCredential } from "../../api";
import { Credential } from "../../types";

const userId = "demo-user-id";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCredentials(userId)
      .then(setCredentials)
      .catch(() => setError("Failed to fetch credentials"))
      .finally(() => setLoading(false));
  }, []);

  const handleIssue = async () => {
    setIssuing(true);
    setError("");
    try {
      const newCredential = await issueCredential(userId, {
        type: "Demo",
        data: { issued: Date.now() }
      });
      setCredentials([...credentials, newCredential]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to issue credential";
      setError(errorMsg);
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Credentials</h2>
      <button
        onClick={handleIssue}
        disabled={issuing}
        style={{ marginBottom: 16 }}
      >
        {issuing ? "Issuing..." : "Issue New Credential"}
      </button>
      <ul>
        {credentials.map((cred, idx) => (
          <li
            key={cred._id || idx}
            style={{ border: "1px solid #eee", marginBottom: 8, padding: 8 }}
          >
            <div>Type: {cred.type}</div>
            <div>Data: {JSON.stringify(cred.data)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
