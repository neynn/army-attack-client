import { Color } from "../graphics/color.js";
import { SHAPE, TWO_PI } from "../math/constants.js";

export const UIColorHandler = function() {
    this.color = new Color();
    this.state = UIColorHandler.STATE.INACTIVE;
}

UIColorHandler.STATE = {
    INACTIVE: 0,
    ACTIVE: 1
};

UIColorHandler.prototype.enable = function() {
    this.state = UIColorHandler.STATE.ACTIVE;
}

UIColorHandler.prototype.disable = function() {
    this.state = UIColorHandler.STATE.INACTIVE;
}

UIColorHandler.prototype.toggle = function() {
    switch(this.state) {
        case UIColorHandler.STATE.ACTIVE: {
            this.state = UIColorHandler.STATE.INACTIVE;
            break;
        }
        case UIColorHandler.STATE.INACTIVE: {
            this.state = UIColorHandler.STATE.ACTIVE;
            break;
        }
    }

    return this.state;
}

UIColorHandler.prototype.drawColor = function(context, shape, x, y, w, h) {
    if(this.state !== UIColorHandler.STATE.ACTIVE) {
        return;
    }

    context.fillStyle = this.color.rgba;

    switch(shape) {
        case SHAPE.RECTANGLE: {
            context.fillRect(x, y, w, h);
            break;
        }
        case SHAPE.CIRCLE: {
            context.beginPath();
            context.arc(x, y, w, 0, TWO_PI);
            context.fill();
            break;
        }
    }
}

UIColorHandler.prototype.drawStroke = function(context, size, shape, x, y, w, h) {
    if(this.state !== UIColorHandler.STATE.ACTIVE) {
        return;
    }

    context.strokeStyle = this.color.rgba;;
    context.lineWidth = size;

    switch(shape) {
        case SHAPE.RECTANGLE: {
            context.strokeRect(x, y, w, h);
            break;
        }
        case SHAPE.CIRCLE: {
            context.beginPath();
            context.arc(x, y, w, 0, TWO_PI);
            context.stroke();
            break;
        }
    }
}