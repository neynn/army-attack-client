import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.goals = new Map();
    this.goalsReached = new Set();
    
    this.events.listen(UIElement.EVENT_CLICKED);
    this.events.listen(UIElement.EVENT_DRAW);
    this.events.listen(UIElement.EVENT_COLLIDES);
}

UIElement.EVENT_CLICKED = "UIElement.EVENT_CLICKED";
UIElement.EVENT_DRAW = "UIElement.EVENT_DRAW";
UIElement.EVENT_COLLIDES = "UIElement.EVENT_COLLIDES";

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.loadFromConfig = function(config) {

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
