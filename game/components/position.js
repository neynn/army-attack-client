export const PositionComponent = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.tileX = 0;
    this.tileY = 0;
}

PositionComponent.prototype.save = function() {
    return {
        "tileX": this.tileX,
        "tileY": this.tileY
    }
}