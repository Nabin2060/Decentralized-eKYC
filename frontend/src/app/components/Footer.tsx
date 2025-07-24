import React from "react";

const Footer = () => (
  <footer
    style={{
      width: "100%",
      padding: "1.5rem 2rem",
      background: "#1a2236",
      borderTop: "2px solid #0070f3",
      color: "#fff",
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 0.5,
      boxShadow: "0 -2px 8px rgba(0,0,0,0.04)"
    }}
  >
    <span>
      &copy; {new Date().getFullYear()} Decentralized eKYC. All rights reserved.
    </span>
  </footer>
);

export default Footer;
