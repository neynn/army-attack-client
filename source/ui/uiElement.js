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
    FINAL_COLLISION: "FINAL_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION",
    COLLISION: "COLLISION"
};

UIElement.ANCHOR_TYPE = {
    "TOP_CENTER": "TOP_CENTER",
    "TOP_LEFT": "TOP_LEFT",
    "TOP_RIGHT": "TOP_RIGHT",
    "BOTTOM_CENTER": "BOTTOM_CENTER",
    "BOTTOM_LEFT": "BOTTOM_LEFT",
    "BOTTOM_RIGHT": "BOTTOM_RIGHT",
    "CENTER": "CENTER",
    "LEFT": "LEFT",
    "RIGHT": "RIGHT"
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

UIElement.prototype.setAnchor = function(typeID, originX, originY, windowWidth, windowHeight) {
    if(UIElement.ANCHOR_TYPE[typeID] === undefined) {
        console.warn(`Anchor Type ${typeID} does not exist!`);
        return;
    }

    const { width, height } = this;

    switch(typeID) {
        case UIElement.ANCHOR_TYPE.TOP_CENTER: {
            const anchorX = windowWidth / 2 - originX - width / 2;

            this.setPosition(anchorX, originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.TOP_RIGHT: {
            const anchorX = windowWidth - originX - width;

            this.setPosition(anchorX, originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_LEFT: {
            const anchorY = windowHeight - originY - height;

            this.setPosition(originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_CENTER: {
            const anchorX = windowWidth / 2 - originX - width / 2;
            const anchorY = windowHeight - originY - height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_RIGHT: {
            const anchorX = windowWidth - originX - width;
            const anchorY = windowHeight - originY - height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.LEFT: {
            const anchorY = windowHeight / 2 - originY - height / 2;

            this.setPosition(originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.CENTER: {
            const anchorX = windowWidth / 2 - originX - width / 2;
            const anchorY = windowHeight / 2 - originY - height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.RIGHT: {
            const anchorX = windowWidth - originX - width;
            const anchorY = windowHeight / 2 - originY - height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
    }
}