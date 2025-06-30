// Journey for Water - Three.js Platformer Level
// Handles 3D environment, player movement, physics, and jerry can collection

class JourneyLevel {
    constructor(canvasId, app, isReturnJourney = false) {
        this.canvasId = canvasId;
        this.app = app;
        this.isReturnJourney = isReturnJourney;
        
        // Performance optimization
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.frameSkip = this.isMobile ? 2 : 1; // Skip frames on mobile
        this.frameCount = 0;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.jerryCans = [];
        this.energyOrbs = [];
        this.platforms = [];
        
        // Parallax background components
        this.backgroundLayers = [];
        this.textureLoader = new THREE.TextureLoader();
        
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
        
        // Enhanced character state tracking
        this.characterState = {
            wasMoving: false,
            wasOnGround: true,
            facingDirection: 'right',
            previousFacingDirection: 'right',
            isJumping: false,
            justLanded: false,
            justStartedMoving: false,
            justStoppedMoving: false,
            isCollecting: false,
            collectTimer: 0,
            isHit: false,
            hitTimer: 0,
            isDead: false,
            isVictorious: false
        };
        
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
        
        // --- ENEMY ARRAYS ---
        this.scorpions = [];
        // --- HAZARD ARRAYS ---
        this.tumbleweeds = [];
        
        this.init();
    }
    
    init() {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded. Please check the script tag.');
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
        // Remove solid background - will be replaced with parallax background
        
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

            // Enable shadows with mobile optimization
            this.renderer.shadowMap.enabled = !this.isMobile; // Disable shadows on mobile
            if (!this.isMobile) {
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }

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
        
        // Parallax background system
        this.createParallaxBackground();
        
        // Background elements
        this.createBackgroundElements();
    }
    
