// Journey for Water - Three.js Platformer Level
// Handles 3D environment, player movement, physics, and jerry can collection

class JourneyLevel {
    constructor(canvasId, app, isReturnJourney = false) {
        this.canvasId = canvasId;
        this.app = app;
        this.isReturnJourney = isReturnJourney;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.jerryCans = [];
        this.energyOrbs = [];
        this.platforms = [];
        
        // Game state
        this.isRunning = false;
        this.keys = {};
        this.mobileInput = null;
        
        // Physics
        this.gravity = 0.015;
        this.jumpStrength = 0.4;
        this.moveSpeed = 0.1;
        this.playerVelocity = { x: 0, y: 0 };
        this.isOnGround = false;
        
        // Energy system
        this.energyDrainRate = 0.5;
        this.movementEnergyCost = 0.2;
        this.energyOrbValue = 25;
        this.lastEnergyUpdate = 0;
        
        // Level dimensions
        this.levelWidth = 200;
        this.levelHeight = 20;
        this.cameraOffset = 0; // Center the camera on the player
        
        // Jerry can properties
        this.jerryCanSize = 0.5;
        this.jerryCanSpacing = 8;
        
        this.init();
    }
    
    init() {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded. Please check the script tag.');
            // Show error message in the game canvas area
            const canvas = document.getElementById(this.canvasId);
            if (canvas) {
                const errorContainer = document.createElement('div');
                errorContainer.style.position = 'absolute';
                errorContainer.style.top = '50%';
                errorContainer.style.left = '50%';
                errorContainer.style.transform = 'translate(-50%, -50%)';
                errorContainer.style.textAlign = 'center';
                errorContainer.style.color = '#ef4444';
                errorContainer.innerHTML = `
                    <h2 style="font-size: 20px; margin-bottom: 8px;">Game Engine Not Loaded</h2>
                    <p style="font-size: 16px; color: #4b5563;">Please refresh the page to try again.</p>
                `;
                canvas.parentNode.appendChild(errorContainer);
            }
            return;
        }

        // Wait for Three.js to be fully loaded
        const checkThreeJs = () => {
            if (typeof THREE.WebGLRenderer === 'undefined') {
                console.log('Waiting for Three.js to fully load...');
                setTimeout(checkThreeJs, 100);
                return;
            }
            
            try {
                this.setupThreeJS();
                
                // Only continue if Three.js setup was successful
                if (!this.renderer) {
                    throw new Error('Failed to initialize Three.js renderer');
                }
                
                this.createLevel();
                this.createPlayer();
                this.createJerryCans();
                this.setupLighting();
                this.setupEventListeners();
            } catch (error) {
                console.error('Error initializing game level:', error);
                // Show error message in the game canvas area
                const canvas = document.getElementById(this.canvasId);
                if (canvas) {
                    const errorContainer = document.createElement('div');
                    errorContainer.style.position = 'absolute';
                    errorContainer.style.top = '50%';
                    errorContainer.style.left = '50%';
                    errorContainer.style.transform = 'translate(-50%, -50%)';
                    errorContainer.style.textAlign = 'center';
                    errorContainer.style.color = '#ef4444';
                    errorContainer.innerHTML = `
                        <h2 style="font-size: 20px; margin-bottom: 8px;">Failed to Initialize Game</h2>
                        <p style="font-size: 16px; color: #4b5563;">Please check if your browser supports WebGL and try again.</p>
                    `;
                    canvas.parentNode.appendChild(errorContainer);
                }
            }
        };

