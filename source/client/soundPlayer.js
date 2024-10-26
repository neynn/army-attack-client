import { Logger } from "../logger.js";
import { ResourceLoader } from "../resourceLoader.js";

export const SoundPlayer = function() {
    this.context = new AudioContext();
    this.buffers = new Map();
    this.activeSounds = new Map();
    this.soundTypes = {};
    this.defaultVolume = 0.3;
}

SoundPlayer.prototype.loadSoundTypes = function(soundTypes) {
    if(soundTypes === undefined) {
        Logger.log(false, "SoundTypes cannot be undefined!", "SoundPlayer.prototype.loadSoundTypes", null);

        return false;
    }

    this.soundTypes = soundTypes;

    return true;
} 

SoundPlayer.prototype.clear = function() {
    this.activeSounds.forEach((sound, key) => this.stopSound(key));
    this.buffers.clear();
}

SoundPlayer.prototype.isPlaying = function(audioID) {
    return this.activeSounds.has(audioID);
}

SoundPlayer.prototype.playRandom = function(soundList, volume) {
    if(!soundList || soundList.length === 0) {
        Logger.log(false, "List is undefined or empty!", "SoundPlayer.prototype.playRandom", null);

        return false;
    }

    const index = Math.floor(Math.random() * soundList.length);
    const soundID = soundList[index];
    const soundType = this.soundTypes[soundID];

    if(!soundType) {
        Logger.log(false, "Sound does not exist!", "SoundPlayer.prototype.playRandom", {soundID});

        return false;
    }

    if(this.isPlaying(soundID) && !soundType.allowStacking) {
        const newList = soundList.filter(id => id !== soundID);

        return this.playRandom(newList, volume);
    }

    this.playSound(soundID, volume);

    return true;
}

SoundPlayer.prototype.playSound = async function(audioID, volume = this.defaultVolume) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.playSound", {audioID});

        return false;
    }

    if(!this.buffers.has(audioID)) {
        await this.loadSound(audioID);
    }

    const buffer = this.buffers.get(audioID);

    if(this.isPlaying(audioID) && !soundType.allowStacking) {
        Logger.log(false, "Sound is already playing!", "SoundPlayer.prototype.playSound", {audioID});

        return false;
    }

    const gainNode = this.context.createGain();
    const source = this.context.createBufferSource();

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    source.buffer = buffer;
    source.start(0);
    source.onended = () => this.activeSounds.delete(audioID);

    this.activeSounds.set(audioID, source);

    return true;
}

SoundPlayer.prototype.stopSound = function(audioID) {
    const sound = this.activeSounds.get(audioID);

    if(!sound) {
        Logger.log(false, "Sound is not active!", "SoundPlayer.prototype.stopSound", {audioID});

        return false;
    }

    sound.stop();

    this.activeSounds.delete(audioID);

    return true;
}

SoundPlayer.prototype.loadSound = async function(audioID) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.loadSound", {audioID});

        return null;
    }

    const promise = ResourceLoader.loadSoundBuffer(soundType, this.context)
    .then(decodedBuffer => this.buffers.set(audioID, decodedBuffer));

    return promise;
}

SoundPlayer.prototype.loadAllSounds = async function() {
    const promises = [];

    for(const soundID in this.soundTypes) {
        const promise = this.loadSound(soundID);
        promises.push(promise);
    }

    await Promise.allSettled(promises);
}