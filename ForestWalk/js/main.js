import '../style.css';
import * as THREE from 'three';
import { PointerLockControls } from './PointerLockControls';
import { generateBarnsleyTree, generatePineTree, generateTrinaryTree } from './Trees';
import { Euler, MeshStandardMaterial, Vector3 } from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//Dom elements
let walkCanvas = document.getElementById('forest-walk');

// Declare variables 
const loader = new GLTFLoader();
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
let distance;
let raycaster;
let reticleTarget;
let groundTerrain;
let skyBox;
let reticle;
let cameraSphere;
let ambientLight;
let superCamera;
let bob = 0;
let oldBob = 0;
let yaw = new THREE.Euler(0,0,0);

//Colors for the sky background
const sky_colors = {
    day: 0x87CEEB,
    night: 0x000000,
}

//Colors for sun to interpolate between
const sun_colors = {
    sunset: 0xF4633C,
    day: 0xfdfbd3
}

const cycle_per_sec = ((15 * (Math.PI / 180)) / 10);
const treeList = [];
const wallList = [];

// Graphics World Variables
let skySystem;
let sun;
let moon;
let sunLight, moonLight;

//Player and Controls
let forward = false;
let back = false;
let left = false;
let right = false;

const velo = new THREE.Vector3();
const direction = new THREE.Vector3();
const position = new THREE.Vector3();

/**
 * Startup Function
 */
function main() {
    initGraphics();
    initControls();
    initBorder();
    render();
} //end of main


/**
 * builds the view the user will see
 */
function initGraphics() {

    //Scene
    scene = new THREE.Scene();


    //Camera
    camera = new THREE.PerspectiveCamera(35, walkCanvas.clientWidth / walkCanvas.clientHeight, 0.1, 3000);
    camera.name = 'camera';
    scene.add(camera);


    //SkyBox 
    skySystem = new THREE.Group();
    skySystem.rotation.z = Math.PI / 2;

    let geometry = new THREE.SphereGeometry(3)
    let material = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    })

    skyBox = new THREE.Mesh(geometry, material);
    skySystem.add(skyBox);

    //Sun and Moon System
    let textload = new THREE.TextureLoader();

    const sunTexture = textload.load('assets/sun.jpeg');
    geometry = new THREE.SphereGeometry(0.1);
    material = new THREE.MeshBasicMaterial({ map: sunTexture }); // color: 0xFFE87C });

    sun = new THREE.Mesh(geometry, material);
    sun.position.x = 2;
    skySystem.add(sun);

    const moonTexture = textload.load('assets/moon.jpeg');
    geometry = new THREE.SphereGeometry(0.05);
    material = new THREE.MeshBasicMaterial({ map: moonTexture })

    moon = new THREE.Mesh(geometry, material);
    moon.position.x = -2;
    skySystem.add(moon);
    scene.add(skySystem);

    skySystem.position.set(64, 0, -64);
    skySystem.scale.set(200, 200, 200);

    //sun and moon lights
    sunLight = new THREE.PointLight(0xfdfbd3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.position.x = 1;
    skySystem.add(sunLight);

    moonLight = new THREE.PointLight(0xc2c5cc, 0.0);
    moonLight.castShadow = false;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moon.add(moonLight);

    // ambient ight
    ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    scene.add(ambientLight);

    // flashlight
    const flashlight = new THREE.SpotLight(0xffffff, 1, 60, Math.PI / 10, 0.75, 2);
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;

    // clock
    clock = new THREE.Clock();

    superCamera = new THREE.PerspectiveCamera(35, walkCanvas.clientWidth / walkCanvas.clientHeight, 0.1, 3000);
    superCamera.position.set(64, 100, -64);
    superCamera.lookAt(new Vector3(64, 0, -64));
    scene.add(superCamera);

    // initialize terrain
    initTerrain();

    // circle reticle
    geometry = new THREE.SphereGeometry(0.0005, 32, 16);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    reticle = new THREE.Mesh(geometry, material);
    camera.add(reticle);
    reticle.position.set(0, 0, -.2);

    // generate trees (10 of 3 different types)
    // allow trees to cast shadows
    for (let i = 0; i < 20; i++) {
        let t = generateTrinaryTree(5);
        t.castShadow = true;
        treeList.push(t);
        placeTree(t);
        scene.add(t);
    }

    for (let i = 0; i < 10; i++) {
        let t = generateBarnsleyTree(3);
        t.castShadow = true;
        treeList.push(t);
        placeTree(t);
        scene.add(t);
    }
    for (let i = 0; i < 15; i++) {
        let t = generatePineTree(Math.ceil(Math.random() * 2) + 2);
        t.castShadow = true;
        treeList.push(t);
        placeTree(t);
        scene.add(t);
    }

    //Player Model
    let loader = new GLTFLoader();

    loader.load('../assets/Character.gltf', function (gltf) {
  
      let char = gltf.scene.children[0];
      char.castShadow = true;
      char.position.z = 3;
      camera.add(char);
      
    },undefined, function (error) {

        console.error(error);
    });

    //Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: walkCanvas,
    });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(walkCanvas.clientWidth, walkCanvas.clientHeight);
    renderer.shadowMap.enabled = true;

    // clock
    clock = new THREE.Clock();

    // camera sphere
    const cameraGeometry = new THREE.SphereGeometry(1);
    const cameraMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, });
    cameraSphere = new THREE.Mesh(cameraGeometry, cameraMaterial);
    scene.add(cameraSphere);

    camera.translateY(10);

} //end of initGraphics


