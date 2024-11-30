export const ResourceComponent = function() {
    this.energy = 0;
    this.maxEnergy = 0;
    this.gold = 0;
    this.money = 0;
    this.supplies = 0;
    this.water = 0;
    this.xp = 0;
    this.honor = 0;
    this.pvpXP = 0;
    this.socialEnergy = 0;
    this.maxSocialEnergy = 0;
    this.dollor = 0;
    this.backgroundEnergy = 0;
}

ResourceComponent.RESOURCE_TYPE_MAP = {
    "Money": "money",
    "Gold": "gold",
    "Energy": "energy",
    "Supplies": "supplies",
    "Water": "water",
    "XP": "xp",
    "Honor": "honor",
    "PVP_XP": "pvpXP",
    "SocialEnergy": "socialEnergy",
    "Dollor": "dollor",
    "BackgroundEnergy": "backgroundEnergy"
};