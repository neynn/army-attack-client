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

export const saveMap = function(mapID, map2D) {
    if(!map2D) {
        return `{ "ERROR": "MAP NOT LOADED! USE CREATE OR LOAD!" }`;
    }
  
    const stringifyArray = (array) => {
        let result = `[\n        `;

        for (let i = 0; i < map2D.height; i++) {
            let row = ``;

            for (let j = 0; j < map2D.width; j++) {
                const element = array[i * map2D.width + j];
                const jsonElement = JSON.stringify(element);
                
                row += jsonElement;

                if(j < map2D.width - 1) {
                    row += `,`
                }
            }

            result += row;

            if (i < map2D.height - 1) {
                result += `,\n        `;
            }
        }

        result += `\n    ]`;
        
        return result;
    }

    const formattedBackground = [];

    for(const layerConfig of map2D.meta.backgroundLayers) {
        formattedBackground.push(`{ "id": "${layerConfig.id}", "opacity": ${layerConfig.opacity}, "autoGenerate": ${layerConfig.autoGenerate} }`);
    }

    const formattedForeground = [];

    for(const layerConfig of map2D.meta.foregroundLayers) {
        formattedForeground.push(`{ "id": "${layerConfig.id}", "opacity": ${layerConfig.opacity}, "autoGenerate": ${layerConfig.autoGenerate} }`);
    }

    const formattedMeta = [];

    for(const layerConfig of map2D.meta.metaLayers) {
        formattedMeta.push(`{ "id": "${layerConfig.id}", "opacity": ${layerConfig.opacity}, "autoGenerate": ${layerConfig.autoGenerate} }`);
    }

	const formattedLayers = [];
    const autoLayers = map2D.getAutoGeneratingLayers();

	for(const layerID in map2D.layers) {
		if(autoLayers.has(layerID)) {
			continue;
		}

		formattedLayers.push(`"${layerID}": ${stringifyArray(map2D.layers[layerID])}`);
	}
      
    const downloadableString = 
`{
    "music": "${map2D.meta.music}",
    "width": ${map2D.width},
    "height": ${map2D.height},
    "backgroundLayers": [
        ${formattedBackground.join(",\n        ")}
    ],
    "foregroundLayers": [ 
        ${formattedForeground.join(",\n        ")}
    ],
    "metaLayers": [
        ${formattedMeta.join(",\n        ")}
    ]
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