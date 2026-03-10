import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// --- INITIALISATION ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); 

const viewport = document.getElementById('viewport');
const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
viewport.appendChild(renderer.domElement);

// --- LUMIÈRES ---
const ambientLight = new THREE.AmbientLight(0x707070);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 20, 10);
scene.add(sunLight);

// --- GRILLE & BASEPLATE ---
const grid = new THREE.GridHelper(100, 100, 0x555555, 0x888888);
scene.add(grid);

const baseplate = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999 })
);
baseplate.position.y = -0.5;
baseplate.name = "Baseplate";
scene.add(baseplate);

// --- CONTRÔLES ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN };

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

// Empêcher la caméra de bouger quand on manipule l'objet
transformControls.addEventListener('dragging-changed', (e) => {
    controls.enabled = !e.value;
});

// --- VARIABLES ÉTAT ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// --- FONCTIONS ---

window.setMode = function(mode) {
    transformControls.setMode(mode);
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + mode).classList.add('active');
};

function selectObject(obj) {
    selectedObject = obj;
    transformControls.attach(obj);
    
    const propPanel = document.getElementById('properties-panel');
    propPanel.innerHTML = `
        <div style="margin-bottom:10px;"><b>Nom:</b> ${obj.userData.name}</div>
        <div style="margin-bottom:5px;"><b>Couleur:</b></div>
        <input type="color" id="colorPicker" value="#${obj.material.color.getHexString()}">
        <button id="del-btn" style="margin-top:15px; width:100%; background:#b33939; color:white; border:none; padding:8px; cursor:pointer; border-radius:4px;">Supprimer</button>
    `;

    document.getElementById('colorPicker').oninput = (e) => obj.material.color.set(e.target.value);
    document.getElementById('del-btn').onclick = () => {
        scene.remove(obj);
        deselectObject();
        // Optionnel : retirer de l'UI explorer
    };
}

function deselectObject() {
    selectedObject = null;
    transformControls.detach();
    document.getElementById('properties-panel').innerHTML = '<p class="empty-msg">Aucun objet sélectionné</p>';
}

window.addPart = function() {
    const shape = document.getElementById('shape-selector').value;
    let geo;
    if(shape === 'sphere') geo = new THREE.SphereGeometry(2, 32, 16);
    else if(shape === 'cylinder') geo = new THREE.CylinderGeometry(2, 2, 4, 32);
    else geo = new THREE.BoxGeometry(4, 4, 4);

    const part = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0x00a2ff }));
    part.position.set(0, 2, 0);
    part.userData.name = shape.charAt(0).toUpperCase() + shape.slice(1);
    scene.add(part);

    const item = document.createElement('div');
    item.className = "tree-item child";
    item.innerHTML = "• " + part.userData.name;
    item.onclick = (e) => { e.stopPropagation(); selectObject(part); };
    document.getElementById('explorer-tree').appendChild(item);
    
    selectObject(part);
};

// --- EVENTS ---
renderer.domElement.addEventListener('pointerdown', (e) => {
    if (transformControls.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    const valid = intersects.find(i => i.object !== baseplate && i.object !== grid && i.object.type === "Mesh");
    
    if (valid) selectObject(valid.object);
    else if (intersects.length > 0 && intersects[0].object === baseplate) deselectObject();
});

window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
