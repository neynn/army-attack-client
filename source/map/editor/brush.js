export const Brush = function() {
    this.size = 0;
    this.pallet = [];

    this.id = -1;
    this.name = "";
    this.mode = Brush.MODE.NONE;

    this.previousID = -1;
    this.previousName = "";
    this.previousMode = Brush.MODE.NONE;
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

Brush.prototype.getPalletSize = function() {
    return this.pallet.length;
}

Brush.prototype.selectFromPallet = function(index) {
    if(index < 0 || index >= this.pallet.length) {
        this.setBrush(Brush.ID.INVALID, "");
        return;
    }

    const { id, name } = this.pallet[index];

    this.setBrush(id, name);
}

Brush.prototype.getTileID = function(index) {
    if(index < 0 || index >= this.pallet.length) {
        return Brush.ID.INVALID;
    }

    const { id } = this.pallet[index];

    if(id === undefined) {
        return Brush.ID.INVALID;
    }

    return id;
}

Brush.prototype.clearPallet = function() {
    this.pallet.length = 0;
}

Brush.prototype.loadPallet = function(palletData) {
    this.pallet.length = 0;

    for(const tileName in palletData) {
        const tileID = palletData[tileName];

        this.pallet.push({
            "id": tileID,
            "name": tileName
        });
    }
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

Brush.prototype.recordPrevious = function() {
    this.previousID = this.id;
    this.previousName = this.name;
    this.previousMode = this.mode;
}

Brush.prototype.applyPrevious = function() {
    this.id = this.previousID;
    this.name = this.previousName;
    this.mode = this.previousMode;
}

Brush.prototype.toggleEraser = function() {
    if(this.mode === Brush.MODE.ERASE) {
        this.applyPrevious();
    } else {
        this.recordPrevious();
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