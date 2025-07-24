const { DID } = require('did-jwt');
const { Resolver } = require('did-resolver');
const { getResolver } = require('ethr-did-resolver');
const { v4: uuidv4 } = require('uuid');

class DIDService {
    constructor() {
        this.didMethod = process.env.DID_METHOD || 'did:ethr';
        this.privateKey = process.env.DID_PRIVATE_KEY;

        // Setup DID resolver
        // const ethrResolver = getResolver();
        // this.resolver = new Resolver(ethrResolver);
    }

    // Generate a new DID
    async generateDID() {
        try {
            if (!this.privateKey) {
                throw new Error('DID private key not configured');
            }

            // Generate a new private key if not provided
            const privateKey = this.privateKey || this.generatePrivateKey();

            // Create DID document
            const did = `did:ethr:${this.getAddressFromPrivateKey(privateKey)}`;

            const didDocument = {
                '@context': 'https://www.w3.org/ns/did/v1',
                id: did,
                verificationMethod: [{
                    id: `${did}#controller`,
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    controller: did,
                    publicKeyHex: this.getPublicKeyFromPrivateKey(privateKey)
                }],
                authentication: [`${did}#controller`],
                assertionMethod: [`${did}#controller`]
            };

            return {
                did,
                privateKey,
                publicKey: this.getPublicKeyFromPrivateKey(privateKey),
                didDocument
            };
        } catch (error) {
            console.error('Failed to generate DID:', error);
            throw new Error('Failed to generate Decentralized Identifier');
        }
    }

    // Resolve a DID
    async resolveDID(did) {
        try {
            const didDocument = await this.resolver.resolve(did);

            if (!didDocument.didDocument) {
                throw new Error('DID not found');
            }

            return didDocument;
        } catch (error) {
            console.error('Failed to resolve DID:', error);
            throw new Error('Failed to resolve DID');
        }
    }

    // Create a Verifiable Credential
    async createVerifiableCredential(issuerDID, holderDID, credentialSubject, options = {}) {
        try {
            const {
                type = ['VerifiableCredential'],
                expirationDate,
                issuanceDate = new Date().toISOString(),
                id = `urn:uuid:${uuidv4()}`,
                context = ['https://www.w3.org/2018/credentials/v1'],
                ...additionalFields
            } = options;

            const credential = {
                '@context': context,
                id,
                type,
                issuer: issuerDID,
                issuanceDate,
                credentialSubject: {
                    id: holderDID,
                    ...credentialSubject
                },
                ...additionalFields
            };

            if (expirationDate) {
                credential.expirationDate = expirationDate;
            }

            return credential;
        } catch (error) {
            console.error('Failed to create Verifiable Credential:', error);
            throw new Error('Failed to create Verifiable Credential');
        }
    }

    // Sign a Verifiable Credential
    async signCredential(credential, issuerPrivateKey) {
        try {
            const { DID } = require('did-jwt');

            const did = new DID({
                resolver: this.resolver,
                signer: this.createSigner(issuerPrivateKey)
            });

            const jwt = await did.createJWT(credential, {
                issuer: credential.issuer,
                subject: credential.credentialSubject.id
            });

            return jwt;
        } catch (error) {
            console.error('Failed to sign credential:', error);
            throw new Error('Failed to sign Verifiable Credential');
        }
    }

    // Verify a Verifiable Credential
    async verifyCredential(jwt) {
        try {
            const { DID } = require('did-jwt');

            const did = new DID({
                resolver: this.resolver
            });

            const verification = await did.verifyJWT(jwt);

            return {
                verified: verification.verified,
                payload: verification.payload,
                issuer: verification.issuer,
                subject: verification.subject,
                errors: verification.errors || []
            };
        } catch (error) {
            console.error('Failed to verify credential:', error);
            throw new Error('Failed to verify Verifiable Credential');
        }
    }

    // Create a Verifiable Presentation
    async createVerifiablePresentation(holderDID, credentials, options = {}) {
        try {
            const {
                id = `urn:uuid:${uuidv4()}`,
                type = ['VerifiablePresentation'],
                context = ['https://www.w3.org/2018/credentials/v1'],
                ...additionalFields
            } = options;

            const presentation = {
                '@context': context,
                id,
                type,
                holder: holderDID,
                verifiableCredential: credentials,
                ...additionalFields
            };

            return presentation;
        } catch (error) {
            console.error('Failed to create Verifiable Presentation:', error);
            throw new Error('Failed to create Verifiable Presentation');
        }
    }

    // Sign a Verifiable Presentation
    async signPresentation(presentation, holderPrivateKey) {
        try {
            const { DID } = require('did-jwt');

            const did = new DID({
                resolver: this.resolver,
                signer: this.createSigner(holderPrivateKey)
            });

            const jwt = await did.createJWT(presentation, {
                issuer: presentation.holder,
                subject: presentation.holder
            });

            return jwt;
        } catch (error) {
            console.error('Failed to sign presentation:', error);
            throw new Error('Failed to sign Verifiable Presentation');
        }
    }

    // Verify a Verifiable Presentation
    async verifyPresentation(jwt) {
        try {
            const { DID } = require('did-jwt');

            const did = new DID({
                resolver: this.resolver
            });

            const verification = await did.verifyJWT(jwt);

            return {
                verified: verification.verified,
                payload: verification.payload,
                holder: verification.issuer,
                credentials: verification.payload.verifiableCredential,
                errors: verification.errors || []
            };
        } catch (error) {
            console.error('Failed to verify presentation:', error);
            throw new Error('Failed to verify Verifiable Presentation');
        }
    }

    // Generate private key
    generatePrivateKey() {
        const { ethers } = require('ethers');
        const wallet = ethers.Wallet.createRandom();
        return wallet.privateKey;
    }

    // Get address from private key
    getAddressFromPrivateKey(privateKey) {
        const { ethers } = require('ethers');
        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    }

    // Get public key from private key
    getPublicKeyFromPrivateKey(privateKey) {
        const { ethers } = require('ethers');
        const wallet = new ethers.Wallet(privateKey);
        return wallet.publicKey;
    }

    // Create signer for DID operations
    createSigner(privateKey) {
        const { ethers } = require('ethers');
        const wallet = new ethers.Wallet(privateKey);

        return async (data) => {
            const signature = await wallet.signMessage(data);
            return signature;
        };
    }

    // Validate DID format
    validateDID(did) {
        const didRegex = /^did:[a-z]+:[a-zA-Z0-9._-]+$/;
        return didRegex.test(did);
    }

    // Extract DID method from DID
    getDIDMethod(did) {
        const parts = did.split(':');
        return parts.length >= 3 ? parts[1] : null;
    }

    // Extract DID identifier from DID
    getDIDIdentifier(did) {
        const parts = did.split(':');
        return parts.length >= 3 ? parts[2] : null;
    }
}

module.exports = new DIDService(); 