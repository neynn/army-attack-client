import { GlobalResourceManager } from "./resourceManager.js";

export const ResourceLoader = {
    SIZE_MB: 1048576,
    BIG_IMAGE: 2048 * 2048 * 4,
    DEFAULT_IMAGE_TYPE: ".png",
    DEFAULT_AUDIO_TYPE: ".mp3",
    FILE_SERVER_ADDRESS: "https://neynn.github.io/army-attack-client"
}

ResourceLoader.loadImages = function(images, onLoad) {
    const promises = [];

    for(const key in images) {
        const imageConfig = images[key];
        const { directory, source } = imageConfig;
        const imagePath = GlobalResourceManager.getPath(directory, source ? source : `${key}${ResourceLoader.DEFAULT_IMAGE_TYPE}`);
        const imagePromise = GlobalResourceManager.promiseHTMLImage(imagePath)
        .then(image => onLoad(key, image, imageConfig))
        .catch(error => console.error({key, error}));

        promises.push(imagePromise);
    }

    return Promise.allSettled(promises);
}