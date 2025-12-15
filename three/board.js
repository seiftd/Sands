
import * as THREE from 'three';

export class Board {
  constructor(scene) {
    this.scene = scene;
    this.createBoard();
  }

  createBoard() {
    // Placeholder Board: A large flat plane
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xdeb887, // Burlywood / Sand color
      roughness: 0.8 
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    
    this.scene.add(this.mesh);

    // Add a border visual
    const borderGeo = new THREE.BoxGeometry(21, 1, 21);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = -0.51; // Just below the board
    this.scene.add(border);
  }
}
