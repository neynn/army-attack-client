const ResourceManager = function() {
    this.serverAddress = null;
    this.audioContext = new AudioContext();
    this.audioBuffers = new Map();

    this.sprites = new Map();
    this.tiles = new Map();
    this.fonts = new Map();
}

ResourceManager.SIZE_MB = 1048576;
ResourceManager.SIZE_BIG_IMAGE = 2048 * 2048 * 4;
ResourceManager.DEFAULT_IMAGE_TYPE = ".png";
ResourceManager.DEFAULT_AUDIO_TYPE = ".mp3";

ResourceManager.prototype.getPath = function(directory, source) {
    const path = `${directory}/${source}`;

    return path;
}

ResourceManager.prototype.promiseHTMLImage = function(path) {
    const promise = new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(image);
        image.src = path;
    }); 

    return promise;
}

ResourceManager.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json());
}

ResourceManager.prototype.promiseAudioBuffer = function(path) {
    return fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer));
}

ResourceManager.prototype.bufferAudio = function(meta) {
    const { id, directory, source } = meta;
    const path = this.getPath(directory, source);
    
    return this.promiseAudioBuffer(path)
    .then(audioBuffer => {
        this.audioBuffers.set(id, audioBuffer);

        return audioBuffer;
    });
}

ResourceManager.prototype.loadHTMLAudio = function(meta) {
    const { directory, source, isLooping } = meta;
    const path = this.getPath(directory, source);
    const audio = new Audio();

    audio.loop = isLooping;
    audio.src = path;

    return audio;
}

ResourceManager.prototype.loadCSSFont = function(meta) {
    const { id, directory, source } = meta;
    const path = this.getPath(directory, source);
    const fontFace = new FontFace(id, `url(${path})`);

    return fontFace.load().then(font => {
        this.fonts.set(id, font);

        document.fonts.add(font);
    });
}

ResourceManager.prototype.loadMain = async function(directory, source) {
    const promises = [];
    const fileIDs = [];
    const mainPath = this.getPath(directory, source);
    const mainFile = await this.promiseJSON(mainPath);

    for(const fileID in mainFile) {
        const fileMeta = mainFile[fileID];
        const { id, directory, source } = fileMeta;
        const path = this.getPath(directory, source);
        const file = this.promiseJSON(path);

        fileIDs.push(id);
        promises.push(file);
    }

    const files = {};
    const results = await Promise.allSettled(promises);

    for(let i = 0; i < results.length; i++) {
        const result = results[i];
        const fileID = fileIDs[i];

        files[fileID] = result.value;
    }

    return files;
}

ResourceManager.prototype.getAudioSource = async function(meta, volume) {
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

ResourceManager.prototype.getSpriteBuffer = function(meta) {

}

ResourceManager.prototype.setServerAddress = function(address) {
    this.serverAddress = address;
}

export const GlobalResourceManager = new ResourceManager();

//Loads and keeps track of all resouces.
//This is long, LONG overdue!

/*
    ArmyContext: 
        onEntityCreate: -> load the required assets in. SpriteManager
*/

//ResourceManager holds the image data in BIG sets of data.
//SpriteManager has no access to the ImageSheets. Why should it? All it needs to know is the metadata!!!