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

const createMyelinSheaths = () => {
    const sheathGroup = new THREE.Group();
    const sheathCount = 6;
    const spacing = 1.2; // Space between sheaths
    const startX = 10; // Starting x position
    
    // Common material for all sheaths
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: false,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < sheathCount; i++) {
        // Create each sheath with slightly random variations
        const geometry = new THREE.SphereGeometry(0.8, 32, 32);
        
        // Scale to make elliptical (y and z flattened)
        geometry.scale(1.0, 0.5 + Math.random()*0.1, 0.5 + Math.random()*0.1);
        
        // Rotate slightly for natural variation
        const sheath = new THREE.Mesh(geometry, material);
        
        // Position each sheath slightly behind the previous one
        sheath.position.set(
            startX - (i * spacing),
            0, // Small vertical variation
            0 // Small depth variation
        );
        
        sheathGroup.add(sheath);
    }
    
    return sheathGroup;
};

// Add to scene
const myelinSheaths = createMyelinSheaths();
scene.add(myelinSheaths);
const createAxonTerminals = () => {
    const terminalsGroup = new THREE.Group();
    const terminalCount = 4;
    
    for (let i = 0; i < terminalCount; i++) {
        // Randomize starting X position (staggered)
        const startX = 10 + (Math.random() - 0.5) * 2; // Slight X variation
        
        // Randomize length (longer terminals)
        const length = 4 + Math.random() * 2; 
        
        // More spread in Y and Z directions
        const endY = (Math.random() - 0.5) * 6; // Wider Y spread
        const endZ = (Math.random() - 0.5) * 3; // Some Z depth
        
        const curve = new THREE.LineCurve3(
            new THREE.Vector3(startX, 0, 0), // Start point (slightly randomized X)
            new THREE.Vector3(
                startX + length, // Extend forward
                endY, // Wider Y variation
                endZ  // Some Z variation
            )
        );
        
        // Thicker tube for visibility
        const lineGeometry = new THREE.TubeGeometry(
            curve,
            20, // More segments for smoother curve
            0.15, // Slightly thicker
            8,
            false
        );
        
        const line = new THREE.Mesh(
            lineGeometry,
            new THREE.MeshBasicMaterial({ 
                color: 0x00aaff,
                transparent: true,
                opacity: 0.9
            })
        );
        
        // Synaptic bulb (slightly larger and more varied)
        const bulbGeometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.2, 5, 5);
        const bulb = new THREE.Mesh(
            bulbGeometry,
            new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8
            })
        );
        bulb.position.copy(curve.getPointAt(1)); // Place at the end
        
        terminalsGroup.add(line);
        terminalsGroup.add(bulb);
    }
    
    return terminalsGroup;
};
/*const createAxonTerminals = () => {
    const terminalsGroup = new THREE.Group();
    const terminalCount = 4;
    const length = 5;
    const baseRadius = 0.3;
    
    for (let i = 0; i < terminalCount; i++) {
        const points = [];
        const segments = 20;
        const wiggleFactor = 1 + Math.random() * 2; // Random waviness
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const x = t * length + 10.0;
            const y = Math.sin(t * Math.PI * wiggleFactor);
            const z = Math.cos(t * Math.PI * wiggleFactor * 0.7) * 0.5;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            segments,
            baseRadius * (0.8 + Math.random() * 0.4),
            5,
            false
        );
        
        const terminal = new THREE.Mesh(
            tubeGeometry,
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        
        terminalsGroup.add(terminal);
    }
    
    return terminalsGroup;
};*/
const axonTerminals = createAxonTerminals();
scene.add(axonTerminals);

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