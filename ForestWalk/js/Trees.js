import * as THREE from 'three';
import { BufferGeometry, Euler, Group, Line, LineSegments, Vector3 } from 'three';

const angleY = (3 * Math.PI) / 2;
const geometry = new THREE.BoxGeometry(1,4,1);
const material = new THREE.MeshStandardMaterial({
	color: 0x002211,
});
const branchMesh = new THREE.Mesh(geometry, material);
branchMesh.castShadow = true;

/*
 0: draw line segment ending in leaf
 1: draw line segment
 [: push position and angle, turn left by angle
 ]: pop position and angle, turn right by angle
 */
function generateTrinaryTree(iteration, angleZ = (Math.PI / 4), axiom = '0') {
    let sequence = generateTrinaryFractal(axiom, iteration);
    console.log(sequence);

    let tree = new THREE.Group();
    let curPos = [0,0,0];
    let curRot = new THREE.Euler(0,0,0);
    let prevRot = new THREE.Euler(0,0,0);
    let stack = [];
    
    let width = new THREE.Vector3(1,0,0);
    let height = new THREE.Vector3(0,4,0);
    let depth = new THREE.Vector3(0,0,1);

    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        switch (char) {
            case '0':
            case '1':
                
                let tempHeight = height.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(curRot);

                let nextPos = [tempHeight.x + curPos[0], tempHeight.y + curPos[1], tempHeight.z + curPos[2]]; 
                
                tempHeight = height.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(prevRot);

                nextPos = [tempHeight.x + nextPos[0], tempHeight.y + nextPos[1], tempHeight.z + nextPos[2]]; 

                let branch = branchMesh.clone();
                branch.position.set(nextPos[0], nextPos[1], nextPos[2]);
                branch.rotation.set(curRot.x, curRot.y, curRot.z);
                tree.add(branch);

                curPos = nextPos;
                prevRot = curRot.clone();
                break;

            case '[':
                stack.push([curPos, curRot.clone()]);
                curRot.z += angleZ;
                break;

            case ']':
                let data = stack.pop();
                curPos = data[0];
                curRot = data[1];
                prevRot = curRot.clone();
                curRot.z -= angleZ;
                break;
        }

    }

    return tree;
}

function generateTrinaryFractal(sequence, iteration) {
    if (iteration == 0) {
        return sequence;
    }

    let newSequence = '';

    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        let phrase = '';
        switch (char) {
            case '0':
                phrase = '1[0]0';
                break;
            case '1':
                phrase = '11';
                break;
            case '[':
                phrase = '[';
                break;
            case ']':
                phrase = ']';
                break;
        }
        newSequence += phrase;
    }

    sequence = newSequence;
    iteration--;
    return generateTrinaryFractal(sequence, iteration);
}

export { generateTrinaryTree }
