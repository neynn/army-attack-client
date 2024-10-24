export const Autotiler = function() {}

Autotiler.VALUESET_8 = {
    "northwest": 1 << 0,
    "north": 1 << 1,
    "northeast": 1 << 2,
    "west": 1 << 3,
    "east": 1 << 4,
    "southwest": 1 << 5,
    "south": 1 << 6,
    "southeast": 1 << 7
};

Autotiler.VALUESET_4 = {
    "north": 1 << 0,
    "west": 1 << 1,
    "east": 1 << 2,
    "south": 1 << 3
};

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
    if(!directions || !onCheck) {
        return null;
    }

    let total = 0b0000;
    const { center } = directions;
    const { north, west, east, south } = Autotiler.VALUESET_4;

    if(onCheck(center, directions.north)) total |= north;
    if(onCheck(center, directions.west)) total |= west;
    if(onCheck(center, directions.east)) total |= east;
    if(onCheck(center, directions.south)) total |= south;

    return Autotiler.BITSET_4[total];
}

Autotiler.autotile8Bits = function(directions, onCheck) {
    if(!directions || !onCheck) {
        return null;
    }

    let total = 0b00000000;
    const { center } = directions;
    const { northwest, north, northeast, west, east, southwest, south, southeast } = Autotiler.VALUESET_8;

    if(onCheck(center, directions.north)) total |= north;
    if(onCheck(center, directions.west)) total |= west;
    if(onCheck(center, directions.east)) total |= east;
    if(onCheck(center, directions.south)) total |= south;
    if((total & north) && (total & west) && onCheck(center, directions.northwest)) total |= northwest;
    if((total & north) && (total & east) && onCheck(center, directions.northeast)) total |= northeast;
    if((total & south) && (total & west) && onCheck(center, directions.southwest)) total |= southwest;
    if((total & south) && (total & east) && onCheck(center, directions.southeast)) total |= southeast;

    return Autotiler.BITSET_8[total];
}