
paper.install(window);

var nodesLayer;
var uiLayer;

$(document).ready(function($) {

	var canvas = $('#testcanvas')[0];
	
	// Create an empty project and a view for the canvas:
	paper.setup(canvas);
	
	nodesLayer = new Layer();
	uiLayer = new Layer();
	
	uiLayer.activate();

	var path = new Path.Circle(new Point($('#testcanvas').width()/2, $('#testcanvas').height()/2), 5);
	path.fillColor = 'black';

	nodesLayer.activate();

	testDrawPoints(testPoints);

	updatePositionText();

	animationQueue = new MAPAPP.ANIMATION_QUEUE;

});

var animationQueue;

function animate() {

	if (!animationQueue.empty()) {
		if (nodesLayer.onFrame == null) {
			nodesLayer.onFrame = animationLoop;
		};
	}
	else {

		nodesLayer.onFrame = null;

	};
};

function animationLoop(event) {	
	animationQueue.animate();
	if (animationQueue.empty()) {
		console.log("empty!!");
		nodesLayer.onFrame = null;
	};

	if (event.count >= 100) {
		nodesLayer.onFrame = null;
	};
};

var MAPAPP = {};

MAPAPP.OBJECTS = {};
MAPAPP.OBJECTS.WORLD_COOR = function(lat, lon) {

	return {lat : parseFloat(lat), lon : parseFloat(lon)};

};
MAPAPP.OBJECTS.MAP_COOR = function(x, y) {

	return {x : x, y : y};

};

MAPAPP.ANIMATION_QUEUE = function() {
	this.queue = [];
	this.push = function(animation) {
		this.queue.push(animation);
	};
	this.remove = function(animation) {
		this.queue.splice(this.queue.indexOf(animation), 1);
		this.length --;
	};
	this.animate = function() {
		var finished = [];
		for (var i = 0; i<this.queue.length; i++) {
			if (this.queue[i].animate() == false) {
				finished.push(this.queue[i]);
			};
		};
		for (i = 0; i<finished.length; i++) {
			this.remove(finished[i]);
		};
	};
	this.empty = function() {
		return (this.queue.length > 0) ? false : true;
	};
};

MAPAPP.ANIMATION = function() {
	this.id = null;
	this.frame = 0;
	this.length = 0;
	this.animate = function() { this.frame++; return (this.frame >= this.length) ? false : this.animateFrame() };
	this.animateFrame = function() { return false };
};

MAPAPP.MAP = {};
MAPAPP.MAP.zoom_level = 1;
MAPAPP.MAP.current_center = new MAPAPP.OBJECTS.WORLD_COOR(55.676097, 12.568337);


MAPAPP.MAP.pixels_to_world_degrees = function(pixels) {

	return pixels / 100000 * MAPAPP.MAP.zoom_level;

};

MAPAPP.MAP.world_degrees_to_pixels = function(degrees) {

	return degrees * 100000 / MAPAPP.MAP.zoom_level;

};

MAPAPP.MAP.world_to_map_coor = function(world_coor) {

	return new MAPAPP.OBJECTS.MAP_COOR(
		MAPAPP.MAP.world_degrees_to_pixels(world_coor.lon - MAPAPP.MAP.current_center.lon) + $('#testcanvas').width()/2, 
		MAPAPP.MAP.world_degrees_to_pixels(world_coor.lat - MAPAPP.MAP.current_center.lat) + $('#testcanvas').height()/2
		);
};

MAPAPP.MAP.map_to_world_coor = function(map_coor) {

	return new MAPAPP.OBJECTS.WORLD_COOR(
		MAPAPP.MAP.current_center.lat + MAPAPP.MAP.pixels_to_world_degrees(map_coor.y - ($('#testcanvas').height()/2)),
		MAPAPP.MAP.current_center.lon + MAPAPP.MAP.pixels_to_world_degrees(map_coor.x - ($('#testcanvas').width()/2))
		);
};

MAPAPP.MAP.goto_position = function(world_coor, animate) {

	MAPAPP.MAP.current_center = world_coor;

	updateNodesPosition(animate);
	updatePositionText();
};

var testPoints = [];
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.674442, 12.566367));
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.672842, 12.563437));
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.676097, 12.568337));

paths = [];

function testDrawPoints(points) {

	$(points).each(function(i, obj) {

		mapPoint = MAPAPP.MAP.world_to_map_coor(obj);

		var path = new Path.Circle(new Point(mapPoint.x, mapPoint.y), 10);
		path.fillColor = 'red';
		paths.push(path);

	});	
};

function updateNodesPosition(animate) {

	if (animate == true) {

	} 
	else {
		$(paths).each(function(i, obj) {

			obj.position = [MAPAPP.MAP.world_to_map_coor(testPoints[i]).x, MAPAPP.MAP.world_to_map_coor(testPoints[i]).y];

		});
	}
};

var testTool = new Tool();

testTool.onMouseDrag = function(event) {

	var newPosition = new MAPAPP.OBJECTS.WORLD_COOR(
		MAPAPP.MAP.current_center.lat - MAPAPP.MAP.pixels_to_world_degrees(event.event.movementY), 
		MAPAPP.MAP.current_center.lon - MAPAPP.MAP.pixels_to_world_degrees(event.event.movementX));
	MAPAPP.MAP.current_center = newPosition;
	
	updateNodesPosition();
	updatePositionText();
};

testTool.onMouseDown = function(event) {
	if (event.event.altKey == true) {
		var coord = MAPAPP.MAP.map_to_world_coor(new MAPAPP.OBJECTS.MAP_COOR(event.event.x, event.event.y));
		console.log(coord.lon.toFixed(6) + ", " + coord.lat.toFixed(6));
		MAPAPP.MAP.goto_position(coord);
	};
};

function isPathInView(path) {
	
	if (path.position.x > 0 && path.position.x < $('#testcanvas').width() && path.position.y > 0 && path.position.y < $('#testcanvas').height()) {
		return true;
	}
	else {
		return true;
	}
};



function updatePositionText() {

	$('#position').html(MAPAPP.MAP.current_center.lat.toFixed(6) + ", " + MAPAPP.MAP.current_center.lon.toFixed(6) );

};














