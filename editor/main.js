import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- VÉRIFICATION DE SÉCURITÉ ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Si pas de session, retour forcé à la page de connexion
        window.location.href = "../auth.html";
    } else {
        console.log("Accès autorisé :", user.email);
        loadProject(); // On ne charge le projet que si l'utilisateur est OK
    }
});

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { db } from "../firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');
const projectName = params.get('name') || "Projet sans nom";

// --- SETUP SCÈNE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); 
const viewport = document.getElementById('viewport');
const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(20, 20, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x707070));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

const grid = new THREE.GridHelper(100, 100, 0x555555, 0x888888);
scene.add(grid);

const baseplate = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999 })
);
baseplate.position.y = -0.5;
scene.add(baseplate);

const controls = new OrbitControls(camera, renderer.domElement);
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);
transformControls.addEventListener('dragging-changed', (e) => controls.enabled = !e.value);

let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- CLOUD FUNCTIONS (FIREBASE) ---

async function saveProject() {
    if (!projectId) return;
    const objectsData = [];

    scene.children.forEach(obj => {
        if (obj.type === "Mesh" && obj !== baseplate) {
            objectsData.push({
                shape: obj.userData.shape,
                name: obj.userData.name,
                pos: obj.position.toArray(),
                rot: obj.rotation.toArray(),
                sca: obj.scale.toArray(),
                col: '#' + obj.material.color.getHexString()
            });
        }
    });

    try {
        await setDoc(doc(db, "projects", projectId), {
            name: projectName,
            lastModified: new Date(),
            data: objectsData
        });
    } catch (e) { console.error("Erreur save:", e); }
}

async function loadProject() {
    if (!projectId) return;
    const docSnap = await getDoc(doc(db, "projects", projectId));

    if (docSnap.exists()) {
        const project = docSnap.data();
        project.data.forEach(item => {
            createPart(item.shape, item.col, item.pos, item.rot, item.sca, item.name);
        });
    }
}

// --- CORE LOGIC ---

function createPart(shape, color, pos = [0,2,0], rot = [0,0,0], sca = [1,1,1], name = null) {
    let geo;
    if(shape === 'sphere') geo = new THREE.SphereGeometry(2, 32, 16);
    else if(shape === 'cylinder') geo = new THREE.CylinderGeometry(2, 2, 4, 32);
    else geo = new THREE.BoxGeometry(4, 4, 4);

    const part = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: color }));
    part.position.fromArray(pos);
    part.rotation.fromArray(rot);
    part.scale.fromArray(sca);
    part.userData.shape = shape;
    part.userData.name = name || (shape.charAt(0).toUpperCase() + shape.slice(1));
    scene.add(part);

    const item = document.createElement('div');
    item.className = "tree-item child";
    item.innerHTML = "• " + part.userData.name;
    item.onclick = (e) => { e.stopPropagation(); selectObject(part); };
    document.getElementById('explorer-tree').appendChild(item);
    return part;
}

window.addPart = function() {
    const shape = document.getElementById('shape-selector').value;
    const part = createPart(shape, 0x00a2ff);
    selectObject(part);
    saveProject();
};

function selectObject(obj) {
    selectedObject = obj;
    transformControls.attach(obj);
    document.getElementById('properties-panel').innerHTML = `
        <b>Nom:</b> ${obj.userData.name}<br><br>
        <input type="color" id="cp" value="#${obj.material.color.getHexString()}">
        <button id="del" style="margin-top:10px; width:100%; background:red; color:white;">Supprimer</button>
    `;
    document.getElementById('cp').oninput = (e) => { obj.material.color.set(e.target.value); saveProject(); };
    document.getElementById('del').onclick = () => { scene.remove(obj); deselectObject(); saveProject(); };
}

function deselectObject() {
    selectedObject = null;
    transformControls.detach();
    document.getElementById('properties-panel').innerHTML = '<p>Aucun objet sélectionné</p>';
}

window.setMode = (m) => transformControls.setMode(m);

renderer.domElement.addEventListener('pointerdown', (e) => {
    if (transformControls.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    const valid = intersects.find(i => i.object !== baseplate && i.object.type === "Mesh");
    if (valid) selectObject(valid.object);
    else if (intersects.length > 0 && intersects[0].object === baseplate) deselectObject();
});

// Save auto quand on finit de bouger un objet
transformControls.addEventListener('change', () => { if(selectedObject) saveProject(); });

loadProject();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});
