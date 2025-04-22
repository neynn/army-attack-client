export const Brush = function() {
    this.size = 0;
    this.id = -1;
    this.name = "";
    this.pallet = [];
    this.brushSet = {};
    this.mode = Brush.MODE.NONE;
}

Brush.ID = {
    ERASER: 0,
    INVALID: -1
};

Brush.MODE = {
    NONE: 0,
    ERASE: 1,
    DRAW: 2
};

Brush.prototype.selectFromPallet = function(index) {
    if(index < 0 || index >= this.pallet.length) {
        this.setBrush(Brush.ID.INVALID, "");
        return;
    }

    const tileName = this.pallet[index];
    const tileID = this.brushSet[tileName];

    this.setBrush(tileID, tileName);
}

Brush.prototype.getPageIndices = function(pageIndex, slots) {
    const pageIndices = []; 

    for(let i = 0; i < slots; i++) {
        const index = slots * pageIndex + i;

        if(index >= this.pallet.length) {
            pageIndices.push(Brush.ID.INVALID);
        } else {
            pageIndices.push(index);
        }
    }

    return pageIndices;
}

Brush.prototype.getTileID = function(index) {
    if(index < 0 || index >= this.pallet.length) {
        return Brush.ID.INVALID;
    }

    const tileName = this.pallet[index];
    const tileID = this.brushSet[tileName];

    if(tileID === undefined) {
        return Brush.ID.INVALID;
    }

    return tileID;
}

Brush.prototype.clearPallet = function() {
    this.pallet.length = 0;
    this.brushSet = {};
}

Brush.prototype.setPallet = function(brushData) {
    this.pallet.length = 0;

    for(const tileID in brushData) {
        this.pallet.push(tileID);
    }

    this.brushSet = brushData;
}

Brush.prototype.setBrush = function(id, name) {
    switch(id) {
        case Brush.ID.INVALID: {
            this.reset();
            break;
        }
        case Brush.ID.ERASER: {
            this.enableEraser();
            break;
        }
        default: {
            this.id = id;
            this.name = name;
            this.mode = Brush.MODE.DRAW;
        }
    }
}

Brush.prototype.setSize = function(size) {
    this.size = size;
}

Brush.prototype.getDrawArea = function() {
    return (this.size + 1) * 2 - 1;
}

Brush.prototype.toggleEraser = function() {
    if(this.mode === Brush.MODE.ERASE) {
        this.reset();
    } else {
        this.enableEraser();
    }

    return this.mode === Brush.MODE.ERASE;
}

Brush.prototype.enableEraser = function() {
    this.name = "ERASER";
    this.id = Brush.ID.ERASER;
    this.mode = Brush.MODE.ERASE;
}

Brush.prototype.reset = function() {
    this.name = "";
    this.id = Brush.ID.INVALID;
    this.mode = Brush.MODE.NONE;
}

Brush.prototype.paint = function(tileX, tileY, onPaint) {
    if(this.mode === Brush.MODE.NONE || typeof onPaint !== "function") {
        return;
    }

    const startX = tileX - this.size;
    const startY = tileY - this.size;
    const endX = tileX + this.size;
    const endY = tileY + this.size;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            onPaint(j, i, this.id, this.name);
        }
    }
}