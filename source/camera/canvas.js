export const Canvas = function() {
    this.canvas = null;
    this.context = null;
    this.width = null;
    this.height = null;
    this.centerX = null;
    this.centerY = null;
    this.imageData = null;
}

Canvas.prototype.clear = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Canvas.prototype.resize = function(width, height) {
    this.clear();

    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.context.imageSmoothingEnabled = false;
}

Canvas.prototype.create = function(width, height, isDisplay) {
    this.canvas = document.createElement("canvas");

    if(isDisplay) {
        this.canvas.oncontextmenu = (event) => { 
            event.preventDefault();
            event.stopPropagation();
        }
        document.body.appendChild(this.canvas);
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");

    this.resize(width, height);
}

Canvas.prototype.getImageData = function() {
    if(!this.canvas) {
        return null;
    }

    this.imageData = this.context.getImageData(0, 0, this.width, this.height);

    return this.imageData;
}