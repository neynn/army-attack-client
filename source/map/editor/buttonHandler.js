import { EditorButton } from "./editorButton.js";

export const ButtonHandler = function() {
    this.buttons = new Map();
    this.currentButton = null;
}

ButtonHandler.prototype.addButton = function(buttonID, layerID, textID) {
    if(this.buttons.has(buttonID)) {
        return;
    }

    const button = new EditorButton(layerID, textID);

    this.buttons.set(buttonID, button);
}

ButtonHandler.prototype.forAllButtons = function(onCall) {
    if(typeof onCall !== "function") {
        return;
    }

    for(const [buttonID, button] of this.buttons) {
        onCall(buttonID, button);
    }
}
