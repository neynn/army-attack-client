export const TileSheet = function() {
    this.directory = null;
    this.source = null;
    this.frames = {};
    this.frameTime = 1;
    this.animations = new Map();
}

TileSheet.ERROR_CODE = {
    SUCCESS: 0,
    MISSING_CONFIG: 1
};

TileSheet.prototype.init = function(config) {
    if(!config) {
        return TileSheet.ERROR_CODE.MISSING_CONFIG;
    }

    const { directory, source, frameTime, frames, patterns, animations } = config;

    
}