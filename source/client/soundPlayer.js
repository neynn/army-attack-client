import { ArmyResouceManager } from "../../armyResourceManager.js";
import { Logger } from "../logger.js";

export const SoundPlayer = function() {
    this.activeSounds = new Map();
    this.soundTypes = {};
    this.defaultVolume = 0.3;
}

SoundPlayer.prototype.load = function(soundTypes) {
    if(typeof soundTypes === "object") {
        this.soundTypes = soundTypes; 
    } else {
        Logger.log(false, "SoundTypes cannot be undefined!", "SoundPlayer.prototype.load", null);
    }
}

SoundPlayer.prototype.clear = function() {
    this.activeSounds.forEach((sound, audioID) => this.stopSound(audioID));
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

SoundPlayer.prototype.playSound = function(audioID, volume = this.defaultVolume) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.playSound", {audioID});

        return false;
    }

    if(this.isPlaying(audioID) && !soundType.allowStacking) {
        Logger.log(false, "Sound is already playing!", "SoundPlayer.prototype.playSound", {audioID});

        return false;
    }

    this.activeSounds.set(audioID, null);

    ArmyResouceManager.getAudioSource(soundType, volume).then(source => {
        this.activeSounds.set(audioID, source);

        source.onended = () => this.activeSounds.delete(audioID);
        source.start(0);
    });

    return true;
}

SoundPlayer.prototype.stopSound = function(audioID) {
    if(!this.activeSounds.has(audioID)) {
        Logger.log(false, "Sound is not active!", "SoundPlayer.prototype.stopSound", {audioID});

        return false;
    }

    const sound = this.activeSounds.get(audioID);

    if(sound) {
        sound.stop();
    }

    this.activeSounds.delete(audioID);

    return true;
}

SoundPlayer.prototype.loadSound = async function(audioID) {
    const soundType = this.soundTypes[audioID];

    if(!soundType) {
        Logger.log(false, "SoundType does not exist!", "SoundPlayer.prototype.loadSound", {audioID});

        return null;
    }

    return ArmyResouceManager.bufferAudio(soundType);
}

SoundPlayer.prototype.loadAllSounds = function() {
    for(const soundID in this.soundTypes) {
        this.loadSound(soundID);
    }
}