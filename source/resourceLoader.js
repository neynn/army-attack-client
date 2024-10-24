export const ResourceLoader = function() {}

ResourceLoader.DEFAULT_IMAGE_TYPE = ".png";
ResourceLoader.DEFAULT_AUDIO_TYPE = ".mp3";
ResourceLoader.FILE_SERVER_ADDRESS = "https://neynn.github.io/Army_Attack_Client";

ResourceLoader.getPath = function(directory, source) {
    const path = `${ResourceLoader.FILE_SERVER_ADDRESS}/${directory}/${source}`;
    return path;
}

ResourceLoader.promiseImage = function(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => { 
            resolve(image);
        }

        image.onerror = () => { 
            console.error(path);
            reject(image);
        }

        image.src = path;
    });
}

ResourceLoader.loadJSON = function(path) {
    return fetch(path)
    .then(response => response.json())
    .catch(error => console.error({path, error}));
}

ResourceLoader.loadAudio = function({ directory, source, isLooping }) {
    const path = this.getPath(directory, source);
    const audio = new Audio();

    audio.loop = isLooping;
    audio.src = path;

    return audio;
}

ResourceLoader.loadSoundBuffer = function({ directory, source }, context) {
    const path = this.getPath(directory, source);
    const decodedBuffer = fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))

    return decodedBuffer;
}

ResourceLoader.loadImages = function(images, onLoad) {
    const promises = [];

    for(const key in images) {
        const imageConfig = images[key];
        const { id, directory, source } = imageConfig;
        const imagePath = ResourceLoader.getPath(directory, source ? source : `${key}${ResourceLoader.DEFAULT_IMAGE_TYPE}`);
        const imagePromise = ResourceLoader.promiseImage(imagePath)
        .then(image => onLoad(key, image, imageConfig))
        .catch(error => console.error({key, error}));

        promises.push(imagePromise);
    }

    return Promise.allSettled(promises);
}

ResourceLoader.loadFonts = function(fonts, onLoad) {
    const promises = [];

    for(const key in fonts) {
        const fontConfig = fonts[key];
        const { id, directory, source } = fontConfig;
        const url = `url(${ResourceLoader.FILE_SERVER_ADDRESS}/${directory}/${source})`;
        const face = new FontFace(id, url);
        const promise = face.load()
        .then(font => onLoad(id, font, fontConfig))
        .catch(error => console.error({key, error}));

        promises.push(promise);
    }

    return Promise.allSettled(promises);
}

ResourceLoader.loadConfigFiles = async function(directory, source) {
    const promises = [];
    const fileIDs = [];
    const fileListPath = this.getPath(directory, source);
    const fileList = await ResourceLoader.loadJSON(fileListPath);

    for(const key in fileList) {
        const fileConfig = fileList[key];
        const { id, directory, source } = fileConfig;
        const path = this.getPath(directory, source);
        const promise = ResourceLoader.loadJSON(path);

        fileIDs.push(id);
        promises.push(promise);
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