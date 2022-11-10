import '../style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

//Dom elements
let walkCanvas = document.getElementById('forest-walk');

// Declare variables 
let scene;
let camera;
let ambientLight;
let orbitControls;
let renderer;
let width = 33;
let heightMap;
let smoothMap;
let textureLoader;


/**
 * Startup Function
 */
function main() {
    initGraphics();
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
    camera.position.set(0, 200, -25);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    //Lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);


    // Orbit controls
    orbitControls = new OrbitControls(camera, document.body);


    //Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: walkCanvas,
    });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(walkCanvas.clientWidth, walkCanvas.clientHeight);


    // initialize terrain
    initTerrain();

    console.log(scene);

} //end of initGraphics


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

    var topMid = heightMap[centerColumnIdx][topRow] = ((topLeft + topRight) / 2);
    var bottomMid = heightMap[centerColumnIdx][bottomRow] = ((bottomLeft + bottomRight) / 2);
    var leftMid = heightMap[leftColumn][centerRowIdx] = ((topLeft + bottomLeft) / 2);
    var rightMid = heightMap[rightColumn][centerRowIdx] = ((topRight + bottomRight) / 2);

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
    heightMap[0][32] = 0;
    // top right
    heightMap[32][0] = 0;
    // bottom right
    heightMap[32][32] = 0;

    // set a center and other chosen height values
    heightMap[16][16] = 75;

    // make a hill in the corner
    heightMap[3][3] = 50;
    heightMap[2][3] = 50;
    heightMap[4][3] = 50;
    heightMap[3][4] = 50;
    heightMap[3][2] = 50;
    heightMap[4][4] = 50;

    heightField(0, 32, 0, 32);

    //smoothing technique
    smoothMap = heightMap;

    smoothTerrain(2);

    // now turn into geometry
    textureLoader = new THREE.TextureLoader();
    var geometry = new THREE.BufferGeometry();
    var vertices = [];

    for (let j = 0; j < width - 1; j++) {
        for (let i = 0; i < width - 1; i++) {
            // bottom right triangle
            // point 1
            vertices.push(i);
            vertices.push(j);
            vertices.push(smoothMap[i][j]);
            // point 2
            vertices.push(i + 1);
            vertices.push(j);
            vertices.push(smoothMap[i + 1][j]);
            // point 3
            vertices.push(i + 1);
            vertices.push(j + 1);
            vertices.push(smoothMap[i + 1][j + 1]);

            // top left triangle
            // point 1
            vertices.push(i);
            vertices.push(j);
            vertices.push(smoothMap[i][j]);
            // point 2
            vertices.push(i + 1);
            vertices.push(j + 1);
            vertices.push(smoothMap[i + 1][j + 1]);
            // point 3
            vertices.push(i);
            vertices.push(j + 1);
            vertices.push(smoothMap[i][j + 1]);
        }
    }

    geometry.setAttribute('position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    var grass = new THREE.MeshStandardMaterial({
        map: textureLoader.load('assets/terrain.jpeg'),
    });
    var mesh = new THREE.Mesh(geometry, grass);
    scene.add(mesh);

}

/**
 * A basic render method, in case special steps
 * must be taken during a single render.
 */
function render() {
    renderer.render(scene, camera);
    orbitControls.update();
    window.requestAnimationFrame(render);
} //end of render


main();