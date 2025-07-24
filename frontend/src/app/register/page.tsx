"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await register(username, email, password);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 1000);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "auto",
        marginTop: 60,
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
        boxShadow: "0 2px 8px #eee"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="username"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc"
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 4,
            background: "#0070f3",
            color: "white",
            border: "none",
            fontWeight: 600
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {error && (
          <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>
            Registration successful!
          </div>
        )}
      </form>
    </div>
  );
}
