import { ethers } from "ethers";
import contractAddresses from "./contracts/contractAddresses";
import uploadABI from "./contracts/UploadVerification.json";
import streamingABI from "./contracts/StreamingVerification.json";

// Define contract types
type ContractType = "upload" | "streaming";

const getEthereumObject = (): any => window.ethereum;

const getProvider = (): ethers.BrowserProvider | null => {
    const ethereum = getEthereumObject();
    return ethereum ? new ethers.BrowserProvider(ethereum) : null;
};

const getSigner = async (): Promise<ethers.Signer | null> => {
    const provider = getProvider();
    return provider ? await provider.getSigner() : null;
};

const getContract = async (contractType: ContractType): Promise<ethers.Contract> => {
    const signer = await getSigner();
    if (!signer) throw new Error("No signer found!");

    let address: string, abi: any;
    if (contractType === "upload") {
        address = contractAddresses.uploadVerification;
        abi = uploadABI.abi;
    } else {
        address = contractAddresses.streamingVerification;
        abi = streamingABI.abi;
    }

    return new ethers.Contract(address, abi, signer);
};

// Ensure all contract interactions use the latest block
const getLatestBlock = async () => {
    const provider = getProvider();
    if (provider) {
        return await provider.getBlockNumber(); // Fetch latest block
    }
    return null;
};

export { getEthereumObject, getProvider, getSigner, getContract, getLatestBlock };
