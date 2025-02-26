import { Logger } from "../../logger.js";
import { PathHandler } from "../../resources/pathHandler.js";
import { MusicTrack } from "./musicTrack.js";

export const MusicPlayer = function() {
    this.defaultVolume = 1;
    this.currentTrack = null;
    this.previousTrack = null;
    this.tracks = new Map();
}

MusicPlayer.prototype.clear = function() {
    this.tracks.forEach(track => track.remove());
    this.tracks.clear();
}

MusicPlayer.prototype.load = function(musicTypes) {
    if(!musicTypes) {
        Logger.log(false, "MusicTypes cannot be undefined!", "MusicPlayer.prototype.load", null);
        return;
    }

    for(const trackID in musicTypes) {
        const trackType = musicTypes[trackID];

        if(!this.tracks.has(trackID)) {
            const track = this.createTrack(trackType);

            this.tracks.set(trackID, track);
        }
    }
}

MusicPlayer.prototype.createTrack = function(trackType) {
    const { directory, source, isLooping, volume } = trackType;
    const path = PathHandler.getPath(directory, source);
    const track = new MusicTrack(path);

    track.setLooping(isLooping);
    track.setVolume(volume ?? this.defaultVolume);

    return track;
}

MusicPlayer.prototype.swapTrack = function(audioID, volume) {
    const nextTrack = this.tracks.get(audioID);

    if(!nextTrack) {
        return;
    }

    if(this.currentTrack === audioID) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.swapTrack", {audioID});
        return;
    }

    const currentTrack = this.tracks.get(this.currentTrack);

    if(currentTrack) {
        currentTrack.reset();
    }

    this.playTrack(audioID, volume);
}

MusicPlayer.prototype.playTrack = function(audioID = this.currentTrack, volume) {
    const track = this.tracks.get(audioID);

    if(!track) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.playTrack", {audioID});
        return;
    }

    if(track.isPlaying()) {
        Logger.log(false, "Track is already playing!", "MusicPlayer.prototype.playTrack", {audioID});
        return;
    }

    if(audioID !== this.currentTrack) {
        this.previousTrack = this.currentTrack;
    }

    this.currentTrack = audioID;

    if(typeof volume === "number") {
        track.setVolume(volume);
    }

    track.play();
}

MusicPlayer.prototype.setVolume = function(volume = this.defaultVolume, audioID = this.currentTrack) {
    const track = this.tracks.get(audioID);

    if(!track) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.setVolume", { audioID });
        return;
    }

    track.setVolume(volume);
}

MusicPlayer.prototype.adjustVolume = function(delta = 0, audioID = this.currentTrack) {
    const track = this.tracks.get(audioID);

    if(!track) {
        Logger.log(false, "Track does not exist!", "MusicPlayer.prototype.adjustVolume", { audioID });
        return;
    }

    track.adjustVolume(delta);
}