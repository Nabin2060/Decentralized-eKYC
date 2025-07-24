"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <nav
      style={{
        width: "100%",
        padding: "0.75rem 2rem",
        background: "#1a2236",
        borderBottom: "2px solid #0070f3",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}
    >
      {/* Logo Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: 24,
            color: "#fff",
            letterSpacing: 1
          }}
        >
          eKYC
        </span>
      </div>
      {/* Links Right */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {!user ? (
          <>
            <Link
              href="/login"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16
              }}
            >
              Login
            </Link>
            <Link
              href="/register"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16
              }}
            >
              Register
            </Link>
            <Link
              href="/about"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16
              }}
            >
              About
            </Link>
            <Link
              href="/contact"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16
              }}
            >
              Contact
            </Link>
          </>
        ) : (
          <>
            {user.role === "admin" ? (
              <Link
                href="/admin-dashboard"
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 16
                }}
              >
                Admin Dashboard
              </Link>
            ) : (
              <Link
                href="/dashboard"
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 16
                }}
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              style={{
                marginLeft: 24,
                background: "#f44336",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 18px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
