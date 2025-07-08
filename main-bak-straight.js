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
    const baseCurvePoints = [];
    const segments = 100;
    const p0 = new THREE.Vector3(-5, 0, 0);
    const p1 = new THREE.Vector3(-1, 0, 1);
    const p2 = new THREE.Vector3(0, 0, 5);
    
    // Generate base curve
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const z = Math.pow(1-t, 2) * p0.z + 2 * (1-t) * t * p1.z + Math.pow(t, 2) * p2.z;
        baseCurvePoints.push(new THREE.Vector3(x, 0, z));
    }

    // Create semicircle points at the top
    const topRadius = 1.0;
    const topSegments = 50;
    const topHeight = 2;
    
    const group = new THREE.Group();

    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const lineGeometry = new THREE.BufferGeometry();
        const surfaceGeometry = new THREE.BufferGeometry();
        const capGeometry = new THREE.BufferGeometry();
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, 
            opacity: 0.15, 
            transparent: true 
        });
        
        const surfaceMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.15
        });

        const lineVertices = [];
        const surfaceVertices = [];
        const surfaceIndices = [];
        
        // Rotated points for this quadrant
        const rotatedBasePoints = baseCurvePoints.map(point => {
            const p = point.clone();
            if (quadrant === 1) p.set(point.z, point.y, -point.x);
            else if (quadrant === 2) p.set(-point.x, point.y, -point.z);
            else if (quadrant === 3) p.set(-point.z, point.y, point.x);
            return p;
        });

        // Create semicircle points for this quadrant
        const rotatedSemicirclePoints = [];
        for (let i = 0; i <= topSegments; i++) {
            const angle = (i / topSegments) * Math.PI; // Half circle
            const x = Math.cos(angle) * topRadius;
            const z = Math.sin(angle) * topRadius;
            const point = new THREE.Vector3(x, topHeight, z);
            if (quadrant === 1) point.set(z, topHeight, -x);
            else if (quadrant === 2) point.set(-x, topHeight, -z);
            else if (quadrant === 3) point.set(-z, topHeight, x);
            rotatedSemicirclePoints.push(point);
        }

        // Connect base points to semicircle points
        rotatedBasePoints.forEach((point, index) => {
            // Find closest semicircle point
            const closestTopPoint = rotatedSemicirclePoints.reduce((closest, current) => {
                const currentDist = current.distanceTo(point);
                return currentDist < closest.dist ? 
                    { point: current, dist: currentDist } : closest;
            }, { point: rotatedSemicirclePoints[0], dist: Infinity }).point;
            
            // Vertical lines
            lineVertices.push(point.x, point.y, point.z);
            lineVertices.push(closestTopPoint.x, closestTopPoint.y, closestTopPoint.z);
            
            // Surface vertices
            surfaceVertices.push(point.x, point.y, point.z);
            surfaceVertices.push(closestTopPoint.x, closestTopPoint.y, closestTopPoint.z);
            
            // Create triangles for walls
            if (index < rotatedBasePoints.length - 1) {
                const baseIndex = index * 2;
                surfaceIndices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                surfaceIndices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
            }
        });

        // Create roof cap (semicircle)
        const capVertices = [];
        const capIndices = [];
        
        // Add center point first
        capVertices.push(0, topHeight, 0);
        
        // Add semicircle points
        rotatedSemicirclePoints.forEach(point => {
            capVertices.push(point.x, point.y, point.z);
        });
        
        // Create fan triangles from center to semicircle
        for (let i = 1; i < capVertices.length/3 - 1; i++) {
            capIndices.push(0, i, i + 1);
        }

        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
        surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surfaceVertices, 3));
        surfaceGeometry.setIndex(surfaceIndices);
        surfaceGeometry.computeVertexNormals();
        
        capGeometry.setAttribute('position', new THREE.Float32BufferAttribute(capVertices, 3));
        capGeometry.setIndex(capIndices);
        capGeometry.computeVertexNormals();
        
        group.add(new THREE.LineSegments(lineGeometry, lineMaterial));
        group.add(new THREE.Mesh(surfaceGeometry, surfaceMaterial));
        group.add(new THREE.Mesh(capGeometry, surfaceMaterial));
    }

    return group;
};

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