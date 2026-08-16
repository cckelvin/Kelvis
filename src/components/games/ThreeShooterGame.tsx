import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Crosshair, Shield, Heart, Zap, RotateCcw, Volume2, VolumeX, Eye, Trophy, Skull } from "lucide-react";
import { playSound } from "../../utils/gameAudio";

interface EnemyBot {
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  lastShotTime: number;
  targetPos: THREE.Vector3;
  state: "patrol" | "chase" | "shoot";
  headMesh: THREE.Mesh;
}

interface Bullet {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  speed: number;
  lifetime: number;
  fromPlayer: boolean;
  damage: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
}

export const ThreeShooterGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Player state
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [reserveAmmo, setReserveAmmo] = useState(120);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [wave, setWave] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [killFeed, setKillFeed] = useState<string[]>([]);
  const [hitFeedback, setHitFeedback] = useState(false);

  // Key tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const isPointerLocked = useRef<boolean>(false);

  // Restart handler
  const handleRestart = () => {
    playSound("click");
    setHealth(100);
    setArmor(100);
    setAmmo(30);
    setReserveAmmo(120);
    setScore(0);
    setKills(0);
    setWave(1);
    setIsGameOver(false);
    setIsVictory(false);
    setIsReloading(false);
    setKillFeed([]);
  };

  const reloadWeapon = () => {
    if (isReloading || ammo === 30 || reserveAmmo <= 0) return;
    setIsReloading(true);
    playSound("reload");
    setTimeout(() => {
      const needed = 30 - ammo;
      const taken = Math.min(needed, reserveAmmo);
      setAmmo((prev) => prev + taken);
      setReserveAmmo((prev) => prev - taken);
      setIsReloading(false);
    }, 1200);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Dark tactical twilight
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    dirLight.position.set(40, 60, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    // --- GROUND & BATTLEGROUND ARENA ---
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(160, 40, 0x38bdf8, 0x334155);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Perimeter boundary walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wallGeo = new THREE.BoxGeometry(160, 8, 2);
    const walls = [
      { pos: [0, 4, -80], rot: 0 },
      { pos: [0, 4, 80], rot: 0 },
      { pos: [-80, 4, 0], rot: Math.PI / 2 },
      { pos: [80, 4, 0], rot: Math.PI / 2 },
    ];
    walls.forEach((w) => {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
      wall.rotation.y = w.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    });

    // --- OBSTACLES: SHIPPING CONTAINERS & CRATES ---
    const obstacles: THREE.Mesh[] = [];
    const containerColors = [0xb91c1c, 0x0369a1, 0xd97706, 0x15803d, 0x475569];

    // Spawn Shipping Containers (Cover objects)
    for (let i = 0; i < 16; i++) {
      const cGeo = new THREE.BoxGeometry(6, 3, 12);
      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[i % containerColors.length],
        roughness: 0.6,
        metalness: 0.4,
      });
      const cMesh = new THREE.Mesh(cGeo, cMat);

      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 18 + Math.random() * 35;
      cMesh.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
      cMesh.rotation.y = Math.random() * Math.PI;
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      scene.add(cMesh);
      obstacles.push(cMesh);
    }

    // Wooden Crates
    for (let i = 0; i < 24; i++) {
      const crateGeo = new THREE.BoxGeometry(2, 2, 2);
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const crate = new THREE.Mesh(crateGeo, crateMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 50;
      crate.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
      crate.rotation.y = Math.random() * Math.PI;
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      obstacles.push(crate);
    }

    // --- WEAPON IN HAND (FP VIEW) ---
    const weaponGroup = new THREE.Group();
    const gunBodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.45);
    const gunBodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
    const gunBody = new THREE.Mesh(gunBodyGeo, gunBodyMat);

    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
    const barrel = new THREE.Mesh(barrelGeo, gunBodyMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.3);

    const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const laserGeo = new THREE.CylinderGeometry(0.002, 0.002, 10);
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.rotation.x = Math.PI / 2;
    laser.position.set(0, 0.03, -5.3);

    weaponGroup.add(gunBody);
    weaponGroup.add(barrel);
    weaponGroup.add(laser);
    weaponGroup.position.set(0.22, -0.2, -0.45);
    camera.add(weaponGroup);
    scene.add(camera);

    // --- PLAYER VARIABLES ---
    const playerPos = new THREE.Vector3(0, 1.7, 0);
    let playerYaw = 0;
    let playerPitch = 0;
    let currentHealth = 100;
    let currentArmor = 100;
    let currentAmmo = 30;
    let currentReserve = 120;
    let currentScore = 0;
    let currentKills = 0;
    let lastPlayerShot = 0;

    // --- ENEMY BOTS SPAWNER ---
    const enemies: EnemyBot[] = [];
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    function createEnemyBot(x: number, z: number): EnemyBot {
      const group = new THREE.Group();

      // Body (tactical armor)
      const bodyGeo = new THREE.CylinderGeometry(0.4, 0.35, 1.2, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }); // Red Enemy
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);

      // Head with glowing visor
      const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.6;
      head.castShadow = true;
      group.add(head);

      const visorGeo = new THREE.BoxGeometry(0.25, 0.08, 0.15);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 1.6, -0.22);
      group.add(visor);

      // Gun
      const botGunGeo = new THREE.BoxGeometry(0.08, 0.1, 0.4);
      const botGunMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      const botGun = new THREE.Mesh(botGunGeo, botGunMat);
      botGun.position.set(0.3, 1.0, -0.3);
      group.add(botGun);

      group.position.set(x, 0, z);
      scene.add(group);

      return {
        mesh: group,
        headMesh: head,
        health: 100,
        maxHealth: 100,
        speed: 2.2 + Math.random() * 1.0,
        lastShotTime: Date.now() + Math.random() * 2000,
        targetPos: new THREE.Vector3(x, 0, z),
        state: "patrol",
      };
    }

    // Spawn Initial Wave of Bots
    function spawnWave(count: number) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 30 + Math.random() * 25;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        enemies.push(createEnemyBot(x, z));
      }
    }

    spawnWave(4);

    // --- SHOOTING HANDLER ---
    function shootBullet(isFromPlayer: boolean, origin: THREE.Vector3, dir: THREE.Vector3) {
      const bulletGeo = new THREE.SphereGeometry(isFromPlayer ? 0.06 : 0.09, 6, 6);
      const bulletMat = new THREE.MeshBasicMaterial({
        color: isFromPlayer ? 0xfacc15 : 0xef4444, // Yellow player bullet, Red enemy bullet
      });
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bulletMesh.position.copy(origin);
      scene.add(bulletMesh);

      bullets.push({
        mesh: bulletMesh,
        direction: dir.clone().normalize(),
        speed: isFromPlayer ? 85 : 45,
        lifetime: 2.0,
        fromPlayer: isFromPlayer,
        damage: isFromPlayer ? 35 : 15,
      });

      if (isFromPlayer) {
        playSound("shoot");
        // Weapon Recoil
        weaponGroup.position.z = -0.35;
        setTimeout(() => {
          weaponGroup.position.z = -0.45;
        }, 80);
      }
    }

    function createSparks(pos: THREE.Vector3, color: number) {
      for (let i = 0; i < 6; i++) {
        const pGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
        const pMat = new THREE.MeshBasicMaterial({ color });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        particles.push({
          mesh: pMesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 4 + 1,
            (Math.random() - 0.5) * 4
          ),
          lifetime: 0.4,
        });
      }
    }

    // --- EVENT LISTENERS ---
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyR") {
        reloadWeapon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        const sensitivity = 0.0022;
        playerYaw -= e.movementX * sensitivity;
        playerPitch -= e.movementY * sensitivity;
        playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.isDown = true;
        if (document.pointerLockElement !== renderer.domElement) {
          renderer.domElement.requestPointerLock();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.isDown = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // --- MAIN GAME LOOP ---
    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (currentHealth <= 0) return;

      // 1. Player Camera Rotation
      camera.rotation.order = "YXZ";
      camera.rotation.y = playerYaw;
      camera.rotation.x = playerPitch;

      // 2. Player Movement (WASD)
      const moveSpeed = (keysRef.current["ShiftLeft"] ? 10.5 : 6.5) * delta;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
      const moveDir = new THREE.Vector3();

      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) moveDir.add(forward);
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) moveDir.sub(forward);
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) moveDir.add(right);
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) moveDir.sub(right);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        playerPos.addScaledVector(moveDir, moveSpeed);
        // Boundaries
        playerPos.x = Math.max(-75, Math.min(75, playerPos.x));
        playerPos.z = Math.max(-75, Math.min(75, playerPos.z));
      }

      camera.position.set(playerPos.x, 1.7, playerPos.z);

      // 3. Player Continuous Firing
      if (mouseRef.current.isDown && !isReloading && currentAmmo > 0) {
        if (now - lastPlayerShot > 140) {
          // 400 RPM
          lastPlayerShot = now;
          currentAmmo--;
          setAmmo(currentAmmo);

          const shootOrigin = camera.position.clone().add(new THREE.Vector3(0.2, -0.15, -0.4).applyEuler(camera.rotation));
          const shootDir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
          shootBullet(true, shootOrigin, shootDir);

          if (currentAmmo === 0) {
            reloadWeapon();
          }
        }
      }

      // 4. Update Bullets & Collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.mesh.position.addScaledVector(b.direction, b.speed * delta);
        b.lifetime -= delta;

        // Player bullet hitting Enemy Bots
        if (b.fromPlayer) {
          for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = b.mesh.position.distanceTo(enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
            if (dist < 1.0) {
              // Enemy Hit!
              enemy.health -= b.damage;
              createSparks(b.mesh.position, 0xef4444);
              playSound("hit");
              setHitFeedback(true);
              setTimeout(() => setHitFeedback(false), 100);

              if (enemy.health <= 0) {
                // Eliminate Enemy
                scene.remove(enemy.mesh);
                enemies.splice(j, 1);
                currentScore += 100;
                currentKills++;
                setScore(currentScore);
                setKills(currentKills);
                playSound("victory");
                setKillFeed((prev) => [`🎯 Enemy Bot Eliminated (+100)`, ...prev.slice(0, 3)]);

                // Check wave clear
                if (enemies.length === 0) {
                  setWave((prevW) => {
                    const nextW = prevW + 1;
                    spawnWave(nextW * 3);
                    setKillFeed((prev) => [`🔥 Wave ${nextW} Incoming!`, ...prev]);
                    return nextW;
                  });
                }
              }

              scene.remove(b.mesh);
              bullets.splice(i, 1);
              break;
            }
          }
        } else {
          // Enemy bullet hitting Player
          const playerDist = b.mesh.position.distanceTo(camera.position);
          if (playerDist < 1.0) {
            createSparks(b.mesh.position, 0x38bdf8);
            playSound("hit");

            if (currentArmor > 0) {
              currentArmor = Math.max(0, currentArmor - b.damage);
              setArmor(currentArmor);
            } else {
              currentHealth = Math.max(0, currentHealth - b.damage);
              setHealth(currentHealth);
              if (currentHealth <= 0) {
                setIsGameOver(true);
                playSound("defeat");
              }
            }

            scene.remove(b.mesh);
            bullets.splice(i, 1);
            continue;
          }
        }

        if (b.lifetime <= 0) {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
        }
      }

      // 5. Update Enemy AI Bots
      enemies.forEach((enemy) => {
        const toPlayer = camera.position.clone().sub(enemy.mesh.position);
        toPlayer.y = 0;
        const distToPlayer = toPlayer.length();

        // Rotate bot toward player
        enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        if (distToPlayer > 12) {
          // Chase player
          toPlayer.normalize();
          enemy.mesh.position.addScaledVector(toPlayer, enemy.speed * delta);
        } else {
          // In combat range: Shoot player
          if (now - enemy.lastShotTime > 1800 + Math.random() * 1200) {
            enemy.lastShotTime = now;
            const shootOrigin = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            const shootDir = camera.position.clone().sub(shootOrigin).normalize();
            shootBullet(false, shootOrigin, shootDir);
          }
        }
      });

      // 6. Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.lifetime -= delta;
        if (p.lifetime <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] sm:h-[600px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Crosshair Center */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`w-6 h-6 border border-amber-400 rounded-full flex items-center justify-center transition-all ${
            hitFeedback ? "scale-150 border-red-500 bg-red-500/20" : "scale-100"
          }`}
        >
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        </div>
      </div>

      {/* Top HUD: Score, Kills, Wave */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 text-white">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black">Score: {score}</span>
          <span className="text-slate-500">|</span>
          <Skull className="w-4 h-4 text-red-400" />
          <span className="text-xs font-black">Kills: {kills}</span>
          <span className="text-slate-500">|</span>
          <span className="text-xs font-bold text-amber-400">Wave {wave}</span>
        </div>

        {/* Instructions / Controls hint */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 text-[11px] text-slate-300">
          <span>Click to Aim & Shoot</span>
          <span className="text-slate-500">•</span>
          <span>WASD Move</span>
          <span className="text-slate-500">•</span>
          <span>Shift Sprint</span>
          <span className="text-slate-500">•</span>
          <span>R Reload</span>
        </div>
      </div>

      {/* Killfeed Notifications */}
      <div className="absolute top-16 right-4 flex flex-col space-y-1 pointer-events-none">
        {killFeed.map((kf, i) => (
          <div
            key={i}
            className="px-2.5 py-1 bg-slate-900/90 border border-amber-500/40 rounded-xl text-[11px] font-bold text-amber-300 shadow-md animate-fade-in"
          >
            {kf}
          </div>
        ))}
      </div>

      {/* Bottom HUD: Health, Shield, Ammo & Reload */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
        {/* Health & Armor Bars */}
        <div className="bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700 flex flex-col space-y-2 w-48 sm:w-56 shadow-xl">
          {/* Health */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-200 mb-1">
              <span className="flex items-center space-x-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>HEALTH</span>
              </span>
              <span>{health} HP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200"
                style={{ width: `${health}%` }}
              />
            </div>
          </div>

          {/* Armor */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-200 mb-1">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span>ARMOR</span>
              </span>
              <span>{armor} AP</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-200"
                style={{ width: `${armor}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ammo Display & Manual Reload Button */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={reloadWeapon}
            disabled={isReloading}
            className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-amber-400 shadow-xl cursor-pointer active:scale-95 transition"
          >
            {isReloading ? "Reloading..." : "Reload (R)"}
          </button>

          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700 shadow-xl flex items-baseline space-x-1 text-white">
            <span className="text-2xl font-black text-amber-400">{ammo}</span>
            <span className="text-xs text-slate-400">/ {reserveAmmo}</span>
          </div>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Skull className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">ELIMINATED</h3>
            <p className="text-xs text-slate-400 mb-4">
              You survived to Wave {wave} with {kills} eliminations and {score} points.
            </p>
            <button
              onClick={handleRestart}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
