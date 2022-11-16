import '../style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { generateBarnsleyTree, generatePineTree, generateTrinaryTree } from './Trees';
import { AmbientLight, BoxGeometry, EqualStencilFunc, Mesh, MeshStandardMaterial } from 'three';

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
let distance;
let raycaster;
let reticleTarget;
let groundTerrain;
let skyBox;
let reticle;
let cameraSphere;
let ambientLight;

//Colors for the sky background
const sky_colors = {
    day: 0x87CEEB,
    sunset: 0xF4633C,
    night: 0x000000,
    sunrise: 0xF4633C,
}

//Colors for sun to interpolate between
const sun_colors = {
    min: 0xDD6E0F,
    max: 0xfdfbd3
}

const cycle_per_sec = ((15 * (Math.PI / 180)) / 10);
const treeList = [];

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
    render();
} //end of main


/**
 * builds the view the user will see
 */
function initGraphics() {

    //Scene
    scene = new THREE.Scene();

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);


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

    //Lights
    sunLight = new THREE.PointLight(0xfdfbd3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sun.add(sunLight);

    moonLight = new THREE.PointLight(0xc2c5cc, 0.0);
    moonLight.castShadow = true;
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

    // initialize terrain
    initTerrain();

    // circle reticle
    geometry = new THREE.SphereGeometry(0.0005, 32, 16);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    reticle = new THREE.Mesh(geometry, material);
    camera.add(reticle);
    reticle.position.set(0, 0, -.2);

    //generate trees
    for (let i = 0; i < 10; i++) {

        let t = generateTrinaryTree(5);
        t.castShadow = true;
        let x = Math.random() * 125 + 2;
        let z = Math.random() * 125 + 2;
        t.position.set(x, smoothMap[Math.floor(x)][Math.floor(z)] - 1.5, -z);
        scene.add(t);
        treeList.push(t);
    }

    for (let i = 0; i < 10; i++) {

        let t = generateBarnsleyTree(3);
        t.castShadow = true;
        let x = Math.random() * 125 + 2;
        let z = Math.random() * 125 + 2;
        t.position.set(x, smoothMap[Math.floor(x)][Math.floor(z)] - 1.5, -z);
        scene.add(t);
        treeList.push(t);

    } for (let i = 0; i < 10; i++) {

        let t = generatePineTree(4);
        t.castShadow = true;
        let x = Math.random() * 125 + 2;
        let z = Math.random() * 125 + 2;
        t.position.set(x, smoothMap[Math.floor(x)][Math.floor(z)] - 3, -z); //interpolate between values
        scene.add(t);
        treeList.push(t);
    }


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
    const cameraGeometry = new THREE.SphereGeometry(2);
    const cameraMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    cameraSphere = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.add(cameraSphere);

    camera.translateY(10);

    // random shapes for raycast detection


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
} //end of initControls

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

function isCollision() {
    var collision = false;
    // check for collisions here
    /*treeList.forEach(item => {
        cameraSphere.geometry.computeBoundingBox();
        cameraSphere.updateMatrixWorld();
        var bb1 = cameraSphere.geometry.boundingBox.clone();
        bb1.applyMatrix4(cameraSphere.matrixWorld);
        // if there is an intersection then refuse the size
        item.geometry.computeBoundingBox();
        item.updateMatrixWorld();
        var bb2 = item.geometry.boundingBox.clone();
        bb2.applyMatrix4(item.matrixWorld);
        // if there is a collision, stop movement
        if (bb1.intersectsBox(bb2)) {
            collision = true;
        }
    });
    */
    return collision;
}


function updateSkySystem(deltaTime) {
    skySystem.rotation.z += deltaTime * 4 * cycle_per_sec;
    let sunPos = Math.sin(skySystem.rotation.z);
    let cycleSide = Math.cos(skySystem.rotation.z);

    if (sunPos >= 0.1)
    {
        sunLight.intensity = 1.5;
        sunLight.color = new THREE.Color(sun_colors.max);
        moonLight.intensity = 0.0;
        ambientLight.intensity = 0.1;
        skyBox.material.color = new THREE.Color(sky_colors.day);
    }
    else if (sunPos >= 0 && cycleSide < 0) 
    {
        sunLight.color = new THREE.Color(weightColors(sunPos / 0.1, sun_colors.max, sun_colors.min));
        //skyBox.material.color = new THREE.Color(weightColors(sunPos / 0.1, sky_colors.day, sky_colors.sunset));
    }
    else if (sunPos >= -0.1 && cycleSide < 0) 
    {
        skyBox.material.color = new THREE.Color(weightColors(Math.abs(sunPos) / 0.1, sky_colors.night, sky_colors.day));
    }
    else if (sunPos < -0.1) {
        sunLight.intensity = 0;
        moonLight.intensity = 0.5;
        ambientLight.intensity = 0.0;
        skyBox.material.color = new THREE.Color(sky_colors.night);
    }
    else if(sunPos >= -0.1 && cycleSide > 0)
    {
        skyBox.material.color = new THREE.Color(weightColors(Math.abs(sunPos) / 0.1, sky_colors.night, sky_colors.sunset));
    }
    else if(sunPos >= 0 && cycleSide > 0)
    {
        sunLight.color = new THREE.Color(weightColors(sunPos / 0.1, sun_colors.max, sun_colors.min));
        skyBox.material.color = new THREE.Color(weightColors(sunPos / 0.1, sky_colors.day, sky_colors.sunset));
    }

}

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

        if (forward || back) velo.z -= direction.z * 100.0 * deltaTime;
        if (left || right) velo.x -= direction.x * 100.0 * deltaTime;

        // move then check for collision then move back?
        if (isCollision()) {
            console.log('colliding with a sphere or wall');
        }

        controls.moveRight(-velo.x * deltaTime);
        controls.moveForward(-velo.z * deltaTime);


        // simulate walking on top of the terrain
        raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        distance = 2;
        var velocity = new THREE.Vector3();
        var intersects = raycaster.intersectObject(groundTerrain);
        if (intersects.length > 0) {
            var delta = distance - intersects[0].distance;
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

        // find intersections with trees
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

            if (!(tree.uuid == reticleTarget.uuid)) {
                reticleTarget.children.forEach(element => {
                    let material = element.material;
                    material.emissive = new THREE.Color(0x000000);
                })

                reticleTarget = tree;
            }

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

function rgbToString(r, g, b) {
    return "rgb(" + r + "," + g + "," + b +")";
}

function hexToRgb(hex) {
    hex = Math.floor( hex );

    return {
        r : ( hex >> 16 & 255 ),
        g : ( hex >> 8 & 255 ),
        b :  ( hex & 255 )
    }
}

function weightColors(sunPos, hex1, hex2)
{
    let rgb1 = hexToRgb(hex1);
    let rbg2 = hexToRgb(hex2);
    
    let r = Math.floor(sunPos * rgb1.r + (1 - sunPos) * rbg2.r);
    let g = Math.floor(sunPos * rgb1.g + (1 - sunPos) * rbg2.g);
    let b = Math.floor(sunPos * rgb1.b + (1 - sunPos) * rbg2.b);

    return rgbToString(r,g,b);
}
