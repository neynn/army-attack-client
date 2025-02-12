import { Component } from "../../source/component/component.js";

export const ArmorComponent = function() {
    this.armor = 0;
}

ArmorComponent.prototype = Object.create(Component.prototype);
ArmorComponent.prototype.constructor = ArmorComponent;

ArmorComponent.prototype.getArmor = function() {
    return this.armor;
}

ArmorComponent.create = function(config = {}) {
    const armorComponent = new ArmorComponent();
    const {
        armor = 0
    } = config;

    armorComponent.armor = armor;

    return armorComponent;
}