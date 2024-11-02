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
  };

  const stringify2DArray = array => {
      if(!array) {
          return null;
      }

      const rows = array.map(row => JSON.stringify(row));
      return `[
          ${rows.join(`,
          `)}
      ]`;
  }

  const formattedEntities = map2D.entities.map(data => 
      `{ "type": "${data.type}", "tileX": ${data.tileX}, "tileY": ${data.tileY} }`
  ).join(',\n        ');

  const formattedOpacity = Object.keys(map2D.layerOpacity).map(key => 
      `"${key}": 1`
  ).join(', ');

  const formattedBackground = map2D.backgroundLayers.map(data =>
      `"${data}"`
  ).join(', ');

  const formattedForeground = map2D.foregroundLayers.map(data =>
      `"${data}"`
  ).join(', ');

  const formattedMeta = map2D.metaLayers.map(data =>
      `"${data}"`
  ).join(', ');

  const formattedLayers = Object.keys(map2D.layers).map(key =>
      `"${key}": ${stringifyArray(map2D.layers[key])}`
  ).join(',\n        ');

  const downloadableString = 
`{
  "music": "${map2D.music}",
  "width": ${map2D.width},
  "height": ${map2D.height},
  "layerOpacity": { ${formattedOpacity} },
  "backgroundLayers": [ ${formattedBackground} ],
  "foregroundLayers": [ ${formattedForeground} ],
  "metaLayers": [ ${formattedMeta} ],
  "layers": {
      ${formattedLayers}
  },
  "entities" : [
      ${formattedEntities}
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

  const { music, width, height, layerOpacity, backgroundLayers, foregroundLayers, metaLayers, layers, entities, flags } = map2D;

  return JSON.stringify({
      music,
      width,
      height,
      layerOpacity,
      backgroundLayers,
      foregroundLayers,
      metaLayers,
      layers,
      entities,
      flags
  });
}