import { Component } from "../../source/component/component.js";

export const UnitSizeComponent = function() {
    this.type = UnitSizeComponent.TYPE.NONE;
    this.infantryCost = 0;
    this.armorCost = 0;
    this.artilleryCost = 0;
}

UnitSizeComponent.TYPE = {
    NONE: 0,
    INFANTRY: 1 << 0,
    ARMOR: 1 << 1,
    ARTILLERY: 1 << 2
};

UnitSizeComponent.prototype = Object.create(Component.prototype);
UnitSizeComponent.prototype.constructor = UnitSizeComponent;

UnitSizeComponent.prototype.isArtillery = function() {
    return (this.type & UnitSizeComponent.TYPE.ARTILLERY) !== 0;
}

UnitSizeComponent.prototype.init = function(config) {
    const { infantry, armor, artillery } = config;

    if(infantry) {
        this.type |= UnitSizeComponent.TYPE.INFANTRY;
        this.infantryCost = infantry;
    }

    if(armor) {
        this.type |= UnitSizeComponent.TYPE.ARMOR;
        this.armorCost = armor;
    }

    if(artillery) {
        this.type |= UnitSizeComponent.TYPE.ARTILLERY;
        this.artilleryCost = artillery;
    }
}