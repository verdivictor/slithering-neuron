import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createInteractivePlanet } from './props/GlowingSphere.js';
import { createNeuron } from './props/Neuron.js';

const sceneWidth = 100; // Adjust based on your scene's width
const sceneHeight = 100; // Adjust based on your scene's height
const sceneDepth = 100; // Adjust based on your scene's depth

// Set up an isometric camera (Orthographic)
const aspect = window.innerWidth / window.innerHeight;
const zoom = 0.5; // Start with no zoom

// Calculate frustum dimensions to fit the entire scene
const frustumSize = Math.max(sceneWidth, sceneHeight, sceneDepth) * 0.5; // Add 20% padding
const camera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2, // left
    frustumSize * aspect / 2,  // right
    frustumSize / 2,           // top
    -frustumSize / 2,          // bottom
    0.1,                       // near
    1000                       // far
);

// Position the camera for isometric view (equal angles)
camera.position.set(-45, 45, 45); // Increased position to match larger frustum
camera.lookAt(0, 0, 0); // Look at the center of the scene
camera.zoom = zoom;
camera.updateProjectionMatrix();

// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Helpers
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const segments = 50;
const tubeRadius = 0.05;
const radialSegments = 8;

// Target position
let targetPosition = null
let isMoving = false;
const moveSpeed = 0.1;

// Click handler
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999); 

const planet = createInteractivePlanet({
    radius: 3,
    color: 0xff00ff,
    position: new THREE.Vector3(50, 5, -10),
    noteFrequency: 523.25 // C5 note
});
scene.add(planet);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planet);
    if (intersects.length > 0) {
        planet.userData.onMouseEnter();
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
}

window.addEventListener('mousemove', onMouseMove, false);

const neuron = createNeuron();
neuron.position.set(-10, 0, -3); // Position the entire neuron
neuron.rotation.y = THREE.MathUtils.degToRad(167);
scene.add(neuron);

const playDisc11 = () => {
  const synth = new Tone.MonoSynth({
    oscillator: { type: "pulse" },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.4 }
  }).toDestination();

  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0 }
  }).toDestination();

  const now = Tone.now();

  // Creepy pulses (main melody)
  synth.triggerAttackRelease("C2", "8n", now);
  synth.triggerAttackRelease("G2", "8n", now + 0.5);
  synth.triggerAttackRelease("F2", "8n", now + 1.0);

  // Random noise bursts (scratches)
  noise.triggerAttackRelease("8n", now + 0.25);
  noise.triggerAttackRelease("16n", now + 1.25);
  noise.triggerAttackRelease("16n", now + 1.75);
};

// Click to initialize and play
document.addEventListener("click", () => {
  //Tone.start().then(playDisc11);
});

// // Animation
let time = 0;
let lastTime = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.02;

    const { axonTerminals, neuronHead, tube, sheathGroup, sheathPositions, curvePoints, originalPoints } = neuron.userData
    const terminalsData = axonTerminals.userData.terminalsData
    const globalTime = time * 0.5; // Slower overall movement

    const currentTime = performance.now() / 1000;
        
    lastTime = currentTime;
    
    checkIntersection();
    
    if (planet.userData.isBobbing) {
        planet.userData.update(currentTime);
    }

    terminalsData.forEach((data, index) => {
        const { terminal, bulb, originalPoints, angle, speed, amplitude, frequency } = data;

        // Get the curve points
        const curve = terminal.geometry.parameters.path;
        const points = curve.points;

        // Update each point with wave motion
        for (let i = 0; i < points.length; i++) {
            const t = i / points.length;
            const phase = globalTime * speed;

            // Calculate wave offset - stronger towards the end
            const waveFactor = t * t; // Quadratic increase for more movement at tips

            // Calculate perpendicular direction to the terminal's base angle
            const perpAngle = angle + Math.PI / 2;
            const waveX = Math.cos(perpAngle) * Math.sin(t * frequency + phase) * amplitude * waveFactor;
            const waveY = Math.sin(perpAngle) * Math.sin(t * frequency + phase) * amplitude * waveFactor;

            // Apply wave motion while maintaining original shape
            points[i].x = originalPoints[i].x + waveX;
            points[i].y = originalPoints[i].y + waveY;
            points[i].z = originalPoints[i].z;
        }

        // Update the curve
        curve.updateArcLengths();

        // Need to create new geometry since TubeGeometry doesn't support dynamic updates well
        terminal.geometry.dispose();
        terminal.geometry = new THREE.TubeGeometry(
            curve,
            segments,
            0.1,
            8,
            false
        );

        // Update bulb position
        bulb.position.copy(points[points.length - 1]);
    });

    // Position and rotate the entire axon terminals group
    axonTerminals.position.copy(curvePoints[curvePoints.length - 1]);
    const endDirection = new THREE.Vector3().subVectors(
        curvePoints[curvePoints.length - 1],
        curvePoints[curvePoints.length - 2]
    ).normalize();
    axonTerminals.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), endDirection);

