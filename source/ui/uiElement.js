import { Drawable } from "../graphics/drawable.js";

export const UIElement = function(id, DEBUG_NAME) {
    Drawable.call(this, id, DEBUG_NAME);
    
    this.events.listen(UIElement.EVENT_DRAW);
    this.events.listen(UIElement.EVENT_CLICKED);
    this.events.listen(UIElement.EVENT_FIRST_COLLISION);
    this.events.listen(UIElement.EVENT_FINAL_COLLISION);
    this.events.listen(UIElement.EVENT_COLLISION);
}

UIElement.EVENT_DRAW = "EVENT_DRAW";
UIElement.EVENT_CLICKED = "EVENT_CLICKED";
UIElement.EVENT_FINAL_COLLISION = "EVENT_FINAL_COLLISION";
UIElement.EVENT_FIRST_COLLISION = "EVENT_FIRST_COLLISION";
UIElement.EVENT_COLLISION = "EVENT_COLLISION";

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.loadFromConfig = function(config) {}

UIElement.prototype.isColliding = function(mouseX, mouseY, mouseRange) {}

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
        if(reference instanceof UIElement) {
            reference.getCollisions(localX, localY, mouseRange, collidedElements);
        }
    }
}
