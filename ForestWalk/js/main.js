import * as THREE from 'three';

//Dom elements
let walkCanvas = document.getElementById('forest-walk');


// Declare variables 


/**
 * Startup Function
 */
function main() {
    initGraphics();
    loop();
} //end of main


/**
 * builds the view the user will see
 */
function initGraphics() {
    /*
        //Scene
    
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
    
        //Camera
    
        camera = new THREE.PerspectiveCamera(90, gameCanvas.clientWidth / gameCanvas.clientHeight, 0.1, 1000);
        camera.name = 'camera';
        camera.position.z = 0.5;
        camera.position.y = 0.5;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    
        scene.add(camera);
    
        //Lighting
    
        ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
    
        // Orbit controls
    
        orbitControls = new OrbitControls(camera, document.body);
    
        //Renderer
    
        renderer = new THREE.WebGLRenderer({
            canvas: gameCanvas,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(gameCanvas.clientWidth, gameCanvas.clientHeight);
        */
} //end of initGraphics


/**
 * This is where the game and its events occur
 */
function loop() {
    render();
    orbitControls.update();
    window.requestAnimationFrame(loop);
} //end of loop


/**
 * A basic render method, in case special steps
 * must be taken during a single render.
 */
function render() {
    renderer.render(scene, camera);
} //end of render

//main();