// const hre = require("hardhat");

// async function main() {
//     const VCRegistry = await hre.ethers.getContractFactory("VerifiableCredentialRegistry");
//     const vc = await VCRegistry.deploy();
//     await vc.deployed();
//     console.log(`✅ VerifiableCredentialRegistry deployed at: ${vc.address}`);

//     const Consent = await hre.ethers.getContractFactory("ConsentManager");
//     const cm = await Consent.deploy();
//     await cm.deployed();
//     console.log(`✅ ConsentManager deployed at: ${cm.address}`);
// }

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });


const hre = require("hardhat");

async function main() {
    const VC = await hre.ethers.getContractFactory("VerifiableCredentialRegistry");
    const vc = await VC.deploy(); // Deploy contract

    await vc.waitForDeployment(); // ✅ deployed() को सट्टा यो प्रयोग गर्नुहोस्

    const address = await vc.getAddress(); // ✅ Get deployed address
    console.log("Contract deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
