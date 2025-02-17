import { Component } from "../../source/component/component.js";

export const ArmorComponent = function() {
    this.armor = 0;
}

ArmorComponent.prototype = Object.create(Component.prototype);
ArmorComponent.prototype.constructor = ArmorComponent;

ArmorComponent.prototype.init = function(config) {
    const { armor } = config;

    if(armor) {
        this.armor = armor;
    }
}

ArmorComponent.prototype.getArmor = function() {
    return this.armor;
}