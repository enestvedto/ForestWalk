import '../style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { Vector2 } from 'three';
import { generateTrinaryTree } from './Trees';

//Dom elements
let walkCanvas = document.getElementById('forest-walk');

// Declare variables 
let scene;
let clock;
let camera;
let controls;
let renderer;
let width = 129;
let heightMap;
let smoothMap;
let textureLoader;
let move;


// Graphics World Variables
let skySystem;
let sun;
let moon;
let directionalLight;

//Player and Controls
let pointerLockControls;
let forward = false;
let back = false;
let left = false;
let right = false;

const velocity =  new THREE.Vector3();
const direction = new THREE.Vector3();
const position = new THREE.Vector3();  





/**
 * Startup Function
 */
function main() {
    initGraphics();
    initControls();
    render();
} //end of main


/**
 * builds the view the user will see
 */
function initGraphics() {

    //Scene
    scene = new THREE.Scene();


    // reticle
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);


    //Camera
    camera = new THREE.PerspectiveCamera(35, walkCanvas.clientWidth / walkCanvas.clientHeight, 0.1, 3000);
    camera.name = 'camera';
    scene.add(camera);

    //Sun and Moon System
    skySystem = new THREE.Group();

    let geometry = new THREE.SphereGeometry(1);
    let material = new THREE.MeshBasicMaterial({ color: 0xFFE87C });

    sun = new THREE.Mesh(geometry, material);
    sun.position.y = 10;
    skySystem.add(sun);

    geometry = new THREE.SphereGeometry(1);
    material = new THREE.MeshBasicMaterial({ color: 0x98A4C4 })

    moon = new THREE.Mesh(geometry, material);
    moon.position.y = -10;
    skySystem.add(moon);

    scene.add(skySystem);

    //DirectionalLight and Target
    directionalLight = new THREE.DirectionalLight(0xFFFFFF);
    scene.add(directionalLight);
    directionalLight.target = moon;

    //Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: walkCanvas,
    });
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(walkCanvas.clientWidth, walkCanvas.clientHeight);

    // clock
    clock = new THREE.Clock();

    // initialize terrain
    initTerrain();

    // circle reticle
    geometry = new THREE.SphereGeometry(0.0005, 32, 16);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    let sphere = new THREE.Mesh(geometry, material);
    camera.add(sphere);
    sphere.position.set(0, 0, -.2);

    console.log(scene);

    //test tree
    let t = generateTrinaryTree(5);
    console.log(t);
    scene.add(t);
    
} //end of initGraphics

function initControls() {

    controls = new PointerLockControls(camera, document.body);
    controls.pointerSpeed = 0.5;

    let instructions = document.getElementById('instructions');
    let blocker = document.getElementById('blocker');
    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        move = true;
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
        move = false;
    });

    document.onkeydown = function (e) {
        switch (e.key) {
            case 'W':
            case 'w':
                forward = true;
                break;
            case 'S':
            case 's':
                back = true;
                break;
            case 'D':
            case 'd':
                right = true;
                break;
            case 'A':
            case 'a':
                left = true;
                break;
        }
    };

    document.onkeyup = function (e) {
        switch (e.key) {
            case 'W':
            case 'w':
                forward = false;
                break;
            case 'S':
            case 's':
                back = false;
                break;
            case 'D':
            case 'd':
                right = false;
                break;
            case 'A':
            case 'a':
                left = false;
                break;
        }
    };
}

