import * as THREE from 'three';
import { BufferGeometry, Euler, Line, LineSegments, Vector3 } from 'three';

const material = new THREE.LineBasicMaterial({
	color: 0x000000,
});


/*
 0: draw line segment ending in leaf
 1: draw line segment
 [: push position and angle, turn left by angle
 ]: pop position and angle, turn right by angle
 */
function generateTrinaryTree(iteration, angle = Math.PI / 4, axiom = '0') {
    let sequence = generateTrinaryFractal(axiom, iteration);
    console.log(sequence);

    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    let curPos = [0,0,0];
    let curRot = new THREE.Euler(0,0,0);
    let stack = [];
    
    let width = new THREE.Vector3(1,0,0);
    let height = new THREE.Vector3(0,4,0);
    let depth = new THREE.Vector3(0,0,1);

    let indicies = [0];
    let idxTrail = []; //allows for moving cleanly beween lines
    let curIdx = 0;
    let vertexCount = 0;

    vertices.push(curPos[0], curPos[1], curPos[2]);

    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        switch (char) {
            case '0':
            case '1':
                
                let newHeight = height.clone();
                newHeight.applyEuler(curRot);

                let nextPos = [newHeight.x + curPos[0], newHeight.y + curPos[1], newHeight.z + curPos[2]];
                vertices.push(nextPos[0], nextPos[1], nextPos[2]);
                vertexCount++;

                curIdx = vertexCount;
                indicies.push(curIdx);

                curPos = nextPos;

                break;

            case '[':
                stack.push([curPos, curRot.clone(), curIdx]);
                curRot.z += angle;
                break;

            case ']':
                let data = stack.pop();
                curPos = data[0];
                curRot = data[1];
                indicies.push(data[2]);
                curRot.z -= angle;
                break;
        }

    }

    console.log(indicies);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex( indicies );

    return new Line(geometry, material);
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
