export const SpriteAtlas = function() {
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.containerID = -1;
}

SpriteAtlas.prototype.loadBounds = function(bounds) {
    if(bounds) {
        const { x, y, w, h } = bounds;

        this.boundsX = x;
        this.boundsY = y;
        this.boundsW = w;
        this.boundsH = h;
    }
}

SpriteAtlas.prototype.setContainerID = function(containerID) {
    this.containerID = containerID;
}

SpriteAtlas.prototype.getContainerID = function() {
    return this.containerID;
}