// function to populate array
function heightField(topRow, bottomRow, leftColumn, rightColumn) {
    var topLeft = heightMap[leftColumn][topRow];
    var topRight = heightMap[rightColumn][topRow];
    var bottomLeft = heightMap[leftColumn][bottomRow];
    var bottomRight = heightMap[rightColumn][bottomRow];

    // fill center value if it isn't already
    var centerHeight = (topLeft + topRight + bottomLeft + bottomRight) / 4;
    var centerRowIdx = (topRow + bottomRow) / 2;
    var centerColumnIdx = (leftColumn + rightColumn) / 2;

    if (!Number.isInteger(centerRowIdx) || !Number.isInteger(centerColumnIdx)) {
        return;
    }

    if (heightMap[centerColumnIdx][centerRowIdx] == -1) {
        heightMap[centerColumnIdx][centerRowIdx] = centerHeight;
    }
    else {
        centerHeight = heightMap[centerColumnIdx][centerRowIdx];
    }

    // set mid values to serve as corners when recursing
    heightMap[centerColumnIdx][topRow] = ((topLeft + topRight) / 2);
    heightMap[centerColumnIdx][bottomRow] = ((bottomLeft + bottomRight) / 2);
    heightMap[leftColumn][centerRowIdx] = ((topLeft + bottomLeft) / 2);
    heightMap[rightColumn][centerRowIdx] = ((topRight + bottomRight) / 2);

    // call recursively on matrix for all 4 corners
    // top left
    heightField(topRow, centerRowIdx, leftColumn, centerColumnIdx);
    // bottom left
    heightField(centerRowIdx, bottomRow, leftColumn, centerColumnIdx);
    // top right
    heightField(topRow, centerRowIdx, centerColumnIdx, rightColumn);
    // bottom right
    heightField(centerRowIdx, bottomRow, centerColumnIdx, rightColumn);
} // end of heighField


// function to smooth a generated terrain
function smoothField() {
    // make sure every edge of the terrain is on y level of 0
    for (var i = 0; i < smoothMap.length; i++) {
        var map = smoothMap[i];
        for (var j = 0; j < map.length; j++) {
            if (i == 0) {
                smoothMap[i][j] = 0;
            }
            if (i == width - 1) {
                smoothMap[i][j] = 0;
            }
            if (j == 0) {
                smoothMap[i][j] = 0;
            }
            if (j == width - 1) {
                smoothMap[i][j] = 0;
            }
        }
    }
    var tmp = new Array(width);
    for (let i = 0; i < tmp.length; i++) {
        tmp[i] = new Array(width);
    }
    for (var i = 0; i < tmp.length; i++) {
        var tmpp = tmp[i];
        for (var j = 0; j < tmpp.length; j++) {

            var res = 0;
            var denom = 0;

            var itsColumn = i;
            var itsRow = j;
            var downRow = j++;
            var upRow = j--;
            var rightColumn = i++;
            var leftColumn = i--;

            // left one / up one
            if (leftColumn >= 0 && leftColumn < width && upRow >= 0 && upRow < width) {
                res += smoothMap[leftColumn][upRow];
                denom++;
            }
            // up one
            if (upRow < width && upRow >= 0) {
                res += smoothMap[itsColumn][upRow];
                denom++;
            }
            // right one / up one
            if (rightColumn >= 0 && rightColumn < width && upRow >= 0 && upRow < width) {
                res + smoothMap[rightColumn][upRow];
                denom++;
            }
            // right one
            if (rightColumn >= 0 && rightColumn < width) {
                res += smoothMap[rightColumn][itsRow];
                denom++;
            }
            // right one / down one
            if (rightColumn >= 0 && rightColumn < width && downRow >= 0 && downRow < width) {
                res += smoothMap[rightColumn][downRow];
                denom++;
            }
            // down one
            if (downRow >= 0 && downRow < width) {
                res += smoothMap[itsColumn][downRow];
                denom++;
            }
            // left one / down one
            if (leftColumn >= 0 && leftColumn < width && downRow >= 0 && downRow < width) {
                res += smoothMap[leftColumn][downRow];
                denom++;
            }
            // left one
            if (leftColumn >= 0 && leftColumn < width) {
                res += (2 * smoothMap[leftColumn][itsRow]);
                denom++;
            }

            // itself
            res += smoothMap[itsColumn][itsRow];
            denom++;

            res /= denom;

            // smooth and put in new array here
            tmpp[j] = res;
        }
    }
    smoothMap = tmp;
} // end of smoothField


// function to smooth a terrain 'x' number of times
function smoothTerrain(smoothingIterations) {
    for (let i = 0; i < smoothingIterations; i++) {
        smoothField();
    }
} // end of smoothTerrain

/***
 * TODO: FIX THIS SO IT WORKS BETTER
 */
