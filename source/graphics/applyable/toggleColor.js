import { Color } from "../color.js";

export const ToggleColor = function() {
    Color.call(this);

    this.state = ToggleColor.STATE.INACTIVE;
    this.width = 1;
}

ToggleColor.STATE = {
    INACTIVE: 0,
    ACTIVE: 1
};

ToggleColor.prototype = Object.create(Color.prototype);
ToggleColor.prototype.constructor = ToggleColor;

ToggleColor.prototype.enable = function() {
    this.state = ToggleColor.STATE.ACTIVE;
}

ToggleColor.prototype.disable = function() {
    this.state = ToggleColor.STATE.INACTIVE;
}

ToggleColor.prototype.toggle = function() {
    switch(this.state) {
        case ToggleColor.STATE.ACTIVE: {
            this.state = ToggleColor.STATE.INACTIVE;
            break;
        }
        case ToggleColor.STATE.INACTIVE: {
            this.state = ToggleColor.STATE.ACTIVE;
            break;
        }
    }

    return this.state;
}

ToggleColor.prototype.isActive = function() {
    return this.state === ToggleColor.STATE.ACTIVE;
}

ToggleColor.prototype.setWidth = function(width = 0) {
    this.width = width;
}

ToggleColor.prototype.apply = function(context) {
    const strokeStyle = this.getRGBAString();

    context.strokeStyle = strokeStyle;
    context.lineWidth = this.width;
}