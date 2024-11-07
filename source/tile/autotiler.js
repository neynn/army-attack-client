export const Autotiler = function() {}

Autotiler.SHIFTSET_8 = {
    "northwest": 0,
    "north": 1,
    "northeast": 2,
    "west": 3,
    "east": 4,
    "southwest": 5,
    "south": 6,
    "southeast": 7
}

Autotiler.SHIFTSET_4 = {
    "north": 0,
    "west": 1,
    "east": 2,
    "south": 3
}

Autotiler.BITSET_8 = {"2": 1, "8": 2, "10": 3, "11": 4, "16": 5, "18": 6, "22": 7, "24": 8, "26": 9, "27": 10, "30": 11, "31": 12, "64": 13, "66": 14, "72": 15, "74": 16, "75": 17, "80": 18, "82": 19, "86": 20, "88": 21, "90": 22, "91": 23, "94": 24, "95": 25, "104": 26, "106": 27, "107": 28, "120": 29, "122": 30, "123": 31, "126": 32, "127": 33, "208": 34, "210": 35, "214": 36, "216": 37, "218": 38, "219": 39, "222": 40, "223": 41, "248": 42, "250": 43, "251": 44, "254": 45, "255": 46, "0": 47};

Autotiler.BITSET_4 = {"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "11": 11, "12": 12, "13": 13, "14": 14, "15": 15};

Autotiler.getDirections = function(tileX, tileY) {
    return {
        "northwest": { "x": tileX - 1, "y": tileY - 1 },
        "north": { "x": tileX, "y": tileY - 1 },
        "northeast": { "x": tileX + 1, "y": tileY - 1 },
        "west": { "x": tileX - 1, "y": tileY },
        "center": { "x": tileX, "y": tileY },
        "east": { "x": tileX + 1, "y": tileY },
        "southwest": { "x": tileX - 1, "y": tileY + 1 },
        "south": { "x": tileX, "y": tileY + 1 },
        "southeast": { "x": tileX + 1, "y": tileY + 1}
    }
}

Autotiler.autotile4Bits = function(directions, onCheck) {
    let total = 0b00000000;

    if(!directions || !onCheck) {
        return total;
    }

    const { center } = directions;
    const { north, west, east, south } = Autotiler.SHIFTSET_4;
    const northShift = onCheck(center, directions.north) << north;
    const westShift = onCheck(center, directions.west) << west;
    const eastShift = onCheck(center, directions.east) << east;
    const southShift = onCheck(center, directions.south) << south;

    total |= northShift;
    total |= westShift;
    total |= eastShift;
    total |= southShift;

    return Autotiler.BITSET_4[total];
}

Autotiler.autotile8Bits = function(directions, onCheck) {
    let total = 0b00000000;

    if(!directions || !onCheck) {
        return total;
    }

    const { center } = directions;
    const { northwest, north, northeast, west, east, southwest, south, southeast } = Autotiler.SHIFTSET_8;
    const northShift = onCheck(center, directions.north) << north;
    const westShift = onCheck(center, directions.west) << west;
    const eastShift = onCheck(center, directions.east) << east;
    const southShift = onCheck(center, directions.south) << south;

    total |= northShift;
    total |= westShift;
    total |= eastShift;
    total |= southShift;

    if((total & northShift) && (total & westShift)) {
        total |= onCheck(center, directions.northwest) << northwest;
    }

    if((total & northShift) && (total & eastShift)) {
        total |= onCheck(center, directions.northeast) << northeast;
    }

    if((total & southShift) && (total & westShift)) {
        total |= onCheck(center, directions.southwest) << southwest;
    }

    if((total & southShift) && (total & eastShift)) {
        total |= onCheck(center, directions.southeast) << southeast;
    }

    return Autotiler.BITSET_8[total];
}