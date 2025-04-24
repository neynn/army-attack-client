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

EditorButton.STATE_COLOR = {
    [EditorButton.STATE.HIDDEN]: [207, 55, 35, 255],
    [EditorButton.STATE.VISIBLE]: [238, 238, 238, 255],
    [EditorButton.STATE.EDIT]: [252, 252, 63, 255]
};

EditorButton.prototype.setType = function(typeID) {
    this.type = typeID;
}

EditorButton.prototype.updateTextColor = function(userInterface) {
    const text = userInterface.getElement(this.textID);

    if(!text) {
        return;
    }

    const { style } = text;
    const { color } = style;
    
    color.setColorArray(EditorButton.STATE_COLOR[this.state]);
}

EditorButton.prototype.setState = function(state) {
    switch(state) {
        case EditorButton.STATE.HIDDEN: {
            this.description = "HIDDEN";
            this.opacity = 0;
            this.state = EditorButton.STATE.HIDDEN;
            break;
        }
        case EditorButton.STATE.VISIBLE: {
            this.description = "VISIBLE";
            this.opacity = 1;
            this.state = EditorButton.STATE.VISIBLE;
            break;
        }
        case EditorButton.STATE.EDIT: {
            this.description = "EDIT";
            this.opacity = 1;
            this.state = EditorButton.STATE.EDIT;
            break;
        }
    }
}

EditorButton.prototype.scrollState = function() {
    switch(this.state) {
        case EditorButton.STATE.HIDDEN: {
            this.setState(EditorButton.STATE.VISIBLE);
            break;
        }
        case EditorButton.STATE.VISIBLE: {
            this.setState(EditorButton.STATE.EDIT);
            break;
        }
        case EditorButton.STATE.EDIT: {
            this.setState(EditorButton.STATE.HIDDEN);
            break;
        }
    }

    return this.state;
}