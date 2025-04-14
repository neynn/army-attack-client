import { PrettyJSON } from "./source/exporter.js";

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
    new PrettyJSON(4)
    .open()
    .writeLine("directory", ["assets", "tiles"])
    .writeLine("source", packerFile.meta.image)
    .writeLine("frameTime", 0.03)
    .writeList("frames", createJSONFrames(packerFile.frames))
    .close()
    .download(id);
}

export const packerToJSONSprites = (id, packerFile) => {
    new PrettyJSON(4)
    .open()
    .writeLine("directory", ["assets", "sprites"])
    .writeLine("source", packerFile.meta.image)
    .writeLine("bounds", {"x": 0,"y": 0,"w":0,"h":0})
    .writeLine("frameTime", 0.03)
    .writeList("frames", createJSONFrames(packerFile.frames))
    .close()
    .download(id);
}

export const saveMap = function(mapID, map2D) {
    if(!map2D) {
        return new PrettyJSON(4)
        .open()
        .writeLine("ERROR", "MAP NOT LOADED! USE CREATE OR LOAD!")
        .close()
        .download("map_" + mapID);
    }

    const graphics = map2D.saveMeta();
    const layers = map2D.saveLayers();
    const flags = map2D.saveFlags();

    new PrettyJSON(4)
    .open()
    .writeLine("music", map2D.music)
    .writeLine("width", map2D.width)
    .writeLine("height", map2D.height)
    .writeLine("flags", flags)
    .openList("graphics")
    .writeList("layers", graphics)
    .writeLine("background", map2D.background)
    .writeLine("foreground", map2D.foreground)
    .closeList()
    .writeList("data", layers)
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
    const ije = new PrettyJSON(4);
    
    for(const typeID in spriteTypes) {
        const type = spriteTypes[typeID];
        const { directory, source, bounds, frameTime, frames } = type;
        const { formatted, unique } = formatFrames_unique(frames);
        const str = ije
        .reset()
        .open(1, typeID)
        .writeLine("directory", directory)
        .writeLine("source", source)
        .writeLine("bounds", {"x":bounds.x,"y":bounds.y,"w":bounds.w,"h":bounds.h})
        .writeLine("frameTime", frameTime)
        .writeList("frames", formatted)
        .openList("animations")
        .openList("default")
        .writeLine("frameTime", frameTime)
        .writeLine("frames", formatAnimationFrames(frames, unique))
        .close()
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