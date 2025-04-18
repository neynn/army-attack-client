export const UnitComponent = function() {
    this.type = UnitComponent.TYPE.NONE;
    this.infantryCost = 0;
    this.armorCost = 0;
    this.artilleryCost = 0;
}

UnitComponent.TYPE = {
    NONE: 0,
    INFANTRY: 1 << 0,
    ARMOR: 1 << 1,
    ARTILLERY: 1 << 2
};

UnitComponent.prototype.isArtillery = function() {
    return (this.type & UnitComponent.TYPE.ARTILLERY) !== 0;
}

UnitComponent.prototype.init = function(config) {
    const { infantry, armor, artillery } = config;

    if(infantry) {
        this.type |= UnitComponent.TYPE.INFANTRY;
        this.infantryCost = infantry;
    }

    if(armor) {
        this.type |= UnitComponent.TYPE.ARMOR;
        this.armorCost = armor;
    }

    if(artillery) {
        this.type |= UnitComponent.TYPE.ARTILLERY;
        this.artilleryCost = artillery;
    }
}