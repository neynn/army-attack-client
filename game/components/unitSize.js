import { Component } from "../../source/component/component.js";

export const UnitSizeComponent = function() {
    this.infantry = 0;
    this.armor = 0;
    this.artillery = 0;
}

UnitSizeComponent.prototype = Object.create(Component.prototype);
UnitSizeComponent.prototype.constructor = UnitSizeComponent;

UnitSizeComponent.prototype.init = function(config) {
    const { infantry, armor, artillery } = config;

    if(infantry) {
        this.infantry = infantry;
    }

    if(armor) {
        this.armor = armor;
    }

    if(artillery) {
        this.artillery = artillery;
    }
}