import { EventEmitter } from "../events/eventEmitter.js";
import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(id, DEBUG_NAME) {
    Drawable.call(this, id, DEBUG_NAME);
    
    this.width = 0;
    this.height = 0;
    
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
    const referenceStack = [this];
    const positionStack = [mouseX, mouseY];

    while(referenceStack.length !== 0) {
        const positionY = positionStack.pop();
        const positionX = positionStack.pop();
        const reference = referenceStack.pop();
        const isColliding = reference.isColliding(positionX, positionY, mouseRange);

        if(!isColliding) {
            continue;
        }

        const children = reference.getChildren();
        const nextX = positionX - reference.position.x;
        const nextY = positionY - reference.position.y;

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            const reference = child.getReference();

            if(reference instanceof UIElement) {
                referenceStack.push(reference);
                positionStack.push(nextX);
                positionStack.push(nextY);
            }
        }

        collidedElements.push(reference);
    }

    return collidedElements;
}