function placeTree(tree) {
    let x = 64;
    let z = 64;

    while (x > 61 && x < 67) {
        x = Math.random() * 125 + 2;
    }
    while (z > 61 && z < 67) {
        z = Math.random() * 125 + 2;
    }

    let f_x = Math.floor(x);
    let f_z = Math.floor(z);
    let c_x = Math.ceil(x);
    let c_z = Math.ceil(z);

    let y = interpolate([x, z],[f_x, f_z, f_x, c_z, c_x, f_z, c_x, c_z] ) //since we padded random gen we dont need edge cases
    tree.position.set(x, y - 2.5, -z);

}
/**
 * this function generates an invisible border around the edge of the terrain
 */
function initBorder() {
    // add walls
    const wallGeometry = new THREE.PlaneGeometry(129, 20);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);

    wall1.translateX(129 / 2);
    wall1.translateY(10);

    wall2.rotation.set(0, Math.PI / 2, 0);
    wall2.translateX(129 / 2);
    wall2.translateY(10);

    wall3.translateX(129 / 2);
    wall3.translateZ(-128); PointerLockControls
    wall3.translateY(10);

    wall4.rotation.set(0, Math.PI / 2, 0);
    wall4.translateZ(128);
    wall4.translateX(129 / 2);
    wall4.translateY(10);

    wallList.push(wall1);
    wallList.push(wall2);
    wallList.push(wall3);
    wallList.push(wall4);
} // end of initBorder

/**
 * This function initializes controls which allow the user to move with WASD, as well
 * as hide the mouse pointer.
 */
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

    controls.addEventListener('change', function(e) {
        yaw = camera.yaw
    })

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
} //end of initControls

/**
 * This function is used to populate a height map given 4 corner values and a center value
*/
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


/**
 * this function smooths a height map by replacing each height with the average of itself and the 
 * eight (if defined) surrounding heights
 */
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


/**
 * This function more easily calls the smooth terrain function multiple times
 * 
 * @param smoothingIterations the number of times to call the smoothField function
 */
function smoothTerrain(smoothingIterations) {
    for (let i = 0; i < smoothingIterations; i++) {
        smoothField();
    }
} // end of smoothTerrain

/**
 * This function builds a terrain by creating and populating a height map. Then it randomly
 * creates hills and valleys around the terrain at random heights. It continually smoothes the 
 * map at each step to reach a more realistic looking terrain. It then generates a fractal terrain
 * based off of the height map and turns it into an object, while giving it a texture.
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
    for (var i = 3; i < heightMap.length; i += 3) {
        var map = heightMap[i];
        for (var j = 3; j < map.length; j += 3) {
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

    // make terrain more realistic
    for (var i = 0; i < smoothMap.length; i++) {
        var map = smoothMap[i];
        for (var j = 0; j < map.length; j++) {
            map[j] += getRndInteger(-0.02, 0.02);
        }
    }

    smoothTerrain(1);

    // now turn into geometry
    textureLoader = new THREE.TextureLoader();
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    var uvs = [];

    // create the array of vertices that the buffer geometry will use to create the mesh.
    // also create the array of corresponding uv values to correctly format the texture
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

    // texture the terrain with repeating texture so it appears much higher resolution
    const dirtTexture = textureLoader.load('assets/dirt.jpeg', function (dirtTexture) {
        dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
        dirtTexture.repeat.set(width, width);
    });

    var grass = new THREE.MeshStandardMaterial({
        map: dirtTexture,
    });
    geometry.computeVertexNormals();
    groundTerrain = new THREE.Mesh(geometry, grass);
    groundTerrain.receiveShadow = true;
    scene.add(groundTerrain);

    // flip the terrain rightside up
    groundTerrain.rotation.set(-Math.PI / 2, 0, 0);

    // "walk" on top of the terrain
    raycaster = new THREE.Raycaster();

    // start in the middle of the terrain
    camera.position.set(64, smoothMap[64][64] + 2, -64);

} // end of initTerrain

/**
 * the function determines if the user (camera) is colliding with any trees
 * @returns if the user (camera) is colliding with any trees
 */
