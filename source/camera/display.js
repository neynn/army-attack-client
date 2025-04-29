export const Display = function() {
    this.canvas = null;
    this.context = null;
    this.imageData = null;
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.type = Display.TYPE.NONE;
    this.color = Display.COLOR.DARK_GRAY;
}

Display.COLOR = {
    BLACK: "#000000",
    DARK_GRAY: "#111111"
};

Display.TYPE = {
    NONE: 0,
    BUFFER: 1,
    DISPLAY: 2,
    CUSTOM: 3
};

Display.prototype.fromDocument = function(canvasID) {
    if(this.type !== Display.TYPE.NONE) {
        return;
    }

    const canvas = document.getElementById(canvasID);

    if(!canvas) {
        return;
    }

    this.type = Display.TYPE.CUSTOM;
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.resize(canvas.width, canvas.height);
}

Display.prototype.clear = function() {
    if(this.type === Display.TYPE.NONE) {
        return;
    }

    this.context.fillStyle = this.color;
    this.context.fillRect(0, 0, this.width, this.height);
}

Display.prototype.onWindowResize = function(width, height) {
    if(this.type === Display.TYPE.CUSTOM) {
        return;
    }

    this.resize(width, height);
}

Display.prototype.resize = function(width, height) {
    if(this.type === Display.TYPE.NONE) {
        return;
    }

    this.clear();
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.context.imageSmoothingEnabled = false;
}

Display.prototype.init = function(width, height, type) {
    if(this.type !== Display.TYPE.NONE) {
        return;
    }
    
    this.canvas = document.createElement("canvas");

    switch(type) {
        case Display.TYPE.DISPLAY: {
            this.type = Display.TYPE.DISPLAY;
            this.canvas.oncontextmenu = (event) => { 
                event.preventDefault();
                event.stopPropagation();
            }

            document.body.appendChild(this.canvas);
            break;
        }
        case Display.TYPE.BUFFER: {
            this.type = Display.TYPE.BUFFER;
            break;
        }
        default: {
            this.type = Display.TYPE.NONE;
            break;
        }
    }

    this.context = this.canvas.getContext("2d");
    this.resize(width, height);
}

Display.prototype.getImageData = function() {
    if(this.type === Display.TYPE.NONE) {
        return null;
    }

    if(!this.canvas) {
        return null;
    }

    this.imageData = this.context.getImageData(0, 0, this.width, this.height);

    return this.imageData;
}