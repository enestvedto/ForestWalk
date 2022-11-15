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

const pineDimension = {r1: 0.5, r2: 0.5, h: 4}
const pineGeometry = new THREE.CylinderGeometry(pineDimension.r1, pineDimension.r2, pineDimension.h);
const pineMaterial = new THREE.MeshStandardMaterial({
    color: 0x725C42,
});

const pineLeafDimension = {r1: 0.5, r2: 6, h: 6}
const pineLeafGeometry = new THREE.CylinderGeometry(pineLeafDimension.r1, pineLeafDimension.r2, pineLeafDimension.h);
const pineLeafMaterial = new THREE.MeshStandardMaterial({
    color: 0x143306,
});

function generateTrinaryTree(iteration, angle = (Math.PI / 5), axiom = '0') {
    const angleY = (2*Math.PI)/3;
    
    let sequence = generateTrinaryFractal(axiom, iteration);
    console.log(sequence);

    return buildTree(sequence, angle, angleY);
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
                
                if( 0.000 <= r < 0.050 )
                    phrase = 't';
                else if( 0.050 <= r < 0.250)
                    phrase = '1[<-0]^[*<-0]^';
                else if( 0.25 <= r < 0.325)
                    phrase = '1[*<-0]^^[<-0]';
                else if( 0.325 <= r < 0.500)
                    phrase = '1^[<-0]^[*<-0]';
                else if( 0.500 <= r < 0.625)
                    phrase = '1[*<-0]^^';
                else if( 0.625 <= r < 0.750)
                    phrase = '1^[<-0]^';
                else if( 0.750 <= r < 0.825)
                    phrase = '1^^[*<-0]';
                else 
                    phrase = '1[*<-0]^[<-0]^[*<-0]';
                break;
            case '1':
                r = Math.random();

                if ( r < 0.5)
                    phrase = '11';
                else 
                    phrase = '1';

                break;
            case '[':
            case ']':
            case '+':
            case '-':
            case '^':
            case '>':
            case '<':
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

    return buildTree(sequence, angle, Math.PI/2);
}

function generateBarnsleyFractal(sequence, iteration) {
    if (iteration == 0) {
        return sequence;
    }

    let newSequence = '';
    let r = 0;
    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        let phrase = '';
        switch (char) {
            case '0':
                phrase = '1';
                break;
            case '1':
                r = Math.random()
                if (r < 0.500)
                    phrase = '11';
                else 
                    phrase = '1';
                break;
            case 'X': 
                phrase = '1<[^[X]>X]>1[*>0X]<X';
                break;
            case '[':
            case ']':
            case '<':
            case '>':
            case '^':
            case '*':
                phrase = char;
                break;
        }
        newSequence += phrase;
    }

    sequence = newSequence;
    iteration--;

    return generateBarnsleyFractal(sequence, iteration);
}

function generatePineTree(iterations, angle = 5 * (Math.PI / 180), axiom = '0')
{
    let sequence = generatePineFractal(axiom, iterations);
    console.log(sequence);

    return buildTree(sequence, angle, angle, pineDimension, pineLeafDimension, pineGeometry, pineMaterial, pineLeafGeometry, pineLeafMaterial, 1.5, 0.9);
}

function generatePineFractal(sequence, iteration)
{
    if (iteration == 0) {
        return sequence;
    }

    let newSequence = '';
    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        let phrase = '';
        let r = 0;

        switch (char) {
            case '0': //branch with top
                r = Math.random()
                if (r > 0.05)
                    phrase = '10';
                else
                    phrase = '1[t/0]';
                break;
            case '1': //branch no top
                r = Math.random()
                if (r > 0.5)
                    phrase = '1</t1';
                else
                    phrase = '1>1';
                break;
            case '+': //increment angle
            case '-': //decrement angle
            case '>': //turn z axis left angle
            case '<': //turn z axis right angle
            case '^': //turn y axis right angle
            case '/': //decrease leaf size
            case '*': //increase leaf scale
            case 't': //terminator
                phrase = char;
                break;
        }
        newSequence += phrase;
    }

    sequence = newSequence;
    iteration--;

    return generatePineFractal(sequence, iteration);
}

