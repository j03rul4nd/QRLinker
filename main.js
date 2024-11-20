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
        this.qrImage = null; // Variable para almacenar la imagen del QR
        this.qrTexture = null; // Variable para almacenar la textura de Three.js
        this.init();
        this.listeners();

        // const Engine = new engine();
    }

    async init() {
        // Inicializa el QRCodeStyling con opciones por defecto y en formato PNG
        this.qrcode = new QRCodeStyling({
            width: 300,
            height: 300,
            type: "png", // Cambiado a "png" para que se genere como imagen PNG
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

        // Adjunta el QR al contenedor para la vista previa
        this.qrcode.append(document.getElementById("qrResult"));

        // Usa getRawData para obtener la imagen en formato Blob y espera a que se complete
        this.qrImage = await this.qrcode.getRawData();

        // Convierte el Blob en una textura de Three.js
        const imageUrl = URL.createObjectURL(this.qrImage);
        const textureLoader = new THREE.TextureLoader();
        
        return new Promise((resolve) => {
            textureLoader.load(imageUrl, (texture) => {
                this.qrTexture = texture;
                const Engine = new engine(this.qrTexture);
                window.engine = Engine;
                resolve();
            });
        });
    }

    listeners() {
        const btn = document.getElementById("generateQrCodeBTN");
        btn.addEventListener('click', async () => {
            const url = document.getElementById("inputUrl").value;
            if (url) {
                await this.updateQR(url);
                console.log("QR code updated and texture stored for Three.js with URL:", url);
            }
        });
    }

    async updateQR(newData) {
        // Actualiza el contenido del QR Code
        this.qrcode.update({ data: newData });

        // Usa getRawData para obtener la imagen en formato Blob y espera a que se complete
        this.qrImage = await this.qrcode.getRawData();

        // Convierte el Blob en una textura de Three.js
        const imageUrl = URL.createObjectURL(this.qrImage);
        const textureLoader = new THREE.TextureLoader();
        
        return new Promise((resolve) => {
            textureLoader.load(imageUrl, (texture) => {
                this.qrTexture = texture;
                //const Engine = new engine(this.qrTexture);
                window.engine.updateTexture(this.qrTexture);
                window.engine.setPlane();
                resolve();
            });
        });
    }

    old_init(){
        // Canvas and scene setup
        const container = document.getElementById('qrcode');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 3; // Aleja la cámara para ver mejor el plano

                
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        // Create plane geometry for particles
        const geometry = new THREE.BufferGeometry();
        // Ajusta el número de partículas y la cantidad por lado
        const numParticlesPerRow = 100; // Número de partículas por fila
        const numParticlesPerColumn = 100; // Número de partículas por columna
        const numParticles = numParticlesPerRow * numParticlesPerColumn;
        const positions = new Float32Array(numParticles * 3);

        // Calcula el espaciado entre partículas
        const spacingX = 2 / numParticlesPerRow; // Ajustar para que cubra la malla de -1 a 1 en x
        const spacingY = 2 / numParticlesPerColumn; // Ajustar para que cubra la malla de -1 a 1 en y

        // Genera las posiciones de las partículas en una cuadrícula
        let index = 0;
        for (let i = 0; i < numParticlesPerRow; i++) {
            for (let j = 0; j < numParticlesPerColumn; j++) {
                positions[index * 3] = (i * spacingX) - 1; // x (ajusta para centrar)
                positions[index * 3 + 1] = (j * spacingY) - 1; // y (ajusta para centrar)
                positions[index * 3 + 2] = 0; // z
                index++;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Add orbit controls but lock user input
        const controls = new OrbitControls(camera, renderer.domElement);
        // controls.enableZoom = false;
        // controls.enablePan = false;
        // controls.enableRotate = false;

        // Load texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./preview-image.png');

        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture }
            },
            vertexShader: `
                void main() {
                    gl_PointSize = 5.0; // Aumenta el tamaño de los puntos para ver la textura mejor
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
            uniform sampler2D uTexture;
            void main() {
                vec2 uv = gl_PointCoord;
                vec4 color = texture2D(uTexture, uv);
                // if (color.a < 0.1) discard; // Comentar para depuración
                gl_FragColor = color;
            }
        `,
            transparent: true
        });

        // Create particle mesh
        const particleMesh = new THREE.Points(geometry, material);
        scene.add(particleMesh);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        animate();

        // Resize handling
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

    }
}

class old_engine {
    camera = null;
    scene = null;
    controls = null;
    qrTexture = null;

    constructor(texture){
        this.qrTexture = texture;
        this.init()
    }
    
