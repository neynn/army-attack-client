import { Component } from "../../source/component/component.js";

export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
    this.type = AttackComponent.ATTACK_TYPE_PASSIVE;
}

AttackComponent.prototype = Object.create(Component.prototype);
AttackComponent.prototype.constructor = AttackComponent;

AttackComponent.ATTACK_TYPE_PASSIVE = 0;
AttackComponent.ATTACK_TYPE_ACTIVE = 1;

AttackComponent.prototype.toPassive = function() {
    this.type = AttackComponent.ATTACK_TYPE_PASSIVE;
}

AttackComponent.prototype.toActive = function() {
    this.type = AttackComponent.ATTACK_TYPE_ACTIVE;
}

AttackComponent.prototype.getDamage = function(armor) {
    const damage = this.damage - armor;

    if(damage < 0) {
        return 0;
    }

    return damage;
}

AttackComponent.prototype.save = function() {
    return [this.damage, this.range];
}

AttackComponent.prototype.load = function(blob) {
    const [ damage, range ] = blob;
    
    this.damage = damage;
    this.range = range;
}

AttackComponent.prototype.init = function(config) {
    const { damage, range } = config;

    this.damage = damage;
    this.range = range;
}

AttackComponent.prototype.custom = function(stats) {
    const {
        damage = 0,
        attackRange = 0
    } = stats;

    this.damage = damage;
    this.range = attackRange;
}