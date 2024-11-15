import { ArmyResouceManager } from "../../armyResourceManager.js";
import { Logger } from "../logger.js";
import { clampValue } from "../math/math.js";

export const MusicPlayer = function() {
    this.tracks = new Map();
    this.currentTack = null;
    this.previousTrack = null;
    this.musicTypes = {};
    this.volume = 0.5;
}

MusicPlayer.prototype.loadAllTracks = function() {
    for(const key in this.musicTypes) {
        this.loadTrack(key);
    }
}

MusicPlayer.prototype.clear = function() {
    this.tracks.forEach((value, key) => this.resetTrack(key));
    this.tracks.clear();
}

MusicPlayer.prototype.load = function(musicTypes) {
    if(typeof musicTypes === "object") {
        this.musicTypes = musicTypes;
    } else {
        Logger.log(false, "MusicTypes cannot be undefined!", "MusicPlayer.prototype.load", null);
    }
}

MusicPlayer.prototype.swapTrack = function(audioID, volume = this.volume) {
    if(!this.tracks.has(audioID)) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.swapTrack", {audioID});

        return false;
    }

    if(this.currentTack === audioID) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.swapTrack", {audioID});

        return false;
    }

    this.resetTrack(this.currentTack);
    this.playTrack(audioID, volume);

    return true;
}

MusicPlayer.prototype.loadTrack = function(audioID) {
    const musicType = this.musicTypes[audioID];

    if(!musicType) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.loadTrack", {audioID});

        return false;
    }

    if(this.tracks.has(audioID)) {
        Logger.log(false, "Track is already loaded!", "MusicPlayer.prototype.loadTrack", {audioID});

        return false;
    }

    const audio = ArmyResouceManager.loadHTMLAudio(musicType);
    this.tracks.set(audioID, audio);

    return true;
}

MusicPlayer.prototype.playTrack = function(audioID = this.currentTack, volume = this.volume) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.playTrack", {audioID});

        return false;
    }

    if(!audio.paused) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.playTrack", {audioID});

        return false;
    }

    if(audioID !== this.currentTack) {
        this.previousTrack = this.currentTack;
    }

    this.currentTack = audioID;
    audio.volume = volume;
    audio.play();

    return true;
}

MusicPlayer.prototype.pauseTrack = function(audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.pauseTrack", {audioID});

        return false;
    }

    audio.pause();

    return true;
}

MusicPlayer.prototype.resetTrack = function(audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.resetTrack", {audioID});

        return false;
    }

    audio.currentTime = 0;
    audio.pause();

    return true;
}


MusicPlayer.prototype.setVolume = function(volume = this.volume, audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.setVolume", {audioID});

        return false;
    }

    audio.volume = volume;

    return true;
}

MusicPlayer.prototype.adjustVolume = function(byValue = 0, audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);
    this.volume = clampValue(this.volume + byValue, 1, 0);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.adjustVolume", {audioID});

        return false;
    }

    audio.volume = this.volume;

    return true;
}