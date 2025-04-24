import { EditorButton } from "./editorButton.js";

export const ButtonHandler = function() {
    this.buttons = new Map();
    this.activeButton = null;
}

ButtonHandler.prototype.forAllButtons = function(onCall) {
    if(typeof onCall !== "function") {
        return;
    }

    for(const [buttonID, button] of this.buttons) {
        onCall(buttonID, button);
    }
}

ButtonHandler.prototype.addButton = function(buttonID, layerID, textID) {
    if(this.buttons.has(buttonID)) {
        return;
    }

    const button = new EditorButton(layerID, textID);

    this.buttons.set(buttonID, button);
}

ButtonHandler.prototype.getCurrentLayer = function() {
    const button = this.buttons.get(this.activeButton);

    if(!button) {
        return null;
    }

    return button.layerID;
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