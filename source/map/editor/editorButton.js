export const EditorButton = function(layerID, textID) {
    this.layerID = layerID;
    this.textID = textID;
    this.description = "VISIBLE";
    this.opacity = 1;
    this.state = EditorButton.STATE.VISIBLE;
    this.type = EditorButton.TYPE.GRAPHICS;
}

EditorButton.TYPE = {
    GRAPHICS: 0,
    TYPE: 1
};

EditorButton.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    EDIT: 2
};

EditorButton.prototype.setType = function(typeID) {
    this.type = typeID;
}

EditorButton.prototype.scrollState = function() {
    switch(this.state) {
        case EditorButton.STATE.HIDDEN: {
            this.description = "VISIBLE";
            this.opacity = 1;
            this.state = EditorButton.STATE.VISIBLE;
            break;
        }
        case EditorButton.STATE.VISIBLE: {
            this.description = "EDIT";
            this.opacity = 1;
            this.state = EditorButton.STATE.EDIT;
            break;
        }
        case EditorButton.STATE.EDIT: {
            this.description = "HIDDEN";
            this.opacity = 0;
            this.state = EditorButton.STATE.HIDDEN;
            break;
        }
    }

    return this.state;
}