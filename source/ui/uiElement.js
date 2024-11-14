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

UIElement.prototype.getCollisionStack = function(mouseX, mouseY, mouseRange) {
    const collidedElements = [];
    const collisionStack = [{
        "element": this,
        "localX": mouseX,
        "localY": mouseY
    }];

    while(collisionStack.length > 0) {
        const { element, localX, localY } = collisionStack.pop();

        if(!element.isColliding(localX, localY, mouseRange)) {
            continue;
        }

        collidedElements.push(element);

        const references = element.getAllChildrenReferences();
        const nextLocalX = localX - element.position.x;
        const nextLocalY = localY - element.position.y;

        for(const reference of references) {
            if(reference instanceof UIElement) {
                collisionStack.push({
                    "element": reference,
                    "localX": nextLocalX,
                    "localY": nextLocalY
                });
            }
        }
    }

    return collidedElements;
}
