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

PositionComponent.create = function(setup = {}) {
    const positionComponent = new PositionComponent();
    const { tileX, tileY } = setup;

    positionComponent.positionX = 0;
    positionComponent.positionY = 0;
    positionComponent.tileX = tileX ?? 0;
    positionComponent.tileY = tileY ?? 0;

    return positionComponent;
}