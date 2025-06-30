// Audio Manager for Journey for Water 2.0
// Handles background music, sound effects, and volume controls

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.audioGenerator = null;
        
        // Audio settings
        this.settings = {
            masterVolume: 0.7,
            musicVolume: 0.6,
            sfxVolume: 0.8,
            musicEnabled: true,
            sfxEnabled: true
        };
        
        // Audio buffers
        this.audioBuffers = {};
        this.currentMusic = null;
        
        // Load saved settings
        this.loadSettings();
        
        // Initialize audio context
        this.initAudioContext();
        
        // Initialize audio generator
        this.initAudioGenerator();
    }
    
    initAudioContext() {
        try {
            // Create audio context with fallback for older browsers
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            console.log('✅ Audio context initialized successfully');
        } catch (error) {
            console.warn('❌ Failed to initialize audio context:', error);
        }
    }

    initAudioGenerator() {
        try {
            // Create audio generator for placeholder sounds
            this.audioGenerator = new AudioGenerator();
            console.log('✅ Audio generator initialized');
        } catch (error) {
            console.warn('❌ Failed to initialize audio generator:', error);
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('journeyForWater_audioSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('journeyForWater_audioSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }
    
    updateVolumes() {
        if (!this.masterGain || !this.musicGain || !this.sfxGain) return;
        
        this.masterGain.gain.value = this.settings.masterVolume;
        this.musicGain.gain.value = this.settings.musicVolume * (this.settings.musicEnabled ? 1 : 0);
        this.sfxGain.gain.value = this.settings.sfxVolume * (this.settings.sfxEnabled ? 1 : 0);
    }
    
    async loadAudioFile(url, name) {
        if (!this.audioContext) {
            console.warn('Audio context not available');
            return null;
        }
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[name] = audioBuffer;
            console.log(`✅ Loaded audio: ${name}`);
            return audioBuffer;
        } catch (error) {
            console.warn(`❌ Failed to load audio ${name}:`, error);
            return null;
        }
    }
    
    async preloadAllAudio() {
        // Try to load real audio files first
        const audioFiles = [
            { url: 'assets/audio/ambient_desert.mp3', name: 'ambient' },
            { url: 'assets/audio/footstep.mp3', name: 'footstep' },
            { url: 'assets/audio/jump.mp3', name: 'jump' },
            { url: 'assets/audio/collect_jerry.mp3', name: 'collect_jerry' },
            { url: 'assets/audio/collect_orb.mp3', name: 'collect_orb' },
            { url: 'assets/audio/low_energy.mp3', name: 'low_energy' },
            { url: 'assets/audio/day_complete.mp3', name: 'day_complete' },
            { url: 'assets/audio/hit.mp3', name: 'hit' },
            { url: 'assets/audio/success.mp3', name: 'success' }
        ];
        
        const loadPromises = audioFiles.map(file => this.loadAudioFile(file.url, file.name));
        const results = await Promise.allSettled(loadPromises);
        
        // Check if any files failed to load (likely empty files)
        const failedLoads = results.filter(result => result.status === 'rejected').length;
        
        if (failedLoads > 0) {
            console.log(`⚠️ ${failedLoads} audio files failed to load, using generated sounds instead`);
        }
        
        console.log('🎵 Audio preloading complete');
    }
    
    playMusic(name, loop = true) {
        if (!this.audioContext || !this.settings.musicEnabled) {
            return null;
        }
        
        // Try to play real audio file first
        if (this.audioBuffers[name]) {
            // Stop current music
            if (this.currentMusic) {
                this.currentMusic.stop();
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffers[name];
            source.loop = loop;
            source.connect(this.musicGain);
            
            source.start(0);
            this.currentMusic = source;
            
            return source;
        } else {
            // Fall back to generated ambient sound
            if (name === 'ambient' && this.audioGenerator) {
                this.audioGenerator.generateAmbientDesert();
                return { stop: () => {} }; // Dummy object for compatibility
            }
        }
        
        return null;
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    playSFX(name, volume = 1.0) {
        if (!this.audioContext || !this.settings.sfxEnabled) {
            return null;
        }
        
        // Try to play real audio file first
        if (this.audioBuffers[name]) {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.audioBuffers[name];
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            gainNode.gain.value = volume;
            source.start(0);
            
            return source;
        } else {
            // Fall back to generated sounds
            if (this.audioGenerator) {
                switch (name) {
                    case 'footstep':
                        this.audioGenerator.generateFootstep();
                        break;
                    case 'jump':
                        this.audioGenerator.generateJump();
                        break;
                    case 'collect_jerry':
                        this.audioGenerator.generateCollectJerry();
                        break;
                    case 'collect_orb':
                        this.audioGenerator.generateCollectOrb();
                        break;
                    case 'low_energy':
                        this.audioGenerator.generateLowEnergy();
                        break;
                    case 'day_complete':
                        this.audioGenerator.generateDayComplete();
                        break;
                    case 'hit':
                        this.audioGenerator.generateHit();
                        break;
                    case 'success':
                        this.audioGenerator.generateSuccess();
                        break;
                }
                return { stop: () => {} }; // Dummy object for compatibility
            }
        }
        
        return null;
    }
    
    // Specific sound effect methods
    playFootstep() {
        // Footstep sounds disabled
        return null;
    }
    
    playJump() {
        this.playSFX('jump', 0.5);
    }
    
    playCollectJerry() {
        this.playSFX('collect_jerry', 0.6);
    }
    
    playCollectOrb() {
        this.playSFX('collect_orb', 0.7);
    }
    
    playLowEnergy() {
        this.playSFX('low_energy', 0.4);
    }
    
    playDayComplete() {
        this.playSFX('day_complete', 0.8);
    }
    
    playHit() {
        this.playSFX('hit', 0.5);
    }
    
    playSuccess() {
        this.playSFX('success', 0.6);
    }
    
    // Settings methods
    setMasterVolume(volume) {
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveSettings();
    }
    
    setMusicVolume(volume) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveSettings();
    }
    
    setSFXVolume(volume) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveSettings();
    }
    
    toggleMusic(enabled) {
        this.settings.musicEnabled = enabled;
        this.updateVolumes();
        if (!enabled && this.currentMusic) {
            this.stopMusic();
        }
        this.saveSettings();
    }
    
    toggleSFX(enabled) {
        this.settings.sfxEnabled = enabled;
        this.updateVolumes();
        this.saveSettings();
    }
    
    // Resume audio context (required for autoplay policies)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Cleanup
    dispose() {
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
} 