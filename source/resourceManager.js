export const ResourceManager = function() {
    this.fonts = new Map();
}

ResourceManager.prototype.getPath = function(directory, source) {
    const path = `${directory}/${source}`;

    return path;
}

ResourceManager.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
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

export const GlobalResourceManager = new ResourceManager();