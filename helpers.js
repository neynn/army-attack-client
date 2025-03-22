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

    const graphics = map2D.saveMeta();
    const layers = map2D.saveLayers();
    const flags = JSON.stringify(map2D.saveFlags());

    const downloadableString = 
`{
    "music": "${map2D.music}",
    "width": ${map2D.width},
    "height": ${map2D.height},
    "flags": ${flags},
    "graphics": {
        "layers": {
            ${graphics.join(",\n            ")}
        },
        "background": ${JSON.stringify(map2D.background)},
        "foreground": ${JSON.stringify(map2D.foreground)}
    },
    "data": {
        ${layers.join(",\n        ")}
    }
}`;

    saveTemplateAsFile("map_" + mapID + ".json", downloadableString);
}

const formatFrames = (frames) => {
    const formattedFrames = [];

    for(const key in frames) {
        const frame = frames[key];
        const format = `"${key}": {"x":${frame.x},"y":${frame.y},"w":${frame.w},"h":${frame.h}}`;

        formattedFrames.push(format);
    }

    return formattedFrames;
}

const formatFrames_unique = (frames) => {
    const formattedFrames = [];
    const uniqueFrames = new Map();
    let id = 0;

    for(const key in frames) {
        const { x, y, w, h } = frames[key];
        const frameKey = `${x}_${y}_${w}_${h}`;

        if(!uniqueFrames.has(frameKey)) {
            const format = `"${id}": {"x":${x},"y":${y},"w":${w},"h":${h}}`;

            uniqueFrames.set(frameKey, id);
            formattedFrames.push(format);

            id++;
        }
    }

    return {
        "formatted": formattedFrames,
        "unique": uniqueFrames
    };
}

const formatAnimationFrames = (frames, uniqueFrames) => {
    const animationFrames = [];

    for(const key in frames) {
        const { x, y, w, h } = frames[key];
        const frameKey = `${x}_${y}_${w}_${h}`;
        const frameID = uniqueFrames.get(frameKey);

        animationFrames.push(`${frameID}`);
    }

    return animationFrames;
}

const lineFormat = function(line, gap) {
    let out = line;

    for(let i = 0; i < gap; i++) {
        out += " ";
    }

    return out;
}

export const saveSprites = function(spriteTypes) {
    const output = [];

    for(const typeID in spriteTypes) {
        const type = spriteTypes[typeID];
        const { directory, source, bounds, frameTime, frames } = type;
        const { formatted, unique } = formatFrames_unique(frames);

        const typeString =
`"${typeID}": {
        "directory": ${JSON.stringify(directory)},
        "source": "${source}",
        "bounds": {"x":${bounds.x},"y":${bounds.y},"w":${bounds.w},"h":${bounds.h}},
        "frameTime": ${frameTime},
        "frames": {
            ${formatted.join(lineFormat(",\n", 12))}
        },
        "animations": {
            "default": {
                "frameTime": ${frameTime},
                "frames": ${JSON.stringify(formatAnimationFrames(frames, unique))}
            }
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