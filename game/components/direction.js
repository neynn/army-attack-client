export const DirectionComponent = function() {
    this.directionX = DirectionComponent.DIRECTION_EAST;
    this.directionY = DirectionComponent.DIRECTION_SOUTH;
}

DirectionComponent.DIRECTION_NORTH = 0;
DirectionComponent.DIRECTION_EAST = 1;
DirectionComponent.DIRECTION_SOUTH = 2;
DirectionComponent.DIRECTION_WEST = 3;

DirectionComponent.create = function() {
    return new DirectionComponent();
}