function buildTree(sequence, angleZ, angleY, 
    branchDimensions = branchDimension, leafDimensions = leafDimension, 
    bGeometry = branchGeometry, bMaterial = branchMaterial, 
    lGeometry = leafGeometry, lMaterial = leafMaterial,
    scaleUp = 1.5, scaleDown = 0.4)
{
    let tree = new THREE.Group();
    let curPos = [0, 0, 0];
    let curRot = new THREE.Euler(0, 0, 0);
    let curAngle = angleZ;
    let prevRot = new THREE.Euler(0, 0, 0);
    let stack = [];
    let branchHeight = new THREE.Vector3(0, branchDimensions.h, 0);
    let leafHeight = new THREE.Vector3(0, leafDimensions.h, 0);
    let branchScale = 1;
    let leafScale = 1;


    for (let i = 0; i < sequence.length; i++) {
        let char = sequence.charAt(i);
        switch (char) {
            case '0':
            case '1':
            case 't':

                let tempHeight = branchHeight.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(curRot);

                let nextPos = [tempHeight.x + curPos[0], tempHeight.y + curPos[1], tempHeight.z + curPos[2]];

                tempHeight = branchHeight.clone();
                tempHeight.divideScalar(2);
                tempHeight.applyEuler(prevRot);

                nextPos = [tempHeight.x + nextPos[0], tempHeight.y + nextPos[1], tempHeight.z + nextPos[2]];

                let branch = new THREE.Mesh(bGeometry.clone(), bMaterial.clone());
                branch.position.set(nextPos[0], nextPos[1], nextPos[2]);
                branch.rotation.set(curRot.x, curRot.y, curRot.z);
                branch.scale.set(branchScale, branchScale, branchScale);
                branch.castShadow = true;
                tree.add(branch);

                if(char === '0' || char === 't') //LEAF CODE
                {
                    tempHeight = branchHeight.clone();
                    tempHeight.divideScalar(2);
                    tempHeight.applyEuler(curRot);

                    let leafPos = [nextPos[0] + tempHeight.x, nextPos[1] + tempHeight.y, nextPos[2] + tempHeight.z]

                    tempHeight = leafHeight.clone();
                    tempHeight.divideScalar(2);
                    tempHeight.applyEuler(curRot);

                    leafPos = [leafPos[0] + tempHeight.x, leafPos[1] + tempHeight.y, leafPos[2] + tempHeight.z]

                    let leaf = new THREE.Mesh(lGeometry.clone(), lMaterial.clone());
                    leaf.position.set(leafPos[0],leafPos[1],leafPos[2]);
                    leaf.rotation.set(curRot.x, curRot.y, curRot.z);
                    leaf.scale.set( leafScale, leafScale, leafScale);
                    leaf.castShadow = true;
                    tree.add(leaf);
                } else

                curPos = nextPos;
                prevRot = curRot.clone();
                break;

            case '[':
                stack.push([curPos, curRot.clone(), prevRot.clone(), curAngle, branchHeight.clone(), branchScale, leafScale, leafHeight.clone()]);
                
                branchHeight.multiplyScalar(0.9);
                branchScale = branchScale * 0.9;

                break;

            case ']':

                let data = stack.pop();
                curPos = data[0];

                curRot = data[1];
                prevRot = data[2];

                curAngle = data[3];

                branchHeight = data[4];
                branchScale = data[5];
                leafScale = data[6];
                leafHeight = data[7];

                break;
            case '+':
                curAngle = 1.5 * curAngle;
                break;
            case '-':
                curAngle = 0.5 * curAngle;
                break;
            case '>':
                curRot.z += curAngle;
                break;
            case '<':
                curRot.z -= curAngle;
                break;
            case '^':
                curRot.y += angleY;
                break;
            case '/':
                leafHeight.multiplyScalar(scaleDown);
                leafScale = leafScale * scaleDown;
                break;
            case '*':
                leafHeight.multiplyScalar(scaleUp);
                leafScale = leafScale * scaleUp;
                break;

        }

    }

    return tree;
}

export { generateTrinaryTree }
export { generateBarnsleyTree }
export { generatePineTree }
