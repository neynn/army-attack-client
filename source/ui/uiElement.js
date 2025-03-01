import { EventEmitter } from "../events/eventEmitter.js";
import { Drawable } from "../graphics/drawable.js";
import { Logger } from "../logger.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.anchor = UIElement.ANCHOR_TYPE.TOP_LEFT;
    this.originX = 0;
    this.originY = 0;
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
    COLLISION: "COLLISION",
    CLICKED: "CLICKED",
    REQUEST_TEXT: "REQUEST_TEXT"
};

UIElement.ANCHOR_TYPE = {
    "TOP_CENTER": 0,
    "TOP_LEFT": 1,
    "TOP_RIGHT": 2,
    "BOTTOM_CENTER": 3,
    "BOTTOM_LEFT": 4,
    "BOTTOM_RIGHT": 5,
    "CENTER": 6,
    "LEFT": 7,
    "RIGHT": 8
};

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.init = function(config) {
    Logger.log(Logger.CODE.ENGINE_WARN, "Method has not been defined", "UIElement.prototype.init", null);
}

UIElement.prototype.onClick = function() {
    Logger.log(Logger.CODE.ENGINE_WARN, "Method has not been defined", "UIElement.prototype.onClick", null);
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

UIElement.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

UIElement.prototype.setAnchor = function(anchor) {
    if(UIElement.ANCHOR_TYPE[anchor] !== undefined) {
        this.anchor = UIElement.ANCHOR_TYPE[anchor];
    }
}

UIElement.prototype.updateAnchor = function(windowWidth, windowHeight) {    
    switch(this.anchor) {
        case UIElement.ANCHOR_TYPE.TOP_CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.TOP_RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_LEFT: {
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.LEFT: {
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
    }
}