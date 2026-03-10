import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- INITIALISATION ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); 

const viewport = document.getElementById('viewport');
const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

// --- OUTILS DE SÉLECTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Le cadre bleu de sélection (SelectionBox)
const selectionHelper = new THREE.BoxHelper(null, 0x00a2ff);
scene.add(selectionHelper);
selectionHelper.visible = false;

// --- LUMIÈRES ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- GRILLE ET BASEPLATE ---
const grid = new THREE.GridHelper(100, 100, 0x555555, 0x888888);
scene.add(grid);

const baseGeo = new THREE.BoxGeometry(100, 1, 100);
const baseMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
const baseplate = new THREE.Mesh(baseGeo, baseMat);
baseplate.position.y = -0.5;
baseplate.name = "Baseplate"; // Important pour ne pas sélectionner le sol par erreur
scene.add(baseplate);

// --- CONTRÔLES ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN };

// --- FONCTIONS ---

// Sélection au clic
function onPointerDown(event) {
    // Calcul de la position de la souris
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // On ne sélectionne pas la Baseplate ou la Grille
        if (object !== baseplate && object.type === "Mesh") {
            selectObject(object);
        } else {
            deselectObject();
        }
    } else {
        deselectObject();
    }
}

function selectObject(obj) {
    selectedObject = obj;
    selectionHelper.setFromObject(obj);
    selectionHelper.visible = true;
    
    // Update UI
    document.getElementById('properties-panel').innerHTML = `
        <div style="margin-bottom:10px;"><b>Nom:</b> Part</div>
        <div><b>Couleur:</b> #${obj.material.color.getHexString()}</div>
        <div style="margin-top:10px;">
            <input type="color" onchange="window.updateColor(this.value)" value="#${obj.material.color.getHexString()}">
        </div>
    `;
}

function deselectObject() {
    selectedObject = null;
    selectionHelper.visible = false;
    document.getElementById('properties-panel').innerHTML = '<p class="empty-msg">Aucun objet sélectionné</p>';
}

// Ajouter une Part
window.addPart = function() {
    const boxGeo = new THREE.BoxGeometry(4, 4, 4);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0x00a2ff });
    const part = new THREE.Mesh(boxGeo, boxMat);
    part.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
    scene.add(part);
    
    // UI Update Explorer
    const tree = document.getElementById('explorer-tree');
    const item = document.createElement('div');
    item.className = "tree-item child";
    item.innerHTML = "• Part";
    item.onclick = () => selectObject(part); // Cliquer dans l'explorateur sélectionne aussi
    tree.appendChild(item);
};

// Changer la couleur (appelé depuis l'UI)
window.updateColor = function(hex) {
    if (selectedObject) {
        selectedObject.material.color.set(hex);
        selectionHelper.update();
    }
}

// --- ÉVÉNEMENTS ---
renderer.domElement.addEventListener('pointerdown', onPointerDown);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

animate();
