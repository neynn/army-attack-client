import { Sheet } from "./resources/sheet.js";

export const ResourceManager = function() {
    this.serverAddress = null;
    this.audioContext = new AudioContext();
    this.audioBuffers = new Map();

    this.spriteSheets = new Map();
    this.tileSheets = new Map();
    this.fonts = new Map();
    this.maps = new Map();
}

ResourceManager.MAP_CACHE_ENABLED = true;
ResourceManager.SIZE_MB = 1048576;
ResourceManager.SIZE_BIG_IMAGE = 2048 * 2048 * 4;
ResourceManager.DEFAULT_IMAGE_TYPE = ".png";
ResourceManager.DEFAULT_AUDIO_TYPE = ".mp3";

ResourceManager.prototype.addTileSheet = function(id, image) {
    if(this.tileSheets.has(id)) {
        return false;
    }

    const sheet = new Sheet(id, image);

    this.tileSheets.set(id, sheet);

    return true;
}

ResourceManager.prototype.addSpriteSheet = function(id, image) {
    if(this.spriteSheets.has(id)) {
        return false;
    }

    const sheet = new Sheet(id, image);

    this.spriteSheets.set(id, sheet);

    return true;
}

ResourceManager.prototype.loadMapData = async function(meta) {
    const { id, directory, source } = meta;

    if(ResourceManager.MAP_CACHE_ENABLED) {
        const cachedMap = this.maps.get(id);

        if(cachedMap) {
            return cachedMap;
        }
    }

    const mapPath = this.getPath(directory, source);
    const mapData = await this.promiseJSON(mapPath);

    if(!mapData) {
        return null;
    }

    if(ResourceManager.MAP_CACHE_ENABLED) {
        this.maps.set(id, mapData);
    }

    return mapData;
}

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
    return fetch(path).then(response => response.json()).catch(error => null);
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

ResourceManager.prototype.loadImages = function(imageMeta, onLoad, onError) {
    const promises = [];
  
    for(const imageID in imageMeta) {
        const imageConfig = imageMeta[imageID];
        const { directory, source } = imageConfig;
        const imagePath = this.getPath(directory, source ? source : `${imageID}${ResourceManager.DEFAULT_IMAGE_TYPE}`);
        const imagePromise = this.promiseHTMLImage(imagePath)
        .then(image => onLoad(imageID, image, imageConfig))
        .catch(error => onError(imageID, error, imageConfig));
  
        promises.push(imagePromise);
    }
  
    return Promise.allSettled(promises);
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

ResourceManager.prototype.getTileSheet = function(sheetID) {
    const sheet = this.tileSheets.get(sheetID);

    if(!sheet) {
        return null;
    }

    return sheet.getBuffer();
}

ResourceManager.prototype.getSpriteSheet = function(sheetID) {
    const sheet = this.spriteSheets.get(sheetID);

    if(!sheet) {
        return null;
    }

    return sheet.getBuffer();
}

export const GlobalResourceManager = new ResourceManager();