    createParallaxBackground() {
        // Create parallax background layers using the provided images
        const backgroundConfig = [
            {
                image: 'bg.png',
                depth: -50,
                speed: 0.1,
                scale: 1.5,
                name: 'farBackground'
            },
            {
                image: 'bg2.png', 
                depth: -25,
                speed: 0.3,
                scale: 1.2,
                name: 'midBackground'
            }
        ];
        
        backgroundConfig.forEach((config, index) => {
            // Load texture
            this.textureLoader.load(
                `assets/${config.image}`,
                (texture) => {
                    // Configure texture for tiling
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.magFilter = THREE.LinearFilter;
                    texture.minFilter = THREE.LinearFilter;
                    
                    // Calculate how many times to repeat the texture across the level
                    const textureAspect = texture.image.width / texture.image.height;
                    const backgroundWidth = this.levelWidth * 2; // Make wider than level for smooth scrolling
                    const backgroundHeight = 40; // Height of background plane
                    const repeatX = backgroundWidth / (backgroundHeight * textureAspect * config.scale);
                    
                    texture.repeat.set(repeatX, 1);
                    
                    // Create background plane geometry
                    const geometry = new THREE.PlaneGeometry(backgroundWidth, backgroundHeight);
                    const material = new THREE.MeshBasicMaterial({ 
                        map: texture,
                        transparent: true,
                        opacity: 0.9
                    });
                    
                    const backgroundMesh = new THREE.Mesh(geometry, material);
                    
                    // Position the background
                    backgroundMesh.position.set(
                        this.levelWidth / 2, // Center horizontally
                        backgroundHeight / 4, // Position vertically
                        config.depth
                    );
                    
                    // Store layer info for parallax updates
                    const layerData = {
                        mesh: backgroundMesh,
                        speed: config.speed,
                        basePosition: backgroundMesh.position.x,
                        name: config.name
                    };
                    
                    this.backgroundLayers.push(layerData);
                    this.scene.add(backgroundMesh);
                    
                    console.log(`✅ Parallax layer ${config.name} loaded successfully (${texture.image.width}x${texture.image.height})`);
                },
                (progress) => {
                    console.log(`Loading ${config.image}: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.warn(`❌ Failed to load background image ${config.image}:`, error);
                    console.log(`🎨 Creating fallback gradient for ${config.name}`);
                    // Create fallback gradient background
                    this.createFallbackBackground(config);
                }
            );
        });
    }
    
    createFallbackBackground(config) {
        // Create a fallback gradient background if images fail to load
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create gradient that mimics the desert landscape colors
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (config.name === 'farBackground') {
            // Far background - sky to distant mountains
            gradient.addColorStop(0, '#F5E6A3'); // Warm cream sky
            gradient.addColorStop(0.4, '#E6D18A'); // Light desert yellow
            gradient.addColorStop(1, '#C49A6C'); // Desert brown
        } else {
            // Mid background - closer hills and terrain
            gradient.addColorStop(0, '#E6D18A'); // Light desert yellow
            gradient.addColorStop(0.6, '#D4A574'); // Medium desert brown
            gradient.addColorStop(1, '#B8956A'); // Darker desert brown
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        const backgroundWidth = this.levelWidth * 2;
        const backgroundHeight = 40;
        
        const geometry = new THREE.PlaneGeometry(backgroundWidth, backgroundHeight);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        const backgroundMesh = new THREE.Mesh(geometry, material);
        backgroundMesh.position.set(
            this.levelWidth / 2,
            backgroundHeight / 4,
            config.depth
        );
        
        const layerData = {
            mesh: backgroundMesh,
            speed: config.speed,
            basePosition: backgroundMesh.position.x,
            name: config.name + '_fallback'
        };
        
        this.backgroundLayers.push(layerData);
        this.scene.add(backgroundMesh);
    }
    
    createBackgroundElements() {
        // Reduce the number of geometric mountains since we have parallax backgrounds
        for (let i = 0; i < 3; i++) {
            const mountainGeometry = new THREE.ConeGeometry(2, 6, 4);
            const mountainMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x696969,
                transparent: true,
                opacity: 0.3 // Make them more subtle
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            mountain.position.set(
                i * 60 - 30, 
                2, 
                -15 // Bring them closer for layering effect
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
                // Updated sprite sheet with poses
                this.characterSprite = new SpriteAnimation('assets/poses.png', 256, 512, 4, 8);
                
                // Wait for sprite to load
                const initSprite = () => {
                    if (this.characterSprite.imageLoaded) {
                        try {
                            this.spriteCharacter = new ThreeJSSpriteCharacter(
                                this.scene,
                                this.characterSprite,
                                { x: 5, y: 1.2, z: 1 } // Adjusted initial Y position to match grounded appearance
                            );
                            this.spriteCharacter.setScale(2.5); // Balanced scaling for good visibility without being too large
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
        // Create scorpions
        this.createScorpions();
        // Create tumbleweeds
        this.createTumbleweeds();
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
        
        // Trigger collection animation
        this.characterState.isCollecting = true;
        this.characterState.collectTimer = 400; // 400ms collection animation
        
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
        
        // Trigger collection animation
        this.characterState.isCollecting = true;
        this.characterState.collectTimer = 400; // 400ms collection animation
        
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
        if (moveX !== 0) {
            this.playerVelocity.x = moveX * this.moveSpeed;
        } else {
            this.playerVelocity.x = 0; // Stop immediately when no input
        }
        this.player.position.x += this.playerVelocity.x;
        
        // Jump
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.mobileInput === 'jump') && this.isOnGround) {
            this.playerVelocity.y = this.jumpStrength;
            this.isOnGround = false;
            this.characterState.isJumping = true; // Set jumping state for animation
            
            // Play jump sound
            if (this.app.audioManager) {
                this.app.audioManager.playJump();
            }
        }
        
        // Apply gravity
        this.playerVelocity.y -= this.gravity;
        this.player.position.y += this.playerVelocity.y;
        
        // Update enhanced character state tracking
        const isMoving = Math.abs(this.playerVelocity.x) > 0.01;
        const isRunning = Math.abs(this.playerVelocity.x) > this.moveSpeed * 1.2;
        const facingLeft = this.playerVelocity.x < 0;
        
        // Debug logging to see what's happening
        if (Math.random() < 0.05) { // Log occasionally
            console.log(`Movement debug: velocity=${this.playerVelocity.x.toFixed(3)}, isMoving=${isMoving}, isRunning=${isRunning}`);
        }
        
        // Update facing direction
        this.characterState.previousFacingDirection = this.characterState.facingDirection;
        if (isMoving) {
            this.characterState.facingDirection = facingLeft ? 'left' : 'right';
        }
        
        // Track movement transitions
        this.characterState.justStartedMoving = !this.characterState.wasMoving && isMoving;
        this.characterState.justStoppedMoving = this.characterState.wasMoving && !isMoving;
        this.characterState.wasMoving = isMoving;
        
        // Track landing
        this.characterState.justLanded = !this.characterState.wasOnGround && this.isOnGround;
        this.characterState.wasOnGround = this.isOnGround;
        
        // Audio feedback for movement and landing
        if (this.app.audioManager) {
            // Play footstep sound when moving on ground (disabled)
            // if (isMoving && this.isOnGround && Math.random() < 0.1) { // 10% chance per frame
            //     this.app.audioManager.playFootstep();
            // }
            
            // Play landing sound (disabled)
            // if (this.characterState.justLanded) {
            //     this.app.audioManager.playFootstep(); // Use footstep for landing sound
            // }
        }
        
        // Update timers
        if (this.characterState.collectTimer > 0) {
            this.characterState.collectTimer -= 16;
            this.characterState.isCollecting = this.characterState.collectTimer > 0;
        }
        
        if (this.characterState.hitTimer > 0) {
            this.characterState.hitTimer -= 16;
            this.characterState.isHit = this.characterState.hitTimer > 0;
        }
        
        // Check for death state
        this.characterState.isDead = this.app.gameState.energy <= 0;
        
        // Update sprite character if available
        if (this.spriteCharacter) {
            // Create comprehensive game state object for animator
            const gameState = {
                isMoving: isMoving,
                isRunning: isRunning,
                isJumping: this.characterState.isJumping,
                isFalling: this.playerVelocity.y < -0.1 && !this.isOnGround,
                isOnGround: this.isOnGround,
                isCollecting: this.characterState.isCollecting,
                isCrouching: this.keys['KeyS'] || this.keys['ArrowDown'],
                facingDirection: this.characterState.facingDirection,
                previousFacingDirection: this.characterState.previousFacingDirection,
                isHit: this.characterState.isHit,
                isDead: this.characterState.isDead,
                isVictorious: this.characterState.isVictorious,
                justLanded: this.characterState.justLanded,
                justStartedMoving: this.characterState.justStartedMoving,
                justStoppedMoving: this.characterState.justStoppedMoving
            };
            
            this.spriteCharacter.update(16, gameState, facingLeft);
            this.spriteCharacter.setPosition(
                this.player.position.x,
                this.player.position.y + 0.2, // Minimal offset to make character appear grounded
                this.player.position.z + 1 // Ensure sprite is in front
            );
        }
        
        // Reset single-frame states
        this.characterState.justLanded = false;
        this.characterState.justStartedMoving = false;
        this.characterState.justStoppedMoving = false;
        this.characterState.isJumping = false;
        
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
        
        // --- SCORPION ENEMY LOGIC ---
        this.scorpions.forEach(scorpion => {
            // Patrol movement
            scorpion.position.x += scorpion.userData.speed * scorpion.userData.dir;
            if (scorpion.position.x > scorpion.userData.max || scorpion.position.x < scorpion.userData.min) {
                scorpion.userData.dir *= -1;
            }
            // Collision cooldown
            if (scorpion.userData.cooldown > 0) {
                scorpion.userData.cooldown--;
                return;
            }
            // Collision with player
            if (Math.abs(scorpion.position.x - this.player.position.x) < 0.7 &&
                Math.abs(scorpion.position.y - this.player.position.y) < 0.7) {
                this.app.updateEnergy(-10, { collision: true });
                this.triggerHitAnimation();
                scorpion.userData.cooldown = 60; // 1 second cooldown
            }
        });
        
        // --- TUMBLEWEED HAZARD LOGIC ---
        this.tumbleweeds.forEach(tumbleweed => {
            // Roll movement
            tumbleweed.position.x += tumbleweed.userData.speed * tumbleweed.userData.dir;
            tumbleweed.rotation.z += 0.08 * tumbleweed.userData.dir;
            if (tumbleweed.position.x > tumbleweed.userData.max || tumbleweed.position.x < tumbleweed.userData.min) {
                tumbleweed.userData.dir *= -1;
            }
            // Collision cooldown
            if (tumbleweed.userData.cooldown > 0) {
                tumbleweed.userData.cooldown--;
                return;
            }
            // Collision with player
            if (Math.abs(tumbleweed.position.x - this.player.position.x) < 0.7 &&
                Math.abs(tumbleweed.position.y - this.player.position.y) < 0.7) {
                this.app.updateEnergy(-5, { collision: true });
                this.triggerHitAnimation();
                tumbleweed.userData.cooldown = 60; // 1 second cooldown
            }
        });
    }
    
    updateEnergyDrain(isMoving) {
        const currentTime = Date.now();
        const previousEnergy = this.app.gameState.energy;
        
        // Drain energy over time
        if (currentTime - this.lastEnergyUpdate > 1000) { // Every second
            this.app.updateEnergy(-this.energyDrainRate);
            this.lastEnergyUpdate = currentTime;
        }
        
        // Additional energy drain while moving
        if (isMoving) {
            this.app.updateEnergy(-this.movementEnergyCost);
        }
        
        // Trigger hit animation if energy dropped significantly
        const energyDrop = previousEnergy - this.app.gameState.energy;
        if (energyDrop > 1) { // Significant energy loss
            this.characterState.isHit = true;
            this.characterState.hitTimer = 300; // 300ms hit animation
        }
        
        // Check if energy is depleted
        if (this.app.gameState.energy <= 0) {
            this.app.gameState.energy = 0;
            // Trigger death animation
            this.characterState.isDead = true;
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
        // Store previous camera position for parallax calculation
        const previousCameraX = this.camera.position.x;
        
        // Smooth camera following - center the camera directly on the player
        const targetX = this.player.position.x + this.cameraOffset;
        this.camera.position.x += (targetX - this.camera.position.x) * 0.15; // Slightly more responsive
        
        // Keep camera within level bounds, but allow more centering
        this.camera.position.x = Math.max(7.5, Math.min(this.levelWidth - 7.5, this.camera.position.x));
        
        // Calculate camera movement for parallax effect
        const cameraMovement = this.camera.position.x - previousCameraX;
        
        // Update parallax background layers
        this.updateParallaxBackground(cameraMovement);
        
        // Always look at the player position for perfect centering
        this.camera.lookAt(this.player.position.x, this.player.position.y, 0);
    }
    
    updateParallaxBackground(cameraMovement) {
        // Update each background layer position based on camera movement and layer speed
        this.backgroundLayers.forEach(layer => {
            if (layer.mesh) {
                // Move background in opposite direction of camera, scaled by speed
                layer.mesh.position.x -= cameraMovement * layer.speed;
                
                // Optional: Reset position if it goes too far (for infinite scrolling)
                const backgroundWidth = this.levelWidth * 2;
                if (layer.mesh.position.x < -backgroundWidth / 2) {
                    layer.mesh.position.x += backgroundWidth;
                } else if (layer.mesh.position.x > backgroundWidth * 1.5) {
                    layer.mesh.position.x -= backgroundWidth;
                }
            }
        });
    }
    
    checkLevelCompletion() {
        // Complete level when player reaches the end
        if (this.player.position.x >= this.levelWidth - 5) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.isRunning = false;
        
        // Trigger victory animation
        this.characterState.isVictorious = true;
        
        // Brief delay to show victory animation, then continue
        setTimeout(() => {
            if (this.isReturnJourney) {
                this.app.completeReturnJourney();
            } else {
                // Start mini-game after journey
                this.app.startMiniGame();
            }
        }, 1000);
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
        
        // Update parallax background scaling if needed
        this.updateParallaxBackgroundScale();
    }
    
    updateParallaxBackgroundScale() {
        // Optionally adjust background scale based on screen size
        this.backgroundLayers.forEach(layer => {
            if (layer.mesh) {
                // Maintain aspect ratio on resize
                const scale = Math.max(1, window.innerWidth / 1920); // Base scale on 1920px width
                layer.mesh.scale.setScalar(scale);
            }
        });
    }
    
    animate() {
        if (!this.isRunning || !this.renderer) return;
        
        try {
            requestAnimationFrame(() => this.animate());
            
            // Frame skipping for mobile performance
            this.frameCount++;
            if (this.frameCount % this.frameSkip !== 0) {
                this.renderer.render(this.scene, this.camera);
                return;
            }
            
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
        this.backgroundLayers = [];
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
        
        // Reset parallax background positions
        this.backgroundLayers.forEach(layer => {
            if (layer.mesh) {
                layer.mesh.position.x = layer.basePosition;
            }
        });
        
        // Restart the game loop
        this.isRunning = true;
        this.animate();
    }
    
    // Method to manually trigger hit animation (for obstacles, spilling water, etc.)
    triggerHitAnimation(duration = 300) {
        this.characterState.isHit = true;
        this.characterState.hitTimer = duration;
    }
    
    // Method to trigger celebration animation
    triggerCelebration(duration = 1000) {
        this.characterState.isVictorious = true;
        setTimeout(() => {
            this.characterState.isVictorious = false;
        }, duration);
    }
    
    // Method to add special interaction animations
    playInteractionAnimation(type = 'collect') {
        switch(type) {
            case 'collect':
                this.characterState.isCollecting = true;
                this.characterState.collectTimer = 400;
                break;
            case 'hit':
                this.triggerHitAnimation();
                break;
            case 'celebrate':
                this.triggerCelebration();
                break;
        }
    }
    
    resetGame() {
        // Clear existing game objects
        this.scene.clear();
        
        // Dispose of the renderer if it exists
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Reset game state variables
        this.isRunning = false;
        this.jerryCans = [];
        this.energyOrbs = [];
        this.platforms = [];
        this.characterState = {
            wasMoving: false,
            wasOnGround: true,
            facingDirection: 'right',
            previousFacingDirection: 'right',
            isJumping: false,
            justLanded: false,
            justStartedMoving: false,
            justStoppedMoving: false,
            isCollecting: false,
            collectTimer: 0,
            isHit: false,
            hitTimer: 0,
            isDead: false,
            isVictorious: false
        };
        
        // Reinitialize the game
        this.init();
    }
    
    createScorpions() {
        // Simple scorpion enemies that patrol horizontally
        const scorpionGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const scorpionMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const patrols = [
            { x: 30, y: 1, min: 28, max: 32, speed: 0.03 },
            { x: 90, y: 1, min: 88, max: 92, speed: 0.025 },
            { x: 150, y: 1, min: 148, max: 152, speed: 0.02 }
        ];
        patrols.forEach(p => {
            const scorpion = new THREE.Mesh(scorpionGeometry, scorpionMaterial);
            scorpion.position.set(p.x, p.y, 0);
            scorpion.userData = { ...p, dir: 1, cooldown: 0 };
            this.scorpions.push(scorpion);
            this.scene.add(scorpion);
        });
    }
    
    createTumbleweeds() {
        // Tumbleweed hazards that roll horizontally
        const tumbleweedTexture = (typeof THREE !== 'undefined' && this.textureLoader) ? this.textureLoader.load('assets/tumbleweed.png', undefined, undefined, () => {}) : null;
        const tumbleweedMaterial = tumbleweedTexture ?
            new THREE.MeshLambertMaterial({ map: tumbleweedTexture, transparent: true }) :
            new THREE.MeshLambertMaterial({ color: 0xB8860B });
        const tumbleweedGeometry = new THREE.SphereGeometry(0.4, 12, 12);
        const hazards = [
            { x: 50, y: 1, min: 48, max: 54, speed: 0.04 },
            { x: 120, y: 1, min: 118, max: 124, speed: 0.035 }
        ];
        hazards.forEach(h => {
            const tumbleweed = new THREE.Mesh(tumbleweedGeometry, tumbleweedMaterial);
            tumbleweed.position.set(h.x, h.y, 0);
            tumbleweed.userData = { ...h, dir: 1, cooldown: 0 };
            this.tumbleweeds.push(tumbleweed);
            this.scene.add(tumbleweed);
        });
    }
} 