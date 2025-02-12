import { Component } from "../../source/component/component.js";

export const HealthComponent = function() {
    this.maxHealth = 0;
    this.health = 0;
}

HealthComponent.prototype = Object.create(Component.prototype);
HealthComponent.prototype.constructor = HealthComponent;

HealthComponent.prototype.isAlive = function() {
    return this.health > 0;
}

HealthComponent.prototype.getRemainder = function(damage) {
    const value = this.health - damage;

    if(value < 0) {
        return 0;
    }

    return value;
}

HealthComponent.prototype.save = function() {
    return [this.health, this.maxHealth];
}

HealthComponent.prototype.load = function(blob) {
    const [ health, maxHealth ] = blob;

    this.health = health;
    this.maxHealth = maxHealth;
}