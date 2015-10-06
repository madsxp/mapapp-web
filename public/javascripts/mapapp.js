


var nodesLayer;
var uiLayer;

$(document).ready(function($) {
	
	paper.install(window);

	var canvas = $('#testcanvas')[0];
	
	// Create an empty project and a view for the canvas:
	paper.setup(canvas);

	var testTool = new Tool();

	testTool.onMouseDrag = function(event) {

		animationQueue.clear();

		var newPosition = new MAPAPP.OBJECTS.WORLD_COOR(
			MAPAPP.MAP.current_center.lat - MAPAPP.MAP.pixels_to_world_degrees(event.event.movementY), 
			MAPAPP.MAP.current_center.lon - MAPAPP.MAP.pixels_to_world_degrees(event.event.movementX));
		MAPAPP.MAP.current_center = newPosition;
		
		updateNodesPosition();
		updatePositionText();
	};

	testTool.onMouseDown = function(event) {
		if (event.event.detail > 1) {
      		var coord = MAPAPP.MAP.map_to_world_coor(new MAPAPP.OBJECTS.MAP_COOR(event.event.x, event.event.y));
			MAPAPP.MAP.goto_position(coord, true);
    	}
		else if (event.event.altKey == true) {
			var coord = MAPAPP.MAP.map_to_world_coor(new MAPAPP.OBJECTS.MAP_COOR(event.event.x, event.event.y));
			console.log(coord.lat.toFixed(6) + ", " + coord.lon.toFixed(6));
		};
	};

	$('#zoom_in').click(function(event) {

		MAPAPP.MAP.zoom_in(null, true);

	});

	$('#zoom_out').click(function(event) {

		MAPAPP.MAP.zoom_out(null, true);

	});


	nodesLayer = new Layer();
	uiLayer = new Layer();
	
	uiLayer.activate();

	var path = new Path.Circle(new Point($('#testcanvas').width()/2, $('#testcanvas').height()/2), 5);
	path.fillColor = 'black';

	nodesLayer.activate();

	//testDrawPoints(testPoints);

	updatePositionText();

	animationQueue = new MAPAPP.ANIMATION_QUEUE;

	test();

	paper.view.draw();

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
		nodesLayer.onFrame = null;
	};

	if (event.count >= 1000) {
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


MAPAPP.OBJECTS.POINT = function(lat, lon) {

	this.worldCoor = null;

	this.position = function()  {

		if (this.worldCoor != null) {

			return MAPAPP.MAP.world_to_map_coor(this.worldCoor);

		}
		else {
			return [0,0]; //TODO
		}
	};

	if (lat != undefined && lon != undefined) {
		this.worldCoor = new MAPAPP.OBJECTS.WORLD_COOR(lat, lon);
	};
};

MAPAPP.OBJECTS.ROAD = function() {

	this.path = [];
	this.addPoint = function(point) {

		this.path.push(point);
		this.createLine();

	};
	this.createLine = function() {

		if (this.paperLine != null)	this.paperLine.remove();

		var line = new Path();
		line.strokeColor = 'red';
		line.strokeWidth = 2;//MAPAPP.MAP.world_degrees_to_pixels(0.0001);;

		$(this.path).each(function(i, obj) {

			if (obj.worldCoor != null) {
				var pos = obj.position();
				obj.paperPoint = line.add([pos.x, pos.y]);

			}
			else {
				console.log("error..1214"); //TODO error
			}
		});

		this.paperLine = line;

	};

	this.updatePosition = function() {

		$(this.path).each(function(i, obj) {

			var pos = obj.position();
			obj.paperPoint.point.x = pos.x;
			obj.paperPoint.point.y = pos.y;

		});

		this.paperLine.strokeWidth = 2;//MAPAPP.MAP.world_degrees_to_pixels(0.0001); //TODO: road width?

	};

	this.paperLine = null;

};

MAPAPP.ANIMATION_QUEUE = function() {
	this.queue = [];
	//TODO: naming
	this.then = [];
	this.push = function(animation) {
		var addToThen = false;
		for (var i = 0; i<this.queue.length; i++) {
			if (this.queue[i].id != null && this.queue[i].id == animation.id) {
				if (animation.queue == true) {
					addToThen = true;
				}
				else {
					this.remove(this.queue[i]);
				};
			};
		};
		if (addToThen) {
			this.then.push(animation);
		}
		else {
			this.queue.push(animation);
			animation.init();
		}
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
		var thenFinished = false;
		for (i = 0; i<finished.length; i++) {
			this.remove(finished[i]);
			for (t = 0; t<this.then.length; t++) {
				if (this.then[t].id == finished[i].id) {
					this.push(this.then[t]);
					thenFinished = this.then[t];
					break;
				};
			};
		};
		if (thenFinished != false) {
			this.then.splice(this.then.indexOf(thenFinished), 1);
		};
	};
	this.clear = function() {
		this.queue = [];
	};
	this.empty = function() {
		return (this.queue.length > 0) ? false : true;
	};
};

MAPAPP.ANIMATION = function() {
	this.id = null;
	this.frame = 0;
	this.length = 0;
	this.queue = false;
	this.init = function() { return false; };
	this.animate = function() { this.frame++; return (this.frame > this.length) ? false : this.animateFrame() };
	this.animateFrame = function() { return false; };
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

MAPAPP.MAP.goto_position = function(world_coor, animation) {

	if (animation == true) {

		var animation = new MAPAPP.ANIMATION;
			
		animation.length = 15;
		animation.id = "goto";
		animation.queue = true;

		animation.init = function() {

			//animation.length = Math.abs((world_coor.lon - MAPAPP.MAP.current_center.lon))*50000
			animation.lon_inteval = (world_coor.lon - MAPAPP.MAP.current_center.lon) / animation.length;
			animation.lat_inteval = (world_coor.lat - MAPAPP.MAP.current_center.lat) / animation.length;

		};
		animation.animateFrame = function() {

			MAPAPP.MAP.current_center = new MAPAPP.OBJECTS.WORLD_COOR(MAPAPP.MAP.current_center.lat + animation.lat_inteval, MAPAPP.MAP.current_center.lon + animation.lon_inteval);
			updateNodesPosition();
			updatePositionText();
			return true;

		};
		animationQueue.push(animation);

		animate();

	}
	else {

		MAPAPP.MAP.current_center = world_coor;

		updateNodesPosition();
		updatePositionText();
	
	}
};

MAPAPP.MAP.set_zoom = function(zoom, animation) {

	if (zoom <= 0) zoom = 0.1;

	if (animation == true) {

		var animation = new MAPAPP.ANIMATION;
		animation.length = 15;
		animation.id = "zoom";

		var zoom_inteval = (MAPAPP.MAP.zoom_level - zoom) / animation.length;

		animation.animateFrame = function() {

			MAPAPP.MAP.zoom_level -= zoom_inteval;
			updateNodesPosition();

		};

		animationQueue.push(animation);
		animate();

	}
	else {

		MAPAPP.MAP.zoom_level = zoom;

		updateNodesPosition();
		paper.view.draw();

	}
};

MAPAPP.MAP.zoom_in = function(val, animate) {

	var zoom_val = (val == undefined || val == null) ? 1 : val;
	this.set_zoom(MAPAPP.MAP.zoom_level - zoom_val, animate);

};

MAPAPP.MAP.zoom_out = function(val, animate) {

	var zoom_val = (val == undefined || val == null) ? 1 : val;
	this.set_zoom(MAPAPP.MAP.zoom_level + zoom_val, animate);

};


var testPoints = [];
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.674442, 12.566367));
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.672842, 12.563437));
testPoints.push(new MAPAPP.OBJECTS.WORLD_COOR(55.676097, 12.568337));

