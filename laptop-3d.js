// laptop-3d.js
import * as THREE from 'three';

const canvas = document.getElementById('laptop-canvas');
if (!canvas) throw new Error('laptop-canvas not found');

console.log('Three.js loaded:', THREE.REVISION);