    init(){
        const container = document.getElementById('qrcode');

        // Crear escena y cámara
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75,  container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 1.5;

        // Añadir lienzo a la escena
        // renderer.setSize(window.innerWidth, window.innerHeight);

        const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        

        const controls = new OrbitControls(camera, renderer.domElement);

        // Cargar textura
        const textureLoader = new THREE.TextureLoader();
        //const texture = textureLoader.load(`https://res.cloudinary.com/dbxohjdng/image/upload/v1712590643/scpeanuobdjpo8fovl2y.png`);
        const texture = this.qrTexture;

        // Definir shaders
        const vertexShader = `
        uniform float uPointSize;
        uniform float uTime; // Uniforme para controlar el tiempo
        varying vec2 vUv;
        uniform float uWaveSpeed;
        uniform float uAmplitude;
        uniform vec2 uWaveCenter; // Añadir la uniforme para el centro de la onda

        void main() {
            vUv = uv;
            vec2 pos = position.xy - uWaveCenter; // Ajustar la posición respecto al centro de la onda
            float distanceFromCenter = length(pos);
            float wave = sin(distanceFromCenter * 10.0 - uTime * uWaveSpeed) * uAmplitude;
            vec3 newPosition = position + vec3(0, 0, wave);
            gl_PointSize = uPointSize;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }


        `;

        const fragmentShader = `
            uniform sampler2D uTexture;
            varying vec2 vUv;

            void main() { 
                vec4 texColor = texture2D(uTexture, vUv);
                vec2 coords = 2.0 * gl_PointCoord - 1.0;
                float radius = dot(coords, coords);
                if (radius > 1.0) {
                    discard;
                }
                gl_FragColor = texColor;
            }
        `;

        // Crear el material usando la textura de MatCap
        const matcapMaterial = new THREE.MeshMatcapMaterial({
            matcap: texture
        });

        // Crear una geometría (esfera, cubo, etc.)
        const geometry = new THREE.PlaneGeometry(5, 5, 100, 100);

        // Crear un mesh con la geometría y el material
        const mesh = new THREE.Mesh(geometry, matcapMaterial);

        // Añadir el mesh a la escena
        scene.add(mesh);

        const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uPointSize: { value: 1.0 }, 
            uTime: { value: 0.0 },
            uWaveSpeed: { value: 0.0 },
            uAmplitude: { value: 0.0 },
            uWaveCenter: { value: new THREE.Vector2(0, 0) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        });

        let globalPointsObject = null;


        function updateGeometry(numberSize) {
        const size = numberSize; // Tamaño deseado para controlar la cantidad de partículas
        const vertices = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const x = (i / size) * 2 - 1;
                const y = (j / size) * 2 - 1;
                vertices.push(x, y, 0);
            }
        }

        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Generar y aplicar coordenadas UV
        const uvs = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const u = i / (size - 1);
                const v = j / (size - 1);
                uvs.push(u, v);
            }
        }
        pointsGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        // Verificar si ya existe un objeto de puntos en la escena
        if (scene.children.some(child => child instanceof THREE.Points)) {
            // Actualizar la geometría del objeto de puntos existente
            const existingPoints = scene.children.find(child => child instanceof THREE.Points);
            existingPoints.geometry.dispose(); // Limpiar la geometría anterior para evitar fugas de memoria
            existingPoints.geometry = pointsGeometry;
            existingPoints.geometry.attributes.position.needsUpdate = true;
            globalPointsObject = existingPoints;
        } else {
            // Crear un nuevo objeto de puntos si no existe ninguno y añadirlo a la escena
            const points = new THREE.Points(pointsGeometry, shaderMaterial);
            scene.add(points);
            globalPointsObject = points; 
        }
        }


        //updateGeometry(731);

        function animate(time) {
            requestAnimationFrame(animate);
            controls.update();
          
          //  shaderMaterial.uniforms.uTime.value += 0.05;
            const position = geometry.attributes.position;
            for (let i = 0; i < position.count; i++) {
                const y = Math.sin(position.getX(i) * 2 + time * 0.001) * 0.5;
                position.setZ(i, y);
            }
            position.needsUpdate = true;
                
            renderer.render(scene, camera);
        }
        
        animate(0);

    }

    createScene(){}
    createQr(){}

    exportQR(){}

    animate(){

    }

    editParams(){}

    resize(){}


}
class engine {
    constructor(texture) {
        this.qrTexture = texture;
        this.container = document.getElementById('qrcode');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.globalPointsObject = null;
        this.shaderMaterial = null;
        this.geometry = null;
        this.isAnimating = true; // Controla si la animación está activa

        this.init();
    }

