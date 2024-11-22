import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

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
        this.debounceTimer = null;
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
        const input = document.getElementById("inputUrl");

        const btnDowloadModel3d = document.getElementById("downloadQrCodeGLTF");
        const btnDowloadPNG = document.getElementById("downloadQrCodePNG");
        const btnDowloadMP4 = document.getElementById("downloadQrCodeMP4");


        btn.addEventListener('click', async () => {
            const url = input.value;
            if (url) {
                await this.updateQR(url);
                console.log("QR code updated and texture stored for Three.js with URL:", url);
            }
        });


        input.addEventListener('input', () => {
            const value = input.value;

            // Cancela cualquier temporizador de debounce anterior
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            if (value) {
                // Debounce: espera 300ms después de que el usuario deje de escribir
                this.debounceTimer = setTimeout(() => {
                    console.log("Starting animation due to user input.");
                    //window.engine.startAnimation();
                    window.engine.setSphere();
                }, 300);
            } else {
                // Si el input está vacío, ejecuta setsphere
                console.log("Input is empty. Resetting sphere.");               
                window.engine.startAnimation();
            }
        });


        btnDowloadModel3d.addEventListener('click', async () =>{
            await window.engine.downloadModel('my_QR.glb')
        });

        btnDowloadPNG.addEventListener('click', async () =>{
            await window.engine.downloadModelAsPNG('my_QR.png')
        });

        btnDowloadMP4.addEventListener('click', async () =>{
            await window.engine.downloadModelAsMP4('my_QR.mp4')
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
    
    
    async setPlane() {
        this.startAnimatonSphere = false;
        this.isAnimating = false; // Detener animación
    
        // Remover el objeto de partículas si está presente
        if (this.globalPointsObject) {
            this.scene.remove(this.globalPointsObject);
            this.globalPointsObject = null;
        }
    
        // Crear un canvas para manipular los píxeles de la textura
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
    
        const qrImage = this.qrTexture.image; // Asume que `this.qrTexture.image` contiene la imagen cargada
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
    
        // Dibujar la textura en el canvas
        context.drawImage(qrImage, 0, 0);
    
        // Obtener los datos de los píxeles
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
    
        // Calcular el centro del canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
        // Aplicar gradiente radial solo a los píxeles azules
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
    
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
    
                // Detectar píxeles predominantemente azules
                if (b > r && b > g) {
                    // Calcular distancia desde el centro
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
    
                    // Normalizar la distancia
                    const t = distance / maxDistance;
    
                    // Interpolar entre rojo y azul
                    const newR = 255 * (1 - t); // Más rojo cerca del centro
                    const newB = 255 * t; // Más azul hacia los bordes
    
                    // Aplicar el gradiente al píxel azul
                    data[index] = newR;     // Rojo
                    data[index + 1] = 0;    // Verde
                    data[index + 2] = newB; // Azul
                    // Mantener el canal alfa original
                }
            }
        }
    
        // Actualizar los datos de la textura
        context.putImageData(imageData, 0, 0);
    
        // Crear una nueva textura desde el canvas
        const updatedTexture = new THREE.CanvasTexture(canvas);
        updatedTexture.wrapS = THREE.ClampToEdgeWrapping;
        updatedTexture.wrapT = THREE.ClampToEdgeWrapping;
        updatedTexture.minFilter = THREE.LinearFilter;
        updatedTexture.magFilter = THREE.LinearFilter;
        updatedTexture.encoding = THREE.sRGBEncoding;
    
        // Crear una nueva geometría de plano y material
        const planeGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: updatedTexture,
            side: THREE.DoubleSide,
            color: 0xffffff, // Asegúrate de que sea blanco puro para no alterar la textura
            toneMapped: false // Evita ajustes automáticos de exposición si usas un renderizador físico
        });
    
        planeGeometry.attributes.uv.needsUpdate = true;
    
        // Crear el mesh del plano
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    
        // Asignar un alias único al objeto
        planeMesh.name = 'planeModel'; // Este es el alias único
    
        this.scene.add(planeMesh);
    
        // Guardar referencia global para futuras modificaciones
        this.globalPointsObject = planeMesh;
    
        // Actualizar la cámara para mejor vista
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(this.scene.position);
    }
    
    
    
    
    setSphere() {
        // Si hay un objeto global presente (sea el plano o las partículas), eliminarlo
        if (this.globalPointsObject) {
            this.scene.remove(this.globalPointsObject);
            this.globalPointsObject = null;
        }
        // Verificar si el objeto global está ausente o no es un `Points`
        if (!this.globalPointsObject || !this.globalPointsObject.isPoints) {
            // Crear el objeto de partículas si no existe
            this.createGeometry();
            this.createMesh();
        }
        this.isAnimating = false; // Detener animación
        this.shaderMaterial.uniforms.uProgress.value = 0.0; // Esfera completo

        // Actualizar la cámara para mejor vista
        this.startAnimatonSphere = true;

    }

    startAnimation() {
        this.startAnimatonSphere = false;
        // Si hay un objeto global presente (sea el plano o las partículas), eliminarlo
        if (this.globalPointsObject) {
            this.scene.remove(this.globalPointsObject);
            this.globalPointsObject = null;
        }
        // Verificar si el objeto global está ausente o no es un `Points`
        if (!this.globalPointsObject || !this.globalPointsObject.isPoints) {
            // Crear el objeto de partículas si no existe
            this.createGeometry();
            this.createMesh();
        }
        this.isAnimating = true; // Reactivar animación
    }

    setPlaneWithAnimation() {
        this.startAnimatonSphere = false;
        // Reiniciar la animación para transición suave
        this.isAnimating = false;
    
        // Verificar si el objeto global está presente
        if (!this.globalPointsObject || !this.globalPointsObject.isPoints) {
            this.createGeometry();
            this.createMesh();
        }
    
        // Iniciar la animación de transición
        let startTime = null;
        const duration = 2000; // Duración de la animación en ms (2 segundos)
        
        const animateTransition = (time) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
    
            // Calcular progreso como una curva suave (ease in-out)
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = -0.5 * (Math.cos(Math.PI * progress) - 1);
    
            // Actualizar el valor uniforme en el shader
            this.shaderMaterial.uniforms.uProgress.value = easedProgress;
    
            // Finalizar la animación cuando termine la duración
            if (progress < 1) {
                requestAnimationFrame(animateTransition);
            } else {
                this.isAnimating = false;
            }
        };
    
        requestAnimationFrame(animateTransition);
    }
    
    animate() {
        const animateScene = (time) => {
            requestAnimationFrame(animateScene);

            if (this.isAnimating) {
                const progress = Math.sin(time * 0.0005) * 0.5 + 0.5; // Oscilar entre 0 y 1
                this.shaderMaterial.uniforms.uProgress.value = progress;
            }
            if(this.startAnimatonSphere){
                this.globalPointsObject.rotation.x += 0.01; // Rotar en el eje X
                this.globalPointsObject.rotation.y += 0.01; // Rotar en el eje Y
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

    async downloadModel(fileName = 'model.glb') {
        try {
            // Buscar el objeto por su nombre en la escena
            const objectToExport = this.scene.getObjectByName('planeModel');
    
            if (!objectToExport) {
                await this.setPlane();
                await this.downloadModel();
                //throw new Error('No se encontró el objeto con el alias "planeModel" en la escena.');
            }
    
            const exporter = new GLTFExporter();
    
            // // Crear un objeto de prueba (testBox)
            // const testMesh = new THREE.Mesh(
            //     new THREE.BoxGeometry(1, 1, 1),
            //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
            // );
            // testMesh.name = 'testBox'; // Alias único
            // this.scene.add(testMesh);
    
            // Intentar exportar el objeto específico
            exporter.parse(
                objectToExport, // Exportar solo el objeto
                (result) => {
                    try {
                        // Manejar el resultado dependiendo de su tipo
                        if (result instanceof ArrayBuffer) {
                            // Crear un blob para la descarga (binario .glb)
                            const blob = new Blob([result], { type: 'application/octet-stream' });
    
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = fileName;
                            link.click();
                        } else if (typeof result === 'object') {
                            // Manejar exportación JSON (glTF)
                            const json = JSON.stringify(result);
                            const blob = new Blob([json], { type: 'application/json' });
    
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = fileName.replace('.glb', '.gltf');
                            link.click();
                        } else {
                            throw new Error('Tipo de resultado no manejado.');
                        }
                    } catch (innerError) {
                        console.error('Error durante la generación del archivo para la descarga:', innerError);
                    }
                },
                {
                    binary: true // Exportar en formato binario (.glb)
                }
            );
        } catch (error) {
            console.error('Error al intentar exportar el modelo:', error);
            console.error(`Error: ${error.message}. Revisa la consola para más detalles.`);
        }
    }
    
    downloadModelAsPNG(fileName = 'model.png') {
        try {
            // Verificar que la escena y el renderizador estén inicializados
            if (!this.scene || !this.renderer || !this.camera) {
                throw new Error('Escena, renderizador o cámara no están configurados.');
            }
    
            // Ajustar el tamaño del renderizador temporalmente si es necesario
            const originalSize = { width: this.renderer.domElement.width, height: this.renderer.domElement.height };
            this.renderer.setSize(1920, 1080); // Resolución para la captura
    
            // Renderizar la escena
            this.renderer.render(this.scene, this.camera);
    
            // Convertir el contenido del canvas a una URL en formato PNG
            const imageURL = this.renderer.domElement.toDataURL('image/png');
    
            // Restaurar el tamaño original del renderizador
            this.renderer.setSize(originalSize.width, originalSize.height);
    
            // Crear un enlace de descarga
            const link = document.createElement('a');
            link.href = imageURL;
            link.download = fileName;
    
            // Activar la descarga
            link.click();
    
            console.log('Modelo exportado como PNG exitosamente.');
        } catch (error) {
            console.error('Error al intentar exportar el modelo como PNG:', error);
            console.error(`Error: ${error.message}. Revisa la consola para más detalles.`);
        }
    }
    
    downloadModelAsMP4(fileName = 'model.mp4', duration = 5000, fps = 30) {
        try {
            if (!this.scene || !this.renderer || !this.camera) {
                throw new Error('Escena, renderizador o cámara no están configurados.');
            }
    
            const capturer = new CCapture({
                format: 'webm',
                framerate: fps,
                verbose: true,
            });
    
            const totalFrames = (fps * duration) / 1000;
            let currentFrame = 0;
            const originalAnimationState = this.isAnimating;
            this.isAnimating = false;
    
            const renderFrame = () => {
                try {
                    if (this.globalPointsObject) {
                        this.globalPointsObject.rotation.y += (Math.PI * 2) / totalFrames;
                    }
    
                    this.renderer.render(this.scene, this.camera);
                    capturer.capture(this.renderer.domElement);
    
                    currentFrame++;
                    if (currentFrame < totalFrames) {
                        requestAnimationFrame(() => renderFrame()); // Asegurar contexto
                    } else {
                        capturer.stop();
                        capturer.save();
                        this.isAnimating = originalAnimationState;
                        console.log('Captura de video completada.');
                    }
                } catch (renderError) {
                    console.error('Error durante el renderizado:', renderError);
                }
            };
    
            capturer.start();
            renderFrame();
        } catch (error) {
            console.error('Error al intentar exportar el modelo como MP4:', error);
            console.error(`Error: ${error.message}. Revisa la consola para más detalles.`);
        }
    }       
}


const UiControl = new uiControl();