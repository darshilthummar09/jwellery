import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Diamond3D({ size }: { size: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // WebGL unavailable — surrounding content still renders without the 3D stone
      return;
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 4);
    camera.lookAt(0, 0, 0);

    // Round-brilliant-cut geometry: octagonal table, star + bezel crown facets,
    // girdle band, 16 pavilion facets to a culet point. Built indexed, then
    // de-indexed so every facet is flat-shaded like a real cut stone.
    const sides = 16;
    const tableSides = 8;
    const tableR = 0.55, tableY = 0.62;
    const girdleR = 1.0, girdleTopY = 0.04, girdleBotY = -0.04;
    const culetY = -1.25;

    const verts: number[] = [];
    const push = (x: number, y: number, z: number) => {
      verts.push(x, y, z);
      return verts.length / 3 - 1;
    };

    const T: number[] = [], GT: number[] = [], GB: number[] = [];
    for (let i = 0; i < tableSides; i++) {
      const a = ((2 * i + 1) / sides) * Math.PI * 2;
      T.push(push(Math.cos(a) * tableR, tableY, Math.sin(a) * tableR));
    }
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      GT.push(push(Math.cos(a) * girdleR, girdleTopY, Math.sin(a) * girdleR));
    }
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      GB.push(push(Math.cos(a) * girdleR, girdleBotY, Math.sin(a) * girdleR));
    }
    const C = push(0, tableY, 0);
    const CU = push(0, culetY, 0);

    const idxArr: number[] = [];
    const tri = (a: number, b: number, c: number) => idxArr.push(a, b, c);
    for (let i = 0; i < tableSides; i++) {
      const iN = (i + 1) % tableSides;
      const g0 = (2 * i) % sides, g1 = (2 * i + 1) % sides, g2 = (2 * i + 2) % sides;
      tri(C, T[iN], T[i]);                 // table
      tri(T[i], GT[g1], GT[g0]);           // bezel facets
      tri(T[i], GT[g2], GT[g1]);
      tri(T[i], T[iN], GT[g2]);            // star facet
    }
    for (let k = 0; k < sides; k++) {
      const kN = (k + 1) % sides;
      tri(GT[k], GT[kN], GB[k]);           // girdle band
      tri(GT[kN], GB[kN], GB[k]);
      tri(GB[k], GB[kN], CU);              // pavilion mains
    }

    const indexed = new THREE.BufferGeometry();
    indexed.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    indexed.setIndex(idxArr);
    indexed.translate(0, 0.3, 0);
    const diamondGeo = indexed.toNonIndexed();
    diamondGeo.computeVertexNormals();
    indexed.dispose();

    // Diamond material: icy blue-white, refractive (IOR 2.42), fire from dispersion
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 1.0,
      thickness: 1.4,
      ior: 2.417,
      dispersion: 0.12,
      envMapIntensity: 3.2,
      clearcoat: 1,
      clearcoatRoughness: 0,
      specularIntensity: 1,
      attenuationColor: new THREE.Color(0x9cc4ff),
      attenuationDistance: 1.4,
    });

    const diamond = new THREE.Mesh(diamondGeo, mat);
    scene.add(diamond);

    // Studio-style env map: dark room with bright softbox strips + cool blue
    // accents, so facets throw crisp white and icy-blue flashes
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512; envCanvas.height = 256;
    const ctx = envCanvas.getContext("2d")!;
    ctx.fillStyle = "#090b10";
    ctx.fillRect(0, 0, 512, 256);
    const strip = (x: number, y: number, w: number, h: number, color: string) => {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.25, color);
      g.addColorStop(0.75, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    };
    strip(40, 20, 70, 140, "#ffffff");
    strip(200, 10, 50, 170, "#eaf2ff");
    strip(330, 30, 80, 120, "#ffffff");
    strip(120, 180, 120, 60, "#9db8ff");
    strip(400, 170, 90, 70, "#3a5aa8");
    strip(0, 90, 30, 60, "#bfd8ff");
    const envTex = new THREE.CanvasTexture(envCanvas, THREE.EquirectangularReflectionMapping);
    const envTexture = pmremGenerator.fromEquirectangular(envTex).texture;
    scene.environment = envTexture;
    envTex.dispose();

    scene.add(new THREE.AmbientLight(0xeef4ff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(2, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 3);
    rim.position.set(-3, 1, -2);
    scene.add(rim);
    const back = new THREE.PointLight(0x4466ff, 2.5, 10);
    back.position.set(0, -2, -3);
    scene.add(back);

    const sparkle1 = new THREE.PointLight(0xffffff, 5, 3);
    sparkle1.position.set(1.2, 1, 1.5);
    scene.add(sparkle1);
    const sparkle2 = new THREE.PointLight(0xaaccff, 4, 3);
    sparkle2.position.set(-1.5, 0.5, -1);
    scene.add(sparkle2);

    // Pointer parallax — the stone leans gently toward the cursor
    let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
    const onPointerMove = (e: PointerEvent) => {
      targetTiltY = (e.clientX / window.innerWidth - 0.5) * 0.5;
      targetTiltX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("pointermove", onPointerMove);

    let frame = 0;
    const animate = () => {
      frame++;
      const t = frame * 0.01;
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;
      diamond.rotation.y = t * 0.6 + tiltY;
      diamond.rotation.x = Math.sin(t * 0.3) * 0.15 + tiltX;

      sparkle1.intensity = 3 + Math.sin(t * 2.1) * 2;
      sparkle2.intensity = 3 + Math.cos(t * 1.7) * 2;
      sparkle1.position.x = Math.cos(t * 1.3) * 1.5;
      sparkle1.position.z = Math.sin(t * 1.3) * 1.5;

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      pmremGenerator.dispose();
      diamondGeo.dispose();
      mat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 60px rgba(130,170,255,0.55)) drop-shadow(0 0 120px rgba(160,195,255,0.25))",
      }}
    />
  );
}
