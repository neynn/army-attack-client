import { EventEmitter } from "../events/eventEmitter.js";
import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.anchor = UIElement.ANCHOR_TYPE.TOP_LEFT;
    this.behavior = 0;
    this.originX = 0;
    this.originY = 0;
    this.width = 0;
    this.height = 0;
    
    this.events = new EventEmitter();
}

UIElement.COLLISION_TYPE = {
    FIRST: 0,
    LAST: 1,
    REPEATED: 2
};

UIElement.EVENT = {
    LAST_COLLISION: "LAST_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION",
    REPEATED_COLLISION: "REPEATED_COLLISION",
    CLICKED: "CLICKED",
    REQUEST_TEXT: "REQUEST_TEXT"
};

UIElement.ANCHOR_TYPE = {
    TOP_CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_CENTER: 3,
    BOTTOM_LEFT: 4,
    BOTTOM_RIGHT: 5,
    CENTER: 6,
    LEFT: 7,
    RIGHT: 8
};

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.removeBehaviorFlag = function(flag) {
    this.behavior &= (~flag);
}

UIElement.prototype.hasBehaviorFlag = function(flag) {
    return (this.behavior & flag) !== 0;
}

UIElement.prototype.addBehaviorFlag = function(flag) {
    this.behavior |= flag;
}

UIElement.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
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