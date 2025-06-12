import { PathHandler } from "./resources/pathHandler.js";

export const ResourceLoader = function() {
    if(ResourceLoader.INSTANCE) {
        return ResourceLoader.INSTANCE;
    }

    this.resources = {};

    ResourceLoader.INSTANCE = this;
}

ResourceLoader.INSTANCE = null;

ResourceLoader.DEV_PATH = "";
ResourceLoader.PROD_PATH = "";

ResourceLoader.MODE = {
    DEVELOPER: 0,
    PRODUCTION: 1
};

ResourceLoader.setPaths = function(devPath, prodPath) {
    ResourceLoader.DEV_PATH = devPath;
    ResourceLoader.PROD_PATH = prodPath;
}

ResourceLoader.getInstance = function() {
    if(!ResourceLoader.INSTANCE) {
        new ResourceLoader();
    }

    return ResourceLoader.INSTANCE;
}

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
            const files = await this.promiseJSON(ResourceLoader.DEV_PATH);
            const resources = await this.loadJSONList(files);

            this.resources = resources;
            break;
        }
        case ResourceLoader.MODE.PRODUCTION: {
            const resources = await this.promiseJSON(ResourceLoader.PROD_PATH);

            this.resources = resources;
            break;
        }
    }

    return this.resources;
}