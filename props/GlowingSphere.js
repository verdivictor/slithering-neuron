import * as THREE from 'three';

export const createInteractivePlanet = (options = {}) => {
    // Default options with new interactive features
    const defaults = {
        radius: 2,
        color: 0x00ffff,
        intensity: 1,
        position: new THREE.Vector3(0, 0, 0),
        noteFrequency: 440, // A4 note by default (440Hz)
        hoverScale: 1.2,    // Scale up on hover
        bobAmount: 0.1,     // Bobbing animation amount
        pulseSpeed: 5,      // Pulse animation speed
        audioContext: null  // Will be initialized on first interaction
    };

    const config = { ...defaults, ...options };

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(config.radius, 32, 32);

    // Create glowing material with emissive properties
    const material = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        shininess: 100
    });

    // Create mesh
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(config.position);

    // Store original values for animation
    planet.userData = {
        originalScale: 1,
        originalY: config.position.y,
        originalZ: config.position.z,
        isHovered: false,
        isBobbing: false,
        bobProgress: 0, // 0-1 value for animation progress
        bobDuration: 1, // 5 second duration
        bobStartTime: 0,
    };

    // Add point light inside
    const light = new THREE.PointLight(config.color, config.intensity, 50);
    planet.add(light);

    // Add halo effect (outer glow)
    const haloGeometry = new THREE.SphereGeometry(config.radius * 1.3, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    planet.add(halo);

    planet.userData.onMouseEnter = () => {
        if (!planet.userData.isBobbing) {
            planet.userData.isBobbing = true;
            planet.userData.isHovered = true;
            planet.userData.bobStartTime = performance.now() / 1000; // Current time in seconds
        }
    };

    planet.userData.onMouseLeave = () => {
        planet.userData.isHovered = false;
    };

    function easeIn(t) {
        return t;  // Quadratic easing - more pronounced acceleration
    }

    planet.userData.update = (currentTime) => {
        if (planet.userData.isBobbing) {
            const elapsed = currentTime - planet.userData.bobStartTime;
            const progress = Math.min(elapsed / planet.userData.bobDuration, 1);

            // Apply ease-in to the entire animation
            const easedProgress = easeIn(progress);

            // Create a sine wave that matches our eased timing
            const wave = Math.sin(easedProgress * Math.PI);

            // Calculate scale (1 → 1.2 → 1)
            const scale = 1 + (0.2 * wave);

            // Calculate vertical position (sync with scale)
            const yPos = planet.userData.originalY + (0.3 * wave);

            // Calculate slight movement on the z-axis
            const zPos = planet.userData.originalZ + (0.01 * wave);

            // Apply transformations
            planet.scale.setScalar(scale);
            planet.position.y = yPos;
            planet.position.z = zPos;

            if (progress >= 1) {
                planet.userData.isBobbing = false;
                // Ensure perfect return to original state
                planet.scale.setScalar(1);
                planet.position.y = planet.userData.originalY;
                planet.position.z = planet.userData.originalZ;
            }
        }
    };

    return planet;
};
