export const EditorAutotiler = function() {
    this.state = EditorAutotiler.STATE.INACTIVE;
}

EditorAutotiler.STATE = {
    INACTIVE: 0,
    ACTIVE: 1,
    ACTIVE_INVERTED: 2
};

EditorAutotiler.prototype.run = function(autotiler, worldMap, tileX, tileY, layerID, onChange) {
    if(this.state === EditorAutotiler.STATE.INACTIVE || !autotiler) {
        return;
    }

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;
    const isInverted = this.state === EditorAutotiler.STATE.ACTIVE_INVERTED;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const previousID = worldMap.getTile(layerID, j, i);

            worldMap.applyAutotiler(autotiler, j, i, layerID, isInverted);

            const nextID = worldMap.getTile(layerID, j, i);

            if(previousID !== nextID) {
                onChange(j, i, previousID, nextID);
            }
        }
    }
}

EditorAutotiler.prototype.toggleInversion = function() {
    switch(this.state) {
        case EditorAutotiler.STATE.ACTIVE: {
            this.state = EditorAutotiler.STATE.ACTIVE_INVERTED;
            break;
        }
        case EditorAutotiler.STATE.ACTIVE_INVERTED: {
            this.state = EditorAutotiler.STATE.ACTIVE;
            break;
        }
    }

    return this.state;
}

EditorAutotiler.prototype.toggleAutotiling = function() {
    switch(this.state) {
        case EditorAutotiler.STATE.INACTIVE: {
            this.state = EditorAutotiler.STATE.ACTIVE;
            break;
        }
        default: {
            this.state = EditorAutotiler.STATE.INACTIVE;
            break;
        }
    }

    return this.state;
}