import { ResourceLoader } from "../resourceLoader.js";
import { response } from "../response.js";

export const SoundPlayer = function() {
    this.context = new AudioContext();
    this.buffers = new Map();
    this.activeSounds = new Map();
    this.soundTypes = {};
    this.defaultVolume = 0.3;
}

SoundPlayer.prototype.loadSoundTypes = function(soundTypes) {
    if(soundTypes === undefined) {
        return response(false, "SoundTypes cannot be undefined!", "SoundPlayer.prototype.loadSoundTypes", null, null);
    }

    this.soundTypes = soundTypes;

    return response(true, "SoundTypes have been loaded!", "SoundPlayer.prototype.loadSoundTypes", null, null);
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
        return response(false, "List is undefined or empty!", "SoundPlayer.prototype.playRandom", null, null);
    }

    const index = Math.floor(Math.random() * soundList.length);
    const soundID = soundList[index];
    const soundType = this.soundTypes[soundID];

    if(!soundType) {
        return response(false, "Sound does not exist!", "SoundPlayer.prototype.playRandom", null, {soundID});
    }

    if(this.isPlaying(soundID) && !soundType.allowStacking) {
        const newList = soundList.filter(id => id !== soundID);
        return this.playRandom(newList, volume);
    }

    this.playSound(soundID, volume);

    return response(true, "Sound is playing!", "SoundPlayer.prototype.playRandom", null, {soundID});
}

SoundPlayer.prototype.playSound = async function(audioID, volume = this.defaultVolume) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        return response(false, "SoundType does not exist!", "SoundPlayer.prototype.playSound", null, {audioID});
    }

    if(!this.buffers.has(audioID)) {
        await this.loadSound(audioID);
    }

    const buffer = this.buffers.get(audioID);

    if(this.isPlaying(audioID) && !soundType.allowStacking) {
        return response(false, "Sound is already playing!", "SoundPlayer.prototype.playSound", null, {audioID});;
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

    return response(true, "Sound is now playing!", "SoundPlayer.prototype.playSound", null, {audioID});;
}

SoundPlayer.prototype.stopSound = function(audioID) {
    const sound = this.activeSounds.get(audioID);

    if(!sound) {
        return response(false, "Sound is not active!", "SoundPlayer.prototype.stopSound", null, {audioID});;
    }

    sound.stop();

    this.activeSounds.delete(audioID);

    return response(true, "Sound is now stopped!", "SoundPlayer.prototype.stopSound", null, {audioID});;
}

SoundPlayer.prototype.loadSound = async function(audioID) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        response(false, "SoundType does not exist!", "SoundPlayer.prototype.loadSound", null, {audioID});
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

    response(true, "SoundTypes have been loaded!", "SoundPlayer.prototype.loadAllSounds", null);
}