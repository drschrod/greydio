import React, { useState, useEffect } from "react";
import { getEthereumObject, getContract, getLatestBlock } from "./web3";
import { ethers } from "ethers";

const App: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [streamMessage, setStreamMessage] = useState<string>("");

  useEffect(() => {
    async function loadWallet() {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Metamask not detected!");
        return;
      }
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    }
    loadWallet();
  }, []);

  const uploadSong = async () => {
    try {
      const latestBlock = await getLatestBlock();
      console.log("Latest Block:", latestBlock); // Debug latest block number

      const contract = await getContract("upload");
      const tx = await contract.uploadSong(1, { value: ethers.parseEther("5") });
      await tx.wait();
      setUploadMessage("Song uploaded successfully!");
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed!");
    }
  };

  const streamSong = async () => {
    try {
      const latestBlock = await getLatestBlock();
      console.log("Latest Block:", latestBlock); // Debug latest block number

      const contract = await getContract("streaming");
      const tx = await contract.recordStream(1);
      await tx.wait();
      setStreamMessage("Stream recorded successfully!");
    } catch (error) {
      console.error(error);
      setStreamMessage("Streaming failed!");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Decentralized Music Streaming</h1>
      <p>Connected Account: {account || "Not Connected"}</p>

      <button onClick={uploadSong} style={{ margin: "10px", padding: "10px" }}>
        Upload Song (Stake 5 ETH)
      </button>
      <p>{uploadMessage}</p>

      <button onClick={streamSong} style={{ margin: "10px", padding: "10px" }}>
        Stream Song
      </button>
      <p>{streamMessage}</p>
    </div>
  );
};

export default App;
