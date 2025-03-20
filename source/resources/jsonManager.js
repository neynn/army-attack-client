import { PathHandler } from "./pathHandler.js";

export const JSONManager = function() {
    this.files = new Map();
    this.cacheEnabled = false;
}

JSONManager.prototype.enableCache = function() {
    this.cacheEnabled = true;
}

JSONManager.prototype.disableCache = function() {
    this.cacheEnabled = false;
}

JSONManager.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}

JSONManager.prototype.loadFileData = async function(id, directory, source) {
    if(this.cacheEnabled) {
        const cachedMap = this.files.get(id);

        if(cachedMap) {
            return cachedMap;
        }
    }

    const filePath = PathHandler.getPath(directory, source);
    const fileData = await this.promiseJSON(filePath);

    if(!fileData) {
        return null;
    }

    if(this.cacheEnabled) {
        this.files.set(id, fileData);
    }

    return fileData;
}