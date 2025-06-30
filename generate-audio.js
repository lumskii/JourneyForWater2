// Audio Generator for Journey for Water 2.0
// Creates placeholder audio files using Web Audio API

class AudioGenerator {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('✅ Audio context initialized for generation');
        } catch (error) {
            console.error('❌ Failed to initialize audio context:', error);
        }
    }

    // Generate a simple tone
    generateTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        return oscillator;
    }

    // Generate ambient desert sound (wind-like)
    generateAmbientDesert() {
        console.log('🎵 Generating ambient desert sound...');
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.generateTone(200 + Math.random() * 100, 2 + Math.random() * 3, 'sine', 0.1);
            }, i * 2000);
        }
    }

    // Generate footstep sound (disabled)
    generateFootstep() {
        // Footstep sounds disabled
        return null;
    }

    // Generate jump sound
    generateJump() {
        console.log('🦘 Generating jump sound...');
        this.generateTone(300, 0.2, 'sine', 0.3);
        setTimeout(() => {
            this.generateTone(400, 0.15, 'sine', 0.25);
        }, 100);
    }

    // Generate collect jerry can sound
    generateCollectJerry() {
        console.log('🪣 Generating collect jerry sound...');
        this.generateTone(400, 0.3, 'sine', 0.4);
        setTimeout(() => {
            this.generateTone(500, 0.2, 'sine', 0.3);
        }, 150);
    }

    // Generate collect orb sound
    generateCollectOrb() {
        console.log('✨ Generating collect orb sound...');
        this.generateTone(600, 0.2, 'sine', 0.3);
        setTimeout(() => {
            this.generateTone(800, 0.15, 'sine', 0.25);
        }, 100);
        setTimeout(() => {
            this.generateTone(1000, 0.1, 'sine', 0.2);
        }, 200);
    }

    // Generate low energy warning sound
    generateLowEnergy() {
        console.log('⚠️ Generating low energy sound...');
        this.generateTone(200, 0.3, 'sawtooth', 0.3);
        setTimeout(() => {
            this.generateTone(180, 0.3, 'sawtooth', 0.3);
        }, 350);
    }

    // Generate day complete sound
    generateDayComplete() {
        console.log('🎉 Generating day complete sound...');
        const notes = [400, 500, 600, 700, 800];
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.generateTone(note, 0.3, 'sine', 0.3);
            }, index * 200);
        });
    }

    // Generate hit sound
    generateHit() {
        console.log('💥 Generating hit sound...');
        this.generateTone(100, 0.2, 'sawtooth', 0.4);
        setTimeout(() => {
            this.generateTone(80, 0.15, 'sawtooth', 0.3);
        }, 100);
    }

    // Generate success sound
    generateSuccess() {
        console.log('✅ Generating success sound...');
        const notes = [600, 700, 800, 900];
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.generateTone(note, 0.2, 'sine', 0.25);
            }, index * 150);
        });
    }

    // Generate all sounds for testing
    generateAllSounds() {
        console.log('🎵 Generating all placeholder sounds...');
        
        setTimeout(() => this.generateAmbientDesert(), 0);
        // setTimeout(() => this.generateFootstep(), 3000); // Footstep disabled
        setTimeout(() => this.generateJump(), 4000);
        setTimeout(() => this.generateCollectJerry(), 5000);
        setTimeout(() => this.generateCollectOrb(), 6000);
        setTimeout(() => this.generateLowEnergy(), 7000);
        setTimeout(() => this.generateDayComplete(), 8000);
        setTimeout(() => this.generateHit(), 9000);
        setTimeout(() => this.generateSuccess(), 10000);
    }
}

// Audio test UI removed - no longer creates overlay in game

// Initialize audio generator when page loads (without UI)
let audioGen;
document.addEventListener('DOMContentLoaded', () => {
    audioGen = new AudioGenerator();
    // createAudioTestUI(); // Removed - no longer creates test overlay
});

// Export for use in other scripts
window.AudioGenerator = AudioGenerator; 