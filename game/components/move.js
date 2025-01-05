export const MoveComponent = function() {
    this.range = 0;
    this.path = [];
    this.speed = 480;
    this.distance = 0;
    this.passability = {};
    this.courageType = MoveComponent.COURAGE_TYPE_NORMAL;
    this.movementType = MoveComponent.MOVEMENT_TYPE_NORMAL;
    this.isStealth = false;
    this.isCloaked = false;
}

MoveComponent.COURAGE_TYPE_NORMAL = 0;
MoveComponent.COURAGE_TYPE_COWARD = 1;
MoveComponent.MOVEMENT_TYPE_NORMAL = 0;
MoveComponent.MOVEMENT_TYPE_STEALTH = 1;
MoveComponent.MOVEMENT_TYPE_CLOAKED = 2;

MoveComponent.create = function(setup = {}, stats = {}) {
    const moveComponent = new MoveComponent();
    const { passability } = setup;
    const { moveRange } = stats;

    if(passability !== undefined) {
        for(const passabilityID of passability) {
            moveComponent.passability[passabilityID] = true;
        }
    }

    moveComponent.range = moveRange ?? 0;

    return moveComponent;
}