import { Logger } from "../logger.js";
import { clampValue } from "../math/math.js";
import { AudioManager } from "../resources/audioManager.js";

export const MusicPlayer = function() {
    this.currentTack = null;
    this.previousTrack = null;
    this.musicTypes = {};
    this.volume = 0.5;
    this.resources = new AudioManager();
}

MusicPlayer.prototype.loadAllTracks = function() {
    for(const trackID in this.musicTypes) {
        this.loadTrack(trackID);
    }
}

MusicPlayer.prototype.clear = function() {
    this.resources.audio.forEach((value, key) => this.resetTrack(key));
    this.resources.audio.clear();
}

MusicPlayer.prototype.load = function(musicTypes) {
    if(typeof musicTypes === "object") {
        this.musicTypes = musicTypes;
    } else {
        Logger.log(false, "MusicTypes cannot be undefined!", "MusicPlayer.prototype.load", null);
    }
}

MusicPlayer.prototype.swapTrack = function(audioID, volume = this.volume) {
    if(!this.resources.audio.has(audioID)) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.swapTrack", {audioID});
        return;
    }

    if(this.currentTack === audioID) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.swapTrack", {audioID});
        return;
    }

    this.resetTrack(this.currentTack);
    this.playTrack(audioID, volume);
}

MusicPlayer.prototype.loadTrack = function(audioID) {
    const musicType = this.musicTypes[audioID];

    if(!musicType) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.loadTrack", {audioID});
        return;
    }

    if(this.resources.audio.has(audioID)) {
        Logger.log(false, "Track is already loaded!", "MusicPlayer.prototype.loadTrack", {audioID});
        return;
    }

    const audio = this.resources.loadHTMLAudio(musicType);

    this.resources.audio.set(audioID, audio);
}

MusicPlayer.prototype.playTrack = function(audioID = this.currentTack, volume = this.volume) {
    const audio = this.resources.audio.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.playTrack", {audioID});
        return;
    }

    if(!audio.paused) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.playTrack", {audioID});
        return;
    }

    if(audioID !== this.currentTack) {
        this.previousTrack = this.currentTack;
    }

    this.currentTack = audioID;
    
    audio.volume = volume;
    audio.play();
}

MusicPlayer.prototype.pauseTrack = function(audioID = this.currentTack) {
    const audio = this.resources.audio.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.pauseTrack", {audioID});
        return;
    }

    audio.pause();
}

MusicPlayer.prototype.resetTrack = function(audioID = this.currentTack) {
    const audio = this.resources.audio.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.resetTrack", {audioID});
        return;
    }

    audio.currentTime = 0;
    audio.pause();
}

MusicPlayer.prototype.setVolume = function(volume = this.volume, audioID = this.currentTack) {
    const audio = this.resources.audio.get(audioID);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.setVolume", {audioID});
        return;
    }

    audio.volume = volume;
}

MusicPlayer.prototype.adjustVolume = function(byValue = 0, audioID = this.currentTack) {
    const audio = this.resources.audio.get(audioID);
    this.volume = clampValue(this.volume + byValue, 1, 0);

    if(!audio) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.adjustVolume", {audioID});
        return;
    }

    audio.volume = this.volume;
}