#!/bin/bash

echo "🛑 Stopping Hardhat Node and Vite Frontend..."

# Kill the Hardhat node if running
if screen -list | grep -q "hardhat_node"; then
    echo "🛑 Stopping Hardhat Node..."
    screen -X -S hardhat_node quit
else
    echo "✅ Hardhat Node is not running."
fi

# Kill the Vite frontend server if running
if screen -list | grep -q "vite_server"; then
    echo "🛑 Stopping Vite Frontend..."
    screen -X -S vite_server quit
else
    echo "✅ Vite Frontend is not running."
fi

echo "✅ All services stopped successfully."
