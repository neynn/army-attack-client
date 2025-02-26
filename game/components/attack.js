import { Component } from "../../source/component/component.js";

export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
    this.type = AttackComponent.ATTACK_TYPE.PASSIVE;
    this.counter = AttackComponent.COUNTER_TYPE.NONE;
    this.bulldoze = AttackComponent.BULLDOZE_TYPE.NONE;
}

AttackComponent.prototype = Object.create(Component.prototype);
AttackComponent.prototype.constructor = AttackComponent;

AttackComponent.BULLDOZE_TYPE = {
    NONE: 0,
    UNIT: 1 << 0,
    DECO: 1 << 1,
    BUILDING: 1 << 2
};

AttackComponent.COUNTER_TYPE = {
    NONE: 0,
    MOVE: 1 << 0,
    ATTACK: 1 << 1
};

AttackComponent.ATTACK_TYPE = {
    PASSIVE: 0,
    ACTIVE: 1
};

AttackComponent.ARCHETYPE_BULLDOZE_MAP = {
    "Unit": AttackComponent.BULLDOZE_TYPE.UNIT,
    "Deco": AttackComponent.BULLDOZE_TYPE.DECO,
    "Building": AttackComponent.BULLDOZE_TYPE.BUILDING
};

AttackComponent.prototype.isBulldozed = function(archetype) {
    const property = AttackComponent.ARCHETYPE_BULLDOZE_MAP[archetype];

    if(property === undefined) {
        return false;
    }

    return (this.bulldoze & property) !== 0;
}

AttackComponent.prototype.isAttackCounterable = function() {
    return (this.counter & AttackComponent.COUNTER_TYPE.ATTACK) !== 0;
}

AttackComponent.prototype.isMoveCounterable = function() {
    return (this.counter & AttackComponent.COUNTER_TYPE.MOVE) !== 0;
}

AttackComponent.prototype.toPassive = function() {
    this.type = AttackComponent.ATTACK_TYPE.PASSIVE;
}

AttackComponent.prototype.toActive = function() {
    this.type = AttackComponent.ATTACK_TYPE.ACTIVE;
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
    const counterTypes = [
        { key: "counterMove", flag: AttackComponent.COUNTER_TYPE.MOVE },
        { key: "counterAttack", flag: AttackComponent.COUNTER_TYPE.ATTACK }
    ];
    const bulldozeTypes = [
        { key: "bulldozeUnit", flag: AttackComponent.BULLDOZE_TYPE.UNIT },
        { key: "bulldozeDeco", flag: AttackComponent.BULLDOZE_TYPE.DECO },
        { key: "bulldozeBuilding", flag: AttackComponent.BULLDOZE_TYPE.BUILDING }
    ];

    if(damage) this.damage = damage;
    if(range) this.range = range;

    for(let i = 0; i < bulldozeTypes.length; i++) {
        const { key, flag } = bulldozeTypes[i];

        if(config[key]) {
            this.bulldoze |= flag;
        }
    }

    for(let i = 0; i < counterTypes.length; i++) {
        const { key, flag } = counterTypes[i];

        if(config[key]) {
            this.counter |= flag;
        }
    }
}

AttackComponent.prototype.custom = function(stats) {
    const {
        damage = 0,
        attackRange = 0
    } = stats;

    this.damage = damage;
    this.range = attackRange;
}