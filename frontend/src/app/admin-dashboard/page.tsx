"use client";
import { useEffect, useState } from "react";
import { getAllCredentials, approveCredential } from "../../api";
import { Credential } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    getAllCredentials()
      .then(setCredentials)
      .catch(() => setError("Failed to fetch credentials"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleApprove = async (credId: string) => {
    setApproving(credId);
    setError("");
    try {
      await approveCredential(credId);
      // Refresh list
      const updated = await getAllCredentials();
      setCredentials(updated);
    } catch (err: any) {
      setError(err.message || "Failed to approve document");
    } finally {
      setApproving(null);
    }
  };

  if (!user || user.role !== "admin") return <div>Admin access only.</div>;

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 24 }}>
      <h2>Admin Dashboard </h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : credentials.length === 0 ? (
        <div>No documents found.</div>
      ) : (
        <ul>
          {credentials.map((cred, idx) => (
            <li
              key={cred._id || idx}
              style={{ border: "1px solid #eee", marginBottom: 8, padding: 8 }}
            >
              <div>Name: {cred.data?.name || "N/A"}</div>
              <div>type: {cred.type}</div>
              <div>Status: {cred.status || cred.data?.status || "pending"}</div>
              {cred.ipfsUrl && (
                <div>
                  <a
                    href={cred.ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on IPFS
                  </a>
                </div>
              )}
              {cred.status !== "verified" &&
                cred.data?.status !== "verified" && (
                  <button
                    onClick={() => handleApprove(cred._id)}
                    disabled={approving === cred._id}
                    style={{ marginTop: 8 }}
                  >
                    {approving === cred._id ? "Approving..." : "Approve"}
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