function isTreeCollision() {
    var collision = false;
    // check for collisions here
    treeList.forEach(tree => {
        cameraSphere.geometry.computeBoundingBox();
        cameraSphere.updateMatrixWorld();
        var bb1 = cameraSphere.geometry.boundingBox.clone();
        bb1.applyMatrix4(cameraSphere.matrixWorld);
        
        for( let i = 0; i < 2; i++)
        {
            tree.children[i].geometry.computeBoundingBox();
            tree.children[i].updateMatrixWorld();
            var bb2 = tree.children[i].geometry.boundingBox.clone();
            bb2.applyMatrix4(tree.children[i].matrixWorld);
        }

        if (bb1.intersectsBox(bb2)) {
            collision = true;
        }
    });
    return collision;
} // end of isTreeCollision

/**
 * the function determines if the user (camera) is colliding with the invisible border
 * @returns if the user (camera) is colliding with the border
 */
function isBorderCollision() {
    var collision = false;

    wallList.forEach(wall => {
        cameraSphere.geometry.computeBoundingBox();
        cameraSphere.updateMatrixWorld();
        var bb1 = cameraSphere.geometry.boundingBox.clone();
        bb1.applyMatrix4(cameraSphere.matrixWorld);

        wall.geometry.computeBoundingBox();
        wall.updateMatrixWorld();
        var bb2 = wall.geometry.boundingBox.clone();
        bb2.applyMatrix4(wall.matrixWorld);

        if (bb1.intersectsBox(bb2)) {
            collision = true;
        }
    });
    return collision;
} // end of isBorderCollision

/**
 * this function manages the sky system's (day/night) rotation, color, position, and intensity
 */
function updateSkySystem(deltaTime) {
    skySystem.rotation.z += deltaTime * cycle_per_sec;
    let sunPos = Math.sin(skySystem.rotation.z);
    let cycleSide = Math.cos(skySystem.rotation.z);

    if (sunPos >= 0.3) { //day
        sunLight.intensity = 1.5;
        sunLight.color = new THREE.Color(sun_colors.day);
        moonLight.intensity = 0.0;
        moonLight.castShadow = false;
        ambientLight.intensity = 0.1;
        skyBox.material.color = new THREE.Color(sky_colors.day);
    }
    else if (sunPos >= -0.2 && cycleSide < 0) { //day into sunset

        let interval = 0.5;
        let t = (sunPos + 0.2) / interval

        sunLight.color = new THREE.Color(weightColors(t, sun_colors.day, sun_colors.sunset));
        skyBox.material.color = new THREE.Color(weightColors(t, sky_colors.day, sky_colors.night));

        if (sunPos < 0)  //sunset into night
        {
            let t = (0.2 + sunPos) / 0.2
            sunLight.intensity = 1.5 * t;
            moonLight.intensity = 0.5 * (1 - t);
            ambientLight.intensity = 0.1 * (1 - t);
        }

    }
    else if (sunPos < -0.2) { //night
        sunLight.intensity = 0;
        sunLight.castShadow = false;
        moonLight.castShadow = true;
        moonLight.intensity = 0.5;
        ambientLight.intensity = 0.0;
        skyBox.material.color = new THREE.Color(sky_colors.night);
    }

    else if (sunPos >= -0.2 && cycleSide > 0) { //day into sunset

        let interval = 0.5;
        let t = (sunPos + 0.2) / interval

        sunLight.color = new THREE.Color(weightColors(t, sun_colors.day, sun_colors.sunset));
        skyBox.material.color = new THREE.Color(weightColors(t, sky_colors.day, sky_colors.night));

        if (sunPos < 0)  //sunset into night
        {
            let t = (Math.abs(sunPos)) / 0.2
            sunLight.intensity = 1.5 * (1 - t);
            moonLight.intensity = 0.5 * t;
            ambientLight.intensity = 0.1 * t;
        }

    }

} // end of updateSkySystem

/**
 * A basic render method, in case special steps
 * must be taken during a single render.
 */
