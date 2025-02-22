export const Autotiler = function() {}

Autotiler.RESPONSE = {
    INVALID: 0,
    VALID: 1
};

Autotiler.SHIFTSET_8 = {
    NORTH_WEST: 0,
    NORTH: 1,
    NORTH_EAST: 2,
    WEST: 3,
    EAST: 4,
    SOUTH_WEST: 5,
    SOUTH: 6,
    SOUTH_EAST: 7
};

Autotiler.SHIFTSET_4 = {
    NORTH: 0,
    WEST: 1,
    EAST: 2,
    SOUTH: 3
};

Autotiler.VALUES_8 = {"2": 1, "8": 2, "10": 3, "11": 4, "16": 5, "18": 6, "22": 7, "24": 8, "26": 9, "27": 10, "30": 11, "31": 12, "64": 13, "66": 14, "72": 15, "74": 16, "75": 17, "80": 18, "82": 19, "86": 20, "88": 21, "90": 22, "91": 23, "94": 24, "95": 25, "104": 26, "106": 27, "107": 28, "120": 29, "122": 30, "123": 31, "126": 32, "127": 33, "208": 34, "210": 35, "214": 36, "216": 37, "218": 38, "219": 39, "222": 40, "223": 41, "248": 42, "250": 43, "251": 44, "254": 45, "255": 46, "0": 47};

Autotiler.autotile4Bits = function(tileX, tileY, onCheck) {
    if(tileX === undefined || tileY === undefined || !onCheck) {
        return 0;
    }

    let total = 0b00000000;
    const { NORTH, WEST, EAST, SOUTH } = Autotiler.SHIFTSET_4;
    const northShift = onCheck(tileX, tileY - 1) << NORTH;
    const westShift = onCheck(tileX - 1, tileY) << WEST;
    const eastShift = onCheck(tileX + 1, tileY) << EAST;
    const southShift = onCheck(tileX, tileY + 1) << SOUTH;

    total |= northShift;
    total |= westShift;
    total |= eastShift;
    total |= southShift;

    return total;
}

Autotiler.autotile8Bits = function(tileX, tileY, onCheck) {
    if(tileX === undefined || tileY === undefined || !onCheck) {
        return 0;
    }

    let total = 0b00000000;
    const { NORTH_WEST, NORTH, NORTH_EAST, WEST, EAST, SOUTH_WEST, SOUTH, SOUTH_EAST } = Autotiler.SHIFTSET_8;
    const northShift = onCheck(tileX, tileY - 1) << NORTH;
    const westShift = onCheck(tileX - 1, tileY) << WEST;
    const eastShift = onCheck(tileX + 1, tileY) << EAST;
    const southShift = onCheck(tileX, tileY + 1) << SOUTH;

    total |= northShift;
    total |= westShift;
    total |= eastShift;
    total |= southShift;

    if((total & northShift) && (total & westShift)) {
        total |= onCheck(tileX - 1, tileY - 1) << NORTH_WEST;
    }

    if((total & northShift) && (total & eastShift)) {
        total |= onCheck(tileX + 1, tileY - 1) << NORTH_EAST;
    }

    if((total & southShift) && (total & westShift)) {
        total |= onCheck(tileX - 1, tileY + 1) << SOUTH_WEST;
    }

    if((total & southShift) && (total & eastShift)) {
        total |= onCheck(tileX + 1, tileY + 1) << SOUTH_EAST;
    }

    return total;
}