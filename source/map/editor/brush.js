export const Brush = function() {
    this.size = 0;
    this.id = -1;
    this.name = "";
    this.pallet = [];
    this.palletData = {};
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
    const tileID = this.palletData[tileName];

    this.setBrush(tileID, tileName);
}

Brush.prototype.getTileID = function(index) {
    if(index < 0 || index >= this.pallet.length) {
        return Brush.ID.INVALID;
    }

    const tileName = this.pallet[index];
    const tileID = this.palletData[tileName];

    if(tileID === undefined) {
        return Brush.ID.INVALID;
    }

    return tileID;
}

Brush.prototype.getPalletIndex = function(pageIndex, slotCount, slot) {
    const palletIndex = pageIndex * slotCount + slot;

    if(palletIndex >= this.pallet.length) {
        return -1;
    }

    return palletIndex;
}

Brush.prototype.clearPallet = function() {
    this.pallet.length = 0;
    this.palletData = {};
}

Brush.prototype.loadPallet = function(palletData) {
    this.pallet.length = 0;

    for(const tileID in palletData) {
        this.pallet.push(tileID);
    }

    this.palletData = palletData;
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

    return this.mode;
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