function render() {
    const deltaTime = clock.getDelta();

    if (move) {

        updateSkySystem(deltaTime);

        velo.x -= velo.x * 10 * deltaTime;
        velo.z -= velo.z * 10 * deltaTime;

        direction.z = Number(forward) - Number(back);
        direction.x = Number(right) - Number(left);
        direction.normalize();

        if (forward || back) velo.z += direction.z * 100.0 * deltaTime;
        if (left || right) velo.x += direction.x * 100.0 * deltaTime;

        //let direction = new THREE.Euler(, 0, )

        direction.z = -direction.z;
        direction.applyEuler(yaw);
        direction.multiplyScalar(3);

        cameraSphere.position.set(camera.position.x, camera.position.y, camera.position.z); //set pos to 0 every time
        cameraSphere.position.addVectors(cameraSphere.position, direction); //switch velo to direction and it should work perfectly
        //^^ basically take sphere and add the direction to see the next step

        if (!isTreeCollision() || isBorderCollision()) {
            controls.moveRight(velo.x * deltaTime);
            controls.moveForward(velo.z * deltaTime);
        }


        // simulate walking on top of the terrain
        raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        distance = 2;
        var velocity = new THREE.Vector3();
        var intersects = raycaster.intersectObject(groundTerrain);

        // plus bob head - extra credit!
        bob += 0.02;
        var newBob = Math.sin(bob);
        var diff = newBob - oldBob;
        distance += diff;
        oldBob = diff;

        if (intersects.length > 0) {
            var delta = distance - intersects[0].distance
            //new position is higher so you need to move you object upwards
            if (distance >= intersects[0].distance) {
                camera.position.y += (delta);
            }
            //gravity and prevent falling through floor
            if (distance >= intersects[0].distance && velocity.y <= 0) {
                velocity.y = 0;
            } else if (distance < intersects[0].distance) {
                velocity.y += (delta);
            }

            camera.translateY(velocity.y);
        }


        // find raycaster intersections with trees for highlighting
        var vector = new THREE.Vector3(0, 0, -1);
        vector = camera.localToWorld(vector);
        // make vector a unit vector with the same direction as the camera
        vector.sub(camera.position);

        var raycaster2 = new THREE.Raycaster(camera.position, vector);
        const treeIntersects = raycaster2.intersectObjects(treeList, true);

        if (treeIntersects.length > 0) {
            let tree = treeIntersects[0].object.parent;

            if (!reticleTarget) {
                reticleTarget = tree;
            }

            // reset the emissiveness if the reticle is not over the tree any longer
            if (!(tree.uuid == reticleTarget.uuid)) {
                reticleTarget.children.forEach(element => {
                    let material = element.material;
                    material.emissive = new THREE.Color(0x000000);
                })

                reticleTarget = tree;
            }

            // if the reticle is over a tree, make it more emissive
            reticleTarget.children.forEach(element => {
                let material = element.material;
                material.emissive = new THREE.Color(0x444444);
            });

        } else {
            if (reticleTarget) {
                reticleTarget.children.forEach(element => {
                    let material = element.material;
                    material.emissive = new THREE.Color(0x000000);
                })
            }
        }

    }
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
} //end of render


// returns a random number between min and max (both included):
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
} // end getRndInteger

main();

/**
 * Takes rbg values and converts them to a string usable by THREE.js
 * @param {Number} r - red
 * @param {Number} g - blue
 * @param {Number} b  - green
 * @returns 
 */
function rgbToString(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
}

/**
 * Takes hex values and decodes it into rgb
 * @param {Hexidecimal} hex 
 * @returns 
 */
function hexToRgb(hex) {
    hex = Math.floor(hex);

    return {
        r: (hex >> 16 & 255),
        g: (hex >> 8 & 255),
        b: (hex & 255)
    }
}

/**
 * Creates a linear interpolation from hex1 to hex2
 * @param {Number} progress state of transition from 0 to 1
 * @param {Number} hex1 color at progress 0
 * @param {Number} hex2 color at progress 1
 * @returns {string} rgbString for THREE.js
 */
function weightColors(progress, hex1, hex2) {
    let rgb1 = hexToRgb(hex1);
    let rbg2 = hexToRgb(hex2);

    let r = Math.floor(progress * rgb1.r + (1 - progress) * rbg2.r);
    let g = Math.floor(progress * rgb1.g + (1 - progress) * rbg2.g);
    let b = Math.floor(progress * rgb1.b + (1 - progress) * rbg2.b);

    return rgbToString(r, g, b);
}

/**
 * Interpolates point given data
 * @param {*} unknown 
 * @param {*} data 
 * @returns 
 */
function interpolate(unknown, data) {

    let distances = []

    //get distance
    for (let i = 0; i < data.length; i += 2) {
        let distance = Math.sqrt(Math.pow(data[i] - unknown[0], 2) + Math.pow(data[i + 1] - unknown[1], 2));
        distances.push(distance)
    }

    //weight by distance to point

    let sum = 0;

    for (let i = 0; i < distances.length; i++) {
        sum += distances[i]
    }

    for (let i = 0; i < distances.length; i++) {
        distances[i] = 1 - distances[i] / sum;
    }

    //correct inverse weights 

    sum = 0;

    for (let i = 0; i < distances.length; i++) {
        sum += distances[i]
    }

    for (let i = 0; i < distances.length; i++) {
        distances[i] = distances[i] / sum;
    }

    //calc amount

    let result = 0;

    for (let i = 0; i < distances.length; i++) {
        result += smoothMap[data[i * 2]][data[i * 2 + 1]] * (distances[i]);
    }

    return result;
}