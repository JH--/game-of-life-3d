var container = document.getElementById("main");
var start = document.getElementById("start");
var newBoard = document.getElementById("new-board");
var width = container.offsetWidth;
var height = window.innerHeight;
var viewAngle = 45;
var aspect = width / height;
var near = 0.1;
var far = 10000;
var min = -25;
var max = 25;
var len = 12;
var keepAliveMin       = document.getElementById("keep-alive-min");
var keepAliveMax       = document.getElementById("keep-alive-max");
var makeAliveMin       = document.getElementById("make-alive-min");
var makeAliveMax       = document.getElementById("make-alive-max");
var lifeProbability    = document.getElementById("life-probability");
var lifeProbabilityVal = document.getElementById("life-probability-val");

lifeProbability.addEventListener('input', function(e) {
	lifeProbabilityVal.innerText = e.target.value + "%";
})

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);

var camera = 
	new THREE.PerspectiveCamera(
		viewAngle,
		aspect,
		near,
		far
	);

camera.position.set(18,30,-21);
scene.add(camera);
var whiteLight = new THREE.PointLight(0xffffff);
whiteLight.position.set(0, 100, 0);
scene.add(whiteLight);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);

container.appendChild(renderer.domElement);

var cubes = generateCubes(len);

setRandomInitialLifeState(cubes, +lifeProbability.value / 100);

newBoard.addEventListener('click', function() {
	setRandomInitialLifeState(cubes, +lifeProbability.value / 100);
});

start.addEventListener('click', function() {
	var then = Date.now();
	var keepAlive = [+keepAliveMin.value, +keepAliveMax.value];
	var makeAlive = [+makeAliveMin.value, +makeAliveMax.value];
	
	evolve(cubes, keepAlive, makeAlive);

	function evolve(cubes, keepAliveVals, makeAliveVals) {
		requestAnimationFrame(evolve.bind(this,cubes,keepAliveVals,makeAliveVals));

		var interval = 2000;
		var now = Date.now();
		var delta = now - then;
		if (delta > interval) {

			then = now - delta % interval;

			var newStatus = getEvolveStatuses(cubes, keepAliveVals, makeAliveVals);
			for (var i = 0; i < cubes.length; i++) {
				for (var j = 0; j < cubes.length; j++) {
					for (var k = 0; k < cubes.length; k++) {
						var cube = cubes[i][j][k];
						cube.userData.isAlive = newStatus[i][j][k];
						cube.material.opacity = +cube.userData.isAlive / 2;
					}
				}
			}
		}
	}

});

var controls = new THREE.OrbitControls(camera, renderer.domElement);

render();

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

function generateCubes(len) {
	var cubes = [];
	for (var i=0;i<len;i++) {
		var cubePlane = [];
		for (var j=0;j<len;j++) {
			var cubeRow = [];
			for (var k=0;k<len;k++) {
				var isAlive = Math.random() < lifeProbability;
				cubeRow.push(addCube([i - len/2,j - len/2,k - len/2]));
			}
			cubePlane.push(cubeRow);
		}
		cubes.push(cubePlane);
	}
	return cubes;
}

function addCube(coordinates) {
	var geometry = new THREE.BoxGeometry(1,1,1);
 	var material = new THREE.MeshLambertMaterial({
 		color: 0x00ff00,
 		transparent: true
 	});
	var cube = new THREE.Mesh(geometry, material);
	cube.position.set.apply(cube.position,coordinates);
	scene.add(cube);
	return cube;
}

function setLifeStatus(cube, isAlive) {
	cube.userData.isAlive = isAlive;
	cube.material.opacity = +cube.userData.isAlive / 2;
}

function setRandomInitialLifeState(cubes, lifeProbability) {
	for (var i = 0; i < cubes.length; i++) {
		for (var j = 0; j < cubes.length; j++) {
			for (var k = 0; k < cubes.length; k++) {
				setLifeStatus(cubes[i][j][k], Math.random() < lifeProbability);
			}
		}
	}
}

function livingNeighborCount(coords, cubes) {
	var numAlive = cubes[coords[0]][coords[1]][coords[2]].userData.isAlive ? -1 : 0;
	for (var i = coords[0] - 1; i <= coords[0] + 1; i++) {
		for (var j = coords[1] - 1; j <= coords[1] + 1; j++) {
			for (var k = coords[2] - 1; k <= coords[2] + 1; k++) {
				try {
					if (cubes[i][j][k].userData.isAlive) numAlive++;
				} catch(e) {
					continue
				}
			}
		}
	}
	return numAlive;
}

function setAlive(coords, aliveVals, cubes) {
	var nbrs = livingNeighborCount(coords,cubes);
	return nbrs >= aliveVals[0] && nbrs <= aliveVals[1];
}

function getEvolveStatuses(cubes, keepAliveVals, makeAliveVals) {
	return cubes.map(function(cubePlanes,i) {
		return cubePlanes.map(function(cubeRows,j) {
			return cubeRows.map(function(cube,k) {
				var aliveVals = cube.userData.isAlive ? keepAliveVals : makeAliveVals;
				return setAlive([i,j,k], aliveVals, cubes);
			});
		});
	});
}