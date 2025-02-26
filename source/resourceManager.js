import { PathHandler } from "./resources/pathHandler.js";

export const ResourceManager = function() {
    this.fonts = new Map();
}

ResourceManager.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}

ResourceManager.prototype.addFont = function(id, font) {
    if(this.fonts.has(id)) {
        return;
    }

    this.fonts.set(id, font);

    document.fonts.add(font);
}

ResourceManager.prototype.loadCSSFont = function(meta) {
    const { id, directory, source } = meta;
    const path = PathHandler.getPath(directory, source);
    const fontFace = new FontFace(id, `url(${path})`);

    return fontFace.load().then(font => this.addFont(id, font));
}

ResourceManager.prototype.loadFontList = async function(fontList) {
	const promises = [];

	for(const fontID in fontList) {
		const fontMeta = fontList[fontID];
        const promise = this.loadCSSFont(fontMeta)

		promises.push(promise);
	}

	await Promise.allSettled(promises);
}

ResourceManager.prototype.loadJSONList = async function(fileList) {
    const files = {};
    const promises = [];

    for(const fileID in fileList) {
        const fileMeta = fileList[fileID];
        const { directory, source } = fileMeta;
        const path = PathHandler.getPath(directory, source);
        const promise = this.promiseJSON(path).then(file => files[fileID] = file);

        promises.push(promise);
    }

    await Promise.allSettled(promises);

    return files;
}