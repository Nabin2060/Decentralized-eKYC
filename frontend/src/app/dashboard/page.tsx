"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCredentials, issueCredential } from "../../api";
import { Credential } from "../../types";
import { useRouter } from "next/navigation";

// Placeholder for apply for verification API
async function applyForVerification(credentialId: string) {
  // TODO: Replace with real API call
  return new Promise((resolve) => setTimeout(resolve, 1200));
}

const statusLabels: Record<string, string> = {
  not_applied: "Not Applied / नआवेदन",
  pending: "Pending Verification / प्रमाणिकरणको लागि प्रतीक्षारत",
  verified: "Verified / प्रमाणित",
  rejected: "Rejected / अस्वीकृत"
};

export default function DashboardPage() {
  const { user } = useAuth();
  // console.log({ user });
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    getCredentials(user._id)
      .then(setCredentials)
      .catch(() => setError("Failed to fetch documents"))
      .finally(() => setLoading(false));
  }, [user, router]);

  // Handle document upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!user || !(user._id || user._id)) {
      setError("User not found. Please login again.");
      return;
    }
    const userId = user._id || user._id;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      await issueCredential(userId, {
        type: "identity",
        data: { name: file.name, status: "not_applied" }
      });
      setSuccess("Document uploaded successfully!");
      const updated = await getCredentials(userId);
      setCredentials(updated);
      setFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle apply for verification
  const handleApplyVerification = async (cred: Credential) => {
    setVerifyingId(cred._id);
    setError("");
    setSuccess("");
    try {
      await applyForVerification(cred._id);
      // Simulate status update
      const updated = credentials.map((c) =>
        c._id === cred._id
          ? { ...c, data: { ...c.data, status: "pending" } }
          : c
      );
      setCredentials(updated);
      setSuccess("Applied for verification!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to apply for verification"
      );
    } finally {
      setVerifyingId(null);
    }
  };

  if (!user) return null;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 24,
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        User Dashboard / प्रयोगकर्ता ड्यासबोर्ड
      </h2>
      <form
        onSubmit={handleUpload}
        style={{
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "center"
        }}
      >
        <label style={{ fontWeight: 500 }}>
          Upload Document (कागजात अपलोड गर्नुहोस्):
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            style={{ marginLeft: 8 }}
            disabled={uploading}
          />
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          style={{
            padding: "8px 18px",
            borderRadius: 4,
            background: uploading ? "#aaa" : "#0070f3",
            color: "white",
            border: "none",
            fontWeight: 600
          }}
        >
          {uploading ? (
            <span>
              <span
                className="spinner"
                style={{
                  marginRight: 8,
                  border: "2px solid #fff",
                  borderTop: "2px solid #0070f3",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "inline-block",
                  animation: "spin 1s linear infinite"
                }}
              />
              Uploading...
            </span>
          ) : (
            "Upload"
          )}
        </button>
      </form>
      {error && (
        <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "green", marginBottom: 12, textAlign: "center" }}>
          {success}
        </div>
      )}
      <h3 style={{ marginBottom: 16 }}>Your Documents / तपाईंका कागजातहरू</h3>
      {loading ? (
        <div style={{ textAlign: "center", margin: 32 }}>
          <span
            className="spinner"
            style={{
              border: "4px solid #eee",
              borderTop: "4px solid #0070f3",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "inline-block",
              animation: "spin 1s linear infinite"
            }}
          />
          <div style={{ marginTop: 8 }}>Loading...</div>
        </div>
      ) : credentials.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>
          No documents uploaded yet. / अहिलेसम्म कुनै कागजात अपलोड गरिएको छैन।
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {credentials.map((cred) => {
            const status = cred.data?.status || "not_applied";
            return (
              <li
                key={cred._id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 6,
                  marginBottom: 16,
                  padding: 16,
                  background: "#fafbfc",
                  boxShadow: "0 2px 8px #f3f3f3"
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 16 }}>
                  नाम: {cred.data?.name || "N/A"}
                </div>
                <div style={{ color: "#555", marginBottom: 6 }}>
                  प्रकार: {cred.type}
                </div>
                <div style={{ marginBottom: 8 }}>
                  Status: <b>{statusLabels[status] || status}</b>
                </div>
                {status === "not_applied" && (
                  <button
                    onClick={() => handleApplyVerification(cred)}
                    disabled={verifyingId === cred._id}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 4,
                      background: verifyingId === cred._id ? "#aaa" : "#28a745",
                      color: "white",
                      border: "none",
                      fontWeight: 600
                    }}
                  >
                    {verifyingId === cred._id ? (
                      <span>
                        <span
                          className="spinner"
                          style={{
                            marginRight: 8,
                            border: "2px solid #fff",
                            borderTop: "2px solid #28a745",
                            borderRadius: "50%",
                            width: 16,
                            height: 16,
                            display: "inline-block",
                            animation: "spin 1s linear infinite"
                          }}
                        />
                        Applying...
                      </span>
                    ) : (
                      "Apply for Verification / प्रमाणीकरणको लागि आवेदन गर्नुहोस्"
                    )}
                  </button>
                )}
                {cred.ipfsUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={cred.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3" }}
                    >
                      View on IPFS
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