        checkThreeJs();
    }
    
    setupThreeJS() {
        const canvas = document.getElementById(this.canvasId);
        
        if (!canvas) {
            throw new Error(`Canvas element with id '${this.canvasId}' not found`);
        }
        
        // Check if canvas is actually a canvas element
        if (canvas.tagName !== 'CANVAS') {
            throw new Error(`Element with id '${this.canvasId}' is not a canvas element`);
        }

        // Set initial canvas size
        const container = canvas.parentElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Check for WebGL support
        let gl = null;
        try {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (e) {
            throw new Error('WebGL initialization failed: ' + e.message);
        }
        
        if (!gl) {
            throw new Error('WebGL is not supported in your browser');
        }

        // Clean up any existing renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.width / canvas.height,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 15); // Start camera centered on player starting position
        
        // Renderer
        try {
            const contextAttributes = {
                alpha: false,
                antialias: true,
                powerPreference: 'default',
                failIfMajorPerformanceCaveat: false
            };

            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                context: gl,
                ...contextAttributes
            });

            // Set size with pixel ratio
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            this.renderer.setPixelRatio(pixelRatio);
            this.renderer.setSize(canvas.width, canvas.height, false);

            // Enable shadows
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Handle context loss
            canvas.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                console.warn('WebGL context lost. Attempting to restore...');
                this.isRunning = false;
            }, false);

            canvas.addEventListener('webglcontextrestored', () => {
                console.log('WebGL context restored. Reinitializing...');
                this.init();
            }, false);

        } catch (error) {
            console.error('Failed to create WebGL renderer:', error);
            throw new Error('Failed to initialize 3D renderer');
        }
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => this.onWindowResize());
        resizeObserver.observe(container);
    }
    
    createLevel() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(this.levelWidth, 2);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 // Brown earth color
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Platforms
        const platformPositions = [
            { x: 15, y: 2, width: 6, height: 1 },
            { x: 25, y: 4, width: 4, height: 1 },
            { x: 35, y: 3, width: 5, height: 1 },
            { x: 45, y: 5, width: 3, height: 1 },
            { x: 55, y: 2, width: 7, height: 1 },
            { x: 70, y: 4, width: 4, height: 1 },
            { x: 80, y: 3, width: 6, height: 1 },
            { x: 95, y: 5, width: 5, height: 1 },
            { x: 110, y: 2, width: 4, height: 1 },
            { x: 120, y: 4, width: 6, height: 1 },
            { x: 135, y: 3, width: 5, height: 1 },
            { x: 150, y: 5, width: 4, height: 1 },
            { x: 165, y: 2, width: 6, height: 1 },
            { x: 180, y: 4, width: 5, height: 1 }
        ];
        
        platformPositions.forEach(platformData => {
            const platformGeometry = new THREE.BoxGeometry(
                platformData.width, 
                platformData.height, 
                2
            );
            const platformMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x654321 // Dark brown
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            
            platform.position.set(
                platformData.x, 
                platformData.y + platformData.height / 2, 
                0
            );
            platform.castShadow = true;
            platform.receiveShadow = true;
            
            // Store platform bounds for collision detection
            platform.userData = {
                bounds: {
                    minX: platformData.x - platformData.width / 2,
                    maxX: platformData.x + platformData.width / 2,
                    minY: platformData.y,
                    maxY: platformData.y + platformData.height
                }
            };
            
            this.platforms.push(platform);
            this.scene.add(platform);
        });
        
        // Background elements
        this.createBackgroundElements();
    }
    
    createBackgroundElements() {
        // Distant mountains
        for (let i = 0; i < 5; i++) {
            const mountainGeometry = new THREE.ConeGeometry(3, 8, 4);
            const mountainMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x696969 
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            mountain.position.set(
                i * 40 - 20, 
                3, 
                -20
            );
            mountain.rotation.y = Math.PI / 4;
            
            this.scene.add(mountain);
        }
        
        // Trees
        for (let i = 0; i < 8; i++) {
            const treeTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
            const treeTrunkMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513 
            });
            const treeTrunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
            
            const treeLeavesGeometry = new THREE.SphereGeometry(1, 8, 6);
            const treeLeavesMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x228B22 
            });
            const treeLeaves = new THREE.Mesh(treeLeavesGeometry, treeLeavesMaterial);
            
            treeTrunk.position.set(i * 25, 0, -5);
            treeLeaves.position.set(i * 25, 2, -5);
            
            treeTrunk.castShadow = true;
            treeLeaves.castShadow = true;
            
            this.scene.add(treeTrunk);
            this.scene.add(treeLeaves);
        }
    }
    
    createPlayer() {
        // Player body (simple cube for collision detection)
        const playerGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const playerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1, // Royal blue
            transparent: true,
            opacity: 0.0 // Make it completely invisible - only used for collision detection
        });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        
        this.player.position.set(5, 1, 0); // Start player more centered in the scene
        this.player.castShadow = true;
        this.player.receiveShadow = true;
        
        this.scene.add(this.player);
        
        // Add sprite animation character
        if (typeof SpriteAnimation !== 'undefined' && typeof ThreeJSSpriteCharacter !== 'undefined') {
            try {
                console.log('Loading sprite character...');
                // 1024x1024 sprite sheet with 3x2 grid (6 frames), each frame ~341x512
                this.characterSprite = new SpriteAnimation('assets/char25d.png', 341, 512, 3, 6);
                
                // Wait for sprite to load
                const initSprite = () => {
                    if (this.characterSprite.imageLoaded) {
                        try {
                            this.spriteCharacter = new ThreeJSSpriteCharacter(
                                this.scene,
                                this.characterSprite,
                                { x: 5, y: 1, z: 0.1 } // Match player starting position
                            );
                            this.spriteCharacter.setScale(1.5); // Moderate scaling for better visibility
                            console.log('Sprite character loaded successfully!');
                        } catch (error) {
                            console.warn('Could not create sprite character:', error);
                        }
                    } else {
                        setTimeout(initSprite, 100);
                    }
                };
                initSprite();
            } catch (error) {
                console.warn('Sprite animation not available:', error);
            }
        }
    }
    
    createJerryCans() {
        // Create jerry cans scattered across the level
        const jerryCanPositions = [
            { x: 8, y: 1 },
            { x: 18, y: 3 },
            { x: 28, y: 5 },
            { x: 38, y: 4 },
            { x: 48, y: 6 },
            { x: 58, y: 3 },
            { x: 68, y: 5 },
            { x: 78, y: 4 },
            { x: 88, y: 6 },
            { x: 98, y: 3 },
            { x: 108, y: 5 },
            { x: 118, y: 4 },
            { x: 128, y: 6 },
            { x: 138, y: 3 },
            { x: 148, y: 5 },
            { x: 158, y: 4 },
            { x: 168, y: 6 },
            { x: 178, y: 3 }
        ];
        
        jerryCanPositions.forEach(pos => {
            const jerryCan = this.createJerryCan(pos.x, pos.y);
            this.jerryCans.push(jerryCan);
            this.scene.add(jerryCan);
        });
        
        // Create energy orbs
        this.createEnergyOrbs();
    }
    
    createEnergyOrbs() {
        // Create energy orbs scattered across the level
        const energyOrbPositions = [
            { x: 12, y: 2 },
            { x: 22, y: 4 },
            { x: 32, y: 3 },
            { x: 42, y: 5 },
            { x: 52, y: 2 },
            { x: 62, y: 4 },
            { x: 72, y: 3 },
            { x: 82, y: 5 },
            { x: 92, y: 2 },
            { x: 102, y: 4 },
            { x: 112, y: 3 },
            { x: 122, y: 5 },
            { x: 132, y: 2 },
            { x: 142, y: 4 },
            { x: 152, y: 3 },
            { x: 162, y: 5 },
            { x: 172, y: 2 },
            { x: 182, y: 4 }
        ];
        
        energyOrbPositions.forEach(pos => {
            const energyOrb = this.createEnergyOrb(pos.x, pos.y);
            this.energyOrbs.push(energyOrb);
            this.scene.add(energyOrb);
        });
    }
    
    createEnergyOrb(x, y) {
        // Create a glowing energy orb
        const orbGroup = new THREE.Group();
        
        // Main orb (sphere)
        const orbGeometry = new THREE.SphereGeometry(0.3, 16, 12);
        const orbMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD800, // Bright yellow
            emissive: 0xFFD800,
            emissiveIntensity: 0.3
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        // Glow effect (larger transparent sphere)
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD800,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        orbGroup.add(orb);
        orbGroup.add(glow);
        
        orbGroup.position.set(x, y, 0);
        orbGroup.castShadow = true;
        
        // Store original position and add click handler
        orbGroup.userData = {
            originalPosition: { x, y },
            collected: false,
            bounds: {
                minX: x - 0.6,
                maxX: x + 0.6,
                minY: y - 0.6,
                maxY: y + 0.6
            },
            type: 'energyOrb'
        };
        
        // Add floating animation
        orbGroup.userData.animation = {
            startY: y,
            time: Math.random() * Math.PI * 2, // Random start phase
            speed: 0.02
        };
        
        return orbGroup;
    }
    
    createJerryCan(x, y) {
        // Create a simple jerry can using basic geometry
        const jerryCanGroup = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(this.jerryCanSize, this.jerryCanSize * 1.5, this.jerryCanSize * 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD800 // Yellow color for jerry cans
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, this.jerryCanSize * 0.8);
        const handleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.y = this.jerryCanSize * 0.8;
        
        jerryCanGroup.add(body);
        jerryCanGroup.add(handle);
        
        jerryCanGroup.position.set(x, y, 0);
        jerryCanGroup.castShadow = true;
        
        // Store original position and add click handler
        jerryCanGroup.userData = {
            originalPosition: { x, y },
            collected: false,
            bounds: {
                minX: x - this.jerryCanSize / 2,
                maxX: x + this.jerryCanSize / 2,
                minY: y - this.jerryCanSize * 0.75,
                maxY: y + this.jerryCanSize * 0.75
            }
        };
        
        return jerryCanGroup;
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mouse/touch controls for jerry cans
        const canvas = this.renderer.domElement;
        canvas.addEventListener('click', (event) => this.handleClick(event));
        canvas.addEventListener('touchend', (event) => this.handleClick(event));
    }
    
    handleClick(event) {
        event.preventDefault();
        
        // Get mouse/touch position
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX || event.touches[0].clientX) - rect.left) / rect.width * 2 - 1;
        const y = -((event.clientY || event.touches[0].clientY) - rect.top) / rect.height * 2 + 1;
        
        // Raycasting to detect jerry can and energy orb clicks
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, this.camera);
        
        // Check jerry cans
        const jerryCanIntersects = raycaster.intersectObjects(this.jerryCans, true);
        if (jerryCanIntersects.length > 0) {
            const jerryCan = jerryCanIntersects[0].object.parent || jerryCanIntersects[0].object;
            
            if (!jerryCan.userData.collected) {
                this.collectJerryCan(jerryCan);
            }
        }
        
        // Check energy orbs
        const energyOrbIntersects = raycaster.intersectObjects(this.energyOrbs, true);
        if (energyOrbIntersects.length > 0) {
            const energyOrb = energyOrbIntersects[0].object.parent || energyOrbIntersects[0].object;
            
            if (!energyOrb.userData.collected) {
                this.collectEnergyOrb(energyOrb);
            }
        }
    }
    
    collectJerryCan(jerryCan) {
        jerryCan.userData.collected = true;
        
        // Add water points
        this.app.addWaterPoints(1);
        
        // Flash animation with safety checks
        jerryCan.children.forEach(child => {
            if (child && child.material && typeof child.material.setHex === 'function') {
                try {
                    child.material.color.setHex(0x00FF00); // Green flash
                    setTimeout(() => {
                        if (child && child.material && typeof child.material.setHex === 'function') {
                            child.material.color.setHex(0xFFD800); // Back to yellow
                        }
                    }, 500);
                } catch (error) {
                    console.warn('Error updating jerry can material:', error);
                }
            }
        });
        
        // Hide the jerry can
        jerryCan.visible = false;
    }
    
    collectEnergyOrb(energyOrb) {
        console.log('Collecting energy orb!'); // Debug log
        energyOrb.userData.collected = true;
        
        // Add energy
        this.app.updateEnergy(this.energyOrbValue);
        
        // Flash animation with safety checks
        energyOrb.children.forEach(child => {
            if (child && child.material && typeof child.material.setHex === 'function') {
                try {
                    child.material.color.setHex(0x00FF00); // Green flash
                    if (child.material.emissive && typeof child.material.emissive.setHex === 'function') {
                        child.material.emissive.setHex(0x00FF00);
                    }
                    setTimeout(() => {
                        if (child && child.material && typeof child.material.setHex === 'function') {
                            child.material.color.setHex(0xFFD800); // Back to yellow
                            if (child.material.emissive && typeof child.material.emissive.setHex === 'function') {
                                child.material.emissive.setHex(0xFFD800);
                            }
                        }
                    }, 500);
                } catch (error) {
                    console.warn('Error updating orb material:', error);
                }
            }
        });
        
        // Hide the energy orb
        energyOrb.visible = false;
    }
    
    handleMobileInput(action) {
        this.mobileInput = action;
        
        // Clear mobile input after a short delay
        setTimeout(() => {
            this.mobileInput = null;
        }, 100);
    }
    
    updatePlayerMovement() {
        // Handle input
        let moveX = 0;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.mobileInput === 'left') {
            moveX = -1;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.mobileInput === 'right') {
            moveX = 1;
        }
        
        // Apply movement
        this.playerVelocity.x = moveX * this.moveSpeed;
        this.player.position.x += this.playerVelocity.x;
        
        // Jump
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.mobileInput === 'jump') && this.isOnGround) {
            this.playerVelocity.y = this.jumpStrength;
            this.isOnGround = false;
        }
        
        // Apply gravity
        this.playerVelocity.y -= this.gravity;
        this.player.position.y += this.playerVelocity.y;
        
        // Update sprite character if available
        if (this.spriteCharacter) {
            const isMoving = Math.abs(this.playerVelocity.x) > 0.01;
            const isRunning = Math.abs(this.playerVelocity.x) > this.moveSpeed * 1.2;
            const facingLeft = this.playerVelocity.x < 0;
            
            this.spriteCharacter.update(16, isMoving, isRunning, facingLeft);
            this.spriteCharacter.setPosition(
                this.player.position.x,
                this.player.position.y + 0.5, // Offset sprite slightly higher than collision box
                this.player.position.z + 0.1
            );
            
            // Debug logging (remove after testing)
            if (Math.random() < 0.01) { // Log occasionally to avoid spam
                console.log(`Sprite pos: (${this.player.position.x.toFixed(1)}, ${this.player.position.y.toFixed(1)}), moving: ${isMoving}, facing: ${facingLeft ? 'left' : 'right'}`);
            }
        }
        
        // Energy drain system
        this.updateEnergyDrain(moveX !== 0);
        
        // Update energy orb animations
        this.updateEnergyOrbAnimations();
        
        // Check for orb collection by proximity
        this.checkOrbCollection();
        
        // Collision detection
        this.handleCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Check level completion
        this.checkLevelCompletion();
        
        // Check for game over
        this.checkGameOver();
    }
    
    updateEnergyDrain(isMoving) {
        const currentTime = Date.now();
        
        // Drain energy over time
        if (currentTime - this.lastEnergyUpdate > 1000) { // Every second
            this.app.updateEnergy(-this.energyDrainRate);
            this.lastEnergyUpdate = currentTime;
        }
        
        // Additional energy drain while moving
        if (isMoving) {
            this.app.updateEnergy(-this.movementEnergyCost);
        }
        
        // Check if energy is depleted
        if (this.app.gameState.energy <= 0) {
            this.app.gameState.energy = 0;
            // Could add game over logic here
        }
    }
    
    updateEnergyOrbAnimations() {
        this.energyOrbs.forEach(orb => {
            if (orb.userData.animation && !orb.userData.collected && orb.visible) {
                const anim = orb.userData.animation;
                anim.time += anim.speed;
                
                // Floating animation
                const floatOffset = Math.sin(anim.time) * 0.2;
                orb.position.y = anim.startY + floatOffset;
                
                // Rotation animation
                orb.rotation.y += 0.02;
                orb.rotation.z += 0.01;
            }
        });
    }
    
    handleCollisions() {
        const playerBounds = {
            minX: this.player.position.x - 0.4,
            maxX: this.player.position.x + 0.4,
            minY: this.player.position.y - 0.6,
            maxY: this.player.position.y + 0.6
        };
        
        // Ground collision
        if (this.player.position.y <= 0.6) {
            this.player.position.y = 0.6;
            this.playerVelocity.y = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }
        
        // Platform collisions
        this.platforms.forEach(platform => {
            const bounds = platform.userData.bounds;
            
            if (playerBounds.maxX > bounds.minX && 
                playerBounds.minX < bounds.maxX &&
                playerBounds.maxY > bounds.minY &&
                playerBounds.minY < bounds.maxY) {
                
                // Determine collision side
                const overlapX = Math.min(playerBounds.maxX - bounds.minX, bounds.maxX - playerBounds.minX);
                const overlapY = Math.min(playerBounds.maxY - bounds.minY, bounds.maxY - playerBounds.minY);
                
                if (overlapX < overlapY) {
                    // Horizontal collision
                    if (this.player.position.x < bounds.minX) {
                        this.player.position.x = bounds.minX - 0.4;
                    } else {
                        this.player.position.x = bounds.maxX + 0.4;
                    }
                } else {
                    // Vertical collision
                    if (this.player.position.y < bounds.minY) {
                        this.player.position.y = bounds.minY - 0.6;
                        this.playerVelocity.y = 0;
                        this.isOnGround = true;
                    } else {
                        this.player.position.y = bounds.maxY + 0.6;
                        this.playerVelocity.y = 0;
                    }
                }
            }
        });
        
        // Level boundaries
        if (this.player.position.x < 0) {
            this.player.position.x = 0;
        }
        if (this.player.position.x > this.levelWidth) {
            this.player.position.x = this.levelWidth;
        }
    }
    
    updateCamera() {
        // Smooth camera following - center the camera directly on the player
        const targetX = this.player.position.x + this.cameraOffset;
        this.camera.position.x += (targetX - this.camera.position.x) * 0.15; // Slightly more responsive
        
        // Keep camera within level bounds, but allow more centering
        this.camera.position.x = Math.max(7.5, Math.min(this.levelWidth - 7.5, this.camera.position.x));
        
        // Always look at the player position for perfect centering
        this.camera.lookAt(this.player.position.x, this.player.position.y, 0);
    }
    
    checkLevelCompletion() {
        // Complete level when player reaches the end
        if (this.player.position.x >= this.levelWidth - 5) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.isRunning = false;
        
        if (this.isReturnJourney) {
            this.app.completeReturnJourney();
        } else {
            // Start mini-game after journey
            this.app.startMiniGame();
        }
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const canvas = this.renderer.domElement;
        const container = canvas.parentElement;
        
        // Update canvas size
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Update camera
        this.camera.aspect = canvas.width / canvas.height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(canvas.width, canvas.height, false);
    }
    
    animate() {
        if (!this.isRunning || !this.renderer) return;
        
        try {
            requestAnimationFrame(() => this.animate());
            this.updatePlayerMovement();
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Animation error:', error);
            this.isRunning = false;
            
            // Try to recover
            setTimeout(() => {
                console.log('Attempting to recover from animation error...');
                this.init();
            }, 1000);
        }
    }
    
    start() {
        if (!this.renderer) {
            console.error('Cannot start level: renderer not initialized');
            return;
        }
        
        this.isRunning = true;
        this.animate();
    }
    
    cleanup() {
        this.isRunning = false;
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Dispose of Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            const gl = this.renderer.getContext();
            if (gl) {
                const loseContext = gl.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    loseContext.loseContext();
                }
            }
            this.renderer = null;
        }
        
        // Clear scene
        if (this.scene) {
            while(this.scene.children.length > 0) {
                const object = this.scene.children[0];
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.map) {
                        object.material.map.dispose();
                    }
                    object.material.dispose();
                }
                this.scene.remove(object);
            }
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.player = null;
        this.jerryCans = [];
        this.energyOrbs = [];
        this.platforms = [];
    }
    
    checkOrbCollection() {
        const playerBounds = {
            minX: this.player.position.x - 1.2, // Increased collision area
            maxX: this.player.position.x + 1.2,
            minY: this.player.position.y - 1.2,
            maxY: this.player.position.y + 1.2
        };
        
        // Check energy orbs
        this.energyOrbs.forEach((orb, index) => {
            if (!orb.userData.collected) {
                const orbBounds = orb.userData.bounds;
                
                if (playerBounds.maxX > orbBounds.minX && 
                    playerBounds.minX < orbBounds.maxX &&
                    playerBounds.maxY > orbBounds.minY &&
                    playerBounds.minY < orbBounds.maxY) {
                    
                    console.log(`Collision detected with orb ${index}!`); // Debug log
                    this.collectEnergyOrb(orb);
                }
            }
        });
        
        // Check jerry cans
        this.jerryCans.forEach(jerryCan => {
            if (!jerryCan.userData.collected) {
                const canBounds = jerryCan.userData.bounds;
                
                if (playerBounds.maxX > canBounds.minX && 
                    playerBounds.minX < canBounds.maxX &&
                    playerBounds.maxY > canBounds.minY &&
                    playerBounds.minY < canBounds.maxY) {
                    
                    this.collectJerryCan(jerryCan);
                }
            }
        });
    }
    
    checkGameOver() {
        if (this.app.gameState.energy <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Show game over screen
        const gameOverContainer = document.createElement('div');
        gameOverContainer.style.position = 'absolute';
        gameOverContainer.style.top = '0';
        gameOverContainer.style.left = '0';
        gameOverContainer.style.width = '100%';
        gameOverContainer.style.height = '100%';
        gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverContainer.style.display = 'flex';
        gameOverContainer.style.justifyContent = 'center';
        gameOverContainer.style.alignItems = 'center';
        gameOverContainer.style.zIndex = '1000';
        
        gameOverContainer.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <h1 style="font-size: 48px; margin-bottom: 20px; color: #ef4444;">Game Over</h1>
                <p style="font-size: 24px; margin-bottom: 30px;">You ran out of energy!</p>
                <p style="font-size: 18px; margin-bottom: 40px; color: #d1d5db;">
                    Water Points Collected: ${this.app.gameState.waterPoints}
                </p>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button id="retryBtn" style="
                        background-color: #3b82f6; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 8px; 
                        font-size: 18px; 
                        cursor: pointer;
                        transition: background-color 0.3s;
                    " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                        Try Again
                    </button>
                    <button id="restartBtn" style="
                        background-color: #ef4444; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 8px; 
                        font-size: 18px; 
                        cursor: pointer;
                        transition: background-color 0.3s;
                    " onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'">
                        Restart Game
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        gameOverContainer.querySelector('#retryBtn').addEventListener('click', () => {
            document.body.removeChild(gameOverContainer);
            this.restartLevel();
        });
        
        gameOverContainer.querySelector('#restartBtn').addEventListener('click', () => {
            document.body.removeChild(gameOverContainer);
            this.app.resetGame();
            this.app.showScreen('splash');
        });
        
        document.body.appendChild(gameOverContainer);
    }
    
    restartLevel() {
        // Reset energy to full
        this.app.gameState.energy = 100;
        this.app.updateHUD();
        
        // Reset player position
        this.player.position.set(0, 1, 0);
        this.playerVelocity = { x: 0, y: 0 };
        
        // Reset all collectibles
        this.jerryCans.forEach(jerryCan => {
            jerryCan.userData.collected = false;
            jerryCan.visible = true;
        });
        
        this.energyOrbs.forEach(orb => {
            orb.userData.collected = false;
            orb.visible = true;
            // Reset orb materials to original state with safety checks
            orb.children.forEach(child => {
                if (child && child.material && typeof child.material.setHex === 'function') {
                    try {
                        child.material.color.setHex(0xFFD800);
                        if (child.material.emissive && typeof child.material.emissive.setHex === 'function') {
                            child.material.emissive.setHex(0xFFD800);
                        }
                    } catch (error) {
                        console.warn('Error resetting orb material:', error);
                    }
                }
            });
        });
        
        // Reset camera
        this.camera.position.set(0, 5, 15);
        
        // Restart the game loop
        this.isRunning = true;
        this.animate();
    }
} 