if (isMoving && targetPosition) {
    const headPosition = curvePoints[0];
    
    const direction = new THREE.Vector3().subVectors(targetPosition, headPosition);
    
    if (direction.length() > 0.5) {
        direction.normalize();
        
        const headMovement = direction.clone().multiplyScalar(moveSpeed);
        curvePoints[0].add(headMovement);

        for (let i = 1; i <= segments; i++) {
            const prevPos = curvePoints[i - 1];
            const currentPos = curvePoints[i];
            const desiredDistance = originalPoints[i - 1].distanceTo(originalPoints[i]);
            const dirToPrev = new THREE.Vector3().subVectors(currentPos, prevPos).normalize();
            curvePoints[i].copy(prevPos).add(dirToPrev.multiplyScalar(desiredDistance));
        }

        // Update original points
        for (let i = 0; i <= segments; i++) {
            originalPoints[i].copy(curvePoints[i]);
        }
    } else {
        isMoving = false;
    }
}

    // Update wave motion for the main body
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const phase = -time * 3;
        const waveAmplitude = 0.03;
        const waveFrequency = 6;

        curvePoints[i].x = originalPoints[i].x + Math.sin(t * Math.PI * waveFrequency + phase) * waveAmplitude;
        curvePoints[i].z = originalPoints[i].z + Math.cos(t * Math.PI * waveFrequency + phase) * waveAmplitude;
    }

    // Update tube geometry
    tube.geometry.dispose();
    const updatedCurve = new THREE.CatmullRomCurve3(curvePoints);
    tube.geometry = new THREE.TubeGeometry(
        updatedCurve,
        segments,
        tubeRadius,
        radialSegments,
        false
    );

    if (neuronHead) {
        // Position at head of tube
        neuronHead.position.copy(curvePoints[0]);

        // Calculate direction the head is moving
        const headDirection = new THREE.Vector3().subVectors(
            curvePoints[0],
            curvePoints[1]
        ).normalize();

        // Make the neuron head face the movement direction
        neuronHead.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1), // Default orientation
            headDirection
        );
    }

    // Update sheath positions along the tube
    sheathGroup.children.forEach((sheath, index) => {
        const t = sheathPositions[index];
        const pos = updatedCurve.getPointAt(t);
        sheath.position.copy(pos);

        // Calculate tangent to orient the sheath
        const tangent = updatedCurve.getTangentAt(t).normalize();
        sheath.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    });

    controls.update();
    renderer.render(scene, camera);
}

function handleClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        // Convert world position to neuron's local space
        const worldTarget = intersects[0].point;
        neuron.updateMatrixWorld(); // Ensure neuron's matrix is updated
        targetPosition = neuron.worldToLocal(worldTarget.clone());
        
        isMoving = true;
    }
}


renderer.domElement.addEventListener('click', handleClick);

animate();

let isModalOpen = false;
let originalCameraPosition = camera.position.clone();
let originalCameraZoom = camera.zoom;
const modal = document.getElementById('planetModal');
const closeModal = document.querySelector('.close-modal');

function openPlanetModal() {
    isModalOpen = true;
    
    // Store original camera position
    originalCameraPosition.copy(camera.position);
    originalCameraZoom = camera.zoom;
    
    // Zoom out effect
    const zoomTarget = new THREE.Vector3(
        camera.position.x * 1.5,
        camera.position.y * 1.5,
        camera.position.z * 1.5
    );
    
    // Animate camera
    const zoomDuration = 1.0;
    const startTime = Date.now();
    
    function zoomAnimation() {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / zoomDuration, 1);
        
        // Ease out interpolation
        const t = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(originalCameraPosition, zoomTarget, t);
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
            requestAnimationFrame(zoomAnimation);
        }
    }
    
    zoomAnimation();
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePlanetModal() {
    isModalOpen = false;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Animate camera back to original position
    const returnDuration = 1.0;
    const startTime = Date.now();
    const startPosition = camera.position.clone();
    
    function returnAnimation() {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / returnDuration, 1);
        
        // Ease out interpolation
        const t = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPosition, originalCameraPosition, t);
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
            requestAnimationFrame(returnAnimation);
        }
    }
    
    returnAnimation();
}

closeModal.addEventListener('click', closePlanetModal);

// Close modal when clicking outside content
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closePlanetModal();
    }
});

function onPlanetClick(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Check for planet intersection
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planet);
    
    if (intersects.length > 0 && !isModalOpen) {
        openPlanetModal();
    }
}

// Uncomment this line to enable click handling
window.addEventListener('click', onPlanetClick, false);

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});