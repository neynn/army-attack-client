export const Brush = function() {
    this.size = 0;
    this.id = -1;
    this.name = "";
    this.pallet = [];
    this.palletSize = 0;
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
        return;
    }

    const { name, id } = this.pallet[index];

    this.setBrush(id, name);
}

Brush.prototype.createPalletElement = function(id, name) {
    return {
        "id": id ?? Brush.ID.INVALID,
        "name": name ?? ""
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