    init() {
        this.createRenderer();
        this.createScene();
        this.createCamera();
        this.createControls();
        this.createMaterials();
        this.createGeometry();
        this.createMesh();
        this.animate();
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    createScene() {
        this.scene = new THREE.Scene();
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = 1.5;
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    createMaterials() {
        let vertexShader = `
            uniform float uProgress;
            attribute vec3 finalPosition;
            varying vec2 vUv;

            void main() {
                vUv = uv;

                // Interpolación entre la esfera y el plano
                vec3 newPosition = mix(position, finalPosition, uProgress);
                gl_PointSize = uProgress * 5.0 + 1.0; // Tamaño de partículas dinámico
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `

        let fragmentShader = `
            uniform sampler2D uTexture;
            varying vec2 vUv;

            void main() {
                vec4 texColor = texture2D(uTexture, vUv);

                // Apariencia circular para las partículas
                vec2 coords = gl_PointCoord * 2.0 - 1.0;
                float radius = dot(coords, coords);
                if (radius > 1.0) discard;

                gl_FragColor = texColor;
            }
        `

        this.shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: this.qrTexture },
                uProgress: { value: 0.0 }, // Controlar transición
                uPointSize: { value: 2.0 }
            },
            vertexShader:  vertexShader,
            fragmentShader: fragmentShader,
            transparent: true
        });
        
    }

    createGeometry() {
        const sphereGeometry = new THREE.SphereGeometry(1, 100, 100);
        const planeGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);
        //const planeGeometry = new THREE.PlaneGeometry(2, 2, 256, 256);

        const spherePositions = sphereGeometry.attributes.position.array;
        const planePositions = planeGeometry.attributes.position.array;

        const numVertices = spherePositions.length;
        const positions = new Float32Array(numVertices);
        const finalPositions = new Float32Array(numVertices);

        for (let i = 0; i < numVertices; i++) {
            positions[i] = spherePositions[i];
            finalPositions[i] = planePositions[i];
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('finalPosition', new THREE.Float32BufferAttribute(finalPositions, 3));
        //this.geometry.setAttribute('uv', sphereGeometry.attributes.uv);
        this.geometry.setAttribute('uv', planeGeometry.attributes.uv);

    }

    createMesh() {
        const points = new THREE.Points(this.geometry, this.shaderMaterial);
        this.scene.add(points);
        this.globalPointsObject = points;
    }

    old_setPlane() {
        this.isAnimating = false; // Detener animación
        this.shaderMaterial.uniforms.uProgress.value = 1.0; // Plano completa
        this.shaderMaterial.uniforms.uPointSize.value = 3.0; // Plano completa
    }

    setPlane() {
        this.isAnimating = false; // Detener animación
    
        // Remover el objeto de partículas si está presente
        if (this.globalPointsObject) {
            this.scene.remove(this.globalPointsObject);
            this.globalPointsObject = null;
        }
    
        // Crear una nueva geometría de plano y material
        const planeGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: this.qrTexture,
            side: THREE.DoubleSide
        });
    
        // Crear el mesh del plano
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(planeMesh);
    
        // Guardar referencia global para futuras modificaciones
        this.globalPointsObject = planeMesh;
    
        // Actualizar la cámara para mejor vista
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(this.scene.position);
    }
    
    setSphere() {
        this.isAnimating = false; // Detener animación
        this.shaderMaterial.uniforms.uProgress.value = 0.0; // Esfera completo
    }

    startAnimation() {
        this.isAnimating = true; // Reactivar animación
    }

    animate() {
        const animateScene = (time) => {
            requestAnimationFrame(animateScene);

            if (this.isAnimating) {
                const progress = Math.sin(time * 0.0005) * 0.5 + 0.5; // Oscilar entre 0 y 1
                this.shaderMaterial.uniforms.uProgress.value = progress;
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animateScene(0);
    }

    updateTexture(newTexture) {
        // Actualiza la textura global
        this.qrTexture = newTexture;
    
        // Actualiza la textura en el shader material (si existe)
        if (this.shaderMaterial && this.shaderMaterial.uniforms.uTexture) {
            this.shaderMaterial.uniforms.uTexture.value = newTexture;
        }
    
        // Si se está mostrando el plano, actualiza el material del plano
        if (this.globalPointsObject && this.globalPointsObject.isMesh) {
            this.globalPointsObject.material.map = newTexture;
            this.globalPointsObject.material.needsUpdate = true; // Asegúrate de forzar la actualización
        }
    }
    
}


const UiControl = new uiControl();