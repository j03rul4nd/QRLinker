import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { EmojiButton } from '@joeattardi/emoji-button';

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
        this.firstrender = true;
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
        let _me =this;
        const btn = document.getElementById("generateQrCodeBTN");
        const input = document.getElementById("inputUrl");

        const btnDowloadModel3d = document.getElementById("downloadQrCodeGLTF");
        const btnDowloadPNG = document.getElementById("downloadQrCodePNG");
        const btnDownloadMP4 = document.getElementById("downloadQrCodeMP4");

        const primaryPalette = document.getElementById("PrimaryPalette");
        const secondaryPalette = document.getElementById("SecondaryPalette");

        // Seleccionamos todos los toggles
        const toggles = document.querySelectorAll('.edit-Toggle');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const icon = toggle.querySelector('.icon-toggle');
                const section = toggle.nextElementSibling;
        
                // Alternar el estado de 'open' y 'close'
                const isOpen = icon.getAttribute('status') === 'open';
                
                icon.setAttribute('status', isOpen ? 'close' : 'open');
                section.setAttribute('status', isOpen ? 'close' : 'open');
            });
        });

        // Selección de los botones y la sección de edición
        const editOptionsSection = document.getElementById("custom-palette");
        const palettebuttons = document.querySelectorAll('.palette-options');

        // Función para manejar el clic en los botones
        palettebuttons.forEach(button => {
            button.addEventListener('click', () => {
                // Limpiar todas las clases 'selected' y ocultar las secciones relacionadas
                palettebuttons.forEach(btn => btn.classList.remove('selected'));
                editOptionsSection.style.display = 'none'; // Ocultar por defecto

                // Marcar el botón actual como seleccionado
                button.classList.add('selected');

                // Mostrar la sección solo si se selecciona "Create Your Palette"
                if (button.id === 'CreateYourPalette') {
                    editOptionsSection.style.display = 'flex';
                }
            });
        });

        // Función para validar si el texto no está vacío
        function isValidInput(value) {
            return value.trim() !== ""; // Verifica que el texto no esté vacío o compuesto solo de espacios
        }

        const editOptions = document.getElementById('editQRoptions');
        this.editQRoptionsDoomIsVisible = false;
        const toggleEditOptions = () => {
            if (editOptions.classList.contains('visible')) {
                // Ocultar la sección
                editOptions.style.opacity = '0';
                this.editQRoptionsDoomIsVisible = false;
                setTimeout(() => {
                    editOptions.classList.remove('visible');
                    editOptions.style.display = 'none';
                }, 500); // Coincide con el tiempo de transición
            } else {
                // Mostrar la sección
                editOptions.style.display = 'block';
                this.editQRoptionsDoomIsVisible = true;
                setTimeout(() => {
                    editOptions.classList.add('visible');
                    editOptions.style.opacity = '1';
                }, 10); // Permite que la transición se active
            }
        };
        const editDownload = document.getElementById('download');
        const toggleDownloadOptions = () => {
            if (editDownload.classList.contains('visible')) {
                // Ocultar la sección
                editDownload.style.opacity = '0';
                setTimeout(() => {
                    editDownload.classList.remove('visible');
                    editDownload.style.display = 'none';
                }, 500); // Coincide con el tiempo de transición
            } else {
                // Mostrar la sección
                editDownload.style.display = 'block';
                setTimeout(() => {
                    editDownload.classList.add('visible');
                    editDownload.style.opacity = '1';
                }, 10); // Permite que la transición se active
            }
        };

        this.lastInputValue = null; // Variable para almacenar el último valor

        btn.addEventListener('click', async () => {
            const inputValue = input.value;

            // Verificar si el valor del input es válido
            if (!isValidInput(inputValue)) {
                console.log("Input inválido. Por favor, introduce algún texto.");
                
                // Añadir clase de shake al input
                input.classList.add('shake');
                
                // Remover la clase después de la animación para poder reutilizarla
                setTimeout(() => {
                    input.classList.remove('shake');
                }, 300); // Duración de la animación (0.3s)

                return; // Detener la ejecución si no es válido
            }

            _me.selectEmojiInQrCurrently = { status:false, type: null};
            // Verificar si el valor es igual al último
            if (inputValue === this.lastInputValue) {
                console.log("El valor es el mismo que el anterior. No se realizará ninguna acción.");
                await this.updateQR(inputValue);
                if(!this.editQRoptionsDoomIsVisible){
                    toggleEditOptions();
                    toggleDownloadOptions();
                    this.firstrender = false;
                }
                return; // Detener la ejecución si el valor no ha cambiado
            }

            // Actualizar el último valor almacenado
            this.lastInputValue = inputValue;

            // Continuar con las acciones si el valor es válido y nuevo
            if(this.firstrender && !this.editQRoptionsDoomIsVisible){
                toggleEditOptions();
                toggleDownloadOptions();
                this.firstrender = false;
            }

            // Si es válido, continuar con la lógica
            await this.updateQR(inputValue);
            console.log("QR code updated and texture stored for Three.js with value:", inputValue);
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
                    // Continuar con las acciones si el valor es válido y nuevo
                    if(!this.firstrender){
                        toggleEditOptions();
                        toggleDownloadOptions();
                        this.firstrender = true;
                    }
                }, 300);
            } else {
                // Si el input está vacío, ejecuta setsphere
                console.log("Input is empty. Resetting sphere.");               
                window.engine.startAnimation();
                if(!this.firstrender){
                    toggleEditOptions();
                    toggleDownloadOptions();
                    this.firstrender = true;
                }
            }
        });

        btnDowloadModel3d.addEventListener('click', async () =>{
            await window.engine.downloadModel('my_QR.glb')
        });

        btnDowloadPNG.addEventListener('click', async () =>{
            await window.engine.downloadModelAsPNG('my_QR.png')
        });

        btnDownloadMP4.addEventListener('click', async () =>{
           // await window.engine.downloadModelAsMP4('my_QR.mp4')
           try {
                // Cambiar texto a "Creating video..."
                btnDownloadMP4.textContent = "Creating video...";
                btnDownloadMP4.disabled = true; // Deshabilitar mientras carga
                
                // Llamar la función de generación de video
                await window.engine.downloadModelAsMP4('my_QR.mp4');
                
                // Cambiar texto a "Successfully created!"
                btnDownloadMP4.textContent = "Successfully created!";
                
                // Esperar unos segundos antes de regresar al estado inicial
                setTimeout(() => {
                    btnDownloadMP4.textContent = "Download as video";
                    btnDownloadMP4.disabled = false; // Habilitar nuevamente
                }, 3000);
            } catch (error) {
                console.error("Error during video creation:", error);
                // En caso de error, mostrar mensaje y regresar al estado inicial
                btnDownloadMP4.textContent = "Error creating video";
                setTimeout(() => {
                    btnDownloadMP4.textContent = "Download as video";
                    btnDownloadMP4.disabled = false;
                }, 3000);
            }
        });
        

        //init custom selection
        this.defaultcustomSelection = { 
            type: "primaryPalette", 
            data: {
                primaryPalette: '#ff00ff', 
                secondary: '#00ffff', 
                background: null 
            } 
        };

        primaryPalette.addEventListener("click", () => {
            // primary palette
            this.defaultcustomSelection = { 
                type: "primaryPalette", 
                data: { 
                    primaryPalette: '#ff00ff', 
                    secondary: '#00ffff', 
                    background: null 
                } 
            };
            window.engine.setPlane();
            if(_me.selectEmojiInQrCurrently.status){
                window.engine.updateTextureWithEmoji(_me.selectEmojiInQrCurrently.type, 50, '#FF5733', 1);
            }
            //window.engine.setPlane('#ff00ff', '#00ffff'); // Rosa neón al centro, azul eléctrico a los bordes
        });
        secondaryPalette.addEventListener("click", () => {
            //secondary palette
            this.defaultcustomSelection = {
                type: "secondaryPalette",
                 data: { 
                    primaryPalette: '#ff4500', 
                    secondary: '#ff0000', 
                    background: null,                    
                } 
            };

            window.engine.setPlane('#ff4500', '#ff0000'); 
            if(_me.selectEmojiInQrCurrently.status){
                window.engine.updateTextureWithEmoji(_me.selectEmojiInQrCurrently.type, 50, '#FF5733', 1);
            }
            // Naranja neón al centro, rojo vibrante a los bordes

        });

        const buttons = document.querySelectorAll('.palette-options');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover la clase 'selected' de todos los botones
                buttons.forEach(btn => btn.classList.remove('selected'));

                // Añadir la clase 'selected' al botón clicado
                button.classList.add('selected');
            });
        });

        this.listenersUiColors();
        this.listenerEmoji();
    }

    listenersUiColors(){
        let _me = this;
         // Función para sincronizar el valor entre el input color y el input text
        function syncColorInputs(colorInputId, textInputId) {
            const colorInput = document.getElementById(colorInputId);
            const textInput = document.getElementById(textInputId);

            // Cuando se cambia el valor en el color picker
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                logColorStates();
            });

            // Cuando se cambia el valor en el input de texto
            textInput.addEventListener('input', () => {
                // Validar que el texto ingresado sea un valor HEX válido
                if (/^#([0-9A-Fa-f]{6})$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                    logColorStates();
                }
            });
        }

        const btnselection = document.getElementById("CreateYourPalette");
        btnselection.addEventListener('click', () => {
            logColorStates();
        });

        // Función para loggear los estados de los colores
        function logColorStates() {
            const color1 = document.getElementById('customPaletteColor1picker').value;
            const color2 = document.getElementById('customPaletteColorpicker2').value;
            const backgroundColor = document.getElementById('backgroundColor').value;

            console.log(`Estado actual:
            Color 1: ${color1}
            Color 2: ${color2}
            Background: ${backgroundColor}`);

            _me.defaultcustomSelection = { type: "CreateYourPalette", data: { primaryPalette: color1, secondary: color2, background: backgroundColor } };
            window.engine.setPlane(color1, color2, backgroundColor); // Fondo transparente con gradiente rojo al azul.
            if(_me.selectEmojiInQrCurrently.status){
                window.engine.updateTextureWithEmoji(_me.selectEmojiInQrCurrently.type, 50, '#FF5733', 1);
            }
        }

        // Inicializar sincronización
        syncColorInputs('customPaletteColor1picker', 'customPaletteColor1');
        syncColorInputs('customPaletteColorpicker2', 'customPaletteColor2');
        syncColorInputs('backgroundColor', 'backgroundColor3');
    }

    listenerEmoji(){
        let _me = this;
        const button = document.getElementById("addEmojiBtn");
        const picker = new EmojiButton();

        picker.on("emoji", emoji => {
            console.log(`Selected Emoji: ${emoji.emoji}`, emoji);
            //window.engine.updateTextureWithEmoji(emoji.emoji, 150, '#FF5733', 0.3);
            let newData = this.lastInputValue;
            console.log(`New data: ${newData}`)
            _me.updateQRwithEmoji(newData, emoji.emoji);            
        });

        button.addEventListener("click", () => {
            picker.togglePicker(button);
        });

    }

    async updateQR(newData) {
        let _me = this;
        // Actualiza el contenido del QR Code
        this.qrcode.update({ data: newData, image: null});

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
                let type = _me.defaultcustomSelection.type
                let palette = _me.defaultcustomSelection.data
                console.log(_me.defaultcustomSelection)
                switch (type) {
                    case "CreateYourPalette":
                        window.engine.setPlane();
                        console.log((`palette primaryPalette ${palette.primaryPalette}`, ` secondary ${palette.secondary}`, ` background ${palette.background}`))
                        window.engine.setPlane(`${palette.primaryPalette}`, `${palette.secondary}`, `${palette.background}`);
                        break;
                    case "primaryPalette":
                        console.log("primary set");
                        window.engine.setPlane();
                        break;
                    case "secondaryPalette":
                        console.log("secondary set");
                        window.engine.setPlane('#ff4500', '#ff0000');
                        //window.engine.setPlane(palette.primaryPalette, palette.secondary);
                        break;  
                    default:
                        console.log("default set");
                        window.engine.setPlane();
                        break;
                }
                resolve();
            });
        });
    }

    async updateQRwithImage(newData, pImage) {
        let _me = this;
        // Actualiza el contenido del QR Code
        this.qrcode.update({ 
            data: newData,  
            image: pImage,  
            // image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Google_%22G%22_Logo.svg/200px-Google_%22G%22_Logo.svg.png",
        });

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
                let type = _me.defaultcustomSelection.type
                let palette = _me.defaultcustomSelection.data
                console.log(_me.defaultcustomSelection)
                switch (type) {
                    case "CreateYourPalette":
                        window.engine.setPlane(palette.primaryPalette, palette.secondary, palette.background);
                        break;
                    case "primaryPalette":
                        console.log("primary set");
                        window.engine.setPlane();
                        break;
                    case "secondaryPalette":
                        console.log("secondary set");
                        window.engine.setPlane('#ff4500', '#ff0000');
                        //window.engine.setPlane(palette.primaryPalette, palette.secondary);
                        break;  
                    default:
                        console.log("default set");
                        window.engine.setPlane();
                        break;
                }

                resolve();
            });
        });
    }

    async updateQRwithEmoji(newData, emoji) {
        let _me = this;
        // Crea un canvas para dibujar el emoji
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 100; // Tamaño del emoji en el lienzo
    
        // Ajusta el tamaño del lienzo
        canvas.width = size;
        canvas.height = size;
    
        // Establece la fuente para el emoji
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    
        // Dibuja el emoji en el centro del canvas
        ctx.fillText(emoji, size / 2, size / 2);
    
        // Convierte el canvas a una URL de datos
        const dataURL = canvas.toDataURL();
    
        // Actualiza el contenido del QR Code con el emoji renderizado
        this.qrcode.update({
            data: newData,
            image: dataURL,
        });
    
        // Usa getRawData para obtener la imagen en formato Blob y espera a que se complete
        this.qrImage = await this.qrcode.getRawData();
    
        // Convierte el Blob en una textura de Three.js
        const imageUrl = URL.createObjectURL(this.qrImage);
        const textureLoader = new THREE.TextureLoader();
    
        return new Promise((resolve) => {
            textureLoader.load(imageUrl, (texture) => {
                this.qrTexture = texture;
                window.engine.updateTexture(this.qrTexture);
                
                //_me.defaultcustomSelection = { type: "CreateYourPalette", data: { primaryPalette: color1, secondary: color2, background: backgroundColor } };
                
                let type = _me.defaultcustomSelection.type
                let palette = _me.defaultcustomSelection.data
                console.log(_me.defaultcustomSelection)
                switch (type) {
                    case "CreateYourPalette":
                        window.engine.setPlane(palette.primaryPalette, palette.secondary, palette.background);
                        break;
                    case "primaryPalette":
                        console.log("primary set");
                        window.engine.setPlane();
                        break;
                    case "secondaryPalette":
                        console.log("secondary set");
                        window.engine.setPlane('#ff4500', '#ff0000');
                        //window.engine.setPlane(palette.primaryPalette, palette.secondary);
                        break;  
                    default:
                        console.log("default set");
                        window.engine.setPlane();
                        break;
                }

                window.engine.updateTextureWithEmoji(emoji, 50, '#FF5733', 1);
                _me.selectEmojiInQrCurrently = { status:true, type: emoji};

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
        this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true });
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
    

    async setPlane(centerColor = '#ff0000', edgeColor = '#0000ff',  backgroundPalette = '#FFFFFF') {
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
    
        // Guardar referencias para uso posterior
        this.gradientCanvas = canvas;
        this.gradientContext = context;
    
        // Aplicar un gradiente radial inicial respetando la textura QR
        this.updateGradientOnQR(centerColor, edgeColor, backgroundPalette);
    
        // Crear una textura inicial desde el canvas
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
            color: 0xffffff, // Blanco puro para no alterar la textura
            transparent: true,
            toneMapped: false // Evita ajustes automáticos de exposición si usas un renderizador físico
        });
    
        planeGeometry.attributes.uv.needsUpdate = true;
    
        // Crear el mesh del plano
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    
        // Asignar un alias único al objeto
        planeMesh.name = 'planeModel';
    
        this.scene.add(planeMesh);
    
        // Guardar referencias globales
        this.globalPointsObject = planeMesh;
        this.globalTexture = updatedTexture;
    
        // Ajustar la cámara para una mejor vista
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(this.scene.position);
    }
    
    
    updateGradientOnQR(centerColor, edgeColor, replacementColor = '#FFFFFF') {
        if (!this.gradientCanvas || !this.gradientContext) {
            console.error('Canvas or context is not initialized.');
            return;
        }
    
        const canvas = this.gradientCanvas;
        const context = this.gradientContext;
    
        // Obtener los datos de los píxeles actuales
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
    
        // Calcular el centro del canvas y la distancia máxima
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
        // Convertir colores hexadecimales a RGB
        const hexToRGB = (hex) => {
            if (hex.startsWith('rgba')) {
                const rgba = hex.match(/rgba?\((\d+), (\d+), (\d+),? ([\d.]+)?\)/);
                return { r: parseInt(rgba[1]), g: parseInt(rgba[2]), b: parseInt(rgba[3]), a: parseFloat(rgba[4] || 1) };
            }
            const bigint = parseInt(hex.slice(1), 16);
            return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 1 };
        };
    
        const centerRGB = hexToRGB(centerColor);
        const edgeRGB = hexToRGB(edgeColor);
        const replacementRGB = hexToRGB(replacementColor);
    
        // Aplicar gradiente radial respetando los píxeles de la textura QR
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
    
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
    
                // Detectar píxeles que NO sean predominantemente azules
                if (!(b > r && b > g)) {
                    if (replacementRGB.a === 0) {
                        // Si el color de reemplazo es transparente, deja el píxel transparente
                        data[index + 3] = 0; // Alpha a 0
                    } else {
                        // Cambiar estos píxeles al color de reemplazo
                        data[index] = replacementRGB.r;     // Rojo
                        data[index + 1] = replacementRGB.g; // Verde
                        data[index + 2] = replacementRGB.b; // Azul
                        data[index + 3] = replacementRGB.a * 255; // Alpha
                    }
                } else {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const t = distance / maxDistance;
    
                    // Interpolación de colores entre centro y borde
                    data[index] = centerRGB.r * (1 - t) + edgeRGB.r * t; // Rojo
                    data[index + 1] = centerRGB.g * (1 - t) + edgeRGB.g * t; // Verde
                    data[index + 2] = centerRGB.b * (1 - t) + edgeRGB.b * t; // Azul
                    data[index + 3] = 255; // Alpha (opaco en la interpolación)
                }
            }
        }
    
        // Actualizar los datos de los píxeles en el canvas
        context.putImageData(imageData, 0, 0);
    
        // Actualizar la textura en Three.js
        if (this.globalTexture) {
            this.globalTexture.needsUpdate = true;
        }
    }
    
    async updateTextureWithEmoji(emoji, fontSize = 100, emojiColor = '#000000', opacity = 0.5) {
        if (!this.gradientCanvas || !this.gradientContext) {
            console.error('Canvas or context is not initialized.');
            return;
        }
    
        const canvas = this.gradientCanvas;
        const context = this.gradientContext;
    
        // Guardar el estado del contexto antes de aplicar cambios
        context.save();
    
        // Calcular el centro del canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
    
        // Configurar el estilo del texto
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = emojiColor;
    
        // Aplicar opacidad al emoji
        context.globalAlpha = opacity;
    
        // Dibujar el emoji en el centro del canvas
        context.fillText(emoji, centerX, centerY);
    
        // Restaurar el estado original del contexto
        context.restore();
    
        // Actualizar la textura de Three.js
        if (this.globalTexture) {
            this.globalTexture.needsUpdate = true;
        }
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
        if (!this.scene || !this.renderer || !this.camera) {
            console.error('La escena, el renderizador o la cámara no están configurados.');
            return;
        }
    
        try {
           
            // Configuración inicial
            const capturer = new CCapture({
                format: 'webm',
                framerate: fps,
                verbose: true,
                name: fileName,
                quality: 100, // Configuración de calidad alta
            });
    
            const totalFrames = Math.ceil((fps * duration) / 1000);
            let currentFrame = 0;
            const wasAnimating = this.isAnimating; // Guardar el estado previo de la animación
            this.isAnimating = false; // Pausar animaciones globales
    
            const originalRotation = this.globalPointsObject
                ? this.globalPointsObject.rotation.y
                : 0;
    
            // Función recursiva para renderizar y capturar cada frame
            const renderFrame = () => {
                try {
                    // Rotación opcional del modelo
                    if (this.globalPointsObject) {
                        this.globalPointsObject.rotation.y =
                            originalRotation + ((Math.PI * 2 * currentFrame) / totalFrames);
                    }
    
                    // Renderizado de la escena
                    this.renderer.render(this.scene, this.camera);
    
                    // Capturar frame
                    capturer.capture(this.renderer.domElement);
    
                    // Continuar o finalizar el proceso
                    currentFrame++;
                    if (currentFrame < totalFrames) {
                        requestAnimationFrame(renderFrame); // Continuar en el siguiente frame
                    } else {
                        // Finalización del proceso de captura
                        capturer.stop();
                        capturer.save();
                        this.isAnimating = wasAnimating; // Restaurar estado original de animación
                        console.log('Captura de video completada.');
                    }
                } catch (renderError) {
                    console.error('Error durante el renderizado de un frame:', renderError);
                    capturer.stop();
                    capturer.save(); // Guardar lo capturado hasta ahora en caso de error
                    this.isAnimating = wasAnimating;
                }
            };
    
            // Iniciar captura y renderizado
            console.log('Iniciando captura de video...');
            capturer.start();
            renderFrame();
        } catch (error) {
            console.error('Error al intentar exportar el modelo como MP4:', error);
        }
    }
          
}


const UiControl = new uiControl();