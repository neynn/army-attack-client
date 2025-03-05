export const VersusSystem = {};

VersusSystem.pickRandomMap = function(gameContext, playerCount) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { availableMaps } = gameContext.versusConfig;
    const pickableMaps = [];

    for(let i = 0; i < availableMaps.length; i++) {
        const mapID = availableMaps[i];
        const mapType = mapManager.getMapType(mapID);

        if(!mapType || mapType.maxPlayers < playerCount) {
            continue;
        }

        pickableMaps.push(mapType);
    }

    if(pickableMaps.length === 0) {
        return null;
    }

    const pickedMapIndex = Math.floor(Math.random() * pickableMaps.length);
    const pickedMap = pickableMaps[pickedMapIndex];

    return pickedMap;
}

//sets up the teams, needs the map config object.
VersusSystem.pickRandomTeam = function(gameContext) {

}

//creates the necessary game elements.
VersusSystem.createGame = function() {

}