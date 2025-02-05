import { EventEmitter } from "../events/eventEmitter.js";
import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(id, DEBUG_NAME) {
    Drawable.call(this, id, DEBUG_NAME);
    
    this.events = new EventEmitter();
    this.events.listen(UIElement.EVENT.FIRST_COLLISION);
    this.events.listen(UIElement.EVENT.FINAL_COLLISION);
    this.events.listen(UIElement.EVENT.COLLISION);
}

UIElement.EVENT = {
    "FINAL_COLLISION": "FINAL_COLLISION",
    "FIRST_COLLISION": "FIRST_COLLISION",
    "COLLISION": "COLLISION"
};

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.loadFromConfig = function(config) {
    console.warn(`Method loadFromConfig has not been defined!`);
}

UIElement.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    return false;
}

UIElement.prototype.getCollisions = function(mouseX, mouseY, mouseRange) {
    const collidedElements = [];
    const uncheckedElements = [];

    uncheckedElements.push({
        "element": this,
        "localX": mouseX,
        "localY": mouseY
    });

    while(uncheckedElements.length !== 0) {
        const { element, localX, localY } = uncheckedElements.pop();
        const isColliding = element.isColliding(localX, localY, mouseRange);

        if(!isColliding) {
            continue;
        }

        collidedElements.push(element);

        const children = element.getChildren();
        const nextLocalX = localX - element.position.x;
        const nextLocalY = localY - element.position.y;

        for(const child of children) {
            const reference = child.getReference();
            
            if(reference instanceof UIElement) {
                uncheckedElements.push({
                    "element": reference,
                    "localX": nextLocalX,
                    "localY": nextLocalY
                });
            }
        }
    }

    return collidedElements;
}
