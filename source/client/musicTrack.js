import { clampValue } from "../math/math.js";

export const MusicTrack = function(path) {
    this.path = path;
    this.audio = null;
    this.volume = 1;
    this.isLooping = true;
    this.state = MusicTrack.STATE.NOT_STARTED;
}

MusicTrack.STATE = {
    NOT_STARTED: 0,
    PLAYING: 1,
    PAUSED: 2
};

MusicTrack.ERROR_CODE = {
    NONE: 0,
    NO_PATH: 1,
    ALREADY_LOADED: 2
};

MusicTrack.prototype.isLoaded = function() {
    return this.audio !== null;
}

MusicTrack.prototype.isPaused = function() {
    return this.state === MusicTrack.STATE.PAUSED;
}

MusicTrack.prototype.isPlaying = function() {
    return this.state === MusicTrack.STATE.PLAYING;
}

MusicTrack.prototype.play = function() {
    if(this.state === MusicTrack.STATE.PLAYING) {
        return;
    }

    if(this.audio) {
        this.state = MusicTrack.STATE.PLAYING;
        this.audio.volume = this.volume;
        this.audio.play();
    }
}

MusicTrack.prototype.remove = function() {
    this.reset();
    this.audio = null;
}

MusicTrack.prototype.pause = function() {
    if(this.audio) {
        this.state = MusicTrack.STATE.PAUSED;
        this.audio.pause();
    }
}

MusicTrack.prototype.reset = function() {
    if(this.audio) {
        this.state = MusicTrack.STATE.NOT_STARTED;
        this.audio.currentTime = 0;
        this.audio.pause();
    }
}

MusicTrack.prototype.adjustVolume = function(delta) {
    const volume = clampValue(this.volume + delta, 1, 0);

    this.volume = volume;

    if(this.audio) {
        this.audio.volume = this.volume;
    }
}

MusicTrack.prototype.setVolume = function(volume) {
    this.volume = clampValue(volume, 1, 0);

    if(this.audio) {
        this.audio.volume = this.volume;
    }
}

MusicTrack.prototype.setLooping = function(isLooping) {
    this.isLooping = isLooping;

    if(this.audio) {
        this.audio.loop = this.isLooping;
    }
}

MusicTrack.prototype.requestAudio = function() {
    if(!this.path) {
        return MusicTrack.ERROR_CODE.NO_PATH;
    }

    if(this.audio) {
        return MusicTrack.ERROR_CODE.ALREADY_LOADED;
    }

    const audio = new Audio();

    audio.loop = this.isLooping;
    audio.src = this.path;
    audio.onended = () => {
        if(!this.isLooping) {
            this.state = MusicTrack.STATE.NOT_STARTED;
        }
    }

    this.audio = audio;

    return MusicTrack.ERROR_CODE.NONE;
}