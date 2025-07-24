import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function useEthereum(contractAddress, contractABI) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (!window.ethereum) {
            console.error("MetaMask not detected");
            return;
        }

        const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(ethProvider);

        async function connect() {
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const signer = ethProvider.getSigner();
                setSigner(signer);

                const account = await signer.getAddress();
                setAccount(account);

                const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
                setContract(contractInstance);
            } catch (error) {
                console.error("User denied account access or error:", error);
            }
        }

        connect();

        // Optional: Listen for account changes
        window.ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            } else {
                setAccount(null);
                setContract(null);
            }
        });
    }, [contractAddress, contractABI]);

    return { provider, signer, contract, account };
}
