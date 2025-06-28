#!/bin/bash

# Create libs directory if it doesn't exist
mkdir -p libs

# Download Three.js from unpkg
curl -L https://unpkg.com/three@0.158.0/build/three.min.js -o libs/three.min.js

echo "Three.js has been downloaded to libs/three.min.js" 