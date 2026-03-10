import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// INITIALISATION
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); 

const viewport = document.getElementById('viewport');
const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

// LUMIÈRES
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// GRILLE ET BASEPLATE
const grid = new THREE.GridHelper(100, 100, 0x555555, 0x888888);
scene.add(grid);

const baseGeo = new THREE.BoxGeometry(100, 1, 100);
const baseMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
const baseplate = new THREE.Mesh(baseGeo, baseMat);
baseplate.position.y = -0.5;
scene.add(baseplate);

// CONTRÔLES
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN };

// AJOUTER UNE PART
window.addPart = function() {
    const boxGeo = new THREE.BoxGeometry(4, 4, 4);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0x00a2ff });
    const part = new THREE.Mesh(boxGeo, boxMat);
    part.position.set(0, 2, 0);
    scene.add(part);
    
    // UI Update
    const tree = document.getElementById('explorer-tree');
    const item = document.createElement('div');
    item.className = "tree-item child";
    item.innerHTML = "• Part";
    tree.appendChild(item);
};

// RENDER LOOP
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
