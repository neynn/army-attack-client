import { InefficientJSONExporter } from "./source/exporter.js";

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

const createJSONFrames = function(frames) {
    return Object.keys(frames).map(key => {
        const { x, y, w, h } = frames[key].frame;
        const [ name ] = key.split(".");

        return `"${name}": {"x":${x},"y":${y},"w":${w},"h":${h}}`;
      }
    );
}

export const packerToJSONTiles = (id, packerFile) => {    
    new InefficientJSONExporter(4)
    .open()
    .writeLine("directory", 1, ["assets", "tiles"])
    .writeLine("source", 1, packerFile.meta.image)
    .writeLine("frameTime", 1, 0.03)
    .writeList("frames", 1, createJSONFrames(packerFile.frames))
    .close()
    .download(id);
}

export const packerToJSONSprites = (id, packerFile) => {
    new InefficientJSONExporter(4)
    .open()
    .writeLine("directory", 1, ["assets", "sprites"])
    .writeLine("source", 1, packerFile.meta.image)
    .writeLine("bounds", 1, {"x": 0,"y": 0,"w":0,"h":0})
    .writeLine("frameTime", 1, 0.03)
    .writeList("frames", 1, createJSONFrames(packerFile.frames))
    .close()
    .download(id);
}

export const saveMap = function(mapID, map2D) {
    if(!map2D) {
        return new InefficientJSONExporter(4)
        .open()
        .writeLine("ERROR", 1, "MAP NOT LOADED! USE CREATE OR LOAD!")
        .close()
        .download("map_" + mapID);
    }

    const graphics = map2D.saveMeta();
    const layers = map2D.saveLayers();
    const flags = map2D.saveFlags();

    new InefficientJSONExporter(4)
    .open()
    .writeLine("music", 1, map2D.music)
    .writeLine("width", 1, map2D.width)
    .writeLine("height", 1, map2D.height)
    .writeLine("flags", 1, flags)
    .openList("graphics", 1)
    .writeList("layers", 2, graphics)
    .writeLine("background", 2, map2D.background)
    .writeLine("foreground", 2, map2D.foreground)
    .closeList()
    .writeList("data", 1, layers)
    .close()
    .download("map_" + mapID);
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

export const saveSprites = function(spriteTypes) {
    const output = [];
    const ije = new InefficientJSONExporter(4);
    
    for(const typeID in spriteTypes) {
        const type = spriteTypes[typeID];
        const { directory, source, bounds, frameTime, frames } = type;
        const { formatted, unique } = formatFrames_unique(frames);
        const str = ije
        .reset()
        .open(1, typeID)
        .writeLine("directory", 2, directory)
        .writeLine("source", 2, source)
        .writeLine("bounds", 2, {"x":bounds.x,"y":bounds.y,"w":bounds.w,"h":bounds.h})
        .writeLine("frameTime", 2, frameTime)
        .writeList("frames", 2, formatted)
        .openList("animations", 2)
        .openList("default", 3)
        .writeLine("frameTime", 4, frameTime)
        .writeLine("frames", 4, formatAnimationFrames(frames, unique))
        .close(1)
        .build();

        output.push(str);
    }

    const str = `{
${output.join(",\n")}
}`

    saveTemplateAsFile("sprites.json", str);
}

export const makeProdFile = function(resources) {
    const prodFile = JSON.stringify(resources);

    saveTemplateAsFile("assets.json", prodFile);
}