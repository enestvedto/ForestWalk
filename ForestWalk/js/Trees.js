import * as THREE from 'three';
import { BufferGeometry, Euler, Group, Line, LineSegments, Vector3 } from 'three';

const branchDimension = {w: 0.5, h:2, d: 0.5}
const branchGeometry = new THREE.BoxGeometry(branchDimension.w, branchDimension.h, branchDimension.d);
const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x725C42,
});

const leafDimension = {w:2, h:2, d:2}
const leafGeometry = new THREE.BoxGeometry(leafDimension.w, leafDimension.h, leafDimension.d);
const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x3A5F0B,
});

/*
 0: draw line segment ending in leaf
 1: draw line segment
 [: push position and angle, turn left by angle
 ]: pop position and angle, turn right by angle
 */
function generateTrinaryTree(iteration, angle = (Math.PI / 4), axiom = '0') {
    const angleY = (2*Math.PI)/3;

    let sequence = generateTrinaryFractal(axiom, iteration);
    console.log(sequence);

    let tree = new THREE.Group();
    let curPos = [0, 0, 0];
    let curRot = new THREE.Euler(0, 0, 0);
    let curAngle = angle;
    let prevRot = new THREE.Euler(0, 0, 0);
    let stack = [];
    let height = new THREE.Vector3(0, branchDimension.h, 0);
    let branchScale = 1;


    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        switch (char) {
            case '0':
            case '1':
            case 't':

                let tempHeight = height.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(curRot);

                let nextPos = [tempHeight.x + curPos[0], tempHeight.y + curPos[1], tempHeight.z + curPos[2]];

                tempHeight = height.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(prevRot);

                nextPos = [tempHeight.x + nextPos[0], tempHeight.y + nextPos[1], tempHeight.z + nextPos[2]];

                let branch = new THREE.Mesh(branchGeometry.clone(), branchMaterial.clone());
                branch.position.set(nextPos[0], nextPos[1], nextPos[2]);
                branch.rotation.set(curRot.x, curRot.y, curRot.z);
                branch.scale.set(branchScale, branchScale, branchScale);
                branch.castShadow = true;
                tree.add(branch);

                if(char === '0' || char === 't') //LEAF CODE
                {
                    tempHeight = height.clone();
                    tempHeight.divideScalar(2);
                    tempHeight.applyEuler(curRot);

                    let leaf = new THREE.Mesh(leafGeometry.clone(), leafMaterial.clone());
                    leaf.position.set(nextPos[0] + tempHeight.x, nextPos[1] + tempHeight.y, nextPos[2] + tempHeight.z);
                    leaf.rotation.set(curRot.x, curRot.y, curRot.z);
                    leaf.castShadow = true;
                    tree.add(leaf);
                }

                curPos = nextPos;
                prevRot = curRot.clone();


                break;

            case '[':
                stack.push([curPos, curRot.clone(), prevRot.clone(), curAngle, height.clone(), branchScale]);
                
                height.multiplyScalar(0.9);
                branchScale = branchScale * 0.9;

                break;

            case ']':

                let data = stack.pop();
                curPos = data[0];

                curRot = data[1];
                prevRot = data[2];

                curAngle = data[3];

                height = data[4];
                branchScale = data[5];

                break;
            case '+':
                curRot.z += curAngle;
                break;

            case '-':
                curRot.z -= curAngle * 0.5;
                break;

            case '*':
                curRot.y += angleY;
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
        let r = 0;

        switch (char) {
            case '0':
                r = Math.random();
                
                if( 0.000 <= r < 0.010 )
                    phrase = t;
                else if( 0.010 <= r < 0.250)
                    phrase = '1[+-0]*[+-0]*';
                else if( 0.25 <= r < 0.325)
                    phrase = '1[+-0]**[+-0]';
                else if( 0.325 <= r < 0.500)
                    phrase = '1*[+-0]*[+-0]';
                else if( 0.500 <= r < 0.625)
                    phrase = '1[+-0]**';
                else if( 0.625 <= r < 0.750)
                    phrase = '1*[+-0]*';
                else if( 0.750 <= r < 0.825)
                    phrase = '1[+-0]**';
                else
                    phrase = '1[+-0]*[+-0]*[+-0]';

                break;
            case '1':
                r = Math.random();
                phrase = '11';
                break;
            case '[':
            case ']':
            case '+':
            case '-':
            case '*':
            case 't':
                phrase = char;
                break;
        }
        newSequence += phrase;
    }

    sequence = newSequence;
    iteration--;
    return generateTrinaryFractal(sequence, iteration);
}

function generateBarnsleyTree(iterations, angle = 25 * (Math.PI / 180), axiom = 'X') {
    let sequence = generateBarnsleyFractal(axiom, iterations);
    console.log(sequence);

    let tree = new THREE.Group();
    let curPos = [0, 0, 0];
    let curRot = new THREE.Euler(0, 0, 0);
    let prevRot = new THREE.Euler(0, 0, 0);
    let stack = [];

    let height = new THREE.Vector3(0, branchDimension.h, 0);

    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        switch (char) {
            case 'F':

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

                break;

            case ']':
                let data = stack.pop();
                curPos = data[0];
                curRot = data[1];
                prevRot = curRot.clone();
                break;

            case '+':
                curRot.z += angle;
                break;
            case '-':
                curRot.z -= angle;
                break;

        }

    }

    return tree;
}

function generateBarnsleyFractal(sequence, iteration) {
    if (iteration == 0) {
        return sequence;
    }

    let newSequence = '';
    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        let phrase = '';
        switch (char) {
            case 'X':
                phrase = 'F+[[X]-X]-F[-FX]+X';
                break;
            case 'F':
                phrase = 'FF';
                break;
            case '[':
            case ']':
            case '+':
            case '-':
                phrase = char;
                break;
        }
        newSequence += phrase;
    }

    sequence = newSequence;
    iteration--;

    return generateBarnsleyFractal(sequence, iteration);
}

export { generateTrinaryTree }
export { generateBarnsleyTree }
