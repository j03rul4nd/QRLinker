import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

// Scene and renderer setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Shader material for radial gradient background
const fragmentShader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
        vec2 center = vec2(0.5);
        float dist = distance(st, center);

        vec3 colorA = vec3(0.04, 0.04, 0.04); // Darker color near edges
        vec3 colorB = vec3(0.12, 0.12, 0.12); // Darker color near center

        // Smooth gradient
        float gradient = smoothstep(0.3, 0.8, dist);
        vec3 color = mix(colorB, colorA, gradient);

        gl_FragColor = vec4(color, 1.0);
    }
`;

const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms: {
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_time: { value: 0.0 }
    }
});

const geometry = new THREE.PlaneGeometry(2, 2);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Animation loop
function animate() {
    material.uniforms.u_time.value += 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Resize event listener
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});