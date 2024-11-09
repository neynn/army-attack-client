import { Camera } from "./camera.js";

export const tileToPosition_center = function(tileX, tileY) {
	const renderWidth = Camera.TILE_WIDTH;
	const renderHeight = Camera.TILE_HEIGHT;

	const positionX = tileX * renderWidth + renderWidth / 2;
	const positionY = tileY * renderHeight + renderHeight / 2;

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