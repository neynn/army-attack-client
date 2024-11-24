import { Camera } from "./camera.js";

export const tileToPosition_center = function(tileX, tileY) {
	const positionX = tileX * Camera.TILE_WIDTH + Camera.TILE_WIDTH_HALF;
	const positionY = tileY * Camera.TILE_HEIGHT + Camera.TILE_HEIGHT_HALF;

	return {
		"x": positionX,
		"y": positionY
	}
}

export const tileToPosition_corner = function(tileX, tileY) {
	const positionX = tileX * Camera.TILE_WIDTH;
	const positionY = tileY * Camera.TILE_HEIGHT;

	return {
		"x": positionX,
		"y": positionY
	}
}

export const positionToTile = function(positionX, positionY) {
	const tileX = Math.trunc(positionX / Camera.TILE_WIDTH);
	const tileY = Math.trunc(positionY / Camera.TILE_HEIGHT);

	return {
		"x": tileX,
		"y": tileY 
	}
}

export const positionSizeOffsetCenter = function(sizeX, sizeY) {
    const xOffset = Camera.TILE_WIDTH * (sizeX / 2 - 0.5);
    const yOffset = Camera.TILE_HEIGHT * (sizeY / 2 - 0.5);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

export const positionSizeOffset = function(sizeX, sizeY) {
    const xOffset = Camera.TILE_WIDTH * (sizeX - 1);
    const yOffset = Camera.TILE_HEIGHT * (sizeY - 1);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}