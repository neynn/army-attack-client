export const RenderContext = function() {
    this.canvas = null;
    this.context = null;
    this.imageData = null;
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.type = RenderContext.TYPE.NONE;
}

RenderContext.TYPE = {
    NONE: 0,
    BUFFER: 1,
    DISPLAY: 2
};

RenderContext.prototype.clear = function() {
    if(this.type === RenderContext.TYPE.NONE) {
        return;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

RenderContext.prototype.resize = function(width, height) {
    if(this.type === RenderContext.TYPE.NONE) {
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

RenderContext.prototype.init = function(width, height, type) {
    if(this.type !== RenderContext.TYPE.NONE) {
        return;
    }
    
    this.canvas = document.createElement("canvas");

    switch(type) {
        case RenderContext.TYPE.DISPLAY: {
            this.type = RenderContext.TYPE.DISPLAY;
            this.canvas.oncontextmenu = (event) => { 
                event.preventDefault();
                event.stopPropagation();
            }

            document.body.appendChild(this.canvas);
            break;
        }
        case RenderContext.TYPE.BUFFER: {
            this.type = RenderContext.TYPE.BUFFER;
            break;
        }
        default: {
            this.type = RenderContext.TYPE.NONE;
            break;
        }
    }

    this.context = this.canvas.getContext("2d");
    this.resize(width, height);
}

RenderContext.prototype.getImageData = function() {
    if(this.type === RenderContext.TYPE.NONE) {
        return null;
    }

    if(!this.canvas) {
        return null;
    }

    this.imageData = this.context.getImageData(0, 0, this.width, this.height);

    return this.imageData;
}