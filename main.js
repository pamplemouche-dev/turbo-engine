import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SETUP SCÈNE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); 

const viewport = document.getElementById('viewport');
const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

// --- LUMIÈRES ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x606060));

// --- GRILLE & SOL ---
const grid = new THREE.GridHelper(100, 100, 0x555555, 0x888888);
scene.add(grid);

const baseplate = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999 })
);
baseplate.position.y = -0.5;
baseplate.name = "Baseplate";
scene.add(baseplate);

// --- CONTRÔLES CAMÉRA ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN };

// --- SÉLECTION & RAYCASTING ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

const selectionHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x00a2ff);
scene.add(selectionHelper);
selectionHelper.visible = false;

function selectObject(obj) {
    selectedObject = obj;
    selectionHelper.setFromObject(obj);
    selectionHelper.visible = true;
    
    const propPanel = document.getElementById('properties-panel');
    propPanel.innerHTML = `
        <div style="margin-bottom:10px;"><b>Type:</b> ${obj.userData.shape || 'Part'}</div>
        <div style="margin-bottom:5px;"><b>Couleur:</b></div>
        <input type="color" id="colorPicker" value="#${obj.material.color.getHexString()}">
    `;

    document.getElementById('colorPicker').addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.material.color.set(e.target.value);
            selectionHelper.update();
        }
    });
}

function deselectObject() {
    selectedObject = null;
    selectionHelper.visible = false;
    document.getElementById('properties-panel').innerHTML = '<p class="empty-msg">Aucun objet sélectionné</p>';
}

// --- AJOUTER UNE PART ---
window.addPart = function() {
    const shape = document.getElementById('shape-selector').value;
    let geometry;

    if(shape === 'sphere') geometry = new THREE.SphereGeometry(2, 32, 16);
    else if(shape === 'cylinder') geometry = new THREE.CylinderGeometry(2, 2, 4, 32);
    else geometry = new THREE.BoxGeometry(4, 4, 4);

    const material = new THREE.MeshPhongMaterial({ color: 0x00a2ff });
    const part = new THREE.Mesh(geometry, material);
    
    part.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
    part.userData.shape = shape;
    scene.add(part);
    
    // UI Explorer
    const tree = document.getElementById('explorer-tree');
    const item = document.createElement('div');
    item.className = "tree-item child";
    item.innerHTML = `• ${shape.charAt(0).toUpperCase() + shape.slice(1)}`;
    item.onclick = (e) => { e.stopPropagation(); selectObject(part); };
    tree.appendChild(item);
};

// --- GESTION DES CLICS ---
renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj !== baseplate && obj !== grid && obj.type === "Mesh") selectObject(obj);
        else if (obj === baseplate) deselectObject();
    }
});

// --- BOUCLE DE RENDU ---
function animate() {
    requestAnimationFrame(animate);
    if (selectedObject) selectionHelper.update();
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

animate();
