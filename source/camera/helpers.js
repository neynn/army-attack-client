import { Camera } from "./camera.js";

export const getViewportTile = function(positionX, positionY, viewportX, viewportY) {
	const tileX = Math.floor((positionX / Camera.SCALE + viewportX) / Camera.TILE_WIDTH);
	const tileY = Math.floor((positionY / Camera.SCALE + viewportY) / Camera.TILE_HEIGHT);
	
	return {
		"x": tileX,
		"y": tileY
	}
}

export const getViewportPosition = function(positionX, positionY, viewportX, viewportY) {
	const viewportPositonX = positionX / Camera.SCALE + viewportX;
	const viewportPositonY = positionY / Camera.SCALE + viewportY;

	return {
		"x": viewportPositonX,
		"y": viewportPositonY
	}
}

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