import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.goals = new Map();
    this.goalsReached = new Set();
    
    this.events.listen(UIElement.EVENT_CLICKED);
    this.events.listen(UIElement.EVENT_DRAW);
    this.events.listen(UIElement.EVENT_COLLIDES);
}

UIElement.ANCHOR_TYPE_TOP_CENTER = "TOP_CENTER";
UIElement.ANCHOR_TYPE_TOP_LEFT = "TOP_LEFT";
UIElement.ANCHOR_TYPE_TOP_RIGHT = "TOP_RIGHT";
UIElement.ANCHOR_TYPE_BOTTOM_CENTER = "BOTTOM_CENTER";
UIElement.ANCHOR_TYPE_BOTTOM_LEFT = "BOTTOM_LEFT";
UIElement.ANCHOR_TYPE_BOTTOM_RIGHT = "BOTTOM_RIGHT";
UIElement.ANCHOR_TYPE_RIGHT_CENTER = "RIGHT_CENTER";
UIElement.ANCHOR_TYPE_LEFT_CENTER = "LEFT_CENTER";
UIElement.ANCHOR_TYPE_CENTER = "CENTER";

UIElement.EVENT_CLICKED = "UIElement.EVENT_CLICKED";
UIElement.EVENT_DRAW = "UIElement.EVENT_DRAW";
UIElement.EVENT_COLLIDES = "UIElement.EVENT_COLLIDES";

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.loadFromConfig = function(config) {

}

UIElement.prototype.adjustAnchor = function(anchorType, originX, originY, viewportWidth, viewportHeight) {
    const width = this.bounds.w;
    const height = this.bounds.h;

    switch(anchorType) {
        case UIElement.ANCHOR_TYPE_TOP_LEFT: {
            return true;
        }
        case UIElement.ANCHOR_TYPE_TOP_CENTER: {
            this.position.x = viewportWidth / 2 - originX - width / 2;
            return true;
        }
        case UIElement.ANCHOR_TYPE_TOP_RIGHT: {
            this.position.x = viewportWidth - originX - width;
            return true;
        }
        case UIElement.ANCHOR_TYPE_BOTTOM_LEFT: {
            this.position.y = viewportHeight - originY - height;
            return true;
        }
        case UIElement.ANCHOR_TYPE_BOTTOM_CENTER: {
            this.position.x = viewportWidth / 2 - originX - width / 2;
            this.position.y = viewportHeight - originY - height;
            return true;
        }
        case UIElement.ANCHOR_TYPE_BOTTOM_RIGHT: {
            this.position.x = viewportWidth - originX - width;
            this.position.y = viewportHeight - originY - height;
            return true;
        }
        case UIElement.ANCHOR_TYPE_LEFT_CENTER: {
            this.position.y = viewportHeight / 2 - originY - height / 2;
            return true;
        }
        case UIElement.ANCHOR_TYPE_CENTER: {
            this.position.x = viewportWidth / 2 - originX - width / 2;
            this.position.y = viewportHeight / 2 - originY - height / 2;
            return true;
        }
        case UIElement.ANCHOR_TYPE_RIGHT_CENTER: {
            this.position.x = viewportWidth - originX - width;
            this.position.y = viewportHeight / 2 - originY - height / 2;
            return true;
        }
        default: {
            console.warn(`Anchor Type ${anchorType} does not exist!`);
            return false;
        }
    }
}

UIElement.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    return false;
}

UIElement.prototype.getCollisions = function(mouseX, mouseY, mouseRange, collidedElements) {
    if(!this.isColliding(mouseX, mouseY, mouseRange)) {
        return;
    } else {
        collidedElements.push(this);
    }

    const localX = mouseX - this.position.x;
    const localY = mouseY - this.position.y;
    const references = this.getAllChildrenReferences();

    for(const reference of references) {
        if(!(reference instanceof UIElement)) {
            continue;
        }

        reference.getCollisions(localX, localY, mouseRange, collidedElements);
    }
}
