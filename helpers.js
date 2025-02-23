export const saveTemplateAsFile = (filename, dataObjToWrite) => {
  const blob = new Blob([dataObjToWrite], { type: "text/json" });
  const link = document.createElement("a");

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

  const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
}

export const packerToJSON = (id, packerFile) => {
  const formattedFrames = Object.keys(packerFile.frames).map(key => {
    const {x, y, w, h} = packerFile.frames[key].frame;
    return `"${key}": {"x":${x},"y":${y},"w":${w},"h":${h},"offset":{"x":0,"y":0}}`;
  }
).join(',\n        ');

  const meta = `{
    "id": "${id}",
    "directory": "assets/tiles",
    "source": "${packerFile.meta.image}",
    "offset": { "x": 0, "y": 0 },
    "frameTime": 0.03,
    "allowFlip": false,
    "frames": {
        ${formattedFrames}
    }
}
`;

  saveTemplateAsFile(`${id}.json`, meta);
}

const rleLayer = function(buffer) {    
    if(buffer.length === 0) {
        return [];
    }

    let index = 0;
    const encodedLayer = [buffer[0], 1];

    for(let i = 1; i < buffer.length; i++) {
        const currentID = buffer[i];

        if(currentID === encodedLayer[index]) {
            encodedLayer[index + 1]++;
        } else {
            encodedLayer.push(currentID);
            encodedLayer.push(1);
            index += 2;
        }  
    }

    return encodedLayer;
}

const formatLayers = function(worldMap) {
    const formattedLayers = [];
    const layers = worldMap.getLayers();
    const graphics = worldMap.getGraphicsSettings();

	for(const layerID in layers) {
        const layerMeta = graphics.layers[layerID];

		if(layerMeta && layerMeta.autoGenerate) {
			continue;
		}

		formattedLayers.push(`"${layerID}": [${rleLayer(layers[layerID])}]`);
	}

    return formattedLayers;
}

const formatLayerSettings = function(worldMap) {
    const formattedConfig = [];
    const { layers } = worldMap.getGraphicsSettings();

    for(const layerID in layers) {
        const layer = layers[layerID];
        const { id, opacity, autoGenerate } = layer;

        formattedConfig.push(`"${id}": { "id": "${id}", "opacity": ${opacity}, "autoGenerate": ${autoGenerate} }`);
    }

    return formattedConfig;
}

const stringifyArray = (width, height, array) => {
    let result = `[\n        `;

    for (let i = 0; i < height; i++) {
        let row = ``;

        for (let j = 0; j < width; j++) {
            const element = array[i * width + j];
            const jsonElement = JSON.stringify(element);
            
            row += jsonElement;

            if(j < width - 1) {
                row += `,`
            }
        }

        result += row;

        if (i < height - 1) {
            result += `,\n        `;
        }
    }

    result += `\n    ]`;
    
    return result;
}

export const saveMap = function(mapID, map2D) {
    if(!map2D) {
        return `{ "ERROR": "MAP NOT LOADED! USE CREATE OR LOAD!" }`;
    }

    const formattedConfig = formatLayerSettings(map2D);
	const formattedLayers = formatLayers(map2D);
      
    const downloadableString = 
`{
    "music": "${map2D.meta.music}",
    "width": ${map2D.width},
    "height": ${map2D.height},
    "graphics": {
        "layers": {
            ${formattedConfig.join(",\n            ")}
        },
        "background": ${JSON.stringify(map2D.meta.graphics.background)},
        "foreground": ${JSON.stringify(map2D.meta.graphics.foreground)}
    }
}`;

    const downloadableLayers = 
`{
    ${formattedLayers.join(",\n    ")}
}`;

    saveTemplateAsFile("layers_" + mapID + ".json", downloadableLayers);
    saveTemplateAsFile("meta_" + mapID + ".json", downloadableString);
}

export const saveSprites = function(spriteTypes) {
    const formatFrames = (frames) => {
        const formattedFrames = [];

        for(const key in frames) {
            const frame = frames[key];
            const format = `"${key}": {"x":${frame.x},"y":${frame.y},"w":${frame.w},"h":${frame.h},"offset":{"x":0,"y":0}}`;

            formattedFrames.push(format);
        }

        return formattedFrames;
    }

    const output = [];

    for(const typeID in spriteTypes) {
        const type = spriteTypes[typeID];
        const typeString =
`"${typeID}": {
        "id": "${typeID}",
        "directory": "${type.directory}",
        "source": "${type.source}",
        "bounds": {"x":${type.offset.x},"y":${type.offset.y},"w":${type.frames["1"].w},"h":${type.frames["1"].h}},
        "frameTime": ${type.frameTime},
        "allowFlip": ${type.allowFlip},
        "frames": {
            ${formatFrames(type.frames).join(",\n            ")}
        }
    }`;
        output.push(typeString);
    }

    const downloadableString =
`{
    ${output.join(`,\n    `)}
}`;

    saveTemplateAsFile("sprites.json", downloadableString);
}