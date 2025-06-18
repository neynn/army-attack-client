import { EditorButton } from "./editorButton.js";

export const ButtonHandler = function() {
    this.buttons = new Map();
    this.activeButton = null;
}

ButtonHandler.prototype.updateLayers = function(worldMap) {
    if(this.activeButton === null) {
        this.buttons.forEach((button) => {
            const { layerID, opacity } = button;

            worldMap.setLayerOpacity(layerID, opacity);
        });
    } else {
        this.buttons.forEach((button) => {
            const { state, layerID, opacity } = button;

            if(state === EditorButton.STATE.VISIBLE) {
                worldMap.setLayerOpacity(layerID, 0.5);
            } else {
                worldMap.setLayerOpacity(layerID, opacity);
            }
        })
    }
}

ButtonHandler.prototype.onClick = function(userInterface, buttonID) {
    const button = this.buttons.get(buttonID);

    if(!button) {
        return;
    }

    const nextState = button.scrollState(userInterface);

    button.updateTextColor(userInterface);

    switch(nextState) {
        case EditorButton.STATE.EDIT: {
            const activeButton = this.buttons.get(this.activeButton);

            if(activeButton) {
                activeButton.setState(EditorButton.STATE.VISIBLE);
                activeButton.updateTextColor(userInterface);
            }
    
            this.activeButton = buttonID;
            break;
        }
        default: {
            if(buttonID === this.activeButton) {
                this.activeButton = null;
            }
            break;
        }
    }

    return this.activeButton;
}

ButtonHandler.prototype.createButton = function(buttonID, layerID, textID) {
    if(this.buttons.has(buttonID)) {
        return this.buttons.get(buttonID);
    }

    const button = new EditorButton(layerID, textID);

    this.buttons.set(buttonID, button);

    return button;
}

ButtonHandler.prototype.getActiveLayer = function() {
    const button = this.buttons.get(this.activeButton);

    if(!button) {
        return null;
    }

    const { state, layerID } = button;

    if(state !== EditorButton.STATE.EDIT) {
        return null;
    }

    return layerID;
}

ButtonHandler.prototype.resetButtons = function(userInterface) {
    this.buttons.forEach((button) => {
        button.setState(EditorButton.STATE.VISIBLE);
        button.updateTextColor(userInterface);
    });

    this.activeButton = null;
}

ButtonHandler.prototype.getButton = function(buttonID) {
    const button = this.buttons.get(buttonID);

    if(!button) {
        return null;
    }
    
    return button;
}

ButtonHandler.prototype.getActiveButton = function() {
    const button = this.buttons.get(this.activeButton);

    if(!button) {
        return null;
    }
    
    return button;
}