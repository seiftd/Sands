
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { eventBus } from '../core/eventBus.js';

export class DiceManager {
  constructor(scene) {
    this.scene = scene;
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82 * 3, 0), // Heavier gravity for snappier feel
    });
    
    // Physics Materials
    const diceMat = new CANNON.Material();
    const floorMat = new CANNON.Material();
    const contactMat = new CANNON.ContactMaterial(floorMat, diceMat, {
      friction: 0.01,
      restitution: 0.5
    });
    this.world.addContactMaterial(contactMat);

    // Floor Body
    this.createFloor(floorMat);

    this.diceMesh = null;
    this.diceBody = null;
    this.isRolling = false;
    this.diceValue = 1;
    
    this.createDice(diceMat);
  }

  createFloor(material) {
    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: material
    });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(floorBody);
  }

  createDice(material) {
    // Visuals
    const size = 1;
    const geometry = new THREE.BoxGeometry(size, size, size);
    
    // Placeholder face textures/colors
    // Mapping standard dice faces (1 opposite 6, etc.)
    // Materials array order: Right (x+), Left (x-), Top (y+), Bottom (y-), Front (z+), Back (z-)
    // Let's assume:
    // x+: 1, x-: 6
    // y+: 2, y-: 5
    // z+: 3, z-: 4
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff, 0xff00ff];
    const materials = colors.map(c => new THREE.MeshStandardMaterial({ color: c }));
    
    this.diceMesh = new THREE.Mesh(geometry, materials);
    this.diceMesh.castShadow = true;
    this.diceMesh.position.set(0, 2, 0);
    this.scene.add(this.diceMesh);

    // Physics
    const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
    this.diceBody = new CANNON.Body({
      mass: 1,
      shape: shape,
      material: material
    });
    this.diceBody.position.set(0, 2, 0);
    this.world.addBody(this.diceBody);
  }

  rollDice() {
    if (this.isRolling) return;
    this.isRolling = true;

    // Reset Position
    this.diceBody.position.set(0, 5, 0);
    this.diceBody.velocity.set(0, 0, 0);
    this.diceBody.angularVelocity.set(0, 0, 0);
    
    // Random rotation start
    this.diceBody.quaternion.setFromEuler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    // Apply impulse
    const forceX = (Math.random() - 0.5) * 5;
    const forceZ = (Math.random() - 0.5) * 5;
    this.diceBody.applyImpulse(
      new CANNON.Vec3(forceX, 5, forceZ),
      new CANNON.Vec3(0, 0, 0)
    );

    // Apply torque for spin
    this.diceBody.angularVelocity.set(
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10
    );

    this.checkStop();
  }

  checkStop() {
    const checkInterval = setInterval(() => {
      const vel = this.diceBody.velocity.length();
      const angVel = this.diceBody.angularVelocity.length();

      if (vel < 0.1 && angVel < 0.1 && this.diceBody.position.y < 1) {
        clearInterval(checkInterval);
        this.isRolling = false;
        this.detectFace();
      }
    }, 200);
  }

  detectFace() {
    // Create local vectors for each face normal relative to the body
    // Using our assumed map:
    // x+: 1, x-: 6
    // y+: 2, y-: 5
    // z+: 3, z-: 4
    
    const normals = [
      { vec: new CANNON.Vec3(1, 0, 0), val: 1 },
      { vec: new CANNON.Vec3(-1, 0, 0), val: 6 },
      { vec: new CANNON.Vec3(0, 1, 0), val: 2 },
      { vec: new CANNON.Vec3(0, -1, 0), val: 5 },
      { vec: new CANNON.Vec3(0, 0, 1), val: 3 },
      { vec: new CANNON.Vec3(0, 0, -1), val: 4 },
    ];

    // Transform local vectors to world space and check 'up' (y+)
    let maxDot = -Infinity;
    let result = 1;

    // World Up
    const worldUp = new CANNON.Vec3(0, 1, 0);

    normals.forEach(face => {
      const worldNormal = new CANNON.Vec3();
      this.diceBody.quaternion.vmult(face.vec, worldNormal);
      const dot = worldNormal.dot(worldUp);
      
      if (dot > maxDot) {
        maxDot = dot;
        result = face.val;
      }
    });

    console.log("Rolled:", result);
    eventBus.emit('DICE_ROLLED', result);
  }

  update() {
    this.world.step(1/60);
    this.diceMesh.position.copy(this.diceBody.position);
    this.diceMesh.quaternion.copy(this.diceBody.quaternion);
  }
}
