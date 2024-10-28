export const MoveComponent = function() {
    this.range = 0;
    this.path = [];
    this.speed = 480; //Magic! (It's 8 per frame)
    this.distance = 0;
    this.maxDistance = 96; //Also magic! (It's the tile size)
    this.passability = {};
    this.isCoward = false;
    this.isStealth = false;
    this.isCloaked = false;
    this.isAvian = false;
}