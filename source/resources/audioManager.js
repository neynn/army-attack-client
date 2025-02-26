export const AudioManager = function() {
    this.audio = new Map();
    this.audioContext = new AudioContext();
    this.audioBuffers = new Map();
}

AudioManager.DEFAULT_AUDIO_TYPE = ".mp3";

AudioManager.prototype.getPath = function(directory, source) {
    const path = `${directory}/${source}`;

    return path;
}

AudioManager.prototype.promiseAudioBuffer = function(path) {
    return fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer));
}

AudioManager.prototype.bufferAudio = function(meta) {
    const { id, directory, source } = meta;
    const path = this.getPath(directory, source);
    
    if(this.audioBuffers.has(id)) {
        return;
    }
    
    return this.promiseAudioBuffer(path)
    .then(audioBuffer => {
        this.audioBuffers.set(id, audioBuffer);

        return audioBuffer;
    });
}

AudioManager.prototype.getAudioSource = async function(meta, volume) {
    const { id } = meta;

    if(!this.audioBuffers.has(id)) {
        await this.bufferAudio(meta);
    }

    const buffer = this.audioBuffers.get(id);
    const gainNode = this.audioContext.createGain();
    const sourceNode = this.audioContext.createBufferSource();

    sourceNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    sourceNode.buffer = buffer;

    return sourceNode;
}