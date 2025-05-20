import { clampValue } from "../../source/math/math.js";

export const HealthComponent = function() {
    this.health = 0;
    this.maxHealth = 0;
}

HealthComponent.prototype.getMissing = function() {
    return this.maxHealth - this.health;
}

HealthComponent.prototype.addHealth = function(value) {
    const health = clampValue(this.health + value, this.maxHealth, 0);

    this.health = health;
}

HealthComponent.prototype.reduceHealth = function(value) {
    const health = this.health - value;

    if(health < 0) {
        this.health = 0;
    } else {
        this.health = health;
    }
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

HealthComponent.prototype.isFatal = function(damage) {
    const health = this.health - damage;

    return health <= 0;
}

HealthComponent.prototype.save = function() {
    return [this.health, this.maxHealth];
}

HealthComponent.prototype.load = function(blob) {
    const [ health, maxHealth ] = blob;

    this.health = health;
    this.maxHealth = maxHealth;
}