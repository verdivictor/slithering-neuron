
import * as THREE from 'three';

const createHemisphere = () => {
    const radius = 0.85;
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
        color: 0xF95B5F,
        specular: 0x111111,
        shininess: 30,
        side: THREE.DoubleSide,
        wireframe: false
    });

    return new THREE.Mesh(geometry, material);
};

const createFourQuadrantBezierSurface = () => {
    const baseCurvePoints = [];
    const segments = 100;
    const p0 = new THREE.Vector3(-3, 0, 0);
    const p1 = new THREE.Vector3(-1, 0, 1);
    const p2 = new THREE.Vector3(0, 0, 3);
    
    // Generate base curve
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const z = Math.pow(1-t, 2) * p0.z + 2 * (1-t) * t * p1.z + Math.pow(t, 2) * p2.z;
        baseCurvePoints.push(new THREE.Vector3(x, 0, z));
    }

    // Create semicircle points at the top
    const topRadius = 0.5664;
    const topSegments = 50;
    const topHeight = 1;
    
    const group = new THREE.Group();

    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const lineGeometry = new THREE.BufferGeometry();
        const surfaceGeometry = new THREE.BufferGeometry();
        const capGeometry = new THREE.BufferGeometry();
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            opacity: 0.05, 
            transparent: true 
        });
        
        const surfaceMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.1
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
        
        const hemisphere = createHemisphere();

        group.add(new THREE.LineSegments(lineGeometry, lineMaterial));
        group.add(new THREE.Mesh(surfaceGeometry, surfaceMaterial));
        group.add(new THREE.Mesh(capGeometry, surfaceMaterial));
        group.add(hemisphere)

        group.position.set(5, 0, 5);
    }

    return group;
};

const createAxonTerminals = () => {
    const group = new THREE.Group();
    const terminalCount = 5;
    const length = 3;
    const radius = 0.1; // Increased radius for thicker tentacles
    const segments = 20; // More segments for smoother curves

    // Array to store terminal data for animation
    const terminalsData = [];

    for (let i = 0; i < terminalCount; i++) {
        const angle = (i / terminalCount) * Math.PI * 2;
        const spread = 2.7; // How much terminals spread out

        // Create points along the terminal with initial straight shape
        const points = [];
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const x = Math.cos(angle) * spread * t;
            const y = Math.sin(angle) * spread * t;
            const z = -length * t;
            points.push(new THREE.Vector3(x, y, z));
        }

        // Store original points for animation reference
        const originalPoints = points.map(p => p.clone());

        // Create curve from points
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            side: THREE.DoubleSide,
            flatShading: true
        });

        const terminal = new THREE.Mesh(geometry, material);
        group.add(terminal);

        // Add bulb to the end of the tentacle
        const bulbGeometry = new THREE.SphereGeometry(radius * 1.5, 16, 16);
        const bulbMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            flatShading: true
        });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.copy(points[points.length - 1]);
        terminal.add(bulb);

        // Store data for animation
        terminalsData.push({
            terminal,
            bulb,
            originalPoints,
            angle,
            speed: 2 + Math.random() * 1, // Vary speed slightly
            amplitude: 0.5 + Math.random() * 0.3, // Vary amplitude
            frequency: 3 + Math.random() * 2 // Vary frequency
        });
    }

    group.userData = { terminalsData };
    return group;
};

export const createNeuron = () => {
    // Create a group to hold all neuron components
    const neuronGroup = new THREE.Group();
    
    // Create neuron head (four quadrant bezier surface)
    const neuronHead = createFourQuadrantBezierSurface();
    neuronGroup.add(neuronHead);

    // Create snake-like tube
    const tubeLength = 10;
    const segments = 50;
    const tubeRadius = 0.05;
    const radialSegments = 8;
    
    // Initial curve points (straight line)
    const curvePoints = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        curvePoints.push(new THREE.Vector3(neuronHead.position.x, neuronHead.position.y, neuronHead.position.z -t * tubeLength));
    }
    
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeometry = new THREE.TubeGeometry(curve, segments, tubeRadius, radialSegments, false);
    const tubeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00aaff,
        side: THREE.DoubleSide,
        flatShading: true
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    neuronGroup.add(tube);

    // Sheath group
    const sheathGroup = new THREE.Group();
    const sheathCount = 10;
    const spacing = 1.2; // Space between sheaths

    // Common material for all sheaths
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: false,
        transparent: true,
        opacity: 0.8
    });

    // Array to store sheath positions along the tube
    const sheathPositions = [];

    for (let i = 0; i < sheathCount; i++) {
        // Create each sheath with slightly random variations
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        
        // Scale to make elliptical (y and z flattened)
        geometry.scale(0.5, 0.5, 1);
        
        const sheath = new THREE.Mesh(geometry, material);
        
        // Calculate position along the tube curve
        const t = i / sheathCount;
        const pos = curve.getPointAt(t);
        sheath.position.copy(pos);
        
        sheathGroup.add(sheath);
        sheathPositions.push(t); // Store the normalized position (0-1) along the tube
    }
    neuronGroup.add(sheathGroup);

    // Create axon terminals
    const axonTerminals = createAxonTerminals();

    // Position at the end of the tube (last curve point)
    axonTerminals.position.copy(curvePoints[curvePoints.length - 1]);
    neuronGroup.add(axonTerminals);

    // Store original positions for animation
    const originalPoints = curvePoints.map(p => p.clone());
    
    // Target position
    let targetPosition = new THREE.Vector3(0, 0, 0);
    let isMoving = false;
    const moveSpeed = 0.1;

    // Store references to components for animation
    neuronGroup.userData = {
        tube,
        curve,
        curvePoints,
        originalPoints,
        sheathGroup,
        sheathPositions,
        neuronHead,
        axonTerminals,
        targetPosition,
        isMoving,
        moveSpeed
    };

    return neuronGroup;
}