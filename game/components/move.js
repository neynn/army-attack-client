export const MoveComponent = function() {
    this.range = 0;
    this.path = [];
    this.speed = 480;
    this.distance = 0;
    this.passability = {};
    this.isCoward = false;
    this.isStealth = false;
    this.isCloaked = false;
    this.isAvian = false;
}

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