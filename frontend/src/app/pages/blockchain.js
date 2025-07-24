import React, { useState } from "react";
import useEthereum from "../hooks/useEthereum";

// contract address and ABI
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const contractABI = [
    {
        "inputs": [],
        "name": "yourFunction",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
    [

    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "credHash",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "holder",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "cid",
                "type": "string"
            }
        ],
        "name": "CredentialIssued",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "credHash",
                "type": "bytes32"
            }
        ],
        "name": "CredentialRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }
        ],
        "name": "addIssuer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "authorizedIssuers",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "credentials",
        "outputs": [
            {
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "holder",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "cid",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "revoked",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "issuedAt",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "holder",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "cid",
                "type": "string"
            }
        ],
        "name": "issueCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }
        ],
        "name": "removeIssuer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "holder",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "cid",
                "type": "string"
            }
        ],
        "name": "revokeCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "holder",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "cid",
                "type": "string"
            }
        ],
        "name": "verifyCredential",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
    ],
];

export default function BlockchainPage() {
    const { contract, account } = useEthereum(contractAddress, contractABI);
    const [contractData, setContractData] = useState(null);

    async function callContractFunction() {
        if (!contract) {
            alert("Contract not connected");
            return;
        }
        try {
            const data = await contract.yourFunction();
        } catch (err) {
            console.error(err);
            alert("Error calling contract function");
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <h1>Blockchain Interaction</h1>
            <p>Connected Account: {account || "Not connected"}</p>
            <button onClick={callContractFunction}>Call Contract Function</button>
            {contractData && <p>Contract Data: {contractData}</p>}
        </div>
    );
}
