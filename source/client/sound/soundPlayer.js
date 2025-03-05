import { Logger } from "../../logger.js";
import { PathHandler } from "../../resources/pathHandler.js";

export const SoundPlayer = function() {
    this.defaultVolume = 0.3;
    this.sounds = new Map();
    this.activeSounds = new Map();
    this.audioContext = new AudioContext();
    this.audioBuffers = new Map();
    this.soundTypes = {};
}

SoundPlayer.prototype.promiseAudioBuffer = function(path) {
    return fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer));
}

SoundPlayer.prototype.bufferAudio = function(audioID, meta) {
    const { directory, source } = meta;
    const path = PathHandler.getPath(directory, source);
    
    if(this.audioBuffers.has(audioID)) {
        return;
    }
    
    return this.promiseAudioBuffer(path)
    .then(audioBuffer => {
        this.audioBuffers.set(audioID, audioBuffer);

        return audioBuffer;
    });
}

SoundPlayer.prototype.getAudioSource = async function(audioID, meta, volume) {
    if(!this.audioBuffers.has(audioID)) {
        await this.bufferAudio(meta);
    }

    const buffer = this.audioBuffers.get(audioID);
    const gainNode = this.audioContext.createGain();
    const sourceNode = this.audioContext.createBufferSource();

    sourceNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    sourceNode.buffer = buffer;

    return sourceNode;
}

SoundPlayer.prototype.load = function(soundTypes) {
    if(!soundTypes) {
        Logger.log(false, "SoundTypes cannot be undefined!", "SoundPlayer.prototype.load", null);
        return;
    }

    this.soundTypes = soundTypes; 
}

SoundPlayer.prototype.clear = function() {
    this.activeSounds.forEach((sound, audioID) => this.stopSound(audioID));
}

SoundPlayer.prototype.getRandomSoundID = function(soundList) {
    const validIndices = [];

    for(let i = 0; i < soundList.length; i++) {
        const soundID = soundList[i];
        const soundType = this.soundTypes[soundID];

        if(!soundType) {
            continue;
        }

        if(this.activeSounds.has(soundID) && !soundType.allowStacking) {
            continue;
        }

        validIndices.push(i);
    }

    if(validIndices.length === 0) {
        return null;
    }

    const randomIndexIndex = Math.floor(Math.random() * validIndices.length);
    const randomIndex = validIndices[randomIndexIndex];

    return soundList[randomIndex];
}

SoundPlayer.prototype.playRandom = function(soundList, volume) {
    if(!soundList || soundList.length === 0) {
        Logger.log(false, "List is undefined or empty!", "SoundPlayer.prototype.playRandom", null);
        return;
    }

    const soundID = this.getRandomSoundID(soundList);

    if(!soundID) {
        Logger.log(false, "No valid sound found!", "SoundPlayer.prototype.playRandom", null);
        return;
    }

    this.playSound(soundID, volume);
}

SoundPlayer.prototype.playSound = function(audioID, volume = this.defaultVolume) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.playSound", {audioID});
        return;
    }

    if(this.activeSounds.has(audioID) && !soundType.allowStacking) {
        Logger.log(false, "Sound is already playing!", "SoundPlayer.prototype.playSound", {audioID});
        return;
    }

    this.activeSounds.set(audioID, null);

    this.getAudioSource(audioID, soundType, volume).then(source => {
        this.activeSounds.set(audioID, source);

        source.onended = () => this.activeSounds.delete(audioID);
        source.start(0);
    });
}

SoundPlayer.prototype.stopSound = function(audioID) {
    if(!this.activeSounds.has(audioID)) {
        Logger.log(false, "Sound is not active!", "SoundPlayer.prototype.stopSound", {audioID});
        return;
    }

    const sound = this.activeSounds.get(audioID);

    if(sound) {
        sound.stop();
    }

    this.activeSounds.delete(audioID);
}

SoundPlayer.prototype.loadSound = async function(audioID) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.loadSound", {audioID});

        return null;
    }

    return this.bufferAudio(audioID, soundType);
}

SoundPlayer.prototype.loadAllSounds = function() {
    for(const soundID in this.soundTypes) {
        this.loadSound(soundID);
    }
}