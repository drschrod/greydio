#!/bin/bash
# echo "Stopping all processes"
# ./scripts/stop_services.sh

echo "🔄 Cleaning Hardhat project..."
npx hardhat clean

echo "⚙️  Compiling smart contracts..."
npx hardhat compile

echo "🚀 Restarting Hardhat node..."
# Start Hardhat node in a detached screen session to keep it running
screen -dmS hardhat_node npx hardhat node

# Wait for Hardhat node to initialize
sleep 3

echo "📜 Deploying contracts..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost)

echo "✅ Deployment complete. Extracting contract addresses..."
UPLOAD_CONTRACT=$(echo "$DEPLOY_OUTPUT" | grep "UploadVerification deployed to:" | awk '{print $4}')
STREAMING_CONTRACT=$(echo "$DEPLOY_OUTPUT" | grep "StreamingVerification deployed to:" | awk '{print $4}')

echo "📂 Copying new contract addresses to frontend..."
cat <<EOL > ../frontend/src/contracts/contractAddresses.ts
const contractAddresses = {
    uploadVerification: "$UPLOAD_CONTRACT",
    streamingVerification: "$STREAMING_CONTRACT"
};
export default contractAddresses;
EOL

echo "📂 Copying updated ABI files to frontend..."
cp -f ./artifacts/contracts/UploadVerification.sol/UploadVerification.json ../frontend/src/contracts/
cp -f ./artifacts/contracts/StreamingVerification.sol/StreamingVerification.json ../frontend/src/contracts/

echo "🚀 Restarting frontend..."
# Kill any existing frontend server before restarting
pkill -f "vite"

# Start frontend in a new screen session
cd ../frontend && screen -dmS vite_server npm run dev

echo "✅ Done! Hardhat and frontend are running."
echo "➡️  Open http://localhost:5173 in your browser."
