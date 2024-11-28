export const JSONManager = function() {
    this.files = new Map();
}

JSONManager.FILE_CACHE_ENABLED = 1;

JSONManager.prototype.getPath = function(directory, source) {
    const path = `${directory}/${source}`;
    return path;
}

JSONManager.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}

JSONManager.prototype.loadFileData = async function(meta) {
    const { id, directory, source } = meta;

    if(JSONManager.FILE_CACHE_ENABLED) {
        const cachedMap = this.files.get(id);

        if(cachedMap) {
            return cachedMap;
        }
    }

    const filePath = this.getPath(directory, source);
    const fileData = await this.promiseJSON(filePath);

    if(!fileData) {
        return null;
    }

    if(JSONManager.FILE_CACHE_ENABLED) {
        this.files.set(id, fileData);
    }

    return fileData;
}