paths = [];
lines = [];


roads = [];

function testDrawPoints(points) {
	/*
	var road = new MAPAPP.OBJECTS.ROAD();

	road.addPoint(new MAPAPP.OBJECTS.POINT(55.676097, 12.568337));
	road.addPoint(new MAPAPP.OBJECTS.POINT(55.674442, 12.566367));	
	road.addPoint(new MAPAPP.OBJECTS.POINT(55.672842, 12.563437));

	roads.push(road);

	var road = new MAPAPP.OBJECTS.ROAD();

	road.addPoint(new MAPAPP.OBJECTS.POINT(55.677972, 12.564867));
	road.addPoint(new MAPAPP.OBJECTS.POINT(55.675112, 12.562597));	
	road.addPoint(new MAPAPP.OBJECTS.POINT(55.674362, 12.564407));
	road.addPoint(new MAPAPP.OBJECTS.POINT(55.674442, 12.566367));

	roads.push(road);
	*/
	/*
	$(points).each(function(i, obj) {

		mapPoint = MAPAPP.MAP.world_to_map_coor(obj);

		var path = new Path.Circle(new Point(mapPoint.x, mapPoint.y), 5);
		path.fillColor = 'red';
		path.onMouseDown = pointPressed;
		path.onMouseEnter = pointEnter;
		path.onMouseLeave = pointLeave;
		paths.push(path);

	});

	var line = new Path();
	line.strokeColor = 'red';
	line.strokeWidth = 3;

	line.add(paths[0].position);
	line.add(paths[1].position);
	lines.push(line);
	*/

};

