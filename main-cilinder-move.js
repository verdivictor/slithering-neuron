import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Helpers
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

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

// Create snake-like tube
const tubeLength = 20;
const segments = 50;
const tubeRadius = 0.5;
const radialSegments = 8;

// Initial curve points (straight line)
const curvePoints = [];
for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curvePoints.push(new THREE.Vector3(0, 0, -t * tubeLength));
}

const curve = new THREE.CatmullRomCurve3(curvePoints);
const tubeGeometry = new THREE.TubeGeometry(curve, segments, tubeRadius, radialSegments, false);
const tubeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00aaff,
    side: THREE.DoubleSide,
    flatShading: true
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

// Store original positions for animation
const originalPoints = curvePoints.map(p => p.clone());

// Target position
let targetPosition = new THREE.Vector3(0, 0, 0);
let isMoving = false;
const moveSpeed = 0.05;

// Click handler
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
    // Calculate mouse position in normalized device coordinates
    console.log("Client click", event.clientX, event.clientY)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    console.log(mouse.x, mouse.y)
    // Calculate objects intersecting the ray
    //const intersects = raycaster.intersectObjects([gridHelper]);
    //console.log(intersects)
    //if (intersects.length > 0) {
        //const point = intersects[0].point;
        targetPosition.set(10, 0, 10); // Maintain Y=0
        isMoving = true;
        
        // Visual marker for target
        if (!scene.getObjectByName('targetMarker')) {
            const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.name = 'targetMarker';
            scene.add(marker);
        }
        scene.getObjectByName('targetMarker').position.copy(targetPosition);
    //}
}

window.addEventListener('click', onClick, false);

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.02;

    // Move snake toward target if needed
    if (isMoving) {
        const headPosition = curvePoints[0];
        const direction = new THREE.Vector3().subVectors(targetPosition, headPosition);
        
        if (direction.length() > 0.1) {
            direction.normalize().multiplyScalar(moveSpeed);
            for (let i = 0; i <= segments; i++) {
                curvePoints[i].x += direction.x;
                curvePoints[i].z += direction.z;
                originalPoints[i].x += direction.x;
                originalPoints[i].z += direction.z;
            }
        } else {
            isMoving = false;
        }
    }

    // Update curve points with sine wave
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const waveOffset = Math.sin(t * Math.PI * 3 + time * 3) * 2;
        curvePoints[i].x = originalPoints[i].x + waveOffset;
    }

    // Update tube geometry
    tube.geometry.dispose();
    tube.geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(curvePoints),
        segments,
        tubeRadius,
        radialSegments,
        false
    );

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});