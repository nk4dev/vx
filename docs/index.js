import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

        const canvas = document.getElementById('bg3d');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
        camera.position.set(0, 1.2, 16);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0x8b5cf6, 1.15);
        keyLight.position.set(7, 6, 9);
        scene.add(keyLight);

        const fillLight = new THREE.PointLight(0x38bdf8, 0.9, 70);
        fillLight.position.set(-8, -2, 6);
        scene.add(fillLight);

        const root = new THREE.Group();
        scene.add(root);

        const nodeGeometry = new THREE.SphereGeometry(0.14, 14, 14);
        const nodeMaterial = new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.45,
            metalness: 0.5,
            roughness: 0.35
        });

        const nodeCount = 36;
        const nodeMeshes = [];
        const nodePositions = [];
        for (let i = 0; i < nodeCount; i += 1) {
            const angle = (i / nodeCount) * Math.PI * 2;
            const ring = i % 3;
            const radius = 4.4 + ring * 1.7 + Math.random() * 0.35;
            const y = (ring - 1) * 1.8 + (Math.random() - 0.5) * 1.1;
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.0;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.0;
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
            node.position.set(x, y, z);
            node.scale.setScalar(0.75 + Math.random() * 0.85);
            node.userData = {
                baseY: y,
                phase: Math.random() * Math.PI * 2,
                drift: 0.002 + Math.random() * 0.004
            };
            root.add(node);
            nodeMeshes.push(node);
            nodePositions.push(node.position);
        }

        const linePoints = [];
        for (let i = 0; i < nodePositions.length; i += 1) {
            for (let j = i + 1; j < nodePositions.length; j += 1) {
                const dist = nodePositions[i].distanceTo(nodePositions[j]);
                if (dist < 3.1) {
                    linePoints.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
                    linePoints.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
                }
            }
        }

        const linkGeometry = new THREE.BufferGeometry();
        linkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
        const linkMaterial = new THREE.LineBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.26
        });
        const links = new THREE.LineSegments(linkGeometry, linkMaterial);
        root.add(links);

        const blockGeometry = new THREE.BoxGeometry(0.34, 0.34, 0.34);
        const blockMaterial = new THREE.MeshStandardMaterial({
            color: 0xa78bfa,
            emissive: 0x7c3aed,
            emissiveIntensity: 0.35,
            metalness: 0.68,
            roughness: 0.22
        });

        const chainBlocks = [];
        for (let i = 0; i < 24; i += 1) {
            const block = new THREE.Mesh(blockGeometry, blockMaterial.clone());
            block.userData = {
                t: i / 24,
                lane: i % 3,
                speed: 0.0016 + Math.random() * 0.0012
            };
            root.add(block);
            chainBlocks.push(block);
        }

        const flowGeometry = new THREE.BufferGeometry();
        const flowCount = 140;
        const flowData = [];
        const flowPositions = new Float32Array(flowCount * 3);
        for (let i = 0; i < flowCount; i += 1) {
            flowData.push({
                t: Math.random(),
                lane: i % 3,
                speed: 0.0015 + Math.random() * 0.0022
            });
            flowPositions[i * 3 + 0] = 0;
            flowPositions[i * 3 + 1] = 0;
            flowPositions[i * 3 + 2] = 0;
        }

        flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
        const flowMaterial = new THREE.PointsMaterial({
            color: 0x67e8f9,
            size: 0.05,
            transparent: true,
            opacity: 0.75,
            depthWrite: false
        });
        const flow = new THREE.Points(flowGeometry, flowMaterial);
        root.add(flow);

        function chainPosition(t, lane) {
            const angle = t * Math.PI * 2;
            const laneOffset = (lane - 1) * 1.8;
            const radius = 6.2 + lane * 0.65;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = laneOffset + Math.sin(angle * 2 + lane) * 0.85;
            return { x, y, z };
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        window.addEventListener('resize', onResize);

        function animate() {
            requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            root.rotation.y = Math.sin(time * 0.16) * 0.25;
            root.rotation.x = Math.cos(time * 0.11) * 0.06;

            for (let i = 0; i < nodeMeshes.length; i += 1) {
                const node = nodeMeshes[i];
                const pulse = 0.7 + Math.sin(time * 2.1 + node.userData.phase) * 0.3;
                node.material.emissiveIntensity = 0.22 + pulse * 0.52;
                node.position.y = node.userData.baseY + Math.sin(time * 1.3 + node.userData.phase) * (node.userData.drift * 160);
            }

            linkMaterial.opacity = 0.18 + (Math.sin(time * 1.8) * 0.5 + 0.5) * 0.18;

            for (let i = 0; i < chainBlocks.length; i += 1) {
                const block = chainBlocks[i];
                block.userData.t = (block.userData.t + block.userData.speed) % 1;
                const p = chainPosition(block.userData.t, block.userData.lane);
                block.position.set(p.x, p.y, p.z);
                block.rotation.x += 0.01;
                block.rotation.y += 0.013;
            }

            const pos = flowGeometry.attributes.position.array;
            for (let i = 0; i < flowData.length; i += 1) {
                const d = flowData[i];
                d.t = (d.t + d.speed) % 1;
                const p = chainPosition(d.t, d.lane);
                pos[i * 3 + 0] = p.x;
                pos[i * 3 + 1] = p.y;
                pos[i * 3 + 2] = p.z;
            }
            flowGeometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }

        animate();