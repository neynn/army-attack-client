import { clampValue } from "../math/math.js";
import { ResourceLoader } from "../resourceLoader.js";
import { response } from "../response.js";

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

MusicPlayer.prototype.loadMusicTypes = function(musicTypes) {
    if(!musicTypes) {
        return response(false, "MusicTypes cannot be undefined!", "MusicPlayer.prototype.loadMusicTypes", null, null);
    }

    this.musicTypes = musicTypes;

    return response(true, "MusicTypes have been loaded!", "MusicPlayer.prototype.loadMusicTypes", null, null);
}

MusicPlayer.prototype.swapTrack = function(audioID, volume = this.volume) {
    if(!this.tracks.has(audioID)) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.swapTrack", null, {audioID});
    }

    if(this.currentTack === audioID) {
        return response(false, "Track is already playing!", "MusicPlayer.prototype.swapTrack", null, {audioID});
    }

    this.resetTrack(this.currentTack);
    this.playTrack(audioID, volume);

    return response(true, "Track has been swapped!", "MusicPlayer.prototype.swapTrack", null, {audioID});
}

MusicPlayer.prototype.loadTrack = function(audioID) {
    const musicType = this.musicTypes[audioID];

    if(!musicType) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.loadTrack", null, {audioID});
    }

    if(this.tracks.has(audioID)) {
        return response(false, "Track is already loaded!", "MusicPlayer.prototype.loadTrack", null, {audioID});
    }

    const audio = ResourceLoader.loadAudio(musicType);
    this.tracks.set(audioID, audio);

    return response(true, "Track has been loaded!", "MusicPlayer.prototype.loadTrack", null, {audioID});
}

MusicPlayer.prototype.playTrack = function(audioID = this.currentTack, volume = this.volume) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.playTrack", null, {audioID});
    }

    if(!audio.paused) {
        return response(false, "Track is already playing!", "MusicPlayer.prototype.playTrack", null, {audioID}); 
    }

    if(audioID !== this.currentTack) {
        this.previousTrack = this.currentTack;
    }

    this.currentTack = audioID;
    audio.volume = volume;
    audio.play();

    return response(true, "Track is now playing!", "MusicPlayer.prototype.playTrack", null, {audioID});
}

MusicPlayer.prototype.pauseTrack = function(audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.pauseTrack", null, {audioID});
    }

    audio.pause();

    return response(true, "Track has been paused!", "MusicPlayer.prototype.pauseTrack", null, {audioID});
}

MusicPlayer.prototype.resetTrack = function(audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.resetTrack", null, {audioID});
    }

    audio.currentTime = 0;
    audio.pause();

    return response(true, "Track has been reset!", "MusicPlayer.prototype.resetTrack", null, {audioID});
}


MusicPlayer.prototype.setVolume = function(volume = this.volume, audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);

    if(!audio) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.setVolume", null, {audioID, volume});
    }

    audio.volume = volume;

    return response(true, "Volume has been set!", "MusicPlayer.prototype.setVolume", null, {audioID, volume});
}

MusicPlayer.prototype.adjustVolume = function(byValue, audioID = this.currentTack) {
    const audio = this.tracks.get(audioID);
    this.volume = clampValue(this.volume + byValue, 1, 0);

    if(!audio) {
        return response(false, "Track does not exist!", "MusicPlayer.prototype.adjustVolume", null, {audioID, byValue});
    }

    audio.volume = this.volume;

    return response(true, "Volume has been adjusted!", "MusicPlayer.prototype.adjustVolume", null, {audioID, byValue});
}