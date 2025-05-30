import { PathHandler } from "./resources/pathHandler.js";

export const ResourceLoader = function(devPath, prodPath) {
    this.devPath = devPath;
    this.prodPath = prodPath;
}

ResourceLoader.MODE = {
    DEVELOPER: 0,
    PRODUCTION: 1
};

ResourceLoader.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}

ResourceLoader.prototype.loadJSONList = async function(fileList) {
    const files = {};
    const promises = [];

    for(const fileID in fileList) {
        const fileMeta = fileList[fileID];
        const { directory, source } = fileMeta;
        const path = PathHandler.getPath(directory, source);
        const promise = this.promiseJSON(path).then(file => files[fileID] = file);

        promises.push(promise);
    }

    await Promise.all(promises);

    return files;
}

ResourceLoader.prototype.loadResources = async function(modeID) {
    switch(modeID) {
        case ResourceLoader.MODE.DEVELOPER: {
            const files = await this.promiseJSON(this.devPath);
            const resources = await this.loadJSONList(files);
            return resources;
        }
        case ResourceLoader.MODE.PRODUCTION: {
            const resources = await this.promiseJSON(this.prodPath);
            return resources;
        }
        default: {
            return {};
        }
    }
}