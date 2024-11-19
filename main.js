import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

// Scene and renderer setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setSize(window.innerWidth, document.body.scrollHeight);
document.body.appendChild(renderer.domElement);

// Estilizar el canvas
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1'; // Se coloca al fondo de la pila de renderizado
renderer.domElement.style.pointerEvents = 'none'; // Para que no interfiera con los eventos del resto de la página


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

 material.uniforms.u_resolution.value.set(window.innerWidth, document.body.scrollHeight);

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
    // renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, document.body.scrollHeight);
    
    // material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    material.uniforms.u_resolution.value.set(window.innerWidth, document.body.scrollHeight);
});


class uiControl {
    constructor() {
        this.init();
        this.listeners();
    }

    init() {
        // Inicializa el QRCodeStyling con opciones por defecto
        this.qrcode = new QRCodeStyling({
            width: 300,
            height: 300,
            type: "svg",
            data: "https://joelbenitez.onrender.com/",
            dotsOptions: {
                color: "#4267b2",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#ffffff"
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 20
            }
        });

        // Adjunta el QR al contenedor
        this.qrcode.append(document.getElementById("qrResult"));
    }

    listeners() {

        const btn = document.getElementById("generateQrCodeBTN");
        btn.addEventListener('click', () => {
            const url = document.getElementById("inputUrl").value;
            if (url) {
                this.updateQR(url);
                console.log("QR code updated with URL:", url);
            }
        });

    }

    updateQR(newData) {
        // Actualiza el contenido del QR Code
        this.qrcode.update({
            data: newData
        });
    }
}
class engine {
    camera = null;
    scene = null;
    controls = null;


    constructor(){

    }
    init(){

    }

    createScene(){}
    createQr(){}

    exportQR(){}

    animate(){

    }

    editParams(){}

    resize(){}


}

const UiControl = new uiControl();