function initTerrain() {
    // make matrix of 2^k+1 by 2^k+1
    heightMap = new Array(width);
    for (let i = 0; i < heightMap.length; i++) {
        heightMap[i] = new Array(width);
    }

    // fill with unusual value of -1
    for (var i = 0; i < heightMap.length; i++) {
        var map = heightMap[i];
        for (var j = 0; j < map.length; j++) {
            map[j] = -1;
        }
    }

    // put in 4 known corners
    // top left
    heightMap[0][0] = 0;
    // bottom left
    heightMap[0][width - 1] = 0;
    // top right
    heightMap[width - 1][0] = 0;
    // bottom right
    heightMap[width - 1][width - 1] = 0;

    // set a random center height
    var centerHeight = getRndInteger(0, 15);
    heightMap[(width - 1) / 2][(width - 1) / 2] = centerHeight;

    // set random hills and valleys around the terrain
    // now turn into geometry
    for (var i = 10; i < heightMap.length - 10; i += 3) {
        var map = heightMap[i];
        for (var j = 10; j < map.length - 10; j += 3) {
            map[j] = getRndInteger(0, 15);
        }
    }

    // call function to automatically populate the rest of the height array
    heightField(0, width - 1, 0, width - 1);

    //smoothing technique
    smoothMap = heightMap;
    smoothTerrain(10);

    // make sure every edge of the terrain is on y level of 0
    for (var i = 0; i < smoothMap.length; i++) {
        var map = smoothMap[i];
        for (var j = 0; j < map.length; j++) {
            if (i == 0) {
                smoothMap[i][j] = 0;
            }
            if (i == width - 1) {
                smoothMap[i][j] = 0;
            }
            if (j == 0) {
                smoothMap[i][j] = 0;
            }
            if (j == width - 1) {
                smoothMap[i][j] = 0;
            }
        }
    }
    smoothTerrain(5);

    // now turn into geometry
    textureLoader = new THREE.TextureLoader();
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    var uvs = [];

    for (let j = 0; j < width - 1; j++) {
        for (let i = 0; i < width - 1; i++) {
            // bottom right triangle
            // point 1
            vertices.push(i);
            vertices.push(j);
            vertices.push(smoothMap[i][j]);
            uvs.push(i / (width - 1));
            uvs.push(j / (width - 1));
            // point 2
            vertices.push(i + 1);
            vertices.push(j);
            vertices.push(smoothMap[i + 1][j]);
            uvs.push((i + 1) / (width - 1));
            uvs.push(j / (width - 1));
            // point 3
            vertices.push(i + 1);
            vertices.push(j + 1);
            vertices.push(smoothMap[i + 1][j + 1]);
            uvs.push((i + 1) / (width - 1));
            uvs.push((j + 1) / (width - 1));

            // top left triangle
            // point 1
            vertices.push(i);
            vertices.push(j);
            vertices.push(smoothMap[i][j]);
            uvs.push(i / (width - 1));
            uvs.push(j / (width - 1));
            // point 2
            vertices.push(i + 1);
            vertices.push(j + 1);
            vertices.push(smoothMap[i + 1][j + 1]);
            uvs.push((i + 1) / (width - 1));
            uvs.push((j + 1) / (width - 1));
            // point 3
            vertices.push(i);
            vertices.push(j + 1);
            vertices.push(smoothMap[i][j + 1]);
            uvs.push(i / (width - 1));
            uvs.push((j + 1) / (width - 1));
        }
    }

    geometry.setAttribute('position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2));

    const dirtTexture = textureLoader.load('assets/dirt.jpeg', function (dirtTexture) {
        dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
        dirtTexture.repeat.set(width, width);
    });

    var grass = new THREE.MeshStandardMaterial({
        map: dirtTexture,
    });
    geometry.computeVertexNormals();
    var mesh = new THREE.Mesh(geometry, grass);
    scene.add(mesh);

    // flip the terrain rightside up
    mesh.rotation.set(-Math.PI / 2, 0, 0) 
} // end of initTerrain



/**
 * A basic render method, in case special steps
 * must be taken during a single render.
 */
function render() {
    const delta = clock.getDelta();

    if (move) {
        skySystem.rotation.z += delta * 0.1;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number( forward ) - Number( back );
        direction.x = Number( right ) - Number( left );
        direction.normalize();

        if ( forward || back ) velocity.z -= direction.z * 100.0 * delta;
        if ( left || right ) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        let object = controls.getObject()

        object.position.y = 1 + smoothMap[Math.abs(Math.floor(object.position.x))][Math.abs(Math.floor(object.position.z))] || 1; //change off absolute

    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
} //end of render


// returns a random number between min and max (both included):
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
} // end getRndInteger


main();


// random terrain
// walking