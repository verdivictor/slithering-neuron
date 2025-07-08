import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const createHemisphere = () => {
    const radius = 1.5;
    const widthSegments = 32;
    const heightSegments = 16;
    const phiStart = 0;
    const phiLength = Math.PI * 2; // Full circle for smooth base
    const thetaStart = 0; // Start from the top (instead of -π/2)
    const thetaLength = Math.PI / 2; // Only go halfway down (creates a flat base)

    const geometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength,
        thetaStart,
        thetaLength
    );

    const material = new THREE.MeshPhongMaterial({
        color: 0x00aaff,
        specular: 0x111111,
        shininess: 30,
        side: THREE.DoubleSide,
        wireframe: false
    });

    return new THREE.Mesh(geometry, material);
};

const hemisphere = createHemisphere();
scene.add(hemisphere);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Helpers (optional)
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const addCrossedLines = () => {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    const xPoints = [
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(5, 0, 0)
    ];
    const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeometry, lineMaterial);
    xLine.material.color.setHex(0xff0000); // Red
    
    const zPoints = [
        new THREE.Vector3(0, 0, -5),
        new THREE.Vector3(0, 0, 5)
    ];
    const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeometry, lineMaterial);
    zLine.material.color.setHex(0xff0000); // Red
    
    const intPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-1.75, 0, 1.75)
    ];
    const intGeometry = new THREE.BufferGeometry().setFromPoints(intPoints);
    const intLine = new THREE.Line(intGeometry, lineMaterial);
    intLine.material.color.setHex(0xff0000); // Red

    scene.add(xLine, zLine, intLine);
};

addCrossedLines();

const createBezierCurve = () => {
    const p0 = new THREE.Vector3(-5, 0, 0);
    const p1 = new THREE.Vector3(-1, 0, 1);
    const p2 = new THREE.Vector3(0, 0, 5);

    const curvePoints = [];
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const z = Math.pow(1-t, 2) * p0.z + 2 * (1-t) * t * p1.z + Math.pow(t, 2) * p2.z;
        //if(z < 1.77) {
            curvePoints.push(new THREE.Vector3(x, 0, z));
        //}
    }

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        linewidth: 2 
    });
    
    return new THREE.Line(curveGeometry, curveMaterial);
};

const bezierCurve = createBezierCurve();
scene.add(bezierCurve);

const createFourQuadrantBezierSurface = () => {
    // Original curve points (from your existing function)
    const baseCurvePoints = [];
    const segments = 100;
    const p0 = new THREE.Vector3(-5, 0, 0);
    const p1 = new THREE.Vector3(-1, 0, 1);
    const p2 = new THREE.Vector3(0, 0, 5);
    
    // Generate the base curve points
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const z = Math.pow(1-t, 2) * p0.z + 2 * (1-t) * t * p1.z + Math.pow(t, 2) * p2.z;
        baseCurvePoints.push(new THREE.Vector3(x, 0, z));
    }

    // Apex point
    const apex = new THREE.Vector3(0, 3, 0);

    // Create a group to hold all surfaces and lines
    const group = new THREE.Group();

    // We'll create 4 surfaces (one for each quadrant)
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        // Create vertical lines geometry
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.15, transparent: true });
        
        // Create surface geometry
        const surfaceGeometry = new THREE.BufferGeometry();
        const surfaceMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.15,
            wireframe: false
        });

        // Prepare data for geometries
        const lineVertices = [];
        const surfaceVertices = [];
        const surfaceIndices = [];
        
        baseCurvePoints.forEach((point, index) => {
            // Rotate the point based on the quadrant
            let rotatedPoint = point.clone();
            if (quadrant === 1) {
                // Rotate 90 degrees around Y axis
                rotatedPoint.set(point.z, point.y, -point.x);
            } else if (quadrant === 2) {
                // Rotate 180 degrees around Y axis
                rotatedPoint.set(-point.x, point.y, -point.z);
            } else if (quadrant === 3) {
                // Rotate 270 degrees around Y axis
                rotatedPoint.set(-point.z, point.y, point.x);
            }
            
            // Vertical line points (base to apex)
            lineVertices.push(rotatedPoint.x, rotatedPoint.y, rotatedPoint.z);
            lineVertices.push(apex.x, apex.y, apex.z);
            
            // Surface vertices (add base point and apex)
            surfaceVertices.push(rotatedPoint.x, rotatedPoint.y, rotatedPoint.z);
            surfaceVertices.push(apex.x, apex.y, apex.z);
            
            // Create triangles between current and next points
            if (index < baseCurvePoints.length - 1) {
                const baseIndex = index * 2;
                surfaceIndices.push(baseIndex, baseIndex + 1, baseIndex + 2); // Triangle 1
                surfaceIndices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2); // Triangle 2
            }
        });

        // Set geometries
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
        surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surfaceVertices, 3));
        surfaceGeometry.setIndex(surfaceIndices);
        surfaceGeometry.computeVertexNormals();

        // Create mesh objects and add to group
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        
        group.add(lines);
        group.add(surface);
    }

    return group;
};

// Add to scene
const bezierSurfaces = createFourQuadrantBezierSurface();
scene.add(bezierSurfaces);

function animate() {
    requestAnimationFrame(animate);
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