function updateNodesPosition() {
	
	$(roads).each(function(i, obj) {

		obj.updatePosition();

	});
	



	/*
	$(nodeObjsArray).each(function(i, obj) {
		if (obj.type == "node") {

			nodeObjs[obj.id] = obj;

			mapPoint = MAPAPP.MAP.world_to_map_coor(new MAPAPP.OBJECTS.WORLD_COOR(obj.lat, obj.lon));

			var path = new Path.Circle(new Point(mapPoint.x, mapPoint.y), 4);
			path.OSM = obj;
			path.fillColor = 'blue';
			path.onMouseDown = pointPressed;
			path.onMouseEnter = pointEnter;
			path.onMouseLeave = pointLeave;
			paths.push(path);

		};
	});
	*/

	/*
	$(paths).each(function(i, obj) {

		obj.position = [MAPAPP.MAP.world_to_map_coor(testPoints[i]).x, MAPAPP.MAP.world_to_map_coor(testPoints[i]).y];

	});

	$(lines).each(function(i, obj) {
		
		obj.segments[0].point.x = MAPAPP.MAP.world_to_map_coor(testPoints[0]).x;
		obj.segments[0].point.y = MAPAPP.MAP.world_to_map_coor(testPoints[0]).y;
		
		obj.segments[1].point.x = MAPAPP.MAP.world_to_map_coor(testPoints[1]).x;
		obj.segments[1].point.y = MAPAPP.MAP.world_to_map_coor(testPoints[1]).y;

	});
	*/
};

function pointEnter(event) {

	event.target.fillColor = 'blue';

};

function pointLeave(event) {

	event.target.fillColor = 'red';

};

function pointPressed(event) {

	event.target.fillColor = 'red';
	console.log(event.target.OSM);
	//var coord = MAPAPP.MAP.map_to_world_coor(new MAPAPP.OBJECTS.MAP_COOR(event.target.position.x, event.target.position.y));
	//MAPAPP.MAP.goto_position(coord, true);

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

var nodeObjs = {};
var wayObjs = {};

var nodeObjsArray = [];
var wayObjsArray = [];

function testDrawNodes(nodes) {

	$(nodes).each(function(i, obj) {
		if (obj.type == "node") {

			nodeObjs[obj.id] = obj;

		}
		else if (obj.type == "way") {

			wayObjsArray.push(obj);

		};
	});

	$(wayObjsArray).each(function(i, obj) {

		var road = new MAPAPP.OBJECTS.ROAD();

		$(obj.nodes).each(function(i, obj) {

			road.addPoint(new MAPAPP.OBJECTS.POINT(nodeObjs[obj].lat, nodeObjs[obj].lon));

		});

		roads.push(road);

	});

	paper.view.draw();
	/*
	console.log("Drawing nodes...");
	$(nodes).each(function(i, obj) {
		if (obj.type == "node") {

			nodeObjs[obj.id] = obj;
			nodeObjsArray.push(obj);

			mapPoint = MAPAPP.MAP.world_to_map_coor(new MAPAPP.OBJECTS.WORLD_COOR(obj.lat, obj.lon));

			var path = new Path.Circle(new Point(mapPoint.x, mapPoint.y), 4);
			path.OSM = obj;
			path.fillColor = 'blue';
			path.onMouseDown = pointPressed;
			path.onMouseEnter = pointEnter;
			path.onMouseLeave = pointLeave;
			paths.push(path);

		};
	});
	console.log("...Done!");
	console.log("Drawing ways...");
	$(nodes).each(function(i, obj) {

		if (obj.type == "way") {

			var line = new Path();
			line.strokeColor = 'red';
			line.strokeWidth = 2;

			$(obj.nodes).each(function(i, obj) {

				mapPoint = MAPAPP.MAP.world_to_map_coor(new MAPAPP.OBJECTS.WORLD_COOR(nodeObjs[obj].lat, nodeObjs[obj].lon));
				line.add(new Point(mapPoint.x, mapPoint.y));

			});
			line.onMouseDown = function(event) {

				console.log(obj);

			};
			wayObjs[obj.id] = obj;
			wayObjsArray.push(obj);
		};
	});
	console.log("...Done!");

	paper.view.draw();

	*/
}

function test() {
	console.log("API CALL...");
	//  (s, w, n, e)
	$.get('http://overpass-api.de/api/interpreter?data=[out:json];(node(55.675212,12.567147,55.677152,12.569317);rel(bn)->.x;way(55.675212,12.567147,55.677152,12.569317);node(w)->.x;);out meta;', function(data) {
		console.log("...DONE!");
		console.log(data);
		testDrawNodes(data.elements);
	});

}
//node(55.664,12.543,55.685,12.590)
/*
//lat, lon
55.685877, 12.565817
55.675477, 12.543177
55.664717, 12.565817
55.676757, 12.590937

55.677152, 12.568277
55.676032, 12.567147
55.675212, 12.568327
55.676212, 12.569317

(55.675212,12.567147,55.677152,12.569317)

(55.685877,12.543177,55.664717,12.590937)

*/
//data=[out:json];(node(55.675212,12.567147,55.677152,12.569317);rel(bn)->.x;way(55.675212,12.567147,55.677152,12.569317);node(w)->.x;rel(bw););out meta;

//[out:json];(node(55.675212,12.567147,55.677152,12.569317);rel(bn)->.x;way(55.675212,12.567147,55.677152,12.569317);node(w)->.x;);out meta;


