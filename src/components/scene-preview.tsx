import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BufferGeometry, Group, Material, Mesh, Object3D, Texture, WebGLRenderer } from "three";
import type { ParsedPrisma, TextureFile } from "@/lib/prisma";
import { buildPreviewNodes, type PreviewNode } from "@/lib/prisma";
import { asBlobPart } from "@/lib/prisma/bytes.ts";

export type ScenePreviewHandle = {
  capturePng: () => Promise<Uint8Array | null>;
};

type Props = {
  project: ParsedPrisma;
  hint: string;
};

const DEG = Math.PI / 180;

export const ScenePreview = forwardRef<ScenePreviewHandle, Props>(function ScenePreview(
  { project, hint },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<null | (() => Promise<Uint8Array | null>)>(null);

  useImperativeHandle(ref, () => ({
    capturePng: () => captureRef.current?.() ?? Promise.resolve(null),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let stop = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      if (disposed || !hostRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x121318);
      scene.fog = new THREE.Fog(0x121318, 80, 420);

      const renderer: WebGLRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      host.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      scene.add(new THREE.HemisphereLight(0xe8eaf0, 0x2a2c34, 1.15));
      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(18, 28, 12);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xc5cdd8, 0.35);
      fill.position.set(-12, 8, -16);
      scene.add(fill);

      const texCache = new Map<string, Texture>();
      const loader = new THREE.TextureLoader();

      async function loadTexture(file: TextureFile, pixelBlend: boolean) {
        const hit = texCache.get(file.name);
        if (hit) return hit;
        const blob = new Blob([asBlobPart(file.data)], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        const texture = await new Promise<Texture>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        URL.revokeObjectURL(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        if (!pixelBlend) {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
        }
        texCache.set(file.name, texture);
        return texture;
      }

      const nodes: PreviewNode[] = buildPreviewNodes(project);
      const groups = new Map<number, Group>();
      const box = new THREE.Box3();
      let hasMesh = false;

      for (const node of nodes) {
        const g = new THREE.Group();
        g.name = node.name;
        g.position.set(node.position[0], node.position[1], node.position[2]);
        g.rotation.order = "ZXY";
        g.rotation.set(node.rotationDeg[0] * DEG, node.rotationDeg[1] * DEG, node.rotationDeg[2] * DEG);
        g.scale.set(node.scale[0], node.scale[1], node.scale[2]);
        g.visible = node.active;
        groups.set(node.id, g);

        if (node.geom) {
          const geo: BufferGeometry = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(node.geom.positions, 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(node.geom.normals, 3));
          geo.setAttribute("uv", new THREE.BufferAttribute(node.geom.uvs, 2));
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(node.geom.color[0], node.geom.color[1], node.geom.color[2]),
            roughness: 0.72,
            metalness: 0.05,
            transparent: node.geom.color[3] < 0.999,
            opacity: node.geom.color[3],
            side: THREE.DoubleSide,
          });
          if (node.geom.textureName) {
            const file = project.textures.find((t) => t.name === node.geom!.textureName);
            if (file) {
              try {
                mat.map = await loadTexture(file, node.geom.pixelBlend);
                mat.needsUpdate = true;
              } catch {
                /* keep vertex color */
              }
            }
          }
          const mesh = new THREE.Mesh(geo, mat);
          g.add(mesh);
          geo.computeBoundingBox();
          hasMesh = true;
        }
      }

      for (const node of nodes) {
        const g = groups.get(node.id);
        if (!g) continue;
        const parent = groups.get(node.parent);
        if (parent) parent.add(g);
        else scene.add(g);
      }

      scene.updateMatrixWorld(true);
      box.makeEmpty();
      scene.traverse((obj: Object3D) => {
        const mesh = obj as Mesh;
        if (mesh.isMesh) {
          const b = new THREE.Box3().setFromObject(mesh);
          box.union(b);
        }
      });

      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      if (hasMesh && !box.isEmpty()) {
        box.getSize(size);
        box.getCenter(center);
      } else {
        size.set(4, 4, 4);
        center.set(0, 1, 0);
      }
      const radius = Math.max(size.length() * 0.55, 2);
      controls.target.copy(center);
      camera.position.copy(center).add(new THREE.Vector3(radius, radius * 0.7, radius * 1.15));
      camera.near = Math.max(radius / 200, 0.05);
      camera.far = radius * 40;
      camera.updateProjectionMatrix();
      controls.update();

      function resize() {
        const el = hostRef.current;
        if (!el) return;
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      let raf = 0;
      const loop = () => {
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      loop();

      captureRef.current = async () => {
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL("image/png");
        const res = await fetch(url);
        return new Uint8Array(await res.arrayBuffer());
      };

      stop = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        renderer.dispose();
        scene.traverse((obj: Object3D) => {
          const mesh = obj as Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const m = mesh.material as Material | Material[] | undefined;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (m) m.dispose();
        });
        texCache.forEach((t) => t.dispose());
        renderer.domElement.remove();
      };
    })().catch((err) => {
      console.error(err);
    });

    return () => {
      disposed = true;
      captureRef.current = null;
      stop();
    };
  }, [project]);

  return (
    <div className="relative h-full min-h-60 w-full overflow-hidden rounded-md bg-elevated">
      <div ref={hostRef} className="absolute inset-0" />
      <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-xs tracking-wide text-subtle">
        {hint}
      </p>
    </div>
  );
});
