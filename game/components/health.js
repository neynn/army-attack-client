import { Component } from "../../source/component/component.js";
import { clampValue } from "../../source/math/math.js";

export const HealthComponent = function() {
    this.health = 0;
    this.maxHealth = 0;
}

HealthComponent.prototype = Object.create(Component.prototype);
HealthComponent.prototype.constructor = HealthComponent;

HealthComponent.prototype.setHealth = function(value) {
    const health = clampValue(value, this.maxHealth, 0);

    this.health = health;
}

HealthComponent.prototype.reduceHealth = function(value) {
    const health = clampValue(this.health - value, this.maxHealth, 0);

    this.health = health;
}

HealthComponent.prototype.toMax = function() {
    this.health = this.maxHealth;
}

HealthComponent.prototype.isAlive = function() {
    return this.health > 0;
}

HealthComponent.prototype.isFull = function() {
    return this.health >= this.maxHealth;
}

HealthComponent.prototype.getRemainder = function(damage) {
    const health = clampValue(this.health - damage, this.maxHealth, 0);

    return health;
}

HealthComponent.prototype.save = function() {
    return [this.health, this.maxHealth];
}

HealthComponent.prototype.load = function(blob) {
    const [ health, maxHealth ] = blob;

    this.health = health;
    this.maxHealth = maxHealth;
}