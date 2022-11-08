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
    camera.position.set(0, 15, 75);
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
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(walkCanvas.clientWidth, walkCanvas.clientHeight);

} //end of initGraphics


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