import { PathHandler } from "./pathHandler.js";

export const AudioManager = function() {
    this.audio = new Map();
    this.audioContext = new AudioContext();
    this.audioBuffers = new Map();
}

AudioManager.prototype.promiseAudioBuffer = function(path) {
    return fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer));
}

AudioManager.prototype.bufferAudio = function(audioID, meta) {
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

AudioManager.prototype.getAudioSource = async function(audioID, meta, volume) {
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