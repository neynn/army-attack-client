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

export const saveMap = function(map2D) {
    if(!map2D) {
        return `{ "ERROR": "MAP NOT LOADED! USE CREATE OR LOAD!" }`;
    }
  
    const stringifyArray = (array) => {
        let result = `[\n            `;

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
                result += `,\n            `;
            }
        }

        result += `\n        ]`;
        
        return result;
    }

    const formattedEntities = [];

    for(const entity of map2D.entities) {
        formattedEntities.push(`{ "type": "${entity.type}", "tileX": ${entity.tileX}, "tileY": ${entity.tileY} }`);
    }

    const formattedBackground = [];

    for(const layerConfig of map2D.backgroundLayers) {
        formattedBackground.push(`{ "id": "${layerConfig.id}", "opacity": ${layerConfig.opacity}, "autoGenerate": ${layerConfig.autoGenerate} }`);
    }

    const formattedForeground = [];

    for(const layerConfig of map2D.foregroundLayers) {
        formattedForeground.push(`{ "id": "${layerConfig.id}", "opacity": ${layerConfig.opacity}, "autoGenerate": ${layerConfig.autoGenerate} }`);
    }

    const formattedMeta = [];

    for(const layerConfig of map2D.metaLayers) {
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
    "music": "${map2D.music}",
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
    ],
    "layers": {
        ${formattedLayers.join(",\n        ")}
    },
    "entities" : [
        ${formattedEntities.join(",\n        ")}
    ],
    "flags" : {
      
    }
}`;

    return downloadableString;
}

export const dirtySave = function(map2D) {
  if(!map2D) {
      return `{ "ERROR": "MAP NOT LOADED! USE CREATE OR LOAD!" }`;
  }

  const { music, width, height, backgroundLayers, foregroundLayers, metaLayers, layers, entities, flags } = map2D;

  return JSON.stringify({
      music,
      width,
      height,
      backgroundLayers,
      foregroundLayers,
      metaLayers,
      layers,
      entities,
      flags
  });
}