import { Component } from "../../source/component/component.js";

export const UnitSizeComponent = function() {
    this.infantry = 0;
    this.armor = 0;
    this.artillery = 0;
}

UnitSizeComponent.prototype = Object.create(Component.prototype);
UnitSizeComponent.prototype.constructor = UnitSizeComponent;