// context/EthereumContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

interface EthereumContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string;
}

const EthereumContext = createContext<EthereumContextType>({
  provider: null,
  signer: null,
  address: ""
});

export const EthereumProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState("");

  // ✅ Wallet connect जब page खोलिन्छ
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const browserProvider = new ethers.BrowserProvider(ethereum);
          await ethereum.request({ method: "eth_requestAccounts" });
          const signer = await browserProvider.getSigner();
          const addr = await signer.getAddress();

          setProvider(browserProvider);
          setSigner(signer);
          setAddress(addr);
        } catch (err) {
          console.error("Wallet connect error:", err);
        }
      } else {
        console.warn("MetaMask not installed.");
      }
    };

    connectWallet();
  }, []);

  return (
    <EthereumContext.Provider value={{ provider, signer, address }}>
      {children}
    </EthereumContext.Provider>
  );
};

export const useEthereum = () => useContext(EthereumContext);
