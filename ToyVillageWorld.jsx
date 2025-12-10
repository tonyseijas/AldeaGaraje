import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ============ APP DEFINITIONS ============
const BUILDING_APPS = {
  tribal: {
    name: 'El Aula Magna',
    icon: '🎓',
    color: '#8B4513',
    description: 'Masterclass Player',
  },
  mediterranean: {
    name: 'El Vórtice',
    icon: '🏓',
    color: '#E74C3C',
    description: 'Pong vs Rocío',
  },
  cottage: {
    name: 'Configuración',
    icon: '⚙️',
    color: '#F39C12',
    description: 'Cottage',
  },
  well: {
    name: 'Pozo de los Deseos',
    icon: '✨',
    color: '#9B59B6',
    description: 'Propón nuevas apps',
  },
  market: {
    name: '¿Vas a llevar comida a la ofi?',
    icon: '🥗',
    color: '#27AE60',
    description: 'Tienda Saludable',
  },
  temple: {
    name: 'Las Nieves',
    icon: '🍺',
    color: '#C0392B',
    description: 'Bar de Reunión',
    isTemple: true, // Special flag for horn behavior (kept for congregation)
  },
  icecave: {
    name: 'La Taberna',
    icon: '🍺',
    color: '#9B59B6',
    description: 'Chat Multirelato',
  },
};

// ============ TABERNA CHARACTERS ============
const TABERNA_CHARACTERS = {
  dev: {
    name: 'Max',
    icon: '💻',
    color: '#2ECC71',
    role: 'CTO Cínico',
    style: 'Nivel de café: crítico',
  },
  designer: {
    name: 'Valentina',
    icon: '🎨',
    color: '#E91E63',
    role: 'Design Diva',
    style: 'Ex-Apple, ex-Nike',
  },
  data: {
    name: 'El Data',
    icon: '📊',
    color: '#3498DB',
    role: 'Buitre de los Números',
    style: 'Sin Excel no hay paraíso',
  },
};

// System prompts profesionales para cada personaje de la Taberna
const TABERNA_SYSTEM_PROMPTS = {
  data: `Eres el Head de Data en Garaje de Ideas. Te llaman "El Buitre de los Números".

PERSONALIDAD: Frío, directo, obsesionado con el EBITDA. No crees en nada sin un Excel detrás. Cuando alguien dice "creo que..." tú respondes "¿qué datos tienes?". El hype tecnológico te da urticaria.

FRASES TÍPICAS:
- "¿Cuál es el margen? Sin 20% no hay negocio."
- "No news, bad news."
- "Soft AI sí, Hard AI de 800k€ no."
- "¿Eso escala? Enséñame los unit economics."

CONTEXTO: Estás en La Taberna del Debate con Max (CTO cínico) y Valentina (Design Diva). Os lleváis bien pero discutís constantemente. Tú eres el aguafiestas que pide números cuando ellos sueñan.

FORMATO: Máximo 2 frases. Seco. Pide datos. Cuestiona el ROI.`,

  dev: `Eres Max, CTO con 25 años de guerra. Sobreviviste al Efecto 2000, a Flash y a la migración a React. Mezcla de Dr. House y Gilfoyle.

PERSONALIDAD: Cínico, brillante, cafeinómano. Tu paciencia murió en 2008 junto con IE6. El código ajeno te da náuseas. Los PMs son tu enemigo natural.

FRASES TÍPICAS:
- "Eso escala fatal."
- "¿Rápido, barato o bien hecho? Escoge dos."
- "No se despliega en viernes. Jamás."
- "Works on my machine no es un test."
- "Otro framework de JS que mañana está muerto."

VOCABULARIO: Div Soup, Spaghetti Code, Monolito de Basura, npm install internet, Consultas N+Muerte.

CONTEXTO: Estás en La Taberna con Valentina (la diva del diseño que te pide imposibles) y El Data (el buitre de los números). Valentina te saca de quicio con sus "3 píxeles a la izquierda". Data a veces tiene razón y eso te molesta más.

FORMATO: Máximo 2 frases. Sarcasmo puro. Si mencionas café, está en nivel crítico.`,

  designer: `Eres Valentina, Directora Creativa. Ex-Apple (el gris no era suficientemente espacial), ex-Nike (diseñaste el aire de la suela). Miranda Priestly con Sketch.

PERSONALIDAD: Elitista, dramática, genial. La fealdad te ofende físicamente. Bebes cosas que cuestan más que un alquiler. Tu ropa es vintage japonés o Balenciaga sucio a propósito.

FRASES TÍPICAS:
- "Le falta aire. Se asfixia."
- "Ese azul tiene la profundidad de un mantel de pizzería."
- "Arial es para cartas de despido."
- "El color es un privilegio, no un derecho."
- "Esto no tiene soul."

VOCABULARIO: Kernear, white space, grid system, moodboard, "es muy pedestrian", "necesita crunch visual".

CONTEXTO: Estás en La Taberna con Max (el CTO cascarrabias que dice que todo "escala fatal") y El Data (el buitre que solo habla de márgenes). Max te irrita porque no entiende la estética. Data te aburre con sus Excels.

FORMATO: Máximo 2 frases. Sé específica (hex codes, tipografías). Menciona tu matcha o tu kimono si viene al caso.`,
};

export default function ToyVillageWorld() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [activeApp, setActiveApp] = useState(null);
  const [nearBuilding, setNearBuilding] = useState(null);
  const nearBuildingRef = useRef(null);
  const activeAppRef = useRef(null);
  
  // Congregation system (horn召集)
  const [isCongregating, setIsCongregating] = useState(false);
  const congregationRef = useRef({
    active: false,
    templeX: 130,
    templeZ: 15,
    originalPositions: [], // Store original NPC/animal positions
  });
  
  // Swimming message (deep sea)
  const [swimmingMessage, setSwimmingMessage] = useState(null);
  const swimmingMessageShown = useRef(false);
  
  // Beach ball game refs
  const beachBallRef = useRef(null);
  const beachKidsRef = useRef([]);
  const ballStateRef = useRef({
    x: 0, z: 180,
    vx: 0, vz: 0,
    height: 1.2,
    vy: 0,
    isFlying: false,
    targetKidIndex: 0,
    currentKidIndex: -1,
    fetchingKidIndex: -1,
    waitTimer: 0,
  });
  
  // Drowning mechanic
  const [waterOverlay, setWaterOverlay] = useState(0); // 0-1 opacity for water covering screen
  const [isDrowning, setIsDrowning] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);

  // Keep refs in sync with state
  useEffect(() => {
    nearBuildingRef.current = nearBuilding;
  }, [nearBuilding]);
  
  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 150, 400);

    // Camera with zoom support
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 100, 150);
    let cameraZoom = 1;
    let targetZoom = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping; // Disable tone mapping for consistent brightness
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting - bright and consistent
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4); // High ambient for bright look
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaf0, 0.8); // Brighter sun
    sunLight.position.set(150, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -250;
    sunLight.shadow.camera.right = 250;
    sunLight.shadow.camera.top = 250;
    sunLight.shadow.camera.bottom = -250;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3); // Brighter rim
    rimLight.position.set(-100, 80, -100);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xB0D4E8, 0xA8D5A2, 0.4); // Pastel sky/ground colors
    scene.add(hemiLight);
    
    // Soft fog for dreamy pastel atmosphere
    scene.fog = new THREE.Fog(0xE8F4F8, 100, 350);

    // Materials helper - high roughness, low metalness for soft matte pastel look
    function createGlossyMaterial(color, metalness = 0.02, roughness = 0.6) {
      return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness,
      });
    }

    // ============ TERRAIN SYSTEM - VALLEY LAYOUT ============
    // Based on design document: River (South) → Market → Plaza → Forest/Meadows (North)
    // Extended south: Beach → Sea at the far south
    
    // EXCLUSION ZONES - areas where trees/rocks should NOT spawn
    const EXCLUSION_ZONES = [
      // === MAIN PLAZA (4 buildings + well) ===
      { x: -70, z: 35, r: 55 },     // Main plaza area
      { x: -100, z: 55, r: 20 },    // Tribal House (NW plaza)
      { x: -40, z: 55, r: 20 },     // Bar Las Nieves (NE plaza)
      { x: -100, z: 15, r: 18 },    // Cottage House (SW plaza)
      { x: -40, z: 15, r: 18 },     // Library (SE plaza)
      { x: -70, z: 8, r: 10 },      // Well (center bottom of plaza)
      // === OTHER BUILDINGS ===
      { x: 60, z: 45, r: 18 },      // Mediterranean House
      { x: -170, z: -170, r: 30 },  // Ice Cave House
      { x: 10, z: -55, r: 12 },     // Well alto (north)
      { x: 25, z: 32, r: 20 },      // Market area
      { x: 45, z: -45, r: 15 },     // Jacuzzi
      { x: -10, z: 85, r: 15 },     // Bridge
      { x: -85, z: 75, r: 10 },     // Canoe
      { x: 0, z: 180, r: 100 },     // Beach area (no trees on beach)
    ];
    
    function isInExclusionZone(x, z) {
      for (const zone of EXCLUSION_ZONES) {
        const dist = Math.sqrt((x - zone.x) ** 2 + (z - zone.z) ** 2);
        if (dist < zone.r) return true;
      }
      return false;
    }
    
    // Beach and sea zones - extended grass area before beach
    const BEACH_START_Z = 140;  // Beach starts further south (more grass)
    const SEA_START_Z = 200;    // Sea begins here
    const SEA_DEEP_Z = 220;     // Deep sea starts here
    const SEA_DEATH_Z = 270;    // Player drowns at this depth
    
    function isOnBeach(x, z) {
      return z > BEACH_START_Z && z < SEA_START_Z;
    }
    
    function isInSea(x, z) {
      return z >= SEA_START_Z;
    }
    
    function isInDeepSea(x, z) {
      return z >= SEA_DEEP_Z;
    }
    
    function isInDeathZone(x, z) {
      return z >= SEA_DEATH_Z;
    }
    
    // Height calculation - smooth valley with river at south
    function getTerrainHeight(x, z) {
      // Check if on bridge - smooth transition from terrain to bridge deck
      const riverCenterZ = 85 + Math.sin(x * 0.015) * 15;
      const bridgeX = -10;
      const bridgeHalfWidth = 7;
      const bridgeZoneHalfLength = 15;
      const bridgeDeckHeight = 4; // Lower bridge height
      
      // Calculate distance from bridge center
      const distFromBridgeX = Math.abs(x - bridgeX);
      const distFromBridgeZ = Math.abs(z - riverCenterZ);
      
      if (distFromBridgeX < bridgeHalfWidth + 8 && distFromBridgeZ < bridgeZoneHalfLength + 5) {
        // In bridge transition zone
        let baseHeight = Math.max(0, (80 - z) * 0.15);
        baseHeight += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.5;
        
        if (distFromBridgeX < bridgeHalfWidth && distFromBridgeZ < bridgeZoneHalfLength) {
          // On bridge deck
          return bridgeDeckHeight;
        } else {
          // Smooth transition ramp to bridge
          const xTransition = Math.max(0, distFromBridgeX - bridgeHalfWidth) / 8;
          const zTransition = Math.max(0, distFromBridgeZ - bridgeZoneHalfLength) / 5;
          const transition = Math.max(xTransition, zTransition);
          const smoothT = transition * transition * (3 - 2 * transition); // Smoothstep
          return bridgeDeckHeight * (1 - smoothT) + baseHeight * smoothT;
        }
      }
      
      // Bar area - characters walk at GROUND LEVEL around the bar
      // The bar structure is on a deck, but the floor where characters walk is ground level
      const BAR_X = -40;  // New position: NE corner of main plaza
      const BAR_Z = 55;
      const barDistSq = (x - BAR_X) ** 2 + (z - BAR_Z) ** 2;
      const barRadius = 22 * 1.2; // Scale 1.2
      
      // Inside temple - return normal terrain height (characters walk under columns)
      // No special elevation for temple area
      
      let height = 0;
      
      // Main valley slope: lower in south (positive Z), higher in north (negative Z)
      // River is at z ≈ 80-100
      const valleyBase = Math.max(0, (80 - z) * 0.15);
      height = valleyBase;
      
      // Central hill for "Cota Alta" (forest/meadow area) in the north
      const distFromNorthCenter = Math.sqrt((x - 0) ** 2 + (z + 60) ** 2);
      if (distFromNorthCenter < 100) {
        const hillInfluence = Math.max(0, 1 - distFromNorthCenter / 100);
        const smoothHill = hillInfluence * hillInfluence * (3 - 2 * hillInfluence);
        height += smoothHill * 25;
      }
      
      // Secondary ridge on the west for variety
      const distFromWestRidge = Math.sqrt((x + 100) ** 2 + (z + 20) ** 2);
      if (distFromWestRidge < 60) {
        const ridgeInfluence = Math.max(0, 1 - distFromWestRidge / 60);
        const smoothRidge = ridgeInfluence * ridgeInfluence * (3 - 2 * ridgeInfluence);
        height += smoothRidge * 12;
      }
      
      // River valley depression - carves through the southern area
      const distFromRiver = Math.abs(z - riverCenterZ);
      if (distFromRiver < 25) {
        const riverInfluence = 1 - distFromRiver / 25;
        const smoothRiver = riverInfluence * riverInfluence;
        height = Math.max(0, height - smoothRiver * 8);
      }
      
      // Beach area - flat and slightly above sea level
      if (z > BEACH_START_Z) {
        // Transition to beach
        const beachProgress = Math.min(1, (z - BEACH_START_Z) / 20);
        height = height * (1 - beachProgress) + 1 * beachProgress; // Flatten to 1
        
        // Sea - below beach level
        if (z >= SEA_START_Z) {
          const seaProgress = Math.min(1, (z - SEA_START_Z) / 30);
          height = 1 - seaProgress * 3; // Goes down to -2
        }
      }
      
      // Gentle undulations for organic feel (not in sea)
      if (z < SEA_START_Z) {
        height += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.5;
        height += Math.sin(x * 0.07 + 1) * Math.cos(z * 0.05) * 0.8;
      }
      
      return Math.max(-3, height); // Allow negative for sea floor
    }

    // Create visual terrain mesh
    function createTerrainMesh() {
      // Asymmetric terrain: expanded 500 north/east/west, south stays for sea
      const sizeX = 1560; // -780 to +780
      const sizeZ = 1060; // -780 (north) to +280 (south/sea)
      const segmentsX = 180;
      const segmentsZ = 130;
      const geometry = new THREE.PlaneGeometry(sizeX, sizeZ, segmentsX, segmentsZ);
      
      const positions = geometry.attributes.position.array;
      
      // Create color array for vertex colors
      const colors = new Float32Array(positions.length);
      
      // Grass color (RGB normalized)
      const grassR = 0x7C / 255, grassG = 0xB3 / 255, grassB = 0x42 / 255;
      // Snow color (RGB normalized) 
      const snowR = 0xFA / 255, snowG = 0xFA / 255, snowB = 0xFA / 255;
      // Sand color (warm beige)
      const sandR = 0xF5 / 255, sandG = 0xE6 / 255, sandB = 0xC8 / 255;
      // Sea color (turquoise)
      const seaR = 0x48 / 255, seaG = 0xD1 / 255, seaB = 0xCC / 255;
      // Deep sea
      const deepSeaR = 0x20 / 255, deepSeaG = 0xB2 / 255, deepSeaB = 0xAA / 255;
      // Very deep sea (death zone)
      const veryDeepR = 0x10 / 255, veryDeepG = 0x80 / 255, veryDeepB = 0x70 / 255;
      
      // Offset Z to center the asymmetric terrain: center is at (-780+280)/2 = -250
      const zOffset = -250;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 1]; // In local space before rotation
        const worldZ = -z + zOffset; // After rotation and offset
        
        positions[i + 2] = getTerrainHeight(x, worldZ);
        
        // Determine color based on zone
        let r, g, b;
        
        if (worldZ >= SEA_DEATH_Z) {
          // Death zone - very deep
          r = veryDeepR; g = veryDeepG; b = veryDeepB;
        } else if (worldZ >= SEA_START_Z) {
          // Sea zone - gradual depth
          const seaDepth = Math.min(1, (worldZ - SEA_START_Z) / 70);
          r = seaR + (veryDeepR - seaR) * seaDepth;
          g = seaG + (veryDeepG - seaG) * seaDepth;
          b = seaB + (veryDeepB - seaB) * seaDepth;
        } else if (worldZ >= BEACH_START_Z) {
          // Beach zone - sand
          r = sandR;
          g = sandG;
          b = sandB;
        } else if (worldZ < -30) {
          // Frozen zone - snow color with slight gradient
          const frozenDepth = Math.min(1, (-30 - worldZ) / 200); // Extended for larger map
          // Blend to pure snow
          r = grassR + (snowR - grassR) * (0.7 + frozenDepth * 0.3);
          g = grassG + (snowG - grassG) * (0.7 + frozenDepth * 0.3);
          b = grassB + (snowB - grassB) * (0.7 + frozenDepth * 0.3);
        } else if (worldZ < -20) {
          // Transition zone - gradual blend
          const blend = (-20 - worldZ) / 10; // 0 at z=-20, 1 at z=-30
          r = grassR + (snowR - grassR) * blend * 0.7;
          g = grassG + (snowG - grassG) * blend * 0.7;
          b = grassB + (snowB - grassB) * blend * 0.7;
        } else {
          // Normal grass
          r = grassR;
          g = grassG;
          b = grassB;
        }
        
        colors[i] = r;
        colors[i + 1] = g;
        colors[i + 2] = b;
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      
      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.02,
        flatShading: false,
      });
      
      const terrain = new THREE.Mesh(geometry, terrainMat);
      terrain.rotation.x = -Math.PI / 2;
      terrain.position.z = zOffset; // Offset to match world coordinates
      terrain.receiveShadow = true;
      scene.add(terrain);
      
      addTerrainDetails();
      return terrain;
    }

    function addTerrainDetails() {
      // Sandy/cobblestone paths (only in non-frozen zone)
      const pathMat = createGlossyMaterial(0xC9B896, 0.05, 0.6);
      
      // Main path: From entrance (south) through market to plaza
      for (let t = 0; t <= 1; t += 0.015) {
        const x = -20 + Math.sin(t * Math.PI * 0.5) * 30;
        const z = 100 - t * 120;
        if (z > -25) { // Stop before frozen zone
          const y = getTerrainHeight(x, z);
          
          const pathPiece = new THREE.Mesh(
            new THREE.CircleGeometry(5 + Math.random() * 2, 8),
            pathMat
          );
          pathPiece.rotation.x = -Math.PI / 2;
          pathPiece.position.set(x, y + 0.3, z);
          scene.add(pathPiece);
        }
      }
      
      // Path from plaza to forest (stops at frozen zone edge)
      for (let t = 0; t <= 0.6; t += 0.02) {
        const x = 10 + Math.sin(t * Math.PI * 0.3) * 15;
        const z = -20 - t * 60;
        if (z > -35) {
          const y = getTerrainHeight(x, z);
          
          const pathPiece = new THREE.Mesh(
            new THREE.CircleGeometry(3.5 + Math.random() * 1.5, 8),
            pathMat
          );
          pathPiece.rotation.x = -Math.PI / 2;
          pathPiece.position.set(x, y + 0.3, z);
          scene.add(pathPiece);
        }
      }
      
      // Frozen path in north (icy, slippery looking)
      const frozenPathMat = createGlossyMaterial(0xB3E5FC, 0.2, 0.1);
      for (let t = 0; t <= 1; t += 0.025) {
        const x = 10 + Math.sin(t * Math.PI * 0.4) * 20;
        const z = -35 - t * 50;
        const y = getTerrainHeight(x, z);
        
        const pathPiece = new THREE.Mesh(
          new THREE.CircleGeometry(4 + Math.random() * 2, 8),
          frozenPathMat
        );
        pathPiece.rotation.x = -Math.PI / 2;
        pathPiece.position.set(x, y + 0.3, z);
        scene.add(pathPiece);
      }
      
      // Lateral path to west ridge (non-frozen)
      for (let t = 0; t <= 1; t += 0.02) {
        const x = -20 - t * 70;
        const z = 20 - t * 30;
        const y = getTerrainHeight(x, z);
        
        const pathPiece = new THREE.Mesh(
          new THREE.CircleGeometry(3 + Math.random() * 1.5, 8),
          pathMat
        );
        pathPiece.rotation.x = -Math.PI / 2;
        pathPiece.position.set(x, y + 0.3, z);
        scene.add(pathPiece);
      }
      
      // Market plaza area (cobblestone)
      const plazaMat = createGlossyMaterial(0xA69070, 0.05, 0.5);
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 20;
        const x = -10 + Math.cos(angle) * dist;
        const z = 50 + Math.sin(angle) * dist * 0.7;
        const y = getTerrainHeight(x, z);
        
        const stone = new THREE.Mesh(
          new THREE.CircleGeometry(2.5 + Math.random() * 2, 6),
          plazaMat
        );
        stone.rotation.x = -Math.PI / 2;
        stone.position.set(x, y + 0.3, z);
        scene.add(stone);
      }
      
      // Plaza Mayor area (mid zone)
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 18;
        const x = 0 + Math.cos(angle) * dist;
        const z = 0 + Math.sin(angle) * dist;
        const y = getTerrainHeight(x, z);
        
        const stone = new THREE.Mesh(
          new THREE.CircleGeometry(2 + Math.random() * 1.5, 6),
          plazaMat
        );
        stone.rotation.x = -Math.PI / 2;
        stone.position.set(x, y + 0.3, z);
        scene.add(stone);
      }
    }

    createTerrainMesh();

    // ============ RIVER ============
    function createRiver() {
      const group = new THREE.Group();
      
      // River flows West to East at southern edge
      // Use a flat plane instead of tube to avoid terrain clipping
      const riverWidth = 24;
      const riverLength = 1560; // Extended for much larger map
      const segments = 150;
      
      const riverGeom = new THREE.PlaneGeometry(riverLength, riverWidth, segments, 1);
      const positions = riverGeom.attributes.position.array;
      
      // Bridge position for lowering river under it
      const bridgeX = -10;
      const bridgeInfluenceRadius = 30;
      
      // Deform the plane to follow the river curve and terrain
      for (let i = 0; i < positions.length; i += 3) {
        const localX = positions[i];
        const localZ = positions[i + 1];
        
        // Apply river curve (sine wave)
        const worldX = localX;
        const riverCurveZ = 85 + Math.sin(worldX * 0.015) * 15;
        const worldZ = riverCurveZ + localZ;
        
        // Get terrain height 
        const terrainY = getTerrainHeight(worldX, worldZ);
        
        // Lower the river near the bridge so it passes underneath
        const distFromBridge = Math.abs(worldX - bridgeX);
        let riverHeight = terrainY + 1.5;
        
        if (distFromBridge < bridgeInfluenceRadius) {
          // Smooth depression under bridge
          const bridgeInfluence = 1 - distFromBridge / bridgeInfluenceRadius;
          const smoothInfluence = bridgeInfluence * bridgeInfluence * (3 - 2 * bridgeInfluence);
          // Lower the river by up to 3 units under the bridge
          riverHeight = terrainY + 1.5 - smoothInfluence * 3;
        }
        
        positions[i + 2] = Math.max(riverHeight, 0.5); // Minimum height
      }
      
      riverGeom.computeVertexNormals();
      
      const waterMat = createGlossyMaterial(0x4FC3F7, 0.3, 0.1);
      const river = new THREE.Mesh(riverGeom, waterMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, 0, 85);
      group.add(river);

      // River banks with rocks
      const bankMat = createGlossyMaterial(0x8D6E63, 0.1, 0.5);
      for (let i = 0; i < 50; i++) {
        const x = -170 + i * 7;
        const riverZ = 85 + Math.sin(x * 0.015) * 15;
        
        if (Math.random() > 0.4) {
          const rockSize = 1.5 + Math.random() * 2.5;
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rockSize, 1),
            bankMat
          );
          const side = Math.random() > 0.5 ? 1 : -1;
          const rz = riverZ + side * (14 + Math.random() * 5);
          rock.position.set(x, getTerrainHeight(x, rz) + rockSize * 0.3, rz);
          rock.rotation.set(Math.random(), Math.random(), Math.random());
          rock.scale.y = 0.5 + Math.random() * 0.3;
          rock.castShadow = true;
          group.add(rock);
        }
      }

      scene.add(group);
    }
    createRiver();

    // ============ SEA ============
    function createSea() {
      // Sea water plane - extended for new map size and deeper drowning zone
      const seaGeom = new THREE.PlaneGeometry(1600, 100, 60, 15);
      const seaMat = new THREE.MeshStandardMaterial({
        color: 0x48D1CC,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const sea = new THREE.Mesh(seaGeom, seaMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -1, SEA_START_Z + 50);
      scene.add(sea);
      
      // Gentle waves decoration
      for (let i = 0; i < 50; i++) {
        const waveX = (Math.random() - 0.5) * 1500;
        const waveZ = SEA_START_Z + 5 + Math.random() * 60;
        const waveMat = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.8,
          transparent: true,
          opacity: 0.4,
        });
        const wave = new THREE.Mesh(
          new THREE.CircleGeometry(3 + Math.random() * 4, 8),
          waveMat
        );
        wave.rotation.x = -Math.PI / 2;
        wave.position.set(waveX, 0.3, waveZ);
        scene.add(wave);
      }
    }
    createSea();

    // ============ BEACH DECORATIONS ============
    function createBeachUmbrella(x, z, color) {
      const group = new THREE.Group();
      const y = getTerrainHeight(x, z);
      
      // Pole
      const poleMat = createGlossyMaterial(0x8B4513);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
        poleMat
      );
      pole.position.y = 4;
      group.add(pole);
      
      // Umbrella top
      const umbrellaMat = createGlossyMaterial(color);
      const umbrella = new THREE.Mesh(
        new THREE.ConeGeometry(5, 2, 8),
        umbrellaMat
      );
      umbrella.position.y = 8.5;
      umbrella.rotation.x = Math.PI;
      group.add(umbrella);
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }
    
    function createBeachTowel(x, z, color) {
      const y = getTerrainHeight(x, z);
      const towelMat = createGlossyMaterial(color);
      const towel = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 6),
        towelMat
      );
      towel.position.set(x, y + 0.1, z);
      towel.rotation.y = Math.random() * 0.5;
      scene.add(towel);
    }
    
    function createBeachBall(x, z) {
      const y = getTerrainHeight(x, z);
      const group = new THREE.Group();
      
      // Ball with stripes
      const ballSize = 1.2;
      const ballMat1 = createGlossyMaterial(0xFF4444);
      const ballMat2 = createGlossyMaterial(0xFFFF44);
      const ballMat3 = createGlossyMaterial(0x4444FF);
      
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballSize, 16, 16),
        ballMat1
      );
      ball.position.y = ballSize;
      group.add(ball);
      
      // Stripe rings
      const stripe1 = new THREE.Mesh(
        new THREE.TorusGeometry(ballSize * 0.9, 0.15, 8, 16),
        ballMat2
      );
      stripe1.position.y = ballSize;
      stripe1.rotation.x = Math.PI / 2;
      group.add(stripe1);
      
      const stripe2 = new THREE.Mesh(
        new THREE.TorusGeometry(ballSize * 0.9, 0.15, 8, 16),
        ballMat3
      );
      stripe2.position.y = ballSize;
      group.add(stripe2);
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }
    
    function createBeachKid(x, z, shirtColor) {
      const group = new THREE.Group();
      const y = getTerrainHeight(x, z);
      
      // Simple kid figure (smaller than NPCs)
      const skinMat = createGlossyMaterial(0xFFDBB4);
      const shirtMat = createGlossyMaterial(shirtColor);
      const shortsMat = createGlossyMaterial(0x4169E1);
      const hairMat = createGlossyMaterial(0x3D2314);
      
      // Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.6, 2, 8),
        shirtMat
      );
      body.position.y = 2.5;
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 12),
        skinMat
      );
      head.position.y = 4;
      group.add(head);
      
      // Hair
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 12, 12),
        hairMat
      );
      hair.position.y = 4.2;
      hair.scale.y = 0.6;
      group.add(hair);
      
      // Legs (shorts)
      const legL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.2, 1.2, 6),
        shortsMat
      );
      legL.position.set(-0.3, 0.9, 0);
      group.add(legL);
      
      const legR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.2, 1.2, 6),
        shortsMat
      );
      legR.position.set(0.3, 0.9, 0);
      group.add(legR);
      
      // Arms
      const armL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1, 6),
        skinMat
      );
      armL.position.set(-1, 3, 0);
      armL.rotation.z = 0.5;
      group.add(armL);
      
      const armR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1, 6),
        skinMat
      );
      armR.position.set(1, 3, 0);
      armR.rotation.z = -0.5;
      group.add(armR);
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }
    
    // ============ INTERACTIVE BEACH BALL GAME ============
    // Kids play catch. If player hits ball, it bounces and a kid fetches it.
    
    function createInteractiveBeachBall(x, z) {
      const y = getTerrainHeight(x, z);
      const group = new THREE.Group();
      
      // Ball with stripes
      const ballSize = 1.2;
      const ballMat1 = createGlossyMaterial(0xFF4444);
      const ballMat2 = createGlossyMaterial(0xFFFF44);
      const ballMat3 = createGlossyMaterial(0x4444FF);
      
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballSize, 16, 16),
        ballMat1
      );
      ball.position.y = ballSize;
      group.add(ball);
      
      // Stripe rings
      const stripe1 = new THREE.Mesh(
        new THREE.TorusGeometry(ballSize * 0.9, 0.15, 8, 16),
        ballMat2
      );
      stripe1.position.y = ballSize;
      stripe1.rotation.x = Math.PI / 2;
      group.add(stripe1);
      
      const stripe2 = new THREE.Mesh(
        new THREE.TorusGeometry(ballSize * 0.9, 0.15, 8, 16),
        ballMat3
      );
      stripe2.position.y = ballSize;
      group.add(stripe2);
      
      group.position.set(x, y, z);
      scene.add(group);
      
      ballStateRef.current.x = x;
      ballStateRef.current.z = z;
      beachBallRef.current = group;
      
      return group;
    }
    
    function createInteractiveBeachKid(x, z, shirtColor, index) {
      const group = new THREE.Group();
      const y = getTerrainHeight(x, z);
      
      const skinMat = createGlossyMaterial(0xFFDBB4);
      const shirtMat = createGlossyMaterial(shirtColor);
      const shortsMat = createGlossyMaterial(0x4169E1);
      const hairMat = createGlossyMaterial(0x3D2314);
      
      // Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.6, 2, 8),
        shirtMat
      );
      body.position.y = 2.5;
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 12),
        skinMat
      );
      head.position.y = 4;
      group.add(head);
      
      // Hair
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 12, 12),
        hairMat
      );
      hair.position.y = 4.2;
      hair.scale.y = 0.6;
      group.add(hair);
      
      // Legs
      const legL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.2, 1.2, 6),
        shortsMat
      );
      legL.position.set(-0.3, 0.9, 0);
      group.add(legL);
      
      const legR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.2, 1.2, 6),
        shortsMat
      );
      legR.position.set(0.3, 0.9, 0);
      group.add(legR);
      
      // Arms (will animate)
      const armL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1, 6),
        skinMat
      );
      armL.position.set(-1, 3, 0);
      armL.rotation.z = 0.5;
      armL.name = 'armL';
      group.add(armL);
      
      const armR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1, 6),
        skinMat
      );
      armR.position.set(1, 3, 0);
      armR.rotation.z = -0.5;
      armR.name = 'armR';
      group.add(armR);
      
      group.position.set(x, y, z);
      group.userData = {
        homeX: x,
        homeZ: z,
        index: index,
        targetX: x,
        targetZ: z,
        state: 'idle', // idle, throwing, fetching, returning
      };
      scene.add(group);
      
      beachKidsRef.current.push(group);
      return group;
    }
    
    // Place beach items
    createBeachUmbrella(-40, 160, 0xFF6B6B);
    createBeachUmbrella(20, 168, 0x4ECDC4);
    createBeachUmbrella(70, 155, 0xFFE66D);
    createBeachUmbrella(-80, 172, 0x95E1D3);
    createBeachUmbrella(120, 165, 0xFF9F43);
    createBeachUmbrella(-120, 158, 0x70A1FF);
    
    createBeachTowel(-35, 162, 0xF38181);
    createBeachTowel(25, 170, 0x3D5A80);
    createBeachTowel(65, 157, 0xFFD93D);
    createBeachTowel(-75, 175, 0x6BCB77);
    createBeachTowel(115, 167, 0xA29BFE);
    
    // Create interactive ball and kids
    createInteractiveBeachBall(0, 178);
    createInteractiveBeachKid(-12, 185, 0xFF6B6B, 0);
    createInteractiveBeachKid(14, 175, 0x4ECDC4, 1);
    createInteractiveBeachKid(0, 168, 0xFFE66D, 2);
    
    // Ball starts with kid 0
    ballStateRef.current.currentKidIndex = 0;
    ballStateRef.current.waitTimer = 2000;

    // ============ BRIDGES ============
    function createWoodenBridge(x, z, rotation = 0, length = 30) {
      const group = new THREE.Group();
      const woodMat = createGlossyMaterial(0x8B5A2B);
      const darkWoodMat = createGlossyMaterial(0x5D4037);

      // Get terrain heights at bridge ends to calculate proper height
      const riverZ = 85 + Math.sin(x * 0.015) * 15;
      const bankNorth = getTerrainHeight(x, riverZ - 18);
      const bankSouth = getTerrainHeight(x, riverZ + 18);
      // Bridge deck at 4 units to match getTerrainHeight bridgeDeckHeight
      const bridgeBaseY = 4;

      // Main deck - positioned so top surface is at y=0 of group
      const deckGeom = new THREE.BoxGeometry(length, 1.5, 10);
      const deck = new THREE.Mesh(deckGeom, woodMat);
      deck.position.y = 0.75; // Deck surface at bridge base
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);

      // Planks on top of deck
      for (let i = -length/2 + 2; i < length/2; i += 2) {
        const plankGeom = new THREE.BoxGeometry(1.5, 0.3, 9);
        const plank = new THREE.Mesh(plankGeom, darkWoodMat);
        plank.position.set(i, 1.65, 0);
        group.add(plank);
      }

      // Rails - lower
      const railGeom = new THREE.CylinderGeometry(0.4, 0.4, length, 8);
      const railL = new THREE.Mesh(railGeom, woodMat);
      railL.rotation.z = Math.PI / 2;
      railL.position.set(0, 3.5, -4);
      group.add(railL);

      const railR = new THREE.Mesh(railGeom, woodMat);
      railR.rotation.z = Math.PI / 2;
      railR.position.set(0, 3.5, 4);
      group.add(railR);

      // Posts - shorter
      const postGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
      for (let i = -length/2 + 3; i < length/2; i += length/4) {
        const postL = new THREE.Mesh(postGeom, darkWoodMat);
        postL.position.set(i, 2.5, -4);
        postL.castShadow = true;
        group.add(postL);

        const postR = new THREE.Mesh(postGeom, darkWoodMat);
        postR.position.set(i, 2.5, 4);
        postR.castShadow = true;
        group.add(postR);
      }

      // Support pillars going down to water - shorter
      const pillarHeight = 5;
      const pillarGeom = new THREE.CylinderGeometry(1.2, 1.5, pillarHeight, 8);
      
      const pillarL = new THREE.Mesh(pillarGeom, darkWoodMat);
      pillarL.position.set(-length/4, -pillarHeight/2 + 0.5, 0);
      pillarL.castShadow = true;
      group.add(pillarL);

      const pillarR = new THREE.Mesh(pillarGeom, darkWoodMat);
      pillarR.position.set(length/4, -pillarHeight/2 + 0.5, 0);
      pillarR.castShadow = true;
      group.add(pillarR);

      group.position.set(x, bridgeBaseY, riverZ);
      group.rotation.y = rotation;
      scene.add(group);
      return group;
    }

    // Main bridge (Puente Principal) - the only way to cross the river
    createWoodenBridge(-10, 85, Math.PI / 2, 28);

    // ============ BUILDINGS ============
    
    // Tribal/Asian style building (Image 1 reference)
    function createTribalHouse(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Base/foundation with stones
      const baseGeom = new THREE.CylinderGeometry(10 * scale, 12 * scale, 3 * scale, 6);
      const stoneMat = createGlossyMaterial(0x78909C);
      const base = new THREE.Mesh(baseGeom, stoneMat);
      base.position.y = 1.5 * scale;
      base.castShadow = true;
      group.add(base);

      // Main body (red wood)
      const bodyGeom = new THREE.BoxGeometry(16 * scale, 12 * scale, 14 * scale);
      const redWoodMat = createGlossyMaterial(0xC62828);
      const body = new THREE.Mesh(bodyGeom, redWoodMat);
      body.position.y = 9 * scale;
      body.castShadow = true;
      group.add(body);

      // Wooden frame strips
      const stripMat = createGlossyMaterial(0x8B4513);
      for (let i = -1; i <= 1; i++) {
        const vStrip = new THREE.Mesh(
          new THREE.BoxGeometry(1 * scale, 12 * scale, 0.5 * scale),
          stripMat
        );
        vStrip.position.set(i * 5 * scale, 9 * scale, 7.3 * scale);
        group.add(vStrip);
      }

      // Decorative symbols (white paint)
      const symbolMat = createGlossyMaterial(0xECEFF1);
      const symbol1 = new THREE.Mesh(
        new THREE.TorusGeometry(2 * scale, 0.4 * scale, 8, 16, Math.PI * 1.5),
        symbolMat
      );
      symbol1.position.set(-5 * scale, 10 * scale, 7.4 * scale);
      group.add(symbol1);

      // Yellow curved roof
      const roofMat = createGlossyMaterial(0xFFD54F);
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-12, 0);
      roofShape.quadraticCurveTo(-12, 8, 0, 10);
      roofShape.quadraticCurveTo(12, 8, 12, 0);
      roofShape.lineTo(-12, 0);
      
      const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
        depth: 18 * scale,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
        bevelSegments: 4
      });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.scale.set(scale, scale, scale);
      roof.rotation.y = Math.PI / 2;
      roof.position.set(-9 * scale, 15 * scale, 0);
      roof.castShadow = true;
      group.add(roof);

      // Red horn spikes on roof
      const hornMat = createGlossyMaterial(0xE53935);
      for (let i = 0; i < 5; i++) {
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(1 * scale, 4 * scale, 8),
          hornMat
        );
        horn.position.set(
          (i - 2) * 4 * scale,
          23 * scale + Math.sin(i * 0.8) * 2,
          0
        );
        horn.rotation.z = (i - 2) * 0.15;
        group.add(horn);
      }

      // Roof beam ends (striped)
      const beamMat = createGlossyMaterial(0x5D4037);
      const stripeMat = createGlossyMaterial(0xE0E0E0);
      for (let side = -1; side <= 1; side += 2) {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2 * scale, 1 * scale, 6 * scale, 8),
          beamMat
        );
        beam.rotation.z = Math.PI / 2;
        beam.position.set(side * 11 * scale, 15 * scale, 8 * scale);
        group.add(beam);
        
        // Stripes
        for (let s = 0; s < 3; s++) {
          const stripe = new THREE.Mesh(
            new THREE.TorusGeometry(1.1 * scale, 0.2 * scale, 8, 16),
            stripeMat
          );
          stripe.rotation.y = Math.PI / 2;
          stripe.position.set(side * (9 + s * 1.5) * scale, 15 * scale, 8 * scale);
          group.add(stripe);
        }
      }

      // Door
      const doorGeom = new THREE.BoxGeometry(5 * scale, 8 * scale, 0.5 * scale);
      const doorMat = createGlossyMaterial(0xFF7043);
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(0, 7 * scale, 7.3 * scale);
      group.add(door);

      // Door decoration
      const doorDeco = new THREE.Mesh(
        new THREE.CircleGeometry(1.5 * scale, 6),
        createGlossyMaterial(0xFFD700, 0.5)
      );
      doorDeco.position.set(0, 9 * scale, 7.6 * scale);
      group.add(doorDeco);

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // Ice cave house (Image 2 reference)
    function createIceCaveHouse(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Ice/snow ground
      const snowMat = createGlossyMaterial(0xE3F2FD, 0.2, 0.1);
      const groundGeom = new THREE.CylinderGeometry(18 * scale, 20 * scale, 2 * scale, 32);
      const ground = new THREE.Mesh(groundGeom, snowMat);
      ground.position.y = 1 * scale;
      ground.receiveShadow = true;
      group.add(ground);

      // Ice blocks forming cave entrance
      const iceMat = createGlossyMaterial(0x4DD0E1, 0.3, 0.1);
      const darkIceMat = createGlossyMaterial(0x0097A7, 0.3, 0.15);
      
      // Main dome structure
      const domeGeom = new THREE.SphereGeometry(10 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeom, iceMat);
      dome.position.y = 2 * scale;
      dome.castShadow = true;
      group.add(dome);

      // Snow cap
      const snowCapGeom = new THREE.SphereGeometry(8 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3);
      const snowCap = new THREE.Mesh(snowCapGeom, snowMat);
      snowCap.position.y = 6 * scale;
      snowCap.castShadow = true;
      group.add(snowCap);

      // Ice block details
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const blockGeom = new THREE.BoxGeometry(
          (3 + Math.random() * 2) * scale,
          (4 + Math.random() * 3) * scale,
          (2 + Math.random()) * scale
        );
        const block = new THREE.Mesh(blockGeom, i % 2 === 0 ? iceMat : darkIceMat);
        block.position.set(
          Math.cos(angle) * 8 * scale,
          4 * scale,
          Math.sin(angle) * 8 * scale
        );
        block.rotation.y = angle;
        block.castShadow = true;
        group.add(block);
      }

      // Cave entrance (dark)
      const entranceGeom = new THREE.CircleGeometry(4 * scale, 16, 0, Math.PI);
      const entranceMat = createGlossyMaterial(0x263238);
      const entrance = new THREE.Mesh(entranceGeom, entranceMat);
      entrance.position.set(0, 4 * scale, 9.5 * scale);
      entrance.rotation.x = Math.PI;
      group.add(entrance);

      // Icicles hanging
      const icicleMat = createGlossyMaterial(0xB2EBF2, 0.3, 0.05);
      for (let i = 0; i < 5; i++) {
        const icicle = new THREE.Mesh(
          new THREE.ConeGeometry(0.4 * scale, (2 + Math.random() * 2) * scale, 6),
          icicleMat
        );
        icicle.position.set(
          (i - 2) * 1.5 * scale,
          7 * scale,
          9 * scale
        );
        icicle.rotation.x = Math.PI;
        group.add(icicle);
      }

      // Rope with decorations
      const ropeMat = createGlossyMaterial(0x795548);
      const rope = new THREE.Mesh(
        new THREE.TorusGeometry(6 * scale, 0.3 * scale, 8, 32, Math.PI),
        ropeMat
      );
      rope.position.set(0, 10 * scale, 0);
      rope.rotation.x = Math.PI / 2;
      group.add(rope);

      // Wooden barrel
      const barrelMat = createGlossyMaterial(0x6D4C41);
      const barrelGeom = new THREE.CylinderGeometry(2 * scale, 2.2 * scale, 4 * scale, 12);
      const barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(8 * scale, 4 * scale, 6 * scale);
      barrel.castShadow = true;
      group.add(barrel);

      // Barrel rings
      const ringMat = createGlossyMaterial(0x37474F);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.1 * scale, 0.15 * scale, 8, 16),
          ringMat
        );
        ring.position.set(8 * scale, (3 + i * 1.5) * scale, 6 * scale);
        group.add(ring);
      }

      // Wooden crate
      const crateMat = createGlossyMaterial(0x5D4037);
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(4 * scale, 3 * scale, 3 * scale),
        crateMat
      );
      crate.position.set(-7 * scale, 3.5 * scale, 5 * scale);
      crate.castShadow = true;
      group.add(crate);

      // Snowman
      const snowmanGroup = new THREE.Group();
      const snowball1 = new THREE.Mesh(new THREE.SphereGeometry(2 * scale, 16, 16), snowMat);
      snowball1.position.y = 2 * scale;
      snowmanGroup.add(snowball1);
      const snowball2 = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 16, 16), snowMat);
      snowball2.position.y = 4.5 * scale;
      snowmanGroup.add(snowball2);
      const snowball3 = new THREE.Mesh(new THREE.SphereGeometry(1 * scale, 16, 16), snowMat);
      snowball3.position.y = 6.5 * scale;
      snowmanGroup.add(snowball3);
      snowmanGroup.position.set(-10 * scale, 2 * scale, 3 * scale);
      group.add(snowmanGroup);

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // Mediterranean house with rooftop garden (Image 3 reference)
    function createMediterraneanHouse(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Stone base
      const baseMat = createGlossyMaterial(0xBCAAA4);
      const baseGeom = new THREE.BoxGeometry(14 * scale, 2 * scale, 12 * scale);
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 1 * scale;
      base.castShadow = true;
      group.add(base);

      // Main body (beige/tan)
      const bodyMat = createGlossyMaterial(0xD7CCC8);
      const bodyGeom = new THREE.BoxGeometry(12 * scale, 8 * scale, 10 * scale);
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 6 * scale;
      body.castShadow = true;
      group.add(body);

      // Rounded edges (corner pieces)
      const cornerMat = createGlossyMaterial(0xBCAAA4);
      for (let cx = -1; cx <= 1; cx += 2) {
        for (let cz = -1; cz <= 1; cz += 2) {
          const corner = new THREE.Mesh(
            new THREE.CylinderGeometry(1 * scale, 1 * scale, 8 * scale, 16),
            cornerMat
          );
          corner.position.set(cx * 6 * scale, 6 * scale, cz * 5 * scale);
          group.add(corner);
        }
      }

      // Rooftop frame
      const roofFrameMat = createGlossyMaterial(0xA1887F);
      const roofFrame = new THREE.Mesh(
        new THREE.BoxGeometry(14 * scale, 1.5 * scale, 12 * scale),
        roofFrameMat
      );
      roofFrame.position.y = 10.5 * scale;
      group.add(roofFrame);

      // Rooftop garden area (green)
      const gardenMat = createGlossyMaterial(0x81C784);
      const garden = new THREE.Mesh(
        new THREE.BoxGeometry(10 * scale, 0.5 * scale, 8 * scale),
        gardenMat
      );
      garden.position.y = 11.5 * scale;
      group.add(garden);

      // Rooftop water feature
      const waterMat = createGlossyMaterial(0x4FC3F7, 0.3, 0.1);
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(6 * scale, 0.3 * scale, 5 * scale),
        waterMat
      );
      water.position.set(-1 * scale, 11.8 * scale, 0);
      group.add(water);

      // Succulent plant
      const succulentGroup = new THREE.Group();
      const leafMat = createGlossyMaterial(0x7CB342);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(1.2 * scale, 8, 8),
          leafMat
        );
        leaf.scale.set(1, 0.5, 0.7);
        leaf.position.set(
          Math.cos(angle) * 1.5 * scale,
          0,
          Math.sin(angle) * 1.5 * scale
        );
        leaf.rotation.z = angle;
        leaf.rotation.x = 0.5;
        succulentGroup.add(leaf);
      }
      const centerLeaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.8 * scale, 8, 8),
        createGlossyMaterial(0x558B2F)
      );
      centerLeaf.scale.y = 0.6;
      succulentGroup.add(centerLeaf);
      succulentGroup.position.set(4 * scale, 13 * scale, 2 * scale);
      group.add(succulentGroup);

      // Entrance awning (red)
      const awningMat = createGlossyMaterial(0xC62828);
      const awningGeom = new THREE.BoxGeometry(6 * scale, 0.5 * scale, 4 * scale);
      const awning = new THREE.Mesh(awningGeom, awningMat);
      awning.position.set(0, 7 * scale, 7 * scale);
      awning.rotation.x = 0.2;
      awning.castShadow = true;
      group.add(awning);

      // Awning support poles (gold)
      const poleMat = createGlossyMaterial(0xFFD700, 0.5);
      for (let side = -1; side <= 1; side += 2) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 5 * scale, 8),
          poleMat
        );
        pole.position.set(side * 2.5 * scale, 5 * scale, 7 * scale);
        group.add(pole);
      }

      // Window
      const windowMat = createGlossyMaterial(0x4FC3F7, 0.2, 0.1);
      const windowGeom = new THREE.BoxGeometry(3 * scale, 3 * scale, 0.3 * scale);
      const window1 = new THREE.Mesh(windowGeom, windowMat);
      window1.position.set(-3 * scale, 6 * scale, 5.2 * scale);
      group.add(window1);

      // Door
      const doorMat = createGlossyMaterial(0x5D4037);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(3 * scale, 5 * scale, 0.5 * scale),
        doorMat
      );
      door.position.set(0, 4.5 * scale, 5.3 * scale);
      group.add(door);

      // Entrance mat
      const matGeom = new THREE.BoxGeometry(4 * scale, 0.2 * scale, 3 * scale);
      const mat = new THREE.Mesh(matGeom, createGlossyMaterial(0x6D4C41));
      mat.position.set(0, 0.1 * scale, 8 * scale);
      group.add(mat);

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // Original cottage style house
    function createCottageHouse(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Base platform
      const platformGeom = new THREE.CylinderGeometry(12 * scale, 13 * scale, 1.5 * scale, 32);
      const platformMat = createGlossyMaterial(0x4CAF50);
      const platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.y = 0.75 * scale;
      platform.receiveShadow = true;
      group.add(platform);

      // Main body
      const houseBodyGeom = new THREE.BoxGeometry(14 * scale, 8 * scale, 10 * scale);
      const houseMat = createGlossyMaterial(0xF4E4A6);
      const houseBody = new THREE.Mesh(houseBodyGeom, houseMat);
      houseBody.position.set(0, 5.5 * scale, 0);
      houseBody.castShadow = true;
      group.add(houseBody);

      // Curved red roof
      const roofMat = createGlossyMaterial(0xE53935);
      const roofCurve = new THREE.Shape();
      roofCurve.moveTo(-8, 0);
      roofCurve.quadraticCurveTo(-8, 6, 0, 7);
      roofCurve.quadraticCurveTo(8, 6, 8, 0);
      roofCurve.lineTo(-8, 0);
      
      const roofGeom = new THREE.ExtrudeGeometry(roofCurve, { depth: 12 * scale, bevelEnabled: false });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.scale.set(scale, scale, 1);
      roof.position.set(0, 9.5 * scale, -6 * scale);
      roof.castShadow = true;
      group.add(roof);

      // Chimney
      const chimneyMat = createGlossyMaterial(0xF5F5DC);
      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2 * scale, 1.5 * scale, 5 * scale, 16),
        chimneyMat
      );
      chimney.position.set(2 * scale, 15 * scale, -1 * scale);
      chimney.castShadow = true;
      group.add(chimney);

      // Chimney top
      const chimneyTop = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5 * scale, 1.3 * scale, 1.5 * scale, 4),
        roofMat
      );
      chimneyTop.position.set(2 * scale, 18 * scale, -1 * scale);
      chimneyTop.rotation.y = Math.PI / 4;
      group.add(chimneyTop);

      // Door
      const doorMat = createGlossyMaterial(0xD2691E);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.5 * scale, 4 * scale, 0.3 * scale),
        doorMat
      );
      door.position.set(0, 3.5 * scale, 5.2 * scale);
      group.add(door);

      // Window with shutters
      const shutterMat = createGlossyMaterial(0xFF8C00);
      const windowGlassMat = createGlossyMaterial(0x87CEEB, 0.3);
      const windowGlass = new THREE.Mesh(
        new THREE.BoxGeometry(2 * scale, 2.5 * scale, 0.2 * scale),
        windowGlassMat
      );
      windowGlass.position.set(-4.5 * scale, 6 * scale, 5.1 * scale);
      group.add(windowGlass);

      // Shutters
      for (let side = -1; side <= 1; side += 2) {
        const shutter = new THREE.Mesh(
          new THREE.BoxGeometry(0.8 * scale, 2.8 * scale, 0.3 * scale),
          shutterMat
        );
        shutter.position.set((-4.5 + side * 1.3) * scale, 6 * scale, 5.1 * scale);
        shutter.rotation.y = side * 0.2;
        group.add(shutter);
      }

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // ============ PLACE BUILDINGS ============
    // 1 building of each type, well distributed
    // RIVER IS AT z ≈ 85 (varies 70-100), width ~20 units
    // So river zone is approximately z = 60 to z = 110
    // Buildings must be NORTH of river (z < 60) or SOUTH of river (z > 110)
    
    // Helper to place building at correct terrain height
    function placeBuilding(createFunc, x, z, scale = 1, rotation = 0) {
      const y = getTerrainHeight(x, z);
      const building = createFunc(x, y, z, scale);
      if (rotation && building) building.rotation.y = rotation;
      return building;
    }
    
    // ============ SMALL ORCHARD (Huerto) ============
    function createOrchard(x, z, width = 20, depth = 15) {
      const group = new THREE.Group();
      const baseY = getTerrainHeight(x, z);
      
      // Tilled soil patches
      const soilMat = createGlossyMaterial(0x5D4037, 0.05, 0.7);
      for (let row = 0; row < 3; row++) {
        const soilPatch = new THREE.Mesh(
          new THREE.BoxGeometry(width - 4, 0.4, 3),
          soilMat
        );
        soilPatch.position.set(0, 0.2, -depth/2 + 3 + row * 5);
        group.add(soilPatch);
        
        // Plants in each row
        const plantColors = [0x66BB6A, 0x81C784, 0x4CAF50];
        for (let p = 0; p < 5; p++) {
          const plantX = -width/2 + 4 + p * (width - 8) / 4;
          
          // Leafy plant
          const plant = new THREE.Mesh(
            new THREE.SphereGeometry(1.2 + Math.random() * 0.4, 8, 6),
            createGlossyMaterial(plantColors[Math.floor(Math.random() * 3)])
          );
          plant.position.set(plantX, 1.2, -depth/2 + 3 + row * 5);
          plant.scale.y = 0.7;
          group.add(plant);
          
          // Some with vegetables/fruits
          if (Math.random() > 0.5) {
            const fruitColor = Math.random() > 0.5 ? 0xE53935 : 0xFFA726;
            const fruit = new THREE.Mesh(
              new THREE.SphereGeometry(0.4, 8, 8),
              createGlossyMaterial(fruitColor)
            );
            fruit.position.set(plantX + 0.5, 0.8, -depth/2 + 3 + row * 5 + 0.5);
            group.add(fruit);
          }
        }
      }
      
      // Small wooden fence around orchard
      const fenceMat = createGlossyMaterial(0x8D6E63);
      const fencePostGeom = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
      const fenceRailGeom = new THREE.BoxGeometry(0.2, 0.4, depth);
      
      // Fence posts at corners and middle
      const postPositions = [
        [-width/2, -depth/2], [-width/2, 0], [-width/2, depth/2],
        [width/2, -depth/2], [width/2, 0], [width/2, depth/2]
      ];
      postPositions.forEach(([px, pz]) => {
        const post = new THREE.Mesh(fencePostGeom, fenceMat);
        post.position.set(px, 1.25, pz);
        group.add(post);
      });
      
      // Side rails
      const leftRail = new THREE.Mesh(fenceRailGeom, fenceMat);
      leftRail.position.set(-width/2, 1.5, 0);
      group.add(leftRail);
      
      const rightRail = new THREE.Mesh(fenceRailGeom, fenceMat);
      rightRail.position.set(width/2, 1.5, 0);
      group.add(rightRail);
      
      group.position.set(x, baseY, z);
      scene.add(group);
      return group;
    }
    
    // Tribal House - NW corner of main plaza
    placeBuilding(createTribalHouse, -100, 55, 1, 0);
    
    // ============ BAR "LAS NIEVES" ============
    function createBar(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Materials
      const woodMat = createGlossyMaterial(0x8B4513, 0.2);       // Dark wood
      const lightWoodMat = createGlossyMaterial(0xDEB887, 0.15); // Light wood
      const redMat = createGlossyMaterial(0xC0392B, 0.3);        // Red (brand color)
      const whiteMat = createGlossyMaterial(0xFFFAF0, 0.1);      // Cream white
      const brickMat = createGlossyMaterial(0xA0522D, 0.1);      // Brick
      const metalMat = createGlossyMaterial(0xB8860B, 0.5);      // Brass/gold metal
      const greenMat = createGlossyMaterial(0x228B22, 0.2);      // Green for plants
      
      // Main building base (circular platform) - minimal height
      const basePlatform = new THREE.Mesh(
        new THREE.CylinderGeometry(22 * scale, 24 * scale, 0.2 * scale, 32),
        lightWoodMat
      );
      basePlatform.position.y = 0.1 * scale;
      basePlatform.receiveShadow = true;
      group.add(basePlatform);
      
      // Wooden deck floor pattern (radial planks effect)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(20 * scale, 0.1 * scale, 2 * scale),
          woodMat
        );
        plank.rotation.y = angle;
        plank.position.y = 0.25 * scale;
        group.add(plank);
      }
      
      // Main bar building (back structure)
      const barBuilding = new THREE.Mesh(
        new THREE.BoxGeometry(18 * scale, 10 * scale, 8 * scale),
        brickMat
      );
      barBuilding.position.set(0, 6 * scale, -8 * scale);
      barBuilding.castShadow = true;
      group.add(barBuilding);
      
      // Bar building roof (slanted)
      const roofGeom = new THREE.BoxGeometry(20 * scale, 1.5 * scale, 10 * scale);
      const roof = new THREE.Mesh(roofGeom, redMat);
      roof.position.set(0, 11.5 * scale, -8 * scale);
      roof.rotation.x = 0.1;
      group.add(roof);
      
      // "Las Nieves" sign
      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(14 * scale, 3 * scale, 0.5 * scale),
        woodMat
      );
      signBoard.position.set(0, 14 * scale, -4 * scale);
      group.add(signBoard);
      
      // Sign letters backing (lighter)
      const signText = new THREE.Mesh(
        new THREE.BoxGeometry(12 * scale, 2 * scale, 0.3 * scale),
        whiteMat
      );
      signText.position.set(0, 14 * scale, -3.6 * scale);
      group.add(signText);
      
      // Bar counter (curved L-shape)
      const counterBase = new THREE.Mesh(
        new THREE.CylinderGeometry(6 * scale, 6 * scale, 4 * scale, 16, 1, false, 0, Math.PI),
        woodMat
      );
      counterBase.position.set(0, 3 * scale, 0);
      counterBase.rotation.y = Math.PI;
      group.add(counterBase);
      
      // Counter top (shiny)
      const counterTop = new THREE.Mesh(
        new THREE.CylinderGeometry(6.5 * scale, 6.5 * scale, 0.5 * scale, 16, 1, false, 0, Math.PI),
        metalMat
      );
      counterTop.position.set(0, 5.25 * scale, 0);
      counterTop.rotation.y = Math.PI;
      group.add(counterTop);
      
      // Bar stools around the counter
      for (let i = 0; i < 5; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2;
        const stoolX = Math.sin(angle) * 8 * scale;
        const stoolZ = Math.cos(angle) * 8 * scale;
        
        // Stool leg
        const stoolLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8),
          metalMat
        );
        stoolLeg.position.set(stoolX, 2.5 * scale, stoolZ);
        group.add(stoolLeg);
        
        // Stool seat
        const stoolSeat = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2 * scale, 1 * scale, 0.8 * scale, 12),
          redMat
        );
        stoolSeat.position.set(stoolX, 4.2 * scale, stoolZ);
        group.add(stoolSeat);
      }
      
      // Beer taps on counter
      for (let i = -1; i <= 1; i++) {
        const tapBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 1 * scale, 8),
          metalMat
        );
        tapBase.position.set(i * 2 * scale, 6 * scale, -1 * scale);
        group.add(tapBase);
        
        const tapHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 2 * scale, 8),
          i === 0 ? redMat : woodMat
        );
        tapHandle.position.set(i * 2 * scale, 7.5 * scale, -1 * scale);
        tapHandle.rotation.x = -0.3;
        group.add(tapHandle);
      }
      
      // Outdoor tables with umbrellas
      const tablePositions = [
        { x: 12, z: 8 },
        { x: -12, z: 8 },
        { x: 14, z: -4 },
        { x: -14, z: -4 },
      ];
      
      tablePositions.forEach((pos, idx) => {
        // Table
        const tableLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4 * scale, 0.4 * scale, 3 * scale, 8),
          metalMat
        );
        tableLeg.position.set(pos.x * scale, 2.5 * scale, pos.z * scale);
        group.add(tableLeg);
        
        const tableTop = new THREE.Mesh(
          new THREE.CylinderGeometry(3 * scale, 3 * scale, 0.4 * scale, 16),
          lightWoodMat
        );
        tableTop.position.set(pos.x * scale, 4.2 * scale, pos.z * scale);
        group.add(tableTop);
        
        // Umbrella pole
        const umbrellaPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 8 * scale, 8),
          woodMat
        );
        umbrellaPole.position.set(pos.x * scale, 8.5 * scale, pos.z * scale);
        group.add(umbrellaPole);
        
        // Umbrella canopy (alternating colors)
        const umbrellaColor = idx % 2 === 0 ? redMat : whiteMat;
        const umbrellaCanopy = new THREE.Mesh(
          new THREE.ConeGeometry(4 * scale, 2 * scale, 8),
          umbrellaColor
        );
        umbrellaCanopy.position.set(pos.x * scale, 13 * scale, pos.z * scale);
        umbrellaCanopy.rotation.x = Math.PI;
        group.add(umbrellaCanopy);
        
        // Chairs around table
        for (let c = 0; c < 3; c++) {
          const chairAngle = (c / 3) * Math.PI * 2 + (idx * 0.5);
          const chairX = pos.x * scale + Math.cos(chairAngle) * 4 * scale;
          const chairZ = pos.z * scale + Math.sin(chairAngle) * 4 * scale;
          
          const chair = new THREE.Mesh(
            new THREE.BoxGeometry(1.5 * scale, 2 * scale, 1.5 * scale),
            woodMat
          );
          chair.position.set(chairX, 2 * scale, chairZ);
          group.add(chair);
        }
      });
      
      // Beer barrels decoration
      const barrelPositions = [
        { x: -8, z: -10 },
        { x: 8, z: -10 },
      ];
      
      barrelPositions.forEach(pos => {
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(2 * scale, 2 * scale, 3 * scale, 12),
          woodMat
        );
        barrel.position.set(pos.x * scale, 2.5 * scale, pos.z * scale);
        barrel.rotation.z = Math.PI / 2;
        group.add(barrel);
        
        // Barrel rings
        for (let r = -1; r <= 1; r++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.1 * scale, 0.15 * scale, 8, 16),
            metalMat
          );
          ring.position.set(pos.x * scale + r * 0.8 * scale, 2.5 * scale, pos.z * scale);
          ring.rotation.y = Math.PI / 2;
          group.add(ring);
        }
      });
      
      // Hanging lights (string of bulbs around the area)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const lightX = Math.cos(angle) * 18 * scale;
        const lightZ = Math.sin(angle) * 18 * scale;
        
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.4 * scale, 8, 8),
          createGlossyMaterial(0xFFD700, 0.6)
        );
        bulb.position.set(lightX, 10 * scale, lightZ);
        group.add(bulb);
      }
      
      // Potted plants around entrance
      for (let side = -1; side <= 1; side += 2) {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5 * scale, 1.2 * scale, 2 * scale, 12),
          brickMat
        );
        pot.position.set(side * 10 * scale, 2 * scale, 2 * scale);
        group.add(pot);
        
        const plant = new THREE.Mesh(
          new THREE.SphereGeometry(2 * scale, 8, 8),
          greenMat
        );
        plant.position.set(side * 10 * scale, 4.5 * scale, 2 * scale);
        group.add(plant);
      }
      
      // Central decorative element (can be used as gathering point)
      // Small fountain/planter in center front
      const centerDecor = new THREE.Mesh(
        new THREE.CylinderGeometry(2 * scale, 2.5 * scale, 1.5 * scale, 16),
        brickMat
      );
      centerDecor.position.set(0, 1.75 * scale, 10 * scale);
      group.add(centerDecor);
      
      const planter = new THREE.Mesh(
        new THREE.SphereGeometry(1.8 * scale, 8, 8),
        greenMat
      );
      planter.position.set(0, 3.5 * scale, 10 * scale);
      planter.scale.y = 0.7;
      group.add(planter);
      
      // VIKING HORN on top of building (congregation signal)
      const hornMaterial = createGlossyMaterial(0xD4A85A, 0.4); // Golden horn
      const hornDarkMat = createGlossyMaterial(0x8B6914, 0.3);
      
      // Main horn body (curved cone)
      const hornBody = new THREE.Mesh(
        new THREE.ConeGeometry(1.5 * scale, 8 * scale, 12),
        hornMaterial
      );
      hornBody.position.set(0, 18 * scale, -8 * scale);
      hornBody.rotation.z = -Math.PI / 4; // Tilted
      hornBody.rotation.x = 0.2;
      group.add(hornBody);
      
      // Horn tip (narrower end)
      const hornTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.4 * scale, 3 * scale, 8),
        hornDarkMat
      );
      hornTip.position.set(3 * scale, 21 * scale, -8.5 * scale);
      hornTip.rotation.z = -Math.PI / 4;
      group.add(hornTip);
      
      // Horn mouth (wider end)
      const hornMouth = new THREE.Mesh(
        new THREE.TorusGeometry(1.8 * scale, 0.4 * scale, 8, 16),
        hornDarkMat
      );
      hornMouth.position.set(-2.5 * scale, 15.5 * scale, -7.5 * scale);
      hornMouth.rotation.y = Math.PI / 4;
      group.add(hornMouth);
      
      // Decorative rings on horn
      for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.2 * scale - r * 0.2 * scale, 0.15 * scale, 8, 16),
          metalMat
        );
        ring.position.set(r * 1.2 * scale - 1 * scale, 17 * scale + r * 1 * scale, -8 * scale);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = -Math.PI / 4;
        group.add(ring);
      }
      
      // Horn mount/bracket
      const hornMount = new THREE.Mesh(
        new THREE.BoxGeometry(4 * scale, 2 * scale, 2 * scale),
        woodMat
      );
      hornMount.position.set(0, 14 * scale, -8 * scale);
      group.add(hornMount);
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }
    
    // Place Bar "Las Nieves" in the main plaza (NE corner)
    const BAR_X = -40;
    const BAR_Z = 55;
    const BAR_SCALE = 1.2;
    const barBaseY = getTerrainHeight(BAR_X, BAR_Z);
    createBar(BAR_X, barBaseY, BAR_Z, BAR_SCALE);
    
    // Store bar position in ref for congregation (horn mechanic still works!)
    congregationRef.current.templeX = BAR_X;
    congregationRef.current.templeZ = BAR_Z;
    congregationRef.current.templeFloorY = barBaseY;
    congregationRef.current.congregationRadius = 35; // Max radius for congregated entities
    
    // ============ BUILDING APP LOCATIONS ============
    // These define clickable/enterable buildings
    const buildingLocations = [
      // Main plaza buildings
      { id: 'tribal', x: -100, z: 55, radius: 18, app: BUILDING_APPS.tribal },
      { id: 'cottage', x: -100, z: 15, radius: 16, app: BUILDING_APPS.cottage },
      { id: 'temple', x: BAR_X, z: BAR_Z, radius: 10, app: BUILDING_APPS.temple },
      // Pozo de los Deseos - center bottom of plaza
      { id: 'well1', x: -70, z: 8, radius: 8, app: BUILDING_APPS.well },
      // Other buildings
      { id: 'mediterranean', x: 60, z: 45, radius: 16, app: BUILDING_APPS.mediterranean },
      { id: 'icecave', x: -170, z: -170, radius: 20, app: BUILDING_APPS.icecave },
      { id: 'well2', x: 10, z: -55, radius: 10, app: BUILDING_APPS.well },
      // Market area - the healthy food stalls
      { id: 'market', x: 25, z: 32, radius: 14, app: BUILDING_APPS.market },
    ];
    
    // Function to check if player is near any building
    function checkBuildingProximity(playerX, playerZ) {
      for (const building of buildingLocations) {
        const dist = Math.sqrt((playerX - building.x) ** 2 + (playerZ - building.z) ** 2);
        if (dist < building.radius) {
          return building;
        }
      }
      return null;
    }
    
    // ============ JACUZZI / HOT TUB ============
    // Jacuzzi location - east side of central mountain
    const JACUZZI_X = 45;
    const JACUZZI_Z = -45;
    const JACUZZI_RADIUS = 8;
    
    const jacuzziBubbles = [];
    let steamParticles = null;
    
    function createJacuzzi(x, z) {
      const group = new THREE.Group();
      const baseY = getTerrainHeight(x, z);
      
      // Stone/rock border
      const stoneMat = createGlossyMaterial(0x8B8682);
      const darkStoneMat = createGlossyMaterial(0x696563);
      
      // Outer ring (rocks)
      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(JACUZZI_RADIUS, 2, 12, 24),
        stoneMat
      );
      outerRing.rotation.x = -Math.PI / 2;
      outerRing.position.y = 1;
      outerRing.receiveShadow = true;
      group.add(outerRing);
      
      // Inner decorative ring
      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(JACUZZI_RADIUS - 1.5, 0.8, 8, 24),
        darkStoneMat
      );
      innerRing.rotation.x = -Math.PI / 2;
      innerRing.position.y = 1.5;
      group.add(innerRing);
      
      // Rock details around edge
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rockSize = 1.2 + Math.random() * 0.8;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rockSize, 0),
          i % 2 === 0 ? stoneMat : darkStoneMat
        );
        rock.position.set(
          Math.cos(angle) * (JACUZZI_RADIUS + 0.5),
          0.5 + Math.random() * 0.5,
          Math.sin(angle) * (JACUZZI_RADIUS + 0.5)
        );
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        group.add(rock);
      }
      
      // Water surface (slightly below rim)
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x4FC3F7,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.3,
      });
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(JACUZZI_RADIUS - 1.5, 32),
        waterMat
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.3;
      water.name = 'jacuzziWater';
      group.add(water);
      
      // Pool floor (darker)
      const floorMat = createGlossyMaterial(0x37474F);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(JACUZZI_RADIUS - 1.5, 32),
        floorMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.5;
      group.add(floor);
      
      // Wooden step/bench
      const woodMat = createGlossyMaterial(0x8B5A2B);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.8, 2),
        woodMat
      );
      step.position.set(JACUZZI_RADIUS + 1, 0.4, 0);
      step.castShadow = true;
      group.add(step);
      
      // Create bubble particles
      const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6,
      });
      
      for (let i = 0; i < 30; i++) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 6, 6),
          bubbleMat
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (JACUZZI_RADIUS - 2);
        bubble.position.set(
          x + Math.cos(angle) * dist,
          baseY + 0.3 + Math.random() * 0.5,
          z + Math.sin(angle) * dist
        );
        bubble.userData.baseY = baseY + 0.3;
        bubble.userData.angle = angle;
        bubble.userData.dist = dist;
        bubble.userData.speed = 0.5 + Math.random() * 1;
        bubble.userData.phase = Math.random() * Math.PI * 2;
        scene.add(bubble);
        jacuzziBubbles.push(bubble);
      }
      
      // Create steam/vapor particles (will be activated when player enters)
      const steamGroup = new THREE.Group();
      steamGroup.visible = false;
      steamGroup.userData.particles = [];
      
      const steamMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.4,
      });
      
      for (let i = 0; i < 8; i++) {
        const steam = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 6, 6),
          steamMat.clone()
        );
        steam.userData.offset = i * 0.5;
        steam.userData.baseOpacity = 0.3 + Math.random() * 0.2;
        steamGroup.userData.particles.push(steam);
        steamGroup.add(steam);
      }
      
      scene.add(steamGroup);
      steamParticles = steamGroup;
      
      group.position.set(x, baseY, z);
      scene.add(group);
      return group;
    }
    
    // Create the jacuzzi
    createJacuzzi(JACUZZI_X, JACUZZI_Z);
    
    // Update jacuzzi bubbles animation
    function updateJacuzziBubbles(time) {
      jacuzziBubbles.forEach((bubble, i) => {
        const phase = bubble.userData.phase + time * bubble.userData.speed * 0.002;
        
        // Bubbles rise and reset
        const riseAmount = (phase % 3) * 0.4;
        bubble.position.y = bubble.userData.baseY + riseAmount;
        
        // Slight horizontal wobble
        const wobble = Math.sin(phase * 3) * 0.1;
        bubble.position.x = JACUZZI_X + Math.cos(bubble.userData.angle) * bubble.userData.dist + wobble;
        bubble.position.z = JACUZZI_Z + Math.sin(bubble.userData.angle) * bubble.userData.dist + wobble;
        
        // Fade out as they rise
        bubble.material.opacity = 0.6 * (1 - (riseAmount / 1.2));
        
        // Scale pulsing
        const scale = 1 + Math.sin(phase * 5) * 0.2;
        bubble.scale.setScalar(scale);
      });
    }
    
    // Update steam particles on player's head
    function updateSteamParticles(time, playerX, playerY, playerZ, isInHotTub) {
      if (!steamParticles) return;
      
      steamParticles.visible = isInHotTub;
      
      if (isInHotTub) {
        steamParticles.position.set(playerX, playerY + 5, playerZ);
        
        steamParticles.userData.particles.forEach((particle, i) => {
          const t = (time * 0.003 + particle.userData.offset) % 3;
          
          // Rise up and spread out
          particle.position.y = t * 1.5;
          particle.position.x = Math.sin(t * 2 + i) * t * 0.5;
          particle.position.z = Math.cos(t * 2 + i) * t * 0.5;
          
          // Fade out as it rises
          const fadeProgress = t / 3;
          particle.material.opacity = particle.userData.baseOpacity * (1 - fadeProgress);
          
          // Grow as it rises
          const scale = 0.5 + t * 0.5;
          particle.scale.setScalar(scale);
        });
      }
    }
    
    // ============ WOODEN CANOE ============
    function createCanoe(x, z, rotation = 0) {
      const group = new THREE.Group();
      const riverY = getTerrainHeight(x, z) + 1.5;
      const woodMat = createGlossyMaterial(0xCD853F); // Lighter wood
      const darkWoodMat = createGlossyMaterial(0x8B4513);
      const redAccent = createGlossyMaterial(0xC62828);
      
      // Canoe hull using ExtrudeGeometry for smooth curved shape
      const hullShape = new THREE.Shape();
      hullShape.moveTo(-6, 0);
      hullShape.quadraticCurveTo(-6, 1.8, -4, 2);
      hullShape.lineTo(4, 2);
      hullShape.quadraticCurveTo(6, 1.8, 6, 0);
      hullShape.quadraticCurveTo(6, -1.8, 4, -2);
      hullShape.lineTo(-4, -2);
      hullShape.quadraticCurveTo(-6, -1.8, -6, 0);
      
      const hullGeom = new THREE.ExtrudeGeometry(hullShape, {
        depth: 1.5,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.2,
        bevelSegments: 4
      });
      const hull = new THREE.Mesh(hullGeom, woodMat);
      hull.rotation.x = -Math.PI / 2;
      hull.position.y = 0;
      hull.castShadow = true;
      group.add(hull);
      
      // Pointed bow (front)
      const bowGeom = new THREE.ConeGeometry(1.5, 3, 8);
      const bow = new THREE.Mesh(bowGeom, woodMat);
      bow.rotation.z = -Math.PI / 2;
      bow.position.set(7.5, 0.8, 0);
      bow.castShadow = true;
      group.add(bow);
      
      // Pointed stern (back)
      const stern = new THREE.Mesh(bowGeom, woodMat);
      stern.rotation.z = Math.PI / 2;
      stern.position.set(-7.5, 0.8, 0);
      stern.castShadow = true;
      group.add(stern);
      
      // Inner floor (darker)
      const innerGeom = new THREE.BoxGeometry(10, 0.2, 3);
      const inner = new THREE.Mesh(innerGeom, darkWoodMat);
      inner.position.y = 1.2;
      group.add(inner);
      
      // Wooden seat planks
      for (let i = -1; i <= 1; i += 2) {
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.2, 3.2),
          darkWoodMat
        );
        seat.position.set(i * 2.5, 1.5, 0);
        group.add(seat);
      }
      
      // Red decorative stripes on sides
      for (let side = -1; side <= 1; side += 2) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.3, 0.15),
          redAccent
        );
        stripe.position.set(0, 1.8, side * 2.1);
        group.add(stripe);
      }
      
      // Paddle lying across
      const paddleMat = createGlossyMaterial(0xA0522D);
      
      // Paddle shaft (longer)
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 7, 8),
        paddleMat
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.rotation.y = 0.3;
      shaft.position.set(0, 1.8, 0);
      group.add(shaft);
      
      // Paddle blade 1
      const bladeGeom = new THREE.BoxGeometry(0.15, 1.8, 0.8);
      const blade1 = new THREE.Mesh(bladeGeom, paddleMat);
      blade1.position.set(3.8, 1.8, 0.5);
      blade1.rotation.y = 0.3;
      group.add(blade1);
      
      // Paddle blade 2
      const blade2 = new THREE.Mesh(bladeGeom, paddleMat);
      blade2.position.set(-3.8, 1.8, -0.5);
      blade2.rotation.y = 0.3;
      group.add(blade2);
      
      group.position.set(x, riverY, z);
      group.rotation.y = rotation;
      scene.add(group);
      return group;
    }
    
    // Canoe floating on the river near tribal house
    createCanoe(-85, 75, 0.5);
    
    // Small orchard on east side of tribal house
    createOrchard(-60, 55, 18, 14);
    
    // Mediterranean House - East side, north of river
    placeBuilding(createMediterraneanHouse, 60, 45, 0.9, -0.3);
    
    // Cottage House - SW corner of main plaza
    placeBuilding(createCottageHouse, -100, 15, 0.85, 0.4);
    
    // Ice Cave House - NORTHWEST corner (frozen fjords) - door facing south
    placeBuilding(createIceCaveHouse, -170, -170, 1.1, 0);
    
    // ============ GARAJE ICON above Ice Cave ============
    function createGarajeIcon(x, z) {
      const group = new THREE.Group();
      const y = getTerrainHeight(x, z);
      
      // Base64 encoded Garaje icon (peace sign hand)
      const iconBase64 = 'data:image/webp;base64,UklGRsQYAABXRUJQVlA4WAoAAAAwAAAAbQEAbQEASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBI1AkAAA3wn/13n0jy/z07glFH0JoIUAZoI8AVgU0EhgiEIzBEAI6gIIIVGYgI9lQEczqC+V0NtnSOdvf1IyImAP/v//8121oLA2YmKodxbuWMBZj4niKrya+9w18aY6xJ6R45f8b3Fn9rrFk7n6ZICjJ9hx80zq19miJlzfQdfty3Pk5ROabv8Fzf+jjFbJm+w5O7FlvSTL/DC7vWDpc8+REv9Oc4kFbsGS+2we+vGRodXtu100UnfsTr7cgDZca+4+U28MAK6RvMsuunY1bciDnu2jdSR/iKmZpgBsqHGzFPe94nZYQvmG/XbikXbsRc7XmfVNF/xZztP0/HPLgR8zXv+6QI12HmIw85sCPmbN73SQ12xOwPvw7Ls2fM27xvSQtnLPDw67C4EXM372+sg4BFHvi4sID52/FNBbZbBsZbXJRrFgDvjhoIWOr7nhZkzljkOCX5NWYx5rzl5QQs9LyV34jlus2wGO+W4vxReh2WvEtxKWcsNpxYeGFROO95GQHLNd1Rdh7Ltu2wCNstCP3EomsXhl2KSwhYsumOkrN+aRj3C7B+UegnFpzH4p0/zi9g2aY7Cq5fHsKJ5+btwrC+y82aDJjuOLeApXtEsTXIYT/xvDyW7+W2yYLpjvNqM9BOUjMuC+gnnpP1GbAgoXnk0TSXOQXksLmqDu00I+uzsLkJbZULZ+J8emTRJaH5XCAM82nyYFwUmUc2feK5dMikSyKz+cDuOJc+F6uHyFxG1veZOOTSR5GtMuIR59FnwzJLzGQEfh7WZwMuSczlpD/NwkN1Bjk1Ls4hZGT1EJjNCvwcPDLqksBMXtppBm1ODGvPgl5mfU4ss/LQXF/mkVUjsNxubi/r82JJXiYzjvhF1tQlY9OLAvJqWF7Zba4v8rVpfX+NR2a/fajPEb+kzU0NbK6vME1uvv6iP5de0SC3P33X3+b2ijY7NdAyP8/aCoXm+jyP7BquAC49r61S6/vTrM0PoQI64md51GmXntVWqub6JGsr1erxJI9K7dKT2hxRFTA2PcXaHFVCH5/ikeOPOrB6PGWTpUrYXJ9hfJZIYGwyZAw9waNewccnbPLEAsuzS0/weaJKsLn9mEeeWWBscmSZy5BQCeDjD63zxNXC2jw9qsHq8SMOeSaJZdqlH9nUA7JZMi7+gK8HuXbpcw6ZTiIjmyUfP+czlSByNlla3z+3ydRHRTCGPuUylWT28S1L8PEzHjWBTZ7W98+4XLHMyObJx89scpVkxiZPlvkTLlMMmZPNE3z8O49Mp1rhcvWoC6vH361zRUID2Tz5xH/jc5XqAlz6K4dcs9Q+vgktSS25TG1uf7XOVYLU2WTKpb9yuWKxRZ8pY9OfjM3VQ2xkMwUf/+SQaxIbyGZq9fiTz1aS232dKR//tKoPyWXKggC4XDHkTjZT8BEwJlckuORy5RLgkOsPwZExmVrfAZ+tJDhEnylHjFWNeKwyhTB4ky2SXPS52o3It+iSy1XOCZJntlUNt424HrJLTlwku+jFlWRHsFUNt42wGMJPTlhJetdGWA/pcfKyIunhvpZVEl/0lc0ZSSXI/7aR1IcCro2kkgKiM1WNyQmKFICplROr4NrIKUGDnLyYHirAbSOmqINLY6REOmByQmIlYAhCStChgZQfCjBu08gpSs/43kLSwnNtA1knSN4HA2lLzo0Q+F1sJnhIPEmtGSFyJpmZYCHzO0Ru3yH1KLJ2h5oWfobYiQUWvkDuEfIOXyD4u7zCF0g+iqv9GZJPkLbdQfR3adkzZH+VVoDsOQmrh/CvkLVtpHcTVoD0o6waI70bZD1C+ldZdRD/6iGqIL/daiuoDgrs1ls5tRpAt96KyPa4QYfdai+hM7BRAnY/DQKyUOThX5N8dHk8UlUz728sGAuQMmD7vUSMcytvDADLykBnjtIwTWvxSaMNhIlE4TcNdGvGrSB8gH69vUjBBgsNjwPLoO+gY9MPErBnqHl3pfL5AEWft8XrG2jaIxYufIWuw1C28AXK9oglC1+g7nYqWOOg7+7KxbIBGt8di/VPqLw/lSpA58bFMtlOaQhDmc7QuiMuUQe1m+ZSoqA3bG4FaqB4R1yeXnPGxeJYqzn48gSofnMrjtedBRXGQ/k+FqbVnkuF8dpbPcpioX2XyuLVZwwVZa0+uFQUpz9LdW31KImD/r/+UhJbAb59lMRVAMMlMRXAUkm+VQAYLoipbLYG1HZLBbE14H9LppKwqQBFrQJckipYFLL6Y5SUjf6oKN9/0h8Xhaz+qLJ9FIWN/qgoydU1svpLRQFZ7THKmpz2UmE+vmnvUZjktEeVLRWGrPZiYZit7hJKe1/r7l6c5HQXK1uqawnFZXJVDfe15m4Fil5zsa5FFJjJ6e1WItzXersW6dqojVDk5NR2KxMnr7VLmXDbKI24UNdGaTcUmmB1diwVbhuVJRT72qjsVK7ojMZiuTC1Crug4NdGYVPJonHqIioZbht1DSj6caeuWDZOXlkXFH4IyhpKF51RVUTxT72qhvIdO6MoovLxrVXUAAEed3qiKAEir6YBIhyClijKIMIraYAQh6AjilKI3KhogBj3o4YoyoGmoKABgjx2Rj0UJcGnoJ4Bojw6r5xIssB+VM4Wwkz3XjUXiPPQWcXwSR68fVfMCQJN06gWukgER+e1MkCmb6PVyQVC5e27SmiSCtI0amSAXI/fgz4iCQaHn1tt8B6i7TqvjAHCfQtOFTFJh99GpwgaIF5+G50eBgiYT63VwgkSHi20SBcRddAiv0HEp14Le8j4MB1aFQyQMh3uvvXii1FMAMUpeb9yRnA0QNYc4yOdG7HRFhLfBiu1N4ict2cjsz2Enm5BZAPEfvzSC2z4VW7YdU5cw6+Q/NtohTX8CtHT9mxFdfoFwqft2Qpq+AXip+3Zimn4FQqk7dkKafgVKqTt2Ypo+BVKpLezkw/voUf+R9dLh9+gyt3XIBt6gzIP34MRTNxDncfp3YrldIVCads3MuE9dEp7FyRCb1Dr4X624jhdoNg4dK0seAvd0uFrMIKIe6j3OI1eCjwkKJi2LhgRxD2UfJx2bfl4SFAzHb4EW7jTEaq+DF0oWRyg7sN0aEvFe4LC6fAYfYn4dIHS094GWxo+XaD4y+CDLQmfLlD+ZfC9KwWfLqiAl5PpmxLw6YJKGE/psDGZi7crKiIdHi7YjMUBtZHiYLuNyVK6HVEl4+XWbJrc8HRl1MvLLfnW54Ona0LlpDgl36xtBuh2TaiiHK936zZ+SRzvV1TVmG7R+7UzC6D4iIQaG+M9WetXzsyG0kdMqLqJ4iPBWbsyzryAOH1PiVCJORE9OLG1sMaYnwAYMIDvzMzEhDpNBGLm7wAY/+///5URVlA4IPoMAAAQTQCdASpuAW4BPlEmkUajoaGhIJHI6HAKCWlu/HyZxcADOzru/SX/Admv9Z/Jjq5u8ftP/VPZex1+L/znmX/DfrR96/sn7e/mT8Rd4PAC/Ef5H/fPyr/uP7kccHqn+X9AL25+j/5D+tfkF6TuoX4A9gD9Uv9B6xd5h5p7AH8v/rn+3+6P6Wf4r/o/478t/Z9+d/3z/mf5b4Cf5P/Uv97/b/8p+znzd+wL9sPYr/WP/6hWgfYmkjHiNJGPEaSMdWpSB0FD8KHfZ8rKvP6kEf/9y260zcNXaEwPLWMeIeWz7HFMh1cvC2mGraFJlubpIx4jSRjxHtxjxGkjHiNJGPEaSMeI0kY8RpIx4jSRjxGkjHiNJGPEaSMeI0kY8RpIx4jSRjxGkjHiNJGPEaSMeI0jsB2yx4DzAzB7s6UsCXpBVkoCbCWF6eWsY8RlrqU96EikBB/bBHFrf/oaxAHgSAccDBujxvLc19W4fioy1CRWUkOcv2Q8ByH2JpIx4h5W3SYoUQef+nyr0dbVEGFE0kY8Ro3xG+2mlh1TNs5WAIleEr05YsY8RpIx1h76Xg3uHbd2hCADbpgboGin5r74J1cn7E0kY8T6GGa5iQ+SCJ4wB8TzT8PrCX2HeuykQo8xvBOD6lkA0f6dDxGkjHiNG5fKmgjKt6B/0uXkcP4VJkvv52adbctXOHhXSRjxGkjHZikCOlb1uPfEYLSLsslSDB6gH2JpIx4h+MAlFn+EWPeevfeMOkGgulLWMeI0kY8RBluDVW2NY2x56usyXE8RpIx4jSRjxGkjHiNJGPEaSMeI0kY8RpIx4jSRjxGkjHiNJGKAAP7+F/g65BoxIMzlYZPa7Vd/Rjz1Ab3ZpJWDOQQeKADzmY9nlAZSWpZyMS3zowYbjeS8ba7wXkiy5dHMvIrl+1g6cGnV+w4+TLgVM54MFGm/Nt10kPJ38ePeZRbZ9vm9dvyD9VwVgjK3lGpPHbvdqIU7kxrrCskhf/lI/QEdBbcef44isCBKrwxkZwsktFu/zwf66KyrBlJu4NcDzE0SI9L9O8veWA7QXgyqHWm2Wkv4y8WB4oojmhB8TjZDss8jfD337QVI4f72H+1+Q9Q17loxT+Y/dxL4YtCZ9TZ4ISuflDJ05wxd/y2rxy5ZweuwrWKg/3aaZKeYJnBAeQLN0B1aYNqu4c2Z7b9cSGb+XnGnfVSbLdGobKckq/+98efkVxbkoI6H/DHyPqfvReofsa4Qagp/Vi7AGl5Ykm3rf8j+o1LQY/w1LphB+Src4LFiXfD6SXf4YjMUL77cOqovmIkRrzBULPD1liasJGi3AH7LSHTk0x60cw9yaMAAAAAAdvsy3P6Df9Dkjx2u0+E8tMfnhTXSGrW951wLmLwYNnDzUMndOAp0aqHFsAF777LHS9qvRMyNPE77Mqf1BxQvnZHv/MwGUFfvahoTV2B+GKbtd/R8L2+0uImrgFX9tfJKe2lBcrCmrUZTE83qcZJ0sldd6K/4u7RT9MiXm4ZrpdxlgfhsBUNsRzc1fHBK88cdAKiWKduk5DFxvqJs+ZZ/o61lmM3IzGZdDIBRk8JNDbsL7e3k7fvDrYsSlldtFvBFBs38yeIzRJOCJjEYKif8p9/bbb5owdMjKif7pyMwo/3l3GH2THRrPOXJyM3KRBxzFqH7l7D2//ICQt7ox8T9SOVDYfHRL+uEUhlFdhNZwKDbpG5P48MnggdPMDXJ8v9d8ibTLivugLxCWiZ91TSnmEredrZ6mepWcTKECZQBvWa3beCl8pXxZkkpk8e5wNz2GautxvGYnNYhOIXK/x+VeKLSPnLjJwWvG6SEqq8tGeDveiBViQi1ppHT60YH7l0MjUHjElUdkbgqoHEqqmkYOXtHO/ZwHri8ffhY2f+8EQ3R1mxTOA89xAM/Cde+ykpIrMZn7iIM3ErVGreaSvqOwKFax1jQz9QP+DdJD01ej4dPYCaHgIbOMxC76P95WmRaO96/66ToKCfcLnX3EQWOvA1AP8Z36Gf6/CRpPHQUBhvgOci6j5jEK6O6MzXgyyYDwrnQTGdwbwwH+9HzQs+46bETLp0d+P0eGfwgkh4FhlNiDkEDJ29Z3ljY01+98ani7NEja2ZbI6WXIq4ws4r8op6+Bw9yyjSGJyoxJSUigSPgCH2CxMkF5tQSDMm3SGyj+ng+hpsz6/uU0K4WZL8g+BtcHsiGw0ieXtpUq3POc3fGIenn5dnJY2ypaDRK6aD43Zxni5+cxbWwPu7cKHRO2pc5n0+1vYxYYlS/PMWqwpwPsi7vEh/rIF9oCrzzZK52yNNhLZFyW66YpPpRJ6fglb3kUdJ0P8FHl9/tjlImAG/7+PvSMx20ndxcuIrv/20OH0SJTtVzAmL7Wv3UP6xY6ctM1xEfwT1tWmHctWE3jkvKGKrZqt/oLsm3d1stdscE4g90GZB+UfsA11c9VVZ3D4OD8fc37GPud9GXBqO50brnhIjtD6CkMnZLe0xi1ZQm5KexTwjQiMwLseajl0f7BZa/j+ULrI+NUeGcs8/GSdP9jkBMqkyctuPDtcFHpjfkvAHxLwyuRtYM+/NpJLHodAQlV/pRTJk6vHKOZTTXDfxbvbUt06AsdMOzOz5hem2LIstQaoPFWktibUYGAelChbyed0ChnuuvEDYXn1EavAsrLiJfdBxrPqEy1t2gd96NIiv8qK+nK1FNUJIRiZbAHyMidk/7/BVsSo3ya0zRARO5xj6oQ4ei6R+JjsUbncePcCfIQqwFDva4rBxMWF+5nAbyMR8iQKZ+q/UxgsS0bwYl5LzoeLxzPBqHKmpjGbQwfZGk1llMWQuXR0XbCOIkdqY94b1tLqb/ePCzomXl3MkuZ4udVp6gBPeho7g9dPeZvT0Hqk4Q2e4fLEoczEOZjDvcCq9zxgQTfsb4RyowN/IPBuJKh77X/qFbi0L321Yldn8t1EQVwr+8GDhjxFk19vE258MHekAPJwp2KrhB3GiUcPAFXhlGE3YsYsZQTDYEYcuuK1wVrcmfbYPPt82GRAsoFuOGb3TV8xwwje2yvpxN9x/75ZZ9aOowwkbzek5ItvEe1HBL44PvqYrJbVME/+DmOhhi84+j1/yvMpaj1JPLjzgJgprcRKGev+fpr+ISv8BUhYUs+RWFPjkONlIbK3TyzBGTflFZWgBvOUhBh9b3s/HBrZCnbeP+JTDIReI+HbBMJZC9d+bXPCbVqY05G0rfu8IagmoNan59iQ+OjeCrqqprCUruQqZRWzab3xdQcn98pXrzlxlqfA2omcvxe/lOmZCydUf48lL8+8KflhYOuUL4TDR6/LkxK//rA57kfceAK1B87DTnpJLBebFmxkrmRtgZkhAdNCwe/h/WZb3uC/Fmuj8RopENcnY0ju/KhtsoPClOYjv8i7T5rRmYjR0DK4whETVKu++Fb+ZcaRMUk9Rlo6l3rNivcxRirwVUljS4n0XAR2VKrKIMRz1bCpx9iaVPm7nt2vLAaaTbNZo5SoBlJbnu/YXejq5NRcJTaOS3kVfndGdu7b55tRFpJ08SaFTeQZlPl0DXIzJXFJTg4B3dp6rwGB+RxDVcjDLw2Dm5lnWuuutCWMn+Qx8GkIWm5+ze+eUNy4T4LV1VysrxohlPfOiNVNqWS+Gvj5w3Li90TREVzFIzd0Dex0wxyT5M1N3CZmSk2yLY1YXMIu8PTArkq8qJZMq3JNQU5Xi6pSTz7xKoD55okBFvhtcYXXXekQJTiexlyRRB0eXVo6iO0jkt2PqXB1MPjcU64fS/0XMJvnew0B8JjP+c+2K78ftglfq3hAXI9gdKaiMAZuTMEd7LH5mfPBrCnP3iB5dN1cPrTdn/GqT/BeTLf1XhbAOV8Ozwg6ztTf/lnUh9CAwFExiDy+rhcZQtxJo5TxmiufXd6NjbVr1j+RPsIH/8AciAmA5CgJaoXDM8rvrm6coMeN1UpJk+QrHeTl/plkIUiodS9QQpe9vg4PWJeeC8VluS+5Jm6zTL4cL613hTD4yZU7TAvChEE9DVn6etzZm7GgAFq+QXSF7x9SeW6IkhKLCaY+/yJgE2GdVHvNDcAKtkGYp5shTnJMI/vx1Y8uCNXcMxUZu7IsEUFOs3lPR0Bv3E9iIEdFgbHwOaj2arsld0sZiq7XPnzvHHbub8M3wuBpdLXiOJI7nOQDHiO7E9ijMzsoSnn/KV/HwPjCVh76XvOcEmMow0KS3plIR8jndvhEi+e7mU2MYNce4wtBAvUAdTyjZ+xpu5WY9nn3vEuy13D+dHsRRSXet09YXC8vwb9h5/kNEMK6GqB6kcig/EZlddm2Bq0A5v4wd8YRCvKWs7pLgQ8ULs1cM52BuNSldy2Y28oAp30wdhw8pNfA4HQsNACr7aWZ+lfFdGAsejaUPi0NV4I4nE+XAhGsh4bKFuqswQgAAAAAAA';
      
      // Load texture from base64
      const texture = new THREE.TextureLoader().load(iconBase64);
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Create double-sided plane with the icon
      const iconMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      
      const iconGeom = new THREE.PlaneGeometry(28, 28);
      const icon = new THREE.Mesh(iconGeom, iconMat);
      group.add(icon);
      
      // Add a subtle glow ring behind
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x4DD0E1,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const glowGeom = new THREE.RingGeometry(14, 16, 32);
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.z = -0.5;
      group.add(glow);
      
      // Position above ice cave
      group.position.set(x, y + 38, z);
      group.rotation.y = Math.PI; // Face south
      
      scene.add(group);
      
      // Store reference for animation
      group.userData = { 
        baseY: y + 38,
        phase: Math.random() * Math.PI * 2,
        icon: icon,
        glow: glow
      };
      
      return group;
    }
    
    const garajeIcon = createGarajeIcon(-170, -170);

    // ============ WELL (with fallen bucket) ============
    function createWell(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      const baseMat = createGlossyMaterial(0xBDC3C7);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3 * scale, 3.5 * scale, 3 * scale, 16),
        baseMat
      );
      base.position.y = 1.5 * scale;
      base.castShadow = true;
      group.add(base);

      const waterMat = createGlossyMaterial(0x3498DB, 0.2, 0.1);
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5 * scale, 2.5 * scale, 0.3 * scale, 16),
        waterMat
      );
      water.position.y = 2.8 * scale;
      group.add(water);

      const woodMat = createGlossyMaterial(0x8B5A2B);
      const postGeom = new THREE.CylinderGeometry(0.35 * scale, 0.35 * scale, 5 * scale, 8);
      const post1 = new THREE.Mesh(postGeom, woodMat);
      post1.position.set(-2.2 * scale, 4 * scale, 0);
      group.add(post1);
      const post2 = new THREE.Mesh(postGeom, woodMat);
      post2.position.set(2.2 * scale, 4 * scale, 0);
      group.add(post2);

      const roofMat = createGlossyMaterial(0xE74C3C);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(4 * scale, 2.5 * scale, 4),
        roofMat
      );
      roof.position.y = 7 * scale;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      
      // Crossbar
      const crossbar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 5 * scale, 8),
        woodMat
      );
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.y = 6 * scale;
      group.add(crossbar);
      
      // Rope hanging
      const ropeMat = createGlossyMaterial(0x8D6E63);
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 3 * scale, 6),
        ropeMat
      );
      rope.position.set(0, 4.5 * scale, 0);
      group.add(rope);

      // Fallen bucket on the ground (east side of well)
      const bucketMat = createGlossyMaterial(0x5D4037);
      const metalMat = createGlossyMaterial(0x78909C, 0.4, 0.2);
      
      const bucketGroup = new THREE.Group();
      
      // Bucket body (cylinder on its side)
      const bucketBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8 * scale, 1 * scale, 1.5 * scale, 12),
        bucketMat
      );
      bucketGroup.add(bucketBody);
      
      // Metal bands
      const band1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.85 * scale, 0.06 * scale, 8, 16),
        metalMat
      );
      band1.rotation.x = Math.PI / 2;
      band1.position.y = 0.4 * scale;
      bucketGroup.add(band1);
      
      const band2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.95 * scale, 0.06 * scale, 8, 16),
        metalMat
      );
      band2.rotation.x = Math.PI / 2;
      band2.position.y = -0.4 * scale;
      bucketGroup.add(band2);
      
      // Handle
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 * scale, 0.05 * scale, 8, 16, Math.PI),
        metalMat
      );
      handle.position.y = 0.8 * scale;
      bucketGroup.add(handle);
      
      // Position bucket fallen on ground, tilted
      bucketGroup.rotation.z = Math.PI / 2 + 0.3;
      bucketGroup.rotation.y = 0.5;
      bucketGroup.position.set(4.5 * scale, 0.8 * scale, 2 * scale);
      group.add(bucketGroup);

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // Pozo de los Deseos - center bottom of main plaza
    createWell(-70, getTerrainHeight(-70, 8), 8, 1);
    
    // Pozo Mayor - north area (smaller scale)
    createWell(10, getTerrainHeight(10, -55), -55, 0.9);

    // ============ MAIN PLAZA (COBBLESTONE FLOOR) ============
    function createPlazaFloor() {
      const plazaGroup = new THREE.Group();
      
      // Plaza dimensions
      const plazaCenterX = -70;
      const plazaCenterZ = 35;
      const plazaWidth = 80;
      const plazaDepth = 60;
      
      // Main cobblestone floor
      const floorGeom = new THREE.PlaneGeometry(plazaWidth, plazaDepth, 20, 15);
      const positions = floorGeom.attributes.position.array;
      
      // Slight height variation for natural look
      for (let i = 0; i < positions.length; i += 3) {
        const localX = positions[i];
        const localZ = positions[i + 1];
        const worldX = plazaCenterX + localX;
        const worldZ = plazaCenterZ - localZ;
        positions[i + 2] = getTerrainHeight(worldX, worldZ) + 0.1 + Math.random() * 0.05;
      }
      floorGeom.computeVertexNormals();
      
      const cobbleMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.8,
        metalness: 0.05,
      });
      
      const floor = new THREE.Mesh(floorGeom, cobbleMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(plazaCenterX, 0, plazaCenterZ);
      plazaGroup.add(floor);
      
      // Decorative cobblestone pattern (darker stones)
      const stoneMat = createGlossyMaterial(0x6B5344, 0.1);
      for (let i = 0; i < 120; i++) {
        const stoneX = plazaCenterX + (Math.random() - 0.5) * (plazaWidth - 4);
        const stoneZ = plazaCenterZ + (Math.random() - 0.5) * (plazaDepth - 4);
        const stoneY = getTerrainHeight(stoneX, stoneZ) + 0.15;
        
        const stone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.1, 6),
          stoneMat
        );
        stone.position.set(stoneX, stoneY, stoneZ);
        stone.rotation.y = Math.random() * Math.PI;
        plazaGroup.add(stone);
      }
      
      // Benches around the plaza
      const benchMat = createGlossyMaterial(0x5D4037, 0.2);
      const benchPositions = [
        { x: plazaCenterX - 35, z: plazaCenterZ, rot: Math.PI / 2 },
        { x: plazaCenterX + 35, z: plazaCenterZ, rot: -Math.PI / 2 },
        { x: plazaCenterX, z: plazaCenterZ - 25, rot: 0 },
      ];
      
      benchPositions.forEach(pos => {
        const benchGroup = new THREE.Group();
        const benchY = getTerrainHeight(pos.x, pos.z);
        
        // Bench seat
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(6, 0.4, 2),
          benchMat
        );
        seat.position.y = 1.5;
        benchGroup.add(seat);
        
        // Bench legs
        [-2.5, 2.5].forEach(legX => {
          const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 1.5, 1.8),
            benchMat
          );
          leg.position.set(legX, 0.75, 0);
          benchGroup.add(leg);
        });
        
        benchGroup.position.set(pos.x, benchY, pos.z);
        benchGroup.rotation.y = pos.rot;
        plazaGroup.add(benchGroup);
      });
      
      // Decorative lantern posts at corners
      const lanternMat = createGlossyMaterial(0x2C2C2C, 0.3);
      const glassMat = createGlossyMaterial(0xFFE4B5, 0.1);
      
      const lanternPositions = [
        { x: plazaCenterX - 30, z: plazaCenterZ + 20 },
        { x: plazaCenterX + 30, z: plazaCenterZ + 20 },
        { x: plazaCenterX - 30, z: plazaCenterZ - 20 },
        { x: plazaCenterX + 30, z: plazaCenterZ - 20 },
      ];
      
      lanternPositions.forEach(pos => {
        const lanternGroup = new THREE.Group();
        const lanternY = getTerrainHeight(pos.x, pos.z);
        
        // Post
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.4, 6, 8),
          lanternMat
        );
        post.position.y = 3;
        lanternGroup.add(post);
        
        // Lantern housing
        const housing = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.5, 1.2),
          lanternMat
        );
        housing.position.y = 6.5;
        lanternGroup.add(housing);
        
        // Glowing glass
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1, 0.8),
          glassMat
        );
        glass.position.y = 6.5;
        lanternGroup.add(glass);
        
        lanternGroup.position.set(pos.x, lanternY, pos.z);
        plazaGroup.add(lanternGroup);
      });
      
      scene.add(plazaGroup);
    }
    createPlazaFloor();

    // ============ LIBRARY BUILDING (SE corner of plaza) ============
    function createLibrary(x, y, z, scale = 1) {
      const group = new THREE.Group();
      
      // Materials
      const stoneMat = createGlossyMaterial(0x8B7355, 0.15);
      const darkStoneMat = createGlossyMaterial(0x5D4037, 0.1);
      const roofMat = createGlossyMaterial(0x4A3728, 0.2);
      const windowMat = createGlossyMaterial(0x87CEEB, 0.3);
      const doorMat = createGlossyMaterial(0x5D3A1A, 0.15);
      const goldMat = createGlossyMaterial(0xDAA520, 0.4);
      
      // Main building - rectangular with classical proportions
      const mainWidth = 16 * scale;
      const mainDepth = 12 * scale;
      const mainHeight = 12 * scale;
      
      const mainBody = new THREE.Mesh(
        new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth),
        stoneMat
      );
      mainBody.position.y = mainHeight / 2;
      group.add(mainBody);
      
      // Classical columns at entrance
      const columnMat = createGlossyMaterial(0xF5F5DC, 0.1);
      for (let i = 0; i < 4; i++) {
        const columnX = -mainWidth / 2 + 3 + i * 3.5;
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6 * scale, 0.7 * scale, 10 * scale, 12),
          columnMat
        );
        column.position.set(columnX * scale, 5 * scale, mainDepth / 2 + 1 * scale);
        group.add(column);
        
        // Column capital
        const capital = new THREE.Mesh(
          new THREE.BoxGeometry(1.4 * scale, 0.8 * scale, 1.4 * scale),
          columnMat
        );
        capital.position.set(columnX * scale, 10.5 * scale, mainDepth / 2 + 1 * scale);
        group.add(capital);
      }
      
      // Entrance portico roof
      const porticoRoof = new THREE.Mesh(
        new THREE.BoxGeometry(mainWidth * 0.9, 0.8 * scale, 4 * scale),
        darkStoneMat
      );
      porticoRoof.position.set(0, 11 * scale, mainDepth / 2 + 2 * scale);
      group.add(porticoRoof);
      
      // Main roof - gabled
      const roofGeom = new THREE.BufferGeometry();
      const roofVertices = new Float32Array([
        // Front face
        -mainWidth / 2, mainHeight, mainDepth / 2,
        mainWidth / 2, mainHeight, mainDepth / 2,
        0, mainHeight + 5 * scale, 0,
        // Back face
        mainWidth / 2, mainHeight, -mainDepth / 2,
        -mainWidth / 2, mainHeight, -mainDepth / 2,
        0, mainHeight + 5 * scale, 0,
        // Left side
        -mainWidth / 2, mainHeight, -mainDepth / 2,
        -mainWidth / 2, mainHeight, mainDepth / 2,
        0, mainHeight + 5 * scale, 0,
        // Right side
        mainWidth / 2, mainHeight, mainDepth / 2,
        mainWidth / 2, mainHeight, -mainDepth / 2,
        0, mainHeight + 5 * scale, 0,
      ]);
      roofGeom.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
      roofGeom.computeVertexNormals();
      
      const roof = new THREE.Mesh(roofGeom, roofMat);
      group.add(roof);
      
      // Windows (arched)
      const windowPositions = [
        { x: -5, z: mainDepth / 2 + 0.1 },
        { x: 5, z: mainDepth / 2 + 0.1 },
        { x: -5, z: -mainDepth / 2 - 0.1 },
        { x: 5, z: -mainDepth / 2 - 0.1 },
      ];
      
      windowPositions.forEach(pos => {
        // Window frame (arched top)
        const windowFrame = new THREE.Mesh(
          new THREE.BoxGeometry(2 * scale, 4 * scale, 0.3 * scale),
          windowMat
        );
        windowFrame.position.set(pos.x * scale, 6 * scale, pos.z * scale);
        group.add(windowFrame);
        
        // Arch top
        const arch = new THREE.Mesh(
          new THREE.CylinderGeometry(1 * scale, 1 * scale, 0.3 * scale, 16, 1, false, 0, Math.PI),
          windowMat
        );
        arch.rotation.x = Math.PI / 2;
        arch.rotation.z = Math.PI / 2;
        arch.position.set(pos.x * scale, 8 * scale, pos.z * scale);
        group.add(arch);
      });
      
      // Main door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(3 * scale, 5 * scale, 0.3 * scale),
        doorMat
      );
      door.position.set(0, 2.5 * scale, mainDepth / 2 + 0.2 * scale);
      group.add(door);
      
      // Door arch
      const doorArch = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5 * scale, 1.5 * scale, 0.3 * scale, 16, 1, false, 0, Math.PI),
        doorMat
      );
      doorArch.rotation.x = Math.PI / 2;
      doorArch.rotation.z = Math.PI / 2;
      doorArch.position.set(0, 5 * scale, mainDepth / 2 + 0.2 * scale);
      group.add(doorArch);
      
      // Book symbol above door
      const bookMat = createGlossyMaterial(0x8B4513, 0.2);
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(2.5 * scale, 0.5 * scale, 1.8 * scale),
        bookMat
      );
      book.position.set(0, 8 * scale, mainDepth / 2 + 0.5 * scale);
      group.add(book);
      
      // Sign: "BIBLIOTECA"
      // (Would need text geometry or sprite, keeping simple for now)
      
      // Steps at entrance
      for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(mainWidth * 0.7, 0.4 * scale, 1.5 * scale),
          darkStoneMat
        );
        step.position.set(0, 0.2 * scale + i * 0.4 * scale, mainDepth / 2 + 4 * scale - i * 1.2 * scale);
        group.add(step);
      }
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }
    
    // Place Library at SE corner of plaza
    const libraryX = -40;
    const libraryZ = 15;
    createLibrary(libraryX, getTerrainHeight(libraryX, libraryZ), libraryZ, 0.85);

    // ============ TREES ============
    function createTree(x, y, z, type = 'normal', scale = 1) {
      const group = new THREE.Group();
      const trunkMat = createGlossyMaterial(0x8B5A2B);

      if (type === 'palm') {
        // Palm tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8 * scale, 1.2 * scale, 12 * scale, 8),
          trunkMat
        );
        trunk.position.y = 6 * scale;
        group.add(trunk);

        const leafMat = createGlossyMaterial(0x2E7D32);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const leaf = new THREE.Mesh(
            new THREE.ConeGeometry(1.5 * scale, 8 * scale, 4),
            leafMat
          );
          leaf.position.set(
            Math.cos(angle) * 2 * scale,
            12 * scale,
            Math.sin(angle) * 2 * scale
          );
          leaf.rotation.z = Math.PI / 3;
          leaf.rotation.y = angle;
          group.add(leaf);
        }
      } else if (type === 'pine') {
        // Pine tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6 * scale, 0.9 * scale, 6 * scale, 8),
          trunkMat
        );
        trunk.position.y = 3 * scale;
        group.add(trunk);

        const pineMat = createGlossyMaterial(0x1B5E20);
        for (let i = 0; i < 4; i++) {
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry((4 - i * 0.7) * scale, (5 - i) * scale, 8),
            pineMat
          );
          cone.position.y = (6 + i * 3) * scale;
          cone.castShadow = true;
          group.add(cone);
        }
      } else if (type === 'snowy_pine') {
        // Snow-covered pine tree (Norwegian fjord style)
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 5 * scale, 8),
          trunkMat
        );
        trunk.position.y = 2.5 * scale;
        group.add(trunk);

        // Dark green pine with snow on top
        const darkPineMat = createGlossyMaterial(0x0D4F1C);
        const snowMat = createGlossyMaterial(0xFAFAFA, 0.1, 0.2);
        
        for (let i = 0; i < 4; i++) {
          // Pine layer
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry((3.5 - i * 0.6) * scale, (4.5 - i * 0.8) * scale, 8),
            darkPineMat
          );
          cone.position.y = (5 + i * 2.5) * scale;
          cone.castShadow = true;
          group.add(cone);
          
          // Snow cap on each layer
          const snowCap = new THREE.Mesh(
            new THREE.ConeGeometry((3.2 - i * 0.6) * scale, (1.5 - i * 0.2) * scale, 8),
            snowMat
          );
          snowCap.position.y = (6.5 + i * 2.5) * scale;
          group.add(snowCap);
        }
        
        // Snow on top
        const topSnow = new THREE.Mesh(
          new THREE.SphereGeometry(0.8 * scale, 8, 8),
          snowMat
        );
        topSnow.position.y = (14) * scale;
        topSnow.scale.y = 0.5;
        group.add(topSnow);
      } else {
        // Normal round tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6 * scale, 0.8 * scale, 4 * scale, 16),
          trunkMat
        );
        trunk.position.y = 2 * scale;
        group.add(trunk);

        const foliageMat = createGlossyMaterial(0x43A047);
        const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(4 * scale, 16, 16), foliageMat);
        foliage1.position.y = 6 * scale;
        foliage1.castShadow = true;
        group.add(foliage1);

        const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(3 * scale, 16, 16), foliageMat);
        foliage2.position.set(1.5 * scale, 8 * scale, 1 * scale);
        foliage2.castShadow = true;
        group.add(foliage2);
      }

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    // Place trees throughout the world - using terrain height
    // RIVER IS AT z ≈ 70-100, so trees north of river should have z < 60
    
    // ========== RIVERBANK PALMS (decorative, on both banks) ==========
    // North bank (z ≈ 60-65)
    createTree(-100, getTerrainHeight(-100, 62), 62, 'palm', 1);
    createTree(-40, getTerrainHeight(-40, 60), 60, 'palm', 0.9);
    createTree(50, getTerrainHeight(50, 63), 63, 'palm', 1.1);
    createTree(100, getTerrainHeight(100, 60), 60, 'palm', 0.95);
    
    // South bank (z ≈ 105-115) - far side of river
    createTree(-80, getTerrainHeight(-80, 110), 110, 'palm', 1.1);
    createTree(0, getTerrainHeight(0, 115), 115, 'palm', 0.9);
    createTree(70, getTerrainHeight(70, 108), 108, 'palm', 1);
    
    // ========== COTA MEDIA - Village area trees (z = 0 to 55) ==========
    // Around plaza and market
    createTree(-35, getTerrainHeight(-35, 35), 35, 'normal', 1);
    createTree(35, getTerrainHeight(35, 38), 38, 'normal', 0.95);
    createTree(80, getTerrainHeight(80, 40), 40, 'normal', 0.9);
    
    // Near cottage area (west)
    createTree(-75, getTerrainHeight(-75, 15), 15, 'normal', 0.9);
    createTree(-85, getTerrainHeight(-85, 25), 25, 'pine', 1);
    
    // East side
    createTree(90, getTerrainHeight(90, 30), 30, 'normal', 0.85);
    createTree(75, getTerrainHeight(75, 20), 20, 'pine', 1.1);
    
    // ========== TRANSITION ZONE (z = -20 to 0) ==========
    createTree(-55, getTerrainHeight(-55, -10), -10, 'pine', 1.1);
    createTree(55, getTerrainHeight(55, -15), -15, 'pine', 1);
    createTree(-30, getTerrainHeight(-30, -5), -5, 'normal', 0.9);
    createTree(25, getTerrainHeight(25, -8), -8, 'normal', 0.95);
    
    // ========== COTA ALTA - Forest / Frozen Zone (z < -20) ==========
    // Dense forest area - but trees in frozen zone are snow-covered
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 1.5 - Math.PI * 0.75;
      const dist = 25 + Math.random() * 45;
      const tx = -15 + Math.cos(angle) * dist;
      const tz = -50 + Math.sin(angle) * dist * 0.6;
      
      // Use exclusion zone check
      if (!isInExclusionZone(tx, tz) && tz < -20) {
        // Trees in frozen zone (z < -30) are snowy pines
        const treeType = tz < -30 ? 'snowy_pine' : (Math.random() > 0.35 ? 'pine' : 'normal');
        createTree(
          tx,
          getTerrainHeight(tx, tz),
          tz,
          treeType,
          0.7 + Math.random() * 0.5
        );
      }
    }
    
    // More trees specifically in the frozen fjord area
    for (let i = 0; i < 12; i++) {
      const tx = (Math.random() - 0.5) * 160;
      const tz = -80 + Math.random() * 40; // z from -80 to -40
      
      // Use exclusion zone check
      if (!isInExclusionZone(tx, tz)) {
        createTree(
          tx,
          getTerrainHeight(tx, tz),
          tz,
          'snowy_pine',
          0.6 + Math.random() * 0.5
        );
      }
    }
    
    // Meadow edge trees
    createTree(60, getTerrainHeight(60, -40), -40, 'pine', 1.1);
    createTree(-70, getTerrainHeight(-70, -35), -35, 'pine', 1);
    createTree(75, getTerrainHeight(75, -50), -50, 'pine', 0.95);

    // ============ MARKET STALLS ============
    function createMarketStall(x, y, z, color, rotation = 0) {
      const group = new THREE.Group();
      
      const stallMat = createGlossyMaterial(0x8B5A2B);
      const canopyMat = createGlossyMaterial(color);

      // Counter
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 4),
        stallMat
      );
      counter.position.y = 2;
      counter.castShadow = true;
      group.add(counter);

      // Canopy
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.5, 6),
        canopyMat
      );
      canopy.position.y = 7;
      canopy.rotation.x = 0.1;
      canopy.castShadow = true;
      group.add(canopy);

      // Posts
      for (let px = -1; px <= 1; px += 2) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 7, 8),
          stallMat
        );
        post.position.set(px * 4, 3.5, 2);
        group.add(post);
      }

      // Goods on counter
      const goodColors = [0xFF5722, 0xFFC107, 0x8BC34A, 0x9C27B0];
      for (let i = 0; i < 4; i++) {
        const good = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          createGlossyMaterial(goodColors[i])
        );
        good.position.set(-2.5 + i * 1.8, 4.5, 0);
        group.add(good);
      }

      group.position.set(x, y, z);
      group.rotation.y = rotation;
      scene.add(group);
      return group;
    }

    // Market area - east side of main path, rotated 180° from before
    createMarketStall(25, getTerrainHeight(25, 42), 42, 0xE53935, Math.PI/2 + 0.1);    // Red stall
    createMarketStall(25, getTerrainHeight(25, 32), 32, 0x1E88E5, Math.PI/2);           // Blue stall
    createMarketStall(25, getTerrainHeight(25, 22), 22, 0xFDD835, Math.PI/2 - 0.1);    // Yellow stall

    // ============ DECORATIVE ELEMENTS ============
    
    // Rocks scattered
    function createRock(x, y, z, scale = 1) {
      const rockMat = createGlossyMaterial(0x78909C, 0.1, 0.4);
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2 * scale, 1),
        rockMat
      );
      rock.position.set(x, y + scale, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.y = 0.6;
      rock.castShadow = true;
      scene.add(rock);
    }

    // Scatter rocks - more in high/forest areas, fewer in village
    // All north of river (z < 60)
    // Rocks in frozen zone are icy blue
    const normalRockMat = createGlossyMaterial(0x78909C, 0.1, 0.5);
    const icyRockMat = createGlossyMaterial(0x90CAF9, 0.2, 0.2);
    
    for (let i = 0; i < 40; i++) {
      const rx = (Math.random() - 0.5) * 280;
      const rz = (Math.random() - 0.5) * 150 - 20; // z from -95 to 55 (north of river)
      
      // Skip if in exclusion zone
      if (isInExclusionZone(rx, rz)) continue;
      
      // More rocks in higher elevations
      const height = getTerrainHeight(rx, rz);
      if (Math.random() < (height / 30 + 0.2)) {
        const rockSize = 0.4 + Math.random() * 1.2;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rockSize * 2, 1),
          rz < -30 ? icyRockMat : normalRockMat
        );
        rock.position.set(rx, height + rockSize * 0.3, rz);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.6;
        rock.castShadow = true;
        scene.add(rock);
      }
    }

    // Flowers - scattered in meadows and around village (all north of river, but not in frozen zone)
    function createFlowerPatch(x, z) {
      const colors = [0xFF4081, 0xFFEB3B, 0xE040FB, 0xFF5722, 0xFFFFFF, 0x7C4DFF];
      for (let i = 0; i < 10; i++) {
        const fx = x + (Math.random() - 0.5) * 6;
        const fz = z + (Math.random() - 0.5) * 6;
        const fy = getTerrainHeight(fx, fz);
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.35 + Math.random() * 0.2, 8, 8),
          createGlossyMaterial(colors[Math.floor(Math.random() * colors.length)])
        );
        flower.position.set(fx, fy + 0.4, fz);
        scene.add(flower);
      }
    }
    
    // Flowers around plaza/market area
    createFlowerPatch(-20, 35);
    createFlowerPatch(25, 40);
    createFlowerPatch(5, 30);
    
    // Flowers in transition zone (not frozen)
    createFlowerPatch(-35, -15);
    createFlowerPatch(25, -20);
    createFlowerPatch(0, -10);
    
    // Flowers near village buildings (non-frozen)
    createFlowerPatch(-55, 50);  // Near tribal house
    createFlowerPatch(55, 40);   // Near mediterranean house
    createFlowerPatch(-60, 15);  // Near cottage (west side, away from well)

    // ============ CLOUDS ============
    function createCloud(x, y, z) {
      const group = new THREE.Group();
      const cloudMat = createGlossyMaterial(0xFFFFFF, 0, 0.2);
      
      const sizes = [6, 4.5, 5, 3.5];
      const positions = [[0,0,0], [5,1,1], [-4,0.5,1], [2,-1,2]];
      
      positions.forEach((pos, i) => {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(sizes[i], 16, 16),
          cloudMat
        );
        puff.position.set(pos[0], pos[1], pos[2]);
        group.add(puff);
      });
      
      group.position.set(x, y, z);
      scene.add(group);
      return group;
    }

    const clouds = [
      createCloud(-100, 120, -100),
      createCloud(50, 130, -120),
      createCloud(150, 115, -80),
      createCloud(-150, 125, -60),
      createCloud(0, 140, -150),
    ];

    // ============ CHARACTER CREATION ============
    function createToyCharacter(config = {}) {
      const {
        skinColor = 0xDEB896,
        hairColor = 0x1a1a1a,
        hairStyle = 'spiky',
        hasBeard = false,
        beardColor = 0x1a1a1a,
        shirtColor = 0xFFFFFF,
        pantsColor = 0x1a1a1a,
        shoeColor = 0xFFFFFF,
        hasWatch = false,
        eyebrowStyle = 'normal',
        scale = 1,
      } = config;

      const group = new THREE.Group();
      const skinMat = createGlossyMaterial(skinColor);
      const hairMat = createGlossyMaterial(hairColor);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(2.2 * scale, 32, 32), skinMat);
      head.scale.set(1, 0.95, 0.9);
      head.position.y = 6.5 * scale;
      head.castShadow = true;
      group.add(head);

      // Face highlight
      const highlightMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, transparent: true, opacity: 0.3, roughness: 0.1
      });
      const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.8 * scale, 16, 16), highlightMat);
      highlight.position.set(-1 * scale, 7.2 * scale, 1.5 * scale);
      group.add(highlight);

      // Eyes
      const eyeMat = createGlossyMaterial(0x000000);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 16, 16), eyeMat);
      eyeL.position.set(-0.55 * scale, 6.8 * scale, 1.95 * scale);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 16, 16), eyeMat);
      eyeR.position.set(0.55 * scale, 6.8 * scale, 1.95 * scale);
      group.add(eyeR);

      // Eyebrows (simplified - just small arcs)
      const browMat = createGlossyMaterial(hairColor);
      const browL = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.12 * scale, 0.15 * scale), browMat);
      browL.position.set(-0.55 * scale, 7.15 * scale, 1.9 * scale);
      group.add(browL);
      const browR = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.12 * scale, 0.15 * scale), browMat);
      browR.position.set(0.55 * scale, 7.15 * scale, 1.9 * scale);
      group.add(browR);

      // Nose (small and simple)
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 16, 16), skinMat);
      nose.scale.set(0.8, 0.5, 0.4);
      nose.position.set(0, 6.5 * scale, 2 * scale);
      group.add(nose);

      // NO MOUTH - cleaner toy look

      // Ears
      const earL = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 16, 16), skinMat);
      earL.scale.set(0.35, 0.8, 0.6);
      earL.position.set(-2.1 * scale, 6.5 * scale, 0);
      group.add(earL);
      const earR = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 16, 16), skinMat);
      earR.scale.set(0.35, 0.8, 0.6);
      earR.position.set(2.1 * scale, 6.5 * scale, 0);
      group.add(earR);

      // Hair
      if (hairStyle === 'spiky') {
        const hairBase = new THREE.Mesh(
          new THREE.SphereGeometry(2.3 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5),
          hairMat
        );
        hairBase.position.y = 6.6 * scale;
        group.add(hairBase);

        const spikes = [
          {x: 0, z: 0, h: 2.2, rot: 0},
          {x: 1, z: 0.3, h: 1.8, rot: 0.3},
          {x: -1, z: 0.3, h: 1.8, rot: -0.3},
          {x: 0.5, z: -0.8, h: 1.5, rot: 0.2},
          {x: -0.5, z: -0.8, h: 1.5, rot: -0.2},
        ];
        spikes.forEach(sp => {
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.5 * scale, sp.h * scale, 8),
            hairMat
          );
          spike.position.set(sp.x * scale, 8.5 * scale + sp.h * 0.2, sp.z * scale);
          spike.rotation.z = sp.rot;
          spike.rotation.x = sp.z * 0.4;
          group.add(spike);
        });
      }

      // NO BEARD - cleaner toy look

      // Body
      const bodyMat = createGlossyMaterial(shirtColor);
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.2 * scale, 32, 32), bodyMat);
      body.scale.set(1.2, 1.1, 1);
      body.position.y = 3.2 * scale;
      body.castShadow = true;
      group.add(body);

      // Arms
      const armL = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 16, 16), skinMat);
      armL.scale.set(0.8, 1.4, 0.9);
      armL.position.set(-2.6 * scale, 3.3 * scale, 0);
      group.add(armL);
      const armR = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 16, 16), skinMat);
      armR.scale.set(0.8, 1.4, 0.9);
      armR.position.set(2.6 * scale, 3.3 * scale, 0);
      group.add(armR);

      // Hands
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 16, 16), skinMat);
      handL.position.set(-2.8 * scale, 2.4 * scale, 0.2 * scale);
      group.add(handL);
      const handR = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 16, 16), skinMat);
      handR.position.set(2.8 * scale, 2.4 * scale, 0.2 * scale);
      group.add(handR);

      // Watch
      if (hasWatch) {
        const watchMat = createGlossyMaterial(0x1a1a1a);
        const watch = new THREE.Mesh(new THREE.TorusGeometry(0.35 * scale, 0.12 * scale, 8, 16), watchMat);
        watch.position.set(2.7 * scale, 2.7 * scale, 0);
        watch.rotation.y = Math.PI / 2;
        group.add(watch);
      }

      // Pants
      const pantsMat = createGlossyMaterial(pantsColor);
      const pants = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8 * scale, 1.5 * scale, 1.8 * scale, 16),
        pantsMat
      );
      pants.position.y = 1.2 * scale;
      group.add(pants);

      // Legs
      const legL = new THREE.Mesh(new THREE.SphereGeometry(0.65 * scale, 16, 16), pantsMat);
      legL.scale.set(1, 1.4, 1);
      legL.position.set(-0.75 * scale, 0.6 * scale, 0);
      group.add(legL);
      const legR = new THREE.Mesh(new THREE.SphereGeometry(0.65 * scale, 16, 16), pantsMat);
      legR.scale.set(1, 1.4, 1);
      legR.position.set(0.75 * scale, 0.6 * scale, 0);
      group.add(legR);

      // Shoes
      const shoeMat = createGlossyMaterial(shoeColor);
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(1.1 * scale, 0.5 * scale, 1.6 * scale), shoeMat);
      shoeL.position.set(-0.75 * scale, 0.25 * scale, 0.2 * scale);
      group.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(1.1 * scale, 0.5 * scale, 1.6 * scale), shoeMat);
      shoeR.position.set(0.75 * scale, 0.25 * scale, 0.2 * scale);
      group.add(shoeR);

      return group;
    }

    // ============ PLAYER ============
    // Start in the village, north of the river
    const playerStartX = 0;
    const playerStartZ = 35;
    const player = createToyCharacter({
      hairStyle: 'spiky',
      hasBeard: true,
      shirtColor: 0xFFFFFF,
      pantsColor: 0x1a1a1a,
      shoeColor: 0xFFFFFF,
      hasWatch: true,
    });
    player.position.set(playerStartX, getTerrainHeight(playerStartX, playerStartZ), playerStartZ);
    scene.add(player);

    const playerState = {
      x: playerStartX, 
      y: getTerrainHeight(playerStartX, playerStartZ), 
      z: playerStartZ,
      rotation: 0, targetRotation: 0,
      isMoving: false, bobPhase: 0,
    };

    // ============ NPCs ============
    const npcs = [];
    
    function createNPCState(startX, startZ) {
      const y = getTerrainHeight(startX, startZ);
      return {
        x: startX, y: y, z: startZ,
        targetX: startX, targetZ: startZ,
        controlX: startX, controlZ: startZ,
        pathProgress: 0,
        startX: startX, startZ: startZ,
        rotation: Math.random() * Math.PI * 2,
        targetRotation: Math.random() * Math.PI * 2,
        state: 0, // IDLE
        stateTimer: Math.random() * 5000 + 2000,
        walkSpeed: 0.006 + Math.random() * 0.003,
        bobPhase: Math.random() * Math.PI * 2,
        idlePhase: Math.random() * Math.PI * 2,
      };
    }

    // Create NPCs distributed across zones (all north of river, z < 60)
    const npcConfigs = [
      // Near market area
      { x: 0, z: 42, config: { hairStyle: 'spiky', hasBeard: true, shirtColor: 0x3498DB, pantsColor: 0xE74C3C } },
      
      // Near tribal house / orchard (west)
      { x: -70, z: 52, config: { hasBeard: true, shirtColor: 0xC0392B, pantsColor: 0x1a1a1a } },
      
      // Near plaza well
      { x: 10, z: 28, config: { shirtColor: 0x27AE60, pantsColor: 0x27AE60, scale: 0.85 } },
      
      // Near cottage (west side, avoiding well on east)
      { x: -60, z: 15, config: { skinColor: 0xF5CBA7, hairColor: 0xF4D03F, hasBeard: true, beardColor: 0xF4D03F, shirtColor: 0x8E44AD } },
      
      // Near ice cave (high zone - north)
      { x: 20, z: -45, config: { hairStyle: 'spiky', hasBeard: false, shirtColor: 0x795548, pantsColor: 0x3E2723 } },
    ];

    npcConfigs.forEach(npcDef => {
      const npc = createToyCharacter(npcDef.config);
      const y = getTerrainHeight(npcDef.x, npcDef.z);
      npc.position.set(npcDef.x, y, npcDef.z);
      scene.add(npc);
      npcs.push({ mesh: npc, ai: createNPCState(npcDef.x, npcDef.z) });
    });

    // ============ ANIMALS ============
    const animals = [];
    
    // Create a chicken
    function createChicken() {
      const group = new THREE.Group();
      const bodyMat = createGlossyMaterial(0xFFFFFF); // White
      const beakMat = createGlossyMaterial(0xFFA000);
      const combMat = createGlossyMaterial(0xE53935);
      const legMat = createGlossyMaterial(0xFFB300);
      
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), bodyMat);
      body.scale.set(1, 0.8, 1.3);
      body.position.y = 1.5;
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), bodyMat);
      head.position.set(0, 2.3, 1);
      group.add(head);
      
      // Beak
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), beakMat);
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 2.2, 1.6);
      group.add(beak);
      
      // Comb
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.5), combMat);
      comb.position.set(0, 2.8, 1);
      group.add(comb);
      
      // Wattle
      const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), combMat);
      wattle.position.set(0, 2, 1.3);
      group.add(wattle);
      
      // Eyes
      const eyeMat = createGlossyMaterial(0x1a1a1a);
      [-0.25, 0.25].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
        eye.position.set(side, 2.4, 1.4);
        group.add(eye);
      });
      
      // Legs
      [-0.4, 0.4].forEach(side => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1, 6), legMat);
        leg.position.set(side, 0.5, 0);
        group.add(leg);
      });
      
      // Tail feathers
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 6), bodyMat);
      tail.rotation.x = Math.PI / 3;
      tail.position.set(0, 2, -1);
      group.add(tail);
      
      group.scale.setScalar(0.8);
      return group;
    }
    
    // Create a sheep
    function createSheep() {
      const group = new THREE.Group();
      const woolMat = createGlossyMaterial(0xF5F5F5);
      const faceMat = createGlossyMaterial(0x1a1a1a);
      const legMat = createGlossyMaterial(0x212121);
      
      // Woolly body
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 10), woolMat);
      body.scale.set(1, 0.8, 1.4);
      body.position.y = 2;
      group.add(body);
      
      // Fluffy texture bumps
      for (let i = 0; i < 8; i++) {
        const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), woolMat);
        const angle = (i / 8) * Math.PI * 2;
        fluff.position.set(Math.cos(angle) * 1.3, 2 + Math.sin(i) * 0.3, Math.sin(angle) * 1.8);
        group.add(fluff);
      }
      
      // Head (black face)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), faceMat);
      head.scale.set(0.8, 1, 1);
      head.position.set(0, 2.5, 2.2);
      group.add(head);
      
      // Ears
      [-0.5, 0.5].forEach(side => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), faceMat);
        ear.scale.set(1.5, 0.5, 1);
        ear.position.set(side, 2.7, 1.9);
        group.add(ear);
      });
      
      // Eyes
      const eyeMat = createGlossyMaterial(0xFFFFFF);
      [-0.2, 0.2].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
        eye.position.set(side, 2.6, 2.7);
        group.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), faceMat);
        pupil.position.set(side, 2.6, 2.8);
        group.add(pupil);
      });
      
      // Legs
      [[-0.7, 1.5], [0.7, 1.5], [-0.7, -1], [0.7, -1]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 1.5, 8), legMat);
        leg.position.set(x, 0.75, z);
        group.add(leg);
      });
      
      group.scale.setScalar(0.7);
      return group;
    }
    
    // Create a Border Collie
    function createBorderCollie() {
      const group = new THREE.Group();
      const blackMat = createGlossyMaterial(0x1a1a1a);
      const whiteMat = createGlossyMaterial(0xFFFFFF);
      
      // Body (black) - using stretched sphere instead of capsule
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), blackMat);
      body.scale.set(1.8, 0.7, 0.7);
      body.position.set(0, 1.5, 0);
      group.add(body);
      
      // White chest/belly
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), whiteMat);
      chest.scale.set(0.8, 1, 0.8);
      chest.position.set(0, 1.3, 0.8);
      group.add(chest);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), blackMat);
      head.scale.set(0.9, 0.85, 1);
      head.position.set(0, 2.2, 1.3);
      group.add(head);
      
      // White blaze on face
      const blaze = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.3), whiteMat);
      blaze.position.set(0, 2.3, 1.7);
      group.add(blaze);
      
      // Snout
      const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8), blackMat);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 2, 1.8);
      group.add(snout);
      
      // Nose
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), createGlossyMaterial(0x2D2D2D));
      nose.position.set(0, 2.05, 2.1);
      group.add(nose);
      
      // Ears (floppy)
      [-0.4, 0.4].forEach(side => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), blackMat);
        ear.scale.set(0.6, 1, 0.4);
        ear.position.set(side, 2.5, 1.1);
        ear.rotation.z = side * 0.5;
        group.add(ear);
      });
      
      // Eyes
      const eyeMat = createGlossyMaterial(0x5D4037);
      [-0.2, 0.2].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), eyeMat);
        eye.position.set(side, 2.35, 1.7);
        group.add(eye);
      });
      
      // Legs (white socks)
      [[-0.4, 0.6], [0.4, 0.6], [-0.4, -0.8], [0.4, -0.8]].forEach(([x, z], i) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.2, 8), blackMat);
        leg.position.set(x, 0.6, z);
        group.add(leg);
        // White paws
        const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 8), whiteMat);
        paw.position.set(x, 0.15, z);
        group.add(paw);
      });
      
      // Fluffy tail - using cylinder instead of capsule
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 1.2, 8), blackMat);
      tail.rotation.x = -0.5;
      tail.position.set(0, 1.8, -1.3);
      group.add(tail);
      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), whiteMat);
      tailTip.position.set(0, 2.2, -1.8);
      group.add(tailTip);
      
      group.scale.setScalar(0.9);
      return group;
    }
    
    // Create a small dog (puppy)
    function createPuppy(color = 0xD2691E) {
      const group = new THREE.Group();
      const furMat = createGlossyMaterial(color);
      const noseMat = createGlossyMaterial(0x1a1a1a);
      
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), furMat);
      body.scale.set(1, 0.9, 1.3);
      body.position.y = 1;
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), furMat);
      head.position.set(0, 1.5, 0.7);
      group.add(head);
      
      // Snout
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), furMat);
      snout.scale.set(0.8, 0.7, 1);
      snout.position.set(0, 1.35, 1.1);
      group.add(snout);
      
      // Nose
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), noseMat);
      nose.position.set(0, 1.4, 1.3);
      group.add(nose);
      
      // Ears (floppy)
      [-0.35, 0.35].forEach(side => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), furMat);
        ear.scale.set(0.6, 1.2, 0.4);
        ear.position.set(side, 1.7, 0.5);
        group.add(ear);
      });
      
      // Eyes
      const eyeMat = createGlossyMaterial(0x1a1a1a);
      [-0.18, 0.18].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
        eye.position.set(side, 1.6, 1);
        group.add(eye);
      });
      
      // Legs
      [[-0.35, 0.4], [0.35, 0.4], [-0.35, -0.5], [0.35, -0.5]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), furMat);
        leg.position.set(x, 0.35, z);
        group.add(leg);
      });
      
      // Tail (wagging up) - using cylinder instead of capsule
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 6), furMat);
      tail.rotation.x = -0.8;
      tail.position.set(0, 1.3, -0.8);
      group.add(tail);
      
      group.scale.setScalar(0.8);
      return group;
    }
    
    // Create Yeti
    function createYeti() {
      const group = new THREE.Group();
      const furMat = createGlossyMaterial(0xE8E8E8);
      const faceMat = createGlossyMaterial(0x90CAF9);
      
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), furMat);
      body.scale.set(1, 1.2, 0.9);
      body.position.y = 3;
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), furMat);
      head.position.set(0, 5.2, 0.3);
      group.add(head);
      
      // Face
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), faceMat);
      face.scale.set(1, 0.8, 0.5);
      face.position.set(0, 5, 0.9);
      group.add(face);
      
      // Eyes
      const eyeWhite = createGlossyMaterial(0xFFFFFF);
      const eyePupil = createGlossyMaterial(0x1a1a1a);
      [-0.35, 0.35].forEach(side => {
        const white = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), eyeWhite);
        white.position.set(side, 5.2, 1.1);
        group.add(white);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), eyePupil);
        pupil.position.set(side, 5.2, 1.25);
        group.add(pupil);
      });
      
      // Mouth
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), eyePupil);
      mouth.position.set(0, 4.6, 1.1);
      group.add(mouth);
      
      // Arms - using cylinder instead of capsule
      [-1, 1].forEach(side => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 2.5, 8), furMat);
        arm.rotation.z = side * 0.3;
        arm.position.set(side * 1.8, 3.5, 0);
        group.add(arm);
      });
      
      // Legs - using cylinder instead of capsule
      [-0.7, 0.7].forEach(side => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 2, 8), furMat);
        leg.position.set(side, 1, 0);
        group.add(leg);
        // Feet
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), faceMat);
        foot.scale.set(1, 0.5, 1.3);
        foot.position.set(side, 0.2, 0.3);
        group.add(foot);
      });
      
      group.scale.setScalar(0.6);
      return group;
    }
    
    // Create a bird
    function createBird(color = 0x1E88E5) {
      const group = new THREE.Group();
      const bodyMat = createGlossyMaterial(color);
      const beakMat = createGlossyMaterial(0xFFB300);
      
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), bodyMat);
      body.scale.set(0.8, 0.7, 1.2);
      group.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), bodyMat);
      head.position.set(0, 0.2, 0.4);
      group.add(head);
      
      // Beak
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), beakMat);
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.15, 0.65);
      group.add(beak);
      
      // Wings
      [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.35), bodyMat);
        wing.position.set(side * 0.5, 0.1, -0.1);
        wing.userData.side = side;
        wing.userData.baseRotation = side * 0.3;
        wing.rotation.z = side * 0.3;
        wing.name = 'wing';
        group.add(wing);
      });
      
      // Tail
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.4), bodyMat);
      tail.position.set(0, 0, -0.5);
      group.add(tail);
      
      // Eye
      const eyeMat = createGlossyMaterial(0x1a1a1a);
      [-0.1, 0.1].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
        eye.position.set(side, 0.28, 0.55);
        group.add(eye);
      });
      
      group.scale.setScalar(1.5);
      return group;
    }
    
    // Animal AI state
    function createAnimalAI(startX, startZ, options = {}) {
      const y = getTerrainHeight(startX, startZ);
      return {
        x: startX, y: y, z: startZ,
        homeX: startX, homeZ: startZ,
        targetX: startX, targetZ: startZ,
        wanderRadius: options.wanderRadius || 15,
        minZ: options.minZ || -200,
        maxZ: options.maxZ || 200,
        minX: options.minX || -200,
        maxX: options.maxX || 200,
        rotation: Math.random() * Math.PI * 2,
        targetRotation: 0,
        state: 0, // 0=IDLE, 1=WALKING
        stateTimer: Math.random() * 3000 + 1000,
        walkSpeed: options.walkSpeed || 0.003,
        bobPhase: Math.random() * Math.PI * 2,
        wingPhase: 0,
        isFlying: options.isFlying || false,
        flyHeight: options.flyHeight || 50,
        type: options.type || 'ground'
      };
    }
    
    // Chickens near market (market is around x=0, z=25)
    for (let i = 0; i < 3; i++) {
      const chicken = createChicken();
      const x = 15 + Math.random() * 20;
      const z = 30 + Math.random() * 15;
      const y = getTerrainHeight(x, z);
      chicken.position.set(x, y, z);
      scene.add(chicken);
      animals.push({ 
        mesh: chicken, 
        ai: createAnimalAI(x, z, { wanderRadius: 12, walkSpeed: 0.004, type: 'chicken' }) 
      });
    }
    
    // Sheep flock in the south (below river, z > 100)
    for (let i = 0; i < 5; i++) {
      const sheep = createSheep();
      const x = -30 + Math.random() * 60;
      const z = 120 + Math.random() * 40;
      const y = getTerrainHeight(x, z);
      sheep.position.set(x, y, z);
      scene.add(sheep);
      animals.push({ 
        mesh: sheep, 
        ai: createAnimalAI(x, z, { wanderRadius: 20, walkSpeed: 0.002, minZ: 100, maxZ: 135, type: 'sheep' }) // maxZ < BEACH_START to keep off beach 
      });
    }
    
    // Border Collie with the sheep
    const collie = createBorderCollie();
    const collieX = 0, collieZ = 130;
    collie.position.set(collieX, getTerrainHeight(collieX, collieZ), collieZ);
    scene.add(collie);
    animals.push({ 
      mesh: collie, 
      ai: createAnimalAI(collieX, collieZ, { wanderRadius: 30, walkSpeed: 0.005, minZ: 100, maxZ: 135, type: 'dog' }) // maxZ < BEACH_START 
    });
    
    // Yeti in the ice zone (north, z < -30)
    const yeti = createYeti();
    const yetiX = -160, yetiZ = -150;
    yeti.position.set(yetiX, getTerrainHeight(yetiX, yetiZ), yetiZ);
    scene.add(yeti);
    animals.push({ 
      mesh: yeti, 
      ai: createAnimalAI(yetiX, yetiZ, { 
        wanderRadius: 40, 
        walkSpeed: 0.0015, 
        minZ: -190, 
        maxZ: -40,  // Never leave ice zone
        minX: -190,
        maxX: -100,
        type: 'yeti' 
      }) 
    });
    
    // Puppies near tribal house (x=-90, z=55)
    const puppyColors = [0xD2691E, 0xF5DEB3]; // Brown and cream
    puppyColors.forEach((color, i) => {
      const puppy = createPuppy(color);
      const x = -75 + i * 8;
      const z = 48 + Math.random() * 10;
      const y = getTerrainHeight(x, z);
      puppy.position.set(x, y, z);
      scene.add(puppy);
      animals.push({ 
        mesh: puppy, 
        ai: createAnimalAI(x, z, { wanderRadius: 10, walkSpeed: 0.006, type: 'puppy' }) 
      });
    });
    
    // Birds flying in sky
    const birdColors = [0x1E88E5, 0x43A047, 0xE53935, 0xFFB300, 0x8E24AA];
    for (let i = 0; i < 6; i++) {
      const bird = createBird(birdColors[i % birdColors.length]);
      const x = -100 + Math.random() * 200;
      const z = -100 + Math.random() * 200;
      const flyHeight = 40 + Math.random() * 30;
      bird.position.set(x, flyHeight, z);
      scene.add(bird);
      animals.push({ 
        mesh: bird, 
        ai: createAnimalAI(x, z, { 
          wanderRadius: 80, 
          walkSpeed: 0.008, 
          isFlying: true, 
          flyHeight: flyHeight,
          type: 'bird' 
        }) 
      });
    }
    
    // Bird flock (V formation)
    const flockCenter = { x: 50, z: -50, y: 60 };
    const flockBirds = [];
    for (let i = 0; i < 7; i++) {
      const bird = createBird(0x37474F); // Dark gray geese
      const row = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      const offsetX = i === 0 ? 0 : side * (row + 1) * 4;
      const offsetZ = i === 0 ? 0 : (row + 1) * 3;
      bird.position.set(flockCenter.x + offsetX, flockCenter.y, flockCenter.z + offsetZ);
      bird.userData.flockOffset = { x: offsetX, z: offsetZ };
      scene.add(bird);
      flockBirds.push(bird);
    }
    // Flock moves as a unit
    const flockAI = { 
      x: flockCenter.x, 
      z: flockCenter.z, 
      y: flockCenter.y,
      targetX: flockCenter.x + 100,
      targetZ: flockCenter.z,
      direction: 1,
      phase: 0
    };

    // Update animal AI
    function updateAnimalAI(animal, deltaTime) {
      const ai = animal.ai;
      ai.stateTimer -= deltaTime;
      ai.bobPhase += deltaTime * 0.003;
      ai.wingPhase += deltaTime * 0.02;
      
      if (ai.state === 0) { // IDLE
        if (ai.stateTimer <= 0) {
          // Pick new target within wander radius and bounds
          let newX = ai.x, newZ = ai.z;
          for (let tries = 0; tries < 10; tries++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * ai.wanderRadius;
            newX = ai.homeX + Math.cos(angle) * dist;
            newZ = ai.homeZ + Math.sin(angle) * dist;
            
            // Clamp to bounds
            newX = Math.max(ai.minX, Math.min(ai.maxX, newX));
            newZ = Math.max(ai.minZ, Math.min(ai.maxZ, newZ));
            
            // If congregated, enforce congregation radius
            if (ai.isCongregated && ai.congregationRadius) {
              const distFromCenter = Math.sqrt(
                (newX - ai.congregationCenterX) ** 2 + 
                (newZ - ai.congregationCenterZ) ** 2
              );
              if (distFromCenter > ai.congregationRadius) {
                // Pull back towards center
                const pullAngle = Math.atan2(
                  ai.congregationCenterZ - newZ,
                  ai.congregationCenterX - newX
                );
                newX = ai.congregationCenterX + Math.cos(pullAngle + Math.PI) * (ai.congregationRadius - 2);
                newZ = ai.congregationCenterZ + Math.sin(pullAngle + Math.PI) * (ai.congregationRadius - 2);
              }
            }
            
            // Check if valid (not in water for ground animals)
            if (ai.isFlying || !isInRiver(newX, newZ)) {
              // Also check bar/plaza exclusion zone (animals NEVER enter bar area)
              const BAR_X = -40, BAR_Z = 55, BAR_RADIUS = 18;
              const PLAZA_X = -70, PLAZA_Z = 35, PLAZA_RADIUS = 45;
              const distToBar = Math.sqrt((newX - BAR_X) ** 2 + (newZ - BAR_Z) ** 2);
              const distToPlaza = Math.sqrt((newX - PLAZA_X) ** 2 + (newZ - PLAZA_Z) ** 2);
              
              // Beach exclusion (animals stay off beach)
              const BEACH_LIMIT_Z = 138;
              
              if (distToBar > BAR_RADIUS && distToPlaza > PLAZA_RADIUS && newZ < BEACH_LIMIT_Z) {
                break; // Valid position - outside bar/plaza zone and not on beach
              }
              // If invalid, keep trying for a new position
            }
          }
          
          ai.targetX = newX;
          ai.targetZ = newZ;
          ai.targetRotation = Math.atan2(newX - ai.x, newZ - ai.z);
          ai.state = 1;
          ai.stateTimer = 3000 + Math.random() * 5000;
        }
      } else if (ai.state === 1) { // WALKING
        const dx = ai.targetX - ai.x;
        const dz = ai.targetZ - ai.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 1 || ai.stateTimer <= 0) {
          ai.state = 0;
          ai.stateTimer = 2000 + Math.random() * 4000;
        } else {
          const speed = ai.walkSpeed * deltaTime;
          let nextX = ai.x + (dx / dist) * speed;
          let nextZ = ai.z + (dz / dist) * speed;
          
          // If congregated, enforce congregation radius during movement
          if (ai.isCongregated && ai.congregationRadius) {
            const distFromCenter = Math.sqrt(
              (nextX - ai.congregationCenterX) ** 2 + 
              (nextZ - ai.congregationCenterZ) ** 2
            );
            if (distFromCenter > ai.congregationRadius) {
              // Stay at edge, don't go further
              const angle = Math.atan2(nextZ - ai.congregationCenterZ, nextX - ai.congregationCenterX);
              nextX = ai.congregationCenterX + Math.cos(angle) * ai.congregationRadius;
              nextZ = ai.congregationCenterZ + Math.sin(angle) * ai.congregationRadius;
            }
          }
          
          // Bar/plaza exclusion zone (animals NEVER enter bar/plaza area, even when congregated)
          if (!ai.isFlying) {
            const BAR_X = -40, BAR_Z = 55, BAR_RADIUS = 18;
            const PLAZA_X = -70, PLAZA_Z = 35, PLAZA_RADIUS = 45;
            const distToBar = Math.sqrt((nextX - BAR_X) ** 2 + (nextZ - BAR_Z) ** 2);
            const distToPlaza = Math.sqrt((nextX - PLAZA_X) ** 2 + (nextZ - PLAZA_Z) ** 2);
            if (distToBar < BAR_RADIUS) {
              // Push away from bar - stay at perimeter
              const awayAngle = Math.atan2(nextZ - BAR_Z, nextX - BAR_X);
              nextX = BAR_X + Math.cos(awayAngle) * BAR_RADIUS;
              nextZ = BAR_Z + Math.sin(awayAngle) * BAR_RADIUS;
              // Stop and pick new target
              ai.state = 0;
              ai.stateTimer = 500;
            }
            if (distToPlaza < PLAZA_RADIUS) {
              // Push away from plaza
              const awayAngle = Math.atan2(nextZ - PLAZA_Z, nextX - PLAZA_X);
              nextX = PLAZA_X + Math.cos(awayAngle) * PLAZA_RADIUS;
              nextZ = PLAZA_Z + Math.sin(awayAngle) * PLAZA_RADIUS;
              ai.state = 0;
              ai.stateTimer = 500;
            }
            
            // Beach exclusion zone (animals stay off the beach)
            const BEACH_LIMIT_Z = 138; // Just before beach starts
            if (nextZ > BEACH_LIMIT_Z) {
              nextZ = BEACH_LIMIT_Z;
              ai.state = 0;
              ai.stateTimer = 500;
            }
          }
          
          ai.x = nextX;
          ai.z = nextZ;
          
          if (!ai.isFlying) {
            ai.y = getTerrainHeight(ai.x, ai.z);
          }
          
          ai.targetRotation = Math.atan2(dx, dz);
        }
      }
      
      // Smooth rotation
      let rotDiff = ai.targetRotation - ai.rotation;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      ai.rotation += rotDiff * 0.01 * deltaTime;
      
      // Update mesh
      animal.mesh.position.x = ai.x;
      animal.mesh.position.z = ai.z;
      
      if (ai.isFlying) {
        // Flying bob
        animal.mesh.position.y = ai.flyHeight + Math.sin(ai.bobPhase) * 2;
        // Wing flap
        animal.mesh.children.forEach(child => {
          if (child.name === 'wing') {
            const side = child.userData.side || 1;
            const baseRot = child.userData.baseRotation || 0;
            child.rotation.z = baseRot + Math.sin(ai.wingPhase) * 0.5 * side;
          }
        });
      } else {
        // Ground bob
        const bobAmount = ai.state === 1 ? 0.15 : 0.05;
        animal.mesh.position.y = ai.y + Math.abs(Math.sin(ai.bobPhase * (ai.state === 1 ? 2 : 1))) * bobAmount;
      }
      
      animal.mesh.rotation.y = ai.rotation;
    }
    
    // Update bird flock
    function updateBirdFlock(deltaTime) {
      flockAI.phase += deltaTime * 0.0001;
      
      // Move flock in a large circular pattern
      const radius = 120;
      flockAI.x = Math.cos(flockAI.phase) * radius;
      flockAI.z = Math.sin(flockAI.phase) * radius - 50;
      
      const flockRotation = flockAI.phase + Math.PI / 2;
      
      flockBirds.forEach((bird, i) => {
        const offset = bird.userData.flockOffset;
        // Rotate offset based on flock direction
        const rotatedX = offset.x * Math.cos(flockRotation) - offset.z * Math.sin(flockRotation);
        const rotatedZ = offset.x * Math.sin(flockRotation) + offset.z * Math.cos(flockRotation);
        
        bird.position.x = flockAI.x + rotatedX;
        bird.position.z = flockAI.z + rotatedZ;
        bird.position.y = flockAI.y + Math.sin(flockAI.phase * 10 + i) * 1.5;
        bird.rotation.y = flockRotation;
        
        // Wing flap
        bird.children.forEach(child => {
          if (child.name === 'wing') {
            const side = child.userData.side || 1;
            const baseRot = child.userData.baseRotation || 0;
            child.rotation.z = baseRot + Math.sin(flockAI.phase * 100 + i * 0.5) * 0.4 * side;
          }
        });
      });
    }

    // ============ CONTROLS ============
    const MOVE_SPEED = 0.5;
    const RIVER_CURRENT_SPEED = 0.15; // How fast the river pushes you
    const ICE_SPEED_MULTIPLIER = 1.8; // Faster on ice
    const ICE_FRICTION = 0.985; // How much velocity is retained (higher = more sliding)
    const NORMAL_FRICTION = 0.8; // Normal ground friction
    
    const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    
    // Player velocity for ice sliding
    let playerVelocity = { x: 0, z: 0 };

    // Check if position is in frozen zone (Norwegian Fjords - north third)
    function isInFrozenZone(x, z) {
      return z < -30;
    }
    
    // Get ice slide factor based on position (more slippery deeper in frozen zone)
    function getIceFactor(z) {
      if (z >= -30) return 0;
      // Gradually more slippery from z=-30 to z=-80
      const depth = Math.min(1, (-30 - z) / 50);
      return depth;
    }

    // River check - returns true if position is in the river
    function isInRiver(x, z) {
      const riverCenterZ = 85 + Math.sin(x * 0.015) * 15;
      const riverHalfWidth = 12; // River width
      return Math.abs(z - riverCenterZ) < riverHalfWidth;
    }
    
    // Jacuzzi check - returns true if position is in the jacuzzi
    function isInJacuzzi(x, z) {
      const dist = Math.sqrt((x - JACUZZI_X) ** 2 + (z - JACUZZI_Z) ** 2);
      return dist < JACUZZI_RADIUS - 1; // Slightly smaller for interior
    }
    
    // Get river current direction and strength at position
    function getRiverCurrent(x, z) {
      if (!isInRiver(x, z)) return { x: 0, z: 0 };
      
      // River flows West to East (+x direction)
      // Current is stronger in center, weaker at edges
      const riverCenterZ = 85 + Math.sin(x * 0.015) * 15;
      const distFromCenter = Math.abs(z - riverCenterZ);
      const riverHalfWidth = 12;
      
      // Strength based on distance from center (stronger in middle)
      const strength = 1 - (distFromCenter / riverHalfWidth) * 0.5;
      
      // Slight z variation based on river curve
      const curveInfluence = Math.cos(x * 0.015) * 0.15;
      
      return {
        x: RIVER_CURRENT_SPEED * strength,
        z: curveInfluence * RIVER_CURRENT_SPEED * strength
      };
    }
    
    // Bridge check - returns true if position is on a bridge
    function isOnBridge(x, z) {
      // Only one bridge: Main bridge at x=-10, spanning river
      if (Math.abs(x - (-10)) < 6 && z > 70 && z < 100) return true;
      
      return false;
    }

    function canMoveTo(x, z) {
      // World boundary - asymmetric, expanded north/east/west
      // X: -770 to +770, Z: -770 (north) to +280 (south/sea)
      if (x < -770 || x > 770 || z < -770 || z > 280) return false;

      // River is now passable! But you'll drift...
      // No river collision - player can enter the water

      // Building collision - 4 buildings + 2 wells + orchard + canoe
      const buildings = [
        { x: -90, z: 55, r: 14 },   // Tribal House
        { x: -60, z: 55, r: 12 },   // Orchard area
        { x: -85, z: 75, r: 6 },    // Canoe (on river near tribal house)
        { x: 60, z: 45, r: 12 },    // Mediterranean House
        { x: -50, z: 10, r: 12 },   // Cottage House
        { x: -170, z: -170, r: 16 },   // Ice Cave House (northwest)
        { x: -32, z: 12, r: 5 },    // Well next to cottage
        { x: 10, z: -55, r: 6 },    // Well alto
        { x: 25, z: 42, r: 4 },     // Market stall 1
        { x: 25, z: 32, r: 4 },     // Market stall 2
        { x: 25, z: 22, r: 4 },     // Market stall 3
      ];

      for (const b of buildings) {
        if (Math.sqrt((x - b.x) ** 2 + (z - b.z) ** 2) < b.r) return false;
      }

      return true;
    }
    
    // Check if on ice plate near ice cave (extra slippery zone)
    function isOnIcePlate(x, z) {
      // Large ice plate around ice cave in northwest
      const distFromIceCave = Math.sqrt((x + 170) ** 2 + (z + 170) ** 2);
      if (distFromIceCave < 45) return true;
      
      // Additional ice patches in north
      const icePatchCenters = [
        { x: -140, z: -160 },
        { x: -180, z: -150 },
        { x: -150, z: -180 },
        { x: -120, z: -170 },
        { x: -160, z: -140 },
      ];
      
      for (const patch of icePatchCenters) {
        const dist = Math.sqrt((x - patch.x) ** 2 + (z - patch.z) ** 2);
        if (dist < 15) return true;
      }
      
      return false;
    }

    // Horn sound using Web Audio API
    function playHornSound() {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 2.5;
        
        // Create multiple oscillators for rich horn sound
        const frequencies = [130.81, 196, 261.63]; // C3, G3, C4 - horn chord
        
        frequencies.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(freq * 0.98, audioContext.currentTime);
          oscillator.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + 0.1);
          oscillator.frequency.linearRampToValueAtTime(freq * 1.02, audioContext.currentTime + duration * 0.7);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.95, audioContext.currentTime + duration);
          
          // ADSR envelope
          const volume = 0.15 / (i + 1);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(volume, audioContext.currentTime + duration * 0.6);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        });
        
        // Add some noise for breathiness
        const bufferSize = audioContext.sampleRate * duration;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = audioContext.createGain();
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 800;
        
        noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.1);
        noiseGain.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + duration * 0.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noise.start(audioContext.currentTime);
        noise.stop(audioContext.currentTime + duration);
      } catch (err) {
        console.log('Audio not available');
      }
    }

    // Toggle congregation
    function toggleCongregation() {
      const congRef = congregationRef.current;
      congRef.active = !congRef.active;
      setIsCongregating(congRef.active);
      playHornSound();
      
      if (congRef.active) {
        // Save original positions and start congregating
        congRef.originalPositions = [];
        
        // Save NPC positions
        npcs.forEach((npc, i) => {
          congRef.originalPositions.push({
            type: 'npc',
            index: i,
            currentX: npc.ai.x,
            currentZ: npc.ai.z,
            startX: npc.ai.startX,
            startZ: npc.ai.startZ,
          });
        });
        
        // Save animal positions
        animals.forEach((animal, i) => {
          congRef.originalPositions.push({
            type: 'animal',
            index: i,
            homeX: animal.ai.x,
            homeZ: animal.ai.z,
            originalHomeX: animal.ai.homeX,
            originalHomeZ: animal.ai.homeZ,
            originalMinX: animal.ai.minX,
            originalMaxX: animal.ai.maxX,
            originalMinZ: animal.ai.minZ,
            originalMaxZ: animal.ai.maxZ,
            originalWanderRadius: animal.ai.wanderRadius,
          });
        });
        
        // Set all to congregate at temple
        const templeX = congRef.templeX;
        const templeZ = congRef.templeZ;
        
        npcs.forEach((npc, i) => {
          // Save original walk speed
          if (!npc.ai.originalWalkSpeed) {
            npc.ai.originalWalkSpeed = npc.ai.walkSpeed;
          }
          // Slightly faster for congregation (70% speed - determined walk)
          npc.ai.walkSpeed = npc.ai.originalWalkSpeed * 0.7;
          npc.ai.isCongreagted = true; // Mark as congregated for boundary check
          
          // Arrange in concentric circles around temple (larger radii for bigger temple)
          const angle = (i / npcs.length) * Math.PI * 2;
          const radius = 12 + Math.floor(i / 6) * 8;
          const destX = templeX + Math.cos(angle) * radius;
          const destZ = templeZ + Math.sin(angle) * radius;
          
          // Set up curved path to temple
          npc.ai.startX = npc.ai.x;
          npc.ai.startZ = npc.ai.z;
          npc.ai.targetX = destX;
          npc.ai.targetZ = destZ;
          // Control point for curve (midpoint with slight offset)
          const midX = (npc.ai.x + destX) / 2;
          const midZ = (npc.ai.z + destZ) / 2;
          npc.ai.controlX = midX + (Math.random() - 0.5) * 20;
          npc.ai.controlZ = midZ + (Math.random() - 0.5) * 20;
          npc.ai.pathProgress = 0;
          npc.ai.state = 1; // Start walking
          npc.ai.stateTimer = 60000; // Long timer to reach destination
          
          // Set congregation boundaries
          npc.ai.congregationCenterX = templeX;
          npc.ai.congregationCenterZ = templeZ;
          npc.ai.congregationRadius = congRef.congregationRadius;
        });
        
        animals.forEach((animal, i) => {
          // Save original walk speed
          if (!animal.ai.originalWalkSpeed) {
            animal.ai.originalWalkSpeed = animal.ai.walkSpeed;
          }
          // FASTER for congregation (180% speed - eager to come!)
          animal.ai.walkSpeed = animal.ai.originalWalkSpeed * 1.8;
          animal.ai.isCongregated = true; // Mark as congregated
          
          // Animals gather in outer ring AROUND the bar (outside bar radius of 25)
          const angle = (i / animals.length) * Math.PI * 2 + 0.3;
          const radius = 21 + Math.floor(i / 8) * 5; // Start at 21 around the bar
          const newHomeX = templeX + Math.cos(angle) * radius;
          const newHomeZ = templeZ + Math.sin(angle) * radius;
          
          // Set boundaries to congregation area only
          animal.ai.minX = templeX - congRef.congregationRadius;
          animal.ai.maxX = templeX + congRef.congregationRadius;
          animal.ai.minZ = templeZ - congRef.congregationRadius;
          animal.ai.maxZ = templeZ + congRef.congregationRadius;
          animal.ai.homeX = newHomeX;
          animal.ai.homeZ = newHomeZ;
          animal.ai.targetX = newHomeX;
          animal.ai.targetZ = newHomeZ;
          animal.ai.wanderRadius = 3; // Stay close but outside bar perimeter
          
          // STAGGERED START for smooth visual arrival
          // Animals start walking at different times (0-2 seconds delay)
          animal.ai.state = 0; // Start in IDLE
          animal.ai.stateTimer = Math.random() * 2000; // Random delay before starting to walk
          
          // Store congregation center for boundary enforcement
          animal.ai.congregationCenterX = templeX;
          animal.ai.congregationCenterZ = templeZ;
          animal.ai.congregationRadius = congRef.congregationRadius;
        });
      } else {
        // Restore original positions and speeds
        congRef.originalPositions.forEach(pos => {
          if (pos.type === 'npc') {
            const npc = npcs[pos.index];
            if (npc) {
              // Restore original walk speed
              if (npc.ai.originalWalkSpeed) {
                npc.ai.walkSpeed = npc.ai.originalWalkSpeed;
              }
              // Set path back to original area
              npc.ai.startX = npc.ai.x;
              npc.ai.startZ = npc.ai.z;
              npc.ai.targetX = pos.startX;
              npc.ai.targetZ = pos.startZ;
              const midX = (npc.ai.x + pos.startX) / 2;
              const midZ = (npc.ai.z + pos.startZ) / 2;
              npc.ai.controlX = midX + (Math.random() - 0.5) * 20;
              npc.ai.controlZ = midZ + (Math.random() - 0.5) * 20;
              npc.ai.pathProgress = 0;
              npc.ai.state = 1;
              npc.ai.stateTimer = 60000;
              // Clear congregation flags
              npc.ai.isCongregated = false;
              npc.ai.congregationCenterX = undefined;
              npc.ai.congregationCenterZ = undefined;
              npc.ai.congregationRadius = undefined;
            }
          } else if (pos.type === 'animal') {
            const animal = animals[pos.index];
            if (animal) {
              // FASTER speed for dispersal (200% - eager to go home!)
              animal.ai.walkSpeed = (animal.ai.originalWalkSpeed || 0.004) * 2.0;
              
              animal.ai.homeX = pos.originalHomeX;
              animal.ai.homeZ = pos.originalHomeZ;
              animal.ai.minX = pos.originalMinX;
              animal.ai.maxX = pos.originalMaxX;
              animal.ai.minZ = pos.originalMinZ;
              animal.ai.maxZ = pos.originalMaxZ;
              animal.ai.wanderRadius = pos.originalWanderRadius || 15;
              animal.ai.targetX = pos.originalHomeX;
              animal.ai.targetZ = pos.originalHomeZ;
              animal.ai.state = 1;
              animal.ai.stateTimer = 60000;
              // Clear congregation flags
              animal.ai.isCongregated = false;
              animal.ai.congregationCenterX = undefined;
              animal.ai.congregationCenterZ = undefined;
              animal.ai.congregationRadius = undefined;
            }
          }
        });
        congRef.originalPositions = [];
      }
    }

    // Expose toggleCongregation to be callable from UI
    gameRef.current = { toggleCongregation };

    function onKeyDown(e) {
      // Ignore keyboard events when typing in input/textarea
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return; // Let the input handle the event normally
      }
      
      if (keys.hasOwnProperty(e.key)) { keys[e.key] = true; e.preventDefault(); }
      
      // Enter key to open app when near building
      if (e.key === 'Enter' && nearBuildingRef.current && !activeAppRef.current) {
        // Special handling for temple - trigger horn instead of opening app
        if (nearBuildingRef.current.app.isTemple) {
          toggleCongregation();
        } else {
          setActiveApp(nearBuildingRef.current.app);
        }
        e.preventDefault();
      }
      
      // Escape key to close app
      if (e.key === 'Escape' && activeAppRef.current) {
        setActiveApp(null);
        e.preventDefault();
      }
    }
    function onKeyUp(e) {
      // Ignore keyboard events when typing in input/textarea
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
      if (keys.hasOwnProperty(e.key)) { keys[e.key] = false; }
    }

    // Zoom control
    function onWheel(e) {
      targetZoom = Math.max(0.5, Math.min(2, targetZoom - e.deltaY * 0.001));
      e.preventDefault();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    containerRef.current.addEventListener('wheel', onWheel, { passive: false });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    // ============ NPC AI ============
    function bezierPoint(t, p0, p1, p2) {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    }

    function easeInOutSine(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function pickNewCurvedPath(npcIndex) {
      const ai = npcs[npcIndex].ai;
      let attempts = 0;
      let newX, newZ, ctrlX, ctrlZ;
      
      do {
        const angle = Math.random() * Math.PI * 2;
        // Shorter distance if congregated
        const maxDist = ai.isCongregated ? 15 : 40;
        const distance = 10 + Math.random() * maxDist;
        newX = ai.x + Math.cos(angle) * distance;
        newZ = ai.z + Math.sin(angle) * distance;
        
        // If congregated, enforce congregation radius
        if (ai.isCongregated && ai.congregationRadius) {
          const distFromCenter = Math.sqrt(
            (newX - ai.congregationCenterX) ** 2 + 
            (newZ - ai.congregationCenterZ) ** 2
          );
          if (distFromCenter > ai.congregationRadius) {
            // Pull back towards center
            const pullAngle = Math.atan2(
              ai.congregationCenterZ - newZ,
              ai.congregationCenterX - newX
            );
            newX = ai.congregationCenterX + Math.cos(pullAngle + Math.PI) * (ai.congregationRadius - 3);
            newZ = ai.congregationCenterZ + Math.sin(pullAngle + Math.PI) * (ai.congregationRadius - 3);
          }
        }
        
        const midX = (ai.x + newX) / 2;
        const midZ = (ai.z + newZ) / 2;
        const perpAngle = angle + Math.PI / 2;
        const curveAmount = (Math.random() - 0.5) * distance * 0.6;
        ctrlX = midX + Math.cos(perpAngle) * curveAmount;
        ctrlZ = midZ + Math.sin(perpAngle) * curveAmount;
        
        attempts++;
      } while (!canMoveTo(newX, newZ) && attempts < 30);
      
      if (attempts < 30) {
        ai.startX = ai.x;
        ai.startZ = ai.z;
        ai.targetX = newX;
        ai.targetZ = newZ;
        ai.controlX = ctrlX;
        ai.controlZ = ctrlZ;
        ai.pathProgress = 0;
        return true;
      }
      return false;
    }

    function updateNPCAI(npcIndex, deltaTime) {
      const npc = npcs[npcIndex];
      const ai = npc.ai;
      
      ai.stateTimer -= deltaTime;
      ai.idlePhase += deltaTime * 0.002;
      
      if (ai.state === 0) { // IDLE
        if (ai.stateTimer <= 0) {
          if (pickNewCurvedPath(npcIndex)) {
            ai.state = 1; // WALKING
            ai.stateTimer = 15000 + Math.random() * 10000;
          } else {
            ai.stateTimer = 2000 + Math.random() * 3000;
          }
        }
      } else if (ai.state === 1) { // WALKING
        ai.pathProgress += ai.walkSpeed * deltaTime * 0.05;
        
        if (ai.pathProgress >= 1 || ai.stateTimer <= 0) {
          ai.pathProgress = 1;
          ai.x = ai.targetX;
          ai.z = ai.targetZ;
          ai.y = getTerrainHeight(ai.x, ai.z);
          ai.state = 2; // PAUSING
          ai.stateTimer = 3000 + Math.random() * 6000;
        } else {
          const easedT = easeInOutSine(ai.pathProgress);
          const newX = bezierPoint(easedT, ai.startX, ai.controlX, ai.targetX);
          const newZ = bezierPoint(easedT, ai.startZ, ai.controlZ, ai.targetZ);
          
          const lookAhead = Math.min(ai.pathProgress + 0.05, 1);
          const nextX = bezierPoint(lookAhead, ai.startX, ai.controlX, ai.targetX);
          const nextZ = bezierPoint(lookAhead, ai.startZ, ai.controlZ, ai.targetZ);
          
          const dx = nextX - ai.x;
          const dz = nextZ - ai.z;
          
          if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
            ai.targetRotation = Math.atan2(dx, dz);
          }
          
          ai.x = newX;
          ai.z = newZ;
          ai.y = getTerrainHeight(ai.x, ai.z); // Update height based on position
          ai.bobPhase += 0.08 * deltaTime;
        }
        
        let rotDiff = ai.targetRotation - ai.rotation;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        ai.rotation += rotDiff * 0.02 * deltaTime;
      } else if (ai.state === 2) { // PAUSING
        if (ai.stateTimer <= 0) {
          ai.state = 0;
          ai.stateTimer = 1000 + Math.random() * 2000;
        }
      }
      
      // Update mesh position - always at terrain height
      npc.mesh.position.x = ai.x;
      npc.mesh.position.z = ai.z;
      
      // Add bob/breathing animation on top of terrain height
      if (ai.state === 1) {
        npc.mesh.position.y = ai.y + Math.abs(Math.sin(ai.bobPhase)) * 0.25;
      } else {
        npc.mesh.position.y = ai.y + Math.sin(ai.idlePhase) * 0.08;
      }
      
      npc.mesh.rotation.y = ai.rotation;
    }

    // ============ ANIMATION LOOP ============
    let lastTime = 0;
    let inWaterTime = 0; // Track time in water for effects
    
    function animate(time) {
      const delta = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;

      // Get input direction (disabled when app is open)
      let inputX = 0, inputZ = 0;
      if (!activeAppRef.current) {
        if (keys.ArrowUp) inputZ -= 1;
        if (keys.ArrowDown) inputZ += 1;
        if (keys.ArrowLeft) inputX -= 1;
        if (keys.ArrowRight) inputX += 1;
      }

      if (inputX !== 0 && inputZ !== 0) { inputX *= 0.707; inputZ *= 0.707; }

      // Check terrain conditions
      const playerInRiver = isInRiver(playerState.x, playerState.z) && !isOnBridge(playerState.x, playerState.z);
      const playerInJacuzzi = isInJacuzzi(playerState.x, playerState.z);
      const playerOnIce = isInFrozenZone(playerState.x, playerState.z);
      const playerOnIcePlate = isOnIcePlate(playerState.x, playerState.z);
      const playerOnBeach = isOnBeach(playerState.x, playerState.z);
      const playerInSea = isInSea(playerState.x, playerState.z);
      const playerInDeepSea = isInDeepSea(playerState.x, playerState.z);
      const playerInDeathZone = isInDeathZone(playerState.x, playerState.z);
      const iceFactor = getIceFactor(playerState.z);
      
      // Calculate water depth for gradual overlay (deeper = more covered)
      if (playerInSea && !isRespawning) {
        const seaDepthProgress = Math.min(1, (playerState.z - SEA_START_Z) / (SEA_DEATH_Z - SEA_START_Z));
        setWaterOverlay(seaDepthProgress * 0.7); // Max 70% opacity before death
        
        // Check for death zone
        if (playerInDeathZone && !isDrowning) {
          setIsDrowning(true);
          setSwimmingMessage('💀 ¡GLUB GLUB GLUB! 💀');
          
          // Drowning animation and respawn
          setTimeout(() => {
            setWaterOverlay(1); // Full water overlay
          }, 500);
          
          setTimeout(() => {
            // Respawn
            setIsRespawning(true);
            setPlayerState({ x: 0, z: 0 }); // Respawn at origin
            setWaterOverlay(0);
            setSwimmingMessage(null);
            setIsDrowning(false);
            
            setTimeout(() => {
              setIsRespawning(false);
            }, 1000);
          }, 2000);
        }
      } else if (!playerInSea && !isDrowning) {
        setWaterOverlay(0);
      }
      
      // Check for deep sea - show warning message
      if (playerInDeepSea && !swimmingMessageShown.current && !isDrowning) {
        setSwimmingMessage('¡Para ahí! ¿De verdad pretendes nadar con esos minibrazos?');
        swimmingMessageShown.current = true;
        setTimeout(() => {
          setSwimmingMessage(null);
          swimmingMessageShown.current = false;
        }, 3000);
      }
      
      // Calculate friction based on terrain
      let friction = NORMAL_FRICTION;
      let speedMultiplier = 1;
      
      if (playerOnIcePlate) {
        // Ice plate near ice cave: MAXIMUM slippery!
        friction = 0.995; // Almost no friction
        speedMultiplier = 2.2;
      } else if (playerOnIce) {
        // Ice: high speed, low friction (lots of sliding)
        friction = ICE_FRICTION - (1 - iceFactor) * (ICE_FRICTION - NORMAL_FRICTION);
        speedMultiplier = 1 + (ICE_SPEED_MULTIPLIER - 1) * iceFactor;
      } else if (playerOnBeach) {
        // Beach: sand slows you down (opposite of ice)
        speedMultiplier = 0.8; // 20% slower on sand
        friction = NORMAL_FRICTION * 0.9; // Slightly more drag
      } else if (playerInSea) {
        // Sea: very slow, wading
        speedMultiplier = 0.35;
        friction = NORMAL_FRICTION;
      } else if (playerInRiver || playerInJacuzzi) {
        // Water: slower, no sliding
        speedMultiplier = playerInJacuzzi ? 0.4 : 0.6; // Even slower in jacuzzi (relaxing!)
        friction = NORMAL_FRICTION;
      }
      
      // Apply river current drift
      if (playerInRiver) {
        inWaterTime += delta * 16.67;
        const current = getRiverCurrent(playerState.x, playerState.z);
        
        const driftX = playerState.x + current.x * delta;
        const driftZ = playerState.z + current.z * delta;
        
        if (canMoveTo(driftX, driftZ)) {
          playerState.x = driftX;
          playerState.z = driftZ;
        }
      } else {
        inWaterTime = 0;
      }

      // Apply input to velocity (ice sliding system)
      if (inputX !== 0 || inputZ !== 0) {
        playerState.isMoving = true;
        playerState.targetRotation = Math.atan2(inputX, inputZ);
        
        // Add acceleration based on input
        const acceleration = MOVE_SPEED * speedMultiplier * 0.15;
        playerVelocity.x += inputX * acceleration * delta;
        playerVelocity.z += inputZ * acceleration * delta;
      } else {
        // No input - will slide on ice, stop quickly on normal ground
        if (!playerOnIce) {
          playerState.isMoving = false;
        }
      }
      
      // Apply friction to velocity
      playerVelocity.x *= Math.pow(friction, delta);
      playerVelocity.z *= Math.pow(friction, delta);
      
      // Clamp max velocity
      const maxVel = MOVE_SPEED * speedMultiplier * 2;
      const velMag = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);
      if (velMag > maxVel) {
        playerVelocity.x = (playerVelocity.x / velMag) * maxVel;
        playerVelocity.z = (playerVelocity.z / velMag) * maxVel;
      }
      
      // Check if still moving (for animation)
      if (velMag > 0.01) {
        playerState.isMoving = true;
      } else if (inputX === 0 && inputZ === 0) {
        playerState.isMoving = false;
        playerVelocity.x = 0;
        playerVelocity.z = 0;
      }

      // Apply velocity to position
      const newX = playerState.x + playerVelocity.x * delta;
      const newZ = playerState.z + playerVelocity.z * delta;

      if (canMoveTo(newX, newZ)) {
        playerState.x = newX;
        playerState.z = newZ;
      } else if (canMoveTo(newX, playerState.z)) {
        playerState.x = newX;
        // Bounce off wall
        playerVelocity.z *= -0.3;
      } else if (canMoveTo(playerState.x, newZ)) {
        playerState.z = newZ;
        // Bounce off wall
        playerVelocity.x *= -0.3;
      } else {
        // Hit corner - stop
        playerVelocity.x *= -0.2;
        playerVelocity.z *= -0.2;
      }
      
      // Update Y based on terrain height
      playerState.y = getTerrainHeight(playerState.x, playerState.z);

      // Smooth rotation
      let rotDiff = playerState.targetRotation - playerState.rotation;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      playerState.rotation += rotDiff * 0.12 * delta;

      // Update player position
      player.position.x = playerState.x;
      player.position.z = playerState.z;
      player.rotation.y = playerState.rotation;

      // Animation based on terrain
      if (playerInJacuzzi) {
        // Relaxed floating in jacuzzi (slower bob, lower in water)
        playerState.bobPhase += 0.08 * delta;
        player.position.y = playerState.y + Math.sin(playerState.bobPhase) * 0.3 - 0.5; // Sink a bit into water
      } else if (playerInRiver) {
        // Swimming/floating animation
        playerState.bobPhase += 0.15 * delta;
        player.position.y = playerState.y + Math.sin(playerState.bobPhase) * 0.5 + 0.3;
      } else if ((playerOnIce || playerOnIcePlate) && playerState.isMoving) {
        // Sliding animation (less bounce, smoother glide)
        playerState.bobPhase += 0.1 * delta;
        player.position.y = playerState.y + Math.sin(playerState.bobPhase) * 0.15;
      } else if (playerState.isMoving) {
        // Normal walking bob
        playerState.bobPhase += 0.25 * delta;
        player.position.y = playerState.y + Math.abs(Math.sin(playerState.bobPhase)) * 0.35;
      } else {
        player.position.y = playerState.y;
        playerState.bobPhase = 0;
      }

      // Update NPCs
      const deltaMs = delta * 16.67;
      npcs.forEach((_, index) => updateNPCAI(index, deltaMs));
      
      // Update animals
      animals.forEach(animal => updateAnimalAI(animal, deltaMs));
      updateBirdFlock(deltaMs);
      
      // ============ BEACH BALL GAME UPDATE ============
      if (beachBallRef.current && beachKidsRef.current.length === 3) {
        const ball = ballStateRef.current;
        const kids = beachKidsRef.current;
        
        // Check player collision with ball
        const distToBall = Math.sqrt(
          (playerState.x - ball.x) ** 2 + (playerState.z - ball.z) ** 2
        );
        
        if (distToBall < 3 && !ball.isFlying && ball.fetchingKidIndex === -1) {
          // Player hit the ball! Bounce it away
          const dx = ball.x - playerState.x;
          const dz = ball.z - playerState.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          
          ball.vx = (dx / dist) * 0.4;
          ball.vz = (dz / dist) * 0.4;
          ball.vy = 0.3;
          ball.isFlying = true;
          ball.currentKidIndex = -1;
          
          // Pick a kid to fetch it
          ball.fetchingKidIndex = Math.floor(Math.random() * 3);
          kids[ball.fetchingKidIndex].userData.state = 'fetching';
        }
        
        // Update ball physics
        if (ball.isFlying) {
          ball.x += ball.vx * deltaMs * 0.1;
          ball.z += ball.vz * deltaMs * 0.1;
          ball.height += ball.vy * deltaMs * 0.1;
          ball.vy -= 0.015 * deltaMs * 0.1; // Gravity
          
          // Bounce on ground
          if (ball.height < 1.2) {
            ball.height = 1.2;
            ball.vy = Math.abs(ball.vy) * 0.5;
            ball.vx *= 0.8;
            ball.vz *= 0.8;
            
            if (Math.abs(ball.vy) < 0.05 && Math.abs(ball.vx) < 0.02) {
              ball.isFlying = false;
              ball.vx = 0;
              ball.vz = 0;
              ball.vy = 0;
            }
          }
          
          // Update ball visual position
          beachBallRef.current.position.x = ball.x;
          beachBallRef.current.position.z = ball.z;
          beachBallRef.current.position.y = getTerrainHeight(ball.x, ball.z) + ball.height - 1.2;
          beachBallRef.current.rotation.x += ball.vz * 0.5;
          beachBallRef.current.rotation.z -= ball.vx * 0.5;
        }
        
        // Update kids
        kids.forEach((kid, i) => {
          const data = kid.userData;
          
          if (data.state === 'fetching') {
            // Move toward ball
            const dx = ball.x - kid.position.x;
            const dz = ball.z - kid.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist > 2) {
              const speed = 0.015 * deltaMs;
              kid.position.x += (dx / dist) * speed;
              kid.position.z += (dz / dist) * speed;
              kid.position.y = getTerrainHeight(kid.position.x, kid.position.z);
              kid.rotation.y = Math.atan2(dx, dz);
              
              // Animate arms while running
              const armL = kid.children.find(c => c.name === 'armL');
              const armR = kid.children.find(c => c.name === 'armR');
              if (armL && armR) {
                armL.rotation.x = Math.sin(time * 0.01) * 0.5;
                armR.rotation.x = -Math.sin(time * 0.01) * 0.5;
              }
            } else {
              // Reached ball, return home
              data.state = 'returning';
              ball.fetchingKidIndex = -1;
            }
          } else if (data.state === 'returning') {
            // Move back to home position
            const dx = data.homeX - kid.position.x;
            const dz = data.homeZ - kid.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // Ball follows kid
            ball.x = kid.position.x;
            ball.z = kid.position.z;
            beachBallRef.current.position.x = ball.x;
            beachBallRef.current.position.z = ball.z;
            beachBallRef.current.position.y = getTerrainHeight(ball.x, ball.z) + 3;
            
            if (dist > 1) {
              const speed = 0.012 * deltaMs;
              kid.position.x += (dx / dist) * speed;
              kid.position.z += (dz / dist) * speed;
              kid.position.y = getTerrainHeight(kid.position.x, kid.position.z);
              kid.rotation.y = Math.atan2(dx, dz);
            } else {
              // Arrived home, start throwing to another kid
              data.state = 'idle';
              ball.currentKidIndex = i;
              ball.waitTimer = 1500 + Math.random() * 1000;
              beachBallRef.current.position.y = getTerrainHeight(ball.x, ball.z);
            }
          } else if (data.state === 'idle' && ball.currentKidIndex === i) {
            // This kid has the ball, wait then throw
            ball.waitTimer -= deltaMs;
            
            // Face center of play area
            const centerX = 0;
            const centerZ = 178;
            kid.rotation.y = Math.atan2(centerX - kid.position.x, centerZ - kid.position.z);
            
            if (ball.waitTimer <= 0) {
              // Throw to another kid
              const otherKids = [0, 1, 2].filter(k => k !== i);
              const targetIndex = otherKids[Math.floor(Math.random() * otherKids.length)];
              const target = kids[targetIndex];
              
              // Calculate throw trajectory
              const dx = target.position.x - ball.x;
              const dz = target.position.z - ball.z;
              const dist = Math.sqrt(dx * dx + dz * dz) || 1;
              
              ball.vx = (dx / dist) * 0.25;
              ball.vz = (dz / dist) * 0.25;
              ball.vy = 0.2;
              ball.height = 3;
              ball.isFlying = true;
              ball.currentKidIndex = -1;
              ball.targetKidIndex = targetIndex;
              
              // Animate throw
              const armR = kid.children.find(c => c.name === 'armR');
              if (armR) armR.rotation.x = -1;
            }
          }
          
          // Check if ball reached target kid
          if (ball.isFlying && ball.targetKidIndex === i && ball.fetchingKidIndex === -1) {
            const dx = ball.x - kid.position.x;
            const dz = ball.z - kid.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < 3 && ball.height < 4) {
              // Caught!
              ball.isFlying = false;
              ball.vx = 0;
              ball.vz = 0;
              ball.vy = 0;
              ball.height = 1.2;
              ball.currentKidIndex = i;
              ball.waitTimer = 1000 + Math.random() * 1500;
              
              // Position ball at kid's feet
              ball.x = kid.position.x;
              ball.z = kid.position.z;
              beachBallRef.current.position.x = ball.x;
              beachBallRef.current.position.z = ball.z;
              beachBallRef.current.position.y = getTerrainHeight(ball.x, ball.z);
            }
          }
          
          // Reset arm positions when idle
          if (data.state === 'idle') {
            const armL = kid.children.find(c => c.name === 'armL');
            const armR = kid.children.find(c => c.name === 'armR');
            if (armL) armL.rotation.x = armL.rotation.x * 0.9;
            if (armR) armR.rotation.x = armR.rotation.x * 0.9;
          }
        });
      }
      
      // Update jacuzzi effects
      updateJacuzziBubbles(time);
      updateSteamParticles(time, playerState.x, playerState.y, playerState.z, playerInJacuzzi);
      
      // Check building proximity for app interaction
      const nearbyBuilding = checkBuildingProximity(playerState.x, playerState.z);
      if (nearbyBuilding !== nearBuildingRef.current) {
        setNearBuilding(nearbyBuilding);
      }

      // Smooth zoom
      cameraZoom += (targetZoom - cameraZoom) * 0.05;

      // Camera follow - adjust based on player height
      const camDist = 100 / cameraZoom;
      const camHeight = (60 + playerState.y) / cameraZoom;
      const camX = playerState.x;
      const camZ = playerState.z + camDist;
      camera.position.x += (camX - camera.position.x) * 0.03 * delta;
      camera.position.z += (camZ - camera.position.z) * 0.03 * delta;
      camera.position.y += (camHeight - camera.position.y) * 0.03 * delta;
      camera.lookAt(playerState.x, playerState.y + 5, playerState.z);

      // Animate clouds
      clouds.forEach((cloud, i) => {
        cloud.position.x += 0.02 * (i % 2 === 0 ? 1 : -1) * delta;
        if (cloud.position.x > 200) cloud.position.x = -200;
        if (cloud.position.x < -200) cloud.position.x = 200;
      });

      // Animate Garaje icon above ice cave
      if (garajeIcon && garajeIcon.userData) {
        const iconTime = time * 0.001; // Convert to seconds
        const userData = garajeIcon.userData;
        
        // Floating animation (bob up and down)
        garajeIcon.position.y = userData.baseY + Math.sin(iconTime * 1.5 + userData.phase) * 2;
        
        // Gentle rotation
        garajeIcon.rotation.y = Math.PI + Math.sin(iconTime * 0.5) * 0.3;
        
        // Pulse the glow
        if (userData.glow) {
          userData.glow.material.opacity = 0.2 + Math.sin(iconTime * 2) * 0.15;
          userData.glow.scale.setScalar(1 + Math.sin(iconTime * 1.8) * 0.1);
        }
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    gameRef.current = true;
    animate(0);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', onWheel);
        if (renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, []);

  // ============ TABERNA DEL DEBATE - Chat Component ============
  const [tabernaMessages, setTabernaMessages] = useState([
    { id: 0, type: 'system', text: 'Bienvenido a La Taberna. Tres opiniones, cero filtros. Pregunta bajo tu responsabilidad.' }
  ]);
  const [tabernaInput, setTabernaInput] = useState('');
  const [isThinking, setIsThinking] = useState({ dev: false, designer: false, data: false });

  const generateCharacterResponse = async (character, context, isReplyTo = null) => {
    // Random chance to just respond with emoji (20% chance)
    if (Math.random() < 0.20) {
      const emojis = {
        dev: ['🙄', '💀', '☕', '🔥', '😤', '🤦‍♂️'],
        designer: ['💅', '✨', '😩', '🙃', '💔', '🖤'],
        data: ['📊', '📉', '🤔', '💰', '📈', '❌'],
      };
      return emojis[character][Math.floor(Math.random() * emojis[character].length)];
    }

    // Build the prompt based on context
    let prompt = context;
    if (isReplyTo) {
      const dynamics = {
        dev: {
          designer: "Valentina acaba de decir algo sobre diseño. Respóndele con tu cinismo técnico habitual. Una frase.",
          data: "El Data ha hablado de números. Dale la razón a regañadientes o discútele. Una frase."
        },
        designer: {
          dev: "Max ha soltado una de sus frases de CTO amargado. Respóndele defendiendo la estética. Una frase.",
          data: "El Data ha mencionado márgenes o ROI. Recuérdale que el diseño también vende. Una frase."
        },
        data: {
          dev: "Max ha opinado sobre tecnología. Pídele datos o cuestiona el coste. Una frase.",
          designer: "Valentina ha hablado de diseño. Pregunta cómo eso afecta al margen. Una frase."
        }
      };
      prompt = `Contexto: "${context.originalQuestion}"\n\n${isReplyTo.name} dijo: "${isReplyTo.text}"\n\n${dynamics[character][isReplyTo.character]}`;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: isReplyTo ? 80 : 120,
          system: TABERNA_SYSTEM_PROMPTS[character],
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      const fallbacks = {
        dev: "Café. Necesito café.",
        designer: "Sin palabras. Literalmente.",
        data: "Los números no mienten."
      };
      return fallbacks[character];
    }
  };

  const handleTabernaSend = async () => {
    if (!tabernaInput.trim()) return;
    
    const userMessage = { id: Date.now(), type: 'user', text: tabernaInput };
    setTabernaMessages(prev => [...prev, userMessage]);
    const question = tabernaInput;
    setTabernaInput('');
    
    // Randomly decide who will respond (at least 1, sometimes 2, sometimes all 3)
    const characters = ['dev', 'designer', 'data'];
    const shuffled = characters.sort(() => Math.random() - 0.5);
    
    // Determine how many will respond initially (1-3)
    const respondersCount = Math.random() < 0.2 ? 1 : (Math.random() < 0.5 ? 2 : 3);
    const initialResponders = shuffled.slice(0, respondersCount);
    
    // Show thinking for selected responders only
    const thinkingState = { dev: false, designer: false, data: false };
    initialResponders.forEach(c => thinkingState[c] = true);
    setIsThinking(thinkingState);
    
    // Track responses for potential follow-ups
    const responses = [];
    let messageCount = 0;
    const maxMessages = 6;
    
    // Generate initial responses with staggered timing
    for (let i = 0; i < initialResponders.length; i++) {
      const character = initialResponders[i];
      const delay = 800 + (i * 1200) + (Math.random() * 500);
      
      setTimeout(async () => {
        const response = await generateCharacterResponse(character, question);
        const charNames = { dev: 'Max', designer: 'Valentina', data: 'El Data' };
        
        responses.push({ character, text: response, name: charNames[character] });
        messageCount++;
        
        setTabernaMessages(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          type: character, 
          text: response 
        }]);
        setIsThinking(prev => ({ ...prev, [character]: false }));
        
        // After last initial response, maybe trigger follow-up banter
        if (i === initialResponders.length - 1 && messageCount < maxMessages) {
          // 60% chance of follow-up conversation
          if (Math.random() < 0.6 && responses.length >= 2) {
            triggerFollowUp(question, responses, messageCount, maxMessages);
          }
        }
      }, delay);
    }
  };

  // Function to trigger follow-up responses between characters
  const triggerFollowUp = async (originalQuestion, previousResponses, currentCount, maxCount) => {
    const characters = ['dev', 'designer', 'data'];
    const charNames = { dev: 'Max', designer: 'Valentina', data: 'El Data' };
    let count = currentCount;
    
    // Generate 1-3 follow-up messages
    const followUpCount = Math.min(
      Math.floor(Math.random() * 3) + 1,
      maxCount - count
    );
    
    for (let i = 0; i < followUpCount; i++) {
      const delay = 2000 + (i * 1500) + (Math.random() * 800);
      
      setTimeout(async () => {
        // Pick a random character to respond
        const responder = characters[Math.floor(Math.random() * characters.length)];
        // Pick a random previous response to reply to
        const replyTo = previousResponses[Math.floor(Math.random() * previousResponses.length)];
        
        // Don't reply to yourself
        if (responder === replyTo.character && previousResponses.length > 1) {
          const others = previousResponses.filter(r => r.character !== responder);
          if (others.length > 0) {
            const newReplyTo = others[Math.floor(Math.random() * others.length)];
            Object.assign(replyTo, newReplyTo);
          }
        }
        
        setIsThinking(prev => ({ ...prev, [responder]: true }));
        
        const response = await generateCharacterResponse(
          responder, 
          { originalQuestion }, 
          replyTo
        );
        
        previousResponses.push({ character: responder, text: response, name: charNames[responder] });
        
        setTabernaMessages(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          type: responder, 
          text: response 
        }]);
        setIsThinking(prev => ({ ...prev, [responder]: false }));
      }, delay);
    }
  };

  // TabernaApp as JSX (not a component) to prevent input losing focus
  const tabernaContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: 480, background: '#1a1a1a' }}>
      {/* PLASTIC HEADER with characters */}
      <div style={{ 
        background: 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)', 
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-around',
        borderBottom: '1px solid rgba(155,89,182,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {Object.entries(TABERNA_CHARACTERS).map(([key, char]) => (
          <div key={key} style={{ 
            textAlign: 'center',
            opacity: isThinking[key] ? 1 : 0.6,
            transition: 'all 0.3s ease',
            transform: isThinking[key] ? 'scale(1.05)' : 'scale(1)',
          }}>
            <div className="plastic-avatar" style={{ 
              width: 44, 
              height: 44, 
              margin: '0 auto 6px',
              background: `linear-gradient(145deg, ${char.color} 0%, ${char.color}bb 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}>{char.icon}</div>
            <div style={{ fontSize: 11, color: char.color, fontWeight: 700, fontFamily: "'Inter Tight', sans-serif" }}>{char.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{char.role}</div>
            {isThinking[key] && (
              <div style={{ fontSize: 9, color: char.color, marginTop: 4, fontWeight: 600 }}>✍️ pensando...</div>
            )}
          </div>
        ))}
      </div>
      
      {/* PLASTIC MESSAGES AREA */}
      <div className="plastic-scroll" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: 16, 
        background: 'linear-gradient(180deg, #151515 0%, #1a1a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {tabernaMessages.map(msg => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} style={{ 
                textAlign: 'center', 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: 12,
                padding: '12px 16px',
                background: 'linear-gradient(145deg, rgba(155,89,182,0.15) 0%, rgba(155,89,182,0.08) 100%)',
                borderRadius: 12,
                border: '1px solid rgba(155,89,182,0.2)',
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 500,
              }}>
                🍺 {msg.text}
              </div>
            );
          }
          
          if (msg.type === 'user') {
            return (
              <div key={msg.id} className="plastic-bubble" style={{ 
                alignSelf: 'flex-end',
                background: 'linear-gradient(145deg, #7c3aed 0%, #5b21b6 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '18px 18px 6px 18px',
                maxWidth: '75%',
                fontSize: 13,
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 500,
              }}>
                {msg.text}
              </div>
            );
          }
          
          const char = TABERNA_CHARACTERS[msg.type];
          return (
            <div key={msg.id} style={{ 
              display: 'flex', 
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <div className="plastic-avatar" style={{ 
                width: 38, 
                height: 38, 
                background: `linear-gradient(145deg, ${char.color} 0%, ${char.color}bb 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}>
                {char.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 11, 
                  color: char.color, 
                  fontWeight: 700, 
                  marginBottom: 4,
                  fontFamily: "'Inter Tight', sans-serif",
                }}>
                  {char.name}
                </div>
                <div className="plastic-bubble" style={{ 
                  background: 'linear-gradient(145deg, #252525 0%, #1f1f1f 100%)',
                  border: `1px solid ${char.color}44`,
                  color: '#f0f0f0',
                  padding: '12px 16px',
                  borderRadius: '6px 18px 18px 18px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontFamily: "'Inter Tight', sans-serif",
                  fontWeight: 400,
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* PLASTIC INPUT AREA */}
      <div style={{ 
        padding: 14, 
        background: 'linear-gradient(180deg, #1f1f1f 0%, #1a1a1a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: 12,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>
        <input
          type="text"
          value={tabernaInput}
          onChange={(e) => setTabernaInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTabernaSend()}
          placeholder="Plantea tu duda al triunvirato..."
          className="plastic-input"
          style={{
            flex: 1,
            borderRadius: 16,
          }}
        />
        <button
          onClick={handleTabernaSend}
          disabled={Object.values(isThinking).some(v => v)}
          className="plastic-btn"
          style={{
            padding: '14px 22px',
            borderRadius: 16,
            background: Object.values(isThinking).some(v => v) 
              ? 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)' 
              : 'linear-gradient(180deg, #9B59B6 0%, #7B2D8E 100%)',
            color: 'white',
            fontSize: 14,
            boxShadow: Object.values(isThinking).some(v => v)
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : '0 6px 16px rgba(155,89,182,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            cursor: Object.values(isThinking).some(v => v) ? 'wait' : 'pointer',
          }}
        >
          🍺 Preguntar
        </button>
      </div>
    </div>
  );
  
  // ============ EL AULA MAGNA - Masterclass Player ============
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessonView, setLessonView] = useState('lessons');
  
  const courseData = {
    title: "Diseño de Producto Digital",
    lessons: [
      { id: 1, title: "Introducción al UX", duration: "15:30", status: "completed" },
      { id: 2, title: "Investigación de Usuarios", duration: "22:45", status: "completed" },
      { id: 3, title: "Wireframing Básico", duration: "18:20", status: "in-progress" },
      { id: 4, title: "Prototipado Interactivo", duration: "25:10", status: "locked" },
      { id: 5, title: "Testing con Usuarios", duration: "20:00", status: "locked" },
    ],
    calendar: [
      { day: 2, title: "Sesión Q&A" },
      { day: 9, title: "Workshop Figma" },
      { day: 16, title: "Review Proyectos" },
    ]
  };

  const AulaMagnaApp = () => (
    <div style={{ display: 'flex', height: 450, background: '#1a1a1a' }}>
      {/* VIDEO PLAYER AREA */}
      <div style={{ flex: 7, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(139,69,19,0.3)' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'linear-gradient(145deg, #151515 0%, #1a1a1a 100%)' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              fontSize: 70, 
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
            }}>🎬</div>
            <div style={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: 14, 
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 500,
            }}>{courseData.lessons[currentLesson]?.title}</div>
            <button className="plastic-btn" style={{ 
              padding: '14px 28px', 
              background: 'linear-gradient(180deg, #CD853F 0%, #8B4513 100%)', 
              color: 'white', 
              fontSize: 15,
              boxShadow: '0 6px 16px rgba(139,69,19,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>▶️ Reproducir</button>
          </div>
          {/* PROGRESS BAR */}
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: 6, 
            background: '#2a2a2a',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}>
            <div style={{ 
              width: '35%', 
              height: '100%', 
              background: 'linear-gradient(90deg, #CD853F 0%, #8B4513 100%)',
              boxShadow: '0 0 8px rgba(205,133,63,0.5)',
              borderRadius: '0 3px 3px 0',
            }} />
          </div>
        </div>
        {/* LESSON INFO */}
        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(180deg, #252525 0%, #1f1f1f 100%)',
          borderTop: '1px solid rgba(139,69,19,0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}>
          <h3 style={{ margin: 0, color: '#CD853F', fontSize: 15, fontFamily: "'Inter Tight', sans-serif", fontWeight: 700 }}>📜 {courseData.lessons[currentLesson]?.title}</h3>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter Tight', sans-serif" }}>Duración: {courseData.lessons[currentLesson]?.duration}</p>
        </div>
      </div>
      {/* SIDEBAR */}
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
        {/* TABS */}
        <div style={{ 
          display: 'flex', 
          padding: 8,
          gap: 6,
          background: 'linear-gradient(180deg, #222 0%, #1a1a1a 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button onClick={() => setLessonView('lessons')} className={lessonView === 'lessons' ? 'plastic-tab plastic-tab-active' : 'plastic-tab plastic-tab-inactive'} style={{ flex: 1 }}>📚 Lecciones</button>
          <button onClick={() => setLessonView('calendar')} className={lessonView === 'calendar' ? 'plastic-tab plastic-tab-active' : 'plastic-tab plastic-tab-inactive'} style={{ flex: 1 }}>📅 Calendario</button>
        </div>
        {/* CONTENT */}
        <div className="plastic-scroll" style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {lessonView === 'lessons' ? (
            <div>
              {courseData.lessons.map((lesson, i) => (
                <div 
                  key={lesson.id} 
                  onClick={() => lesson.status !== 'locked' && setCurrentLesson(i)} 
                  className="plastic-lesson"
                  style={{ 
                    background: currentLesson === i 
                      ? 'linear-gradient(145deg, #8B4513 0%, #6B3410 100%)' 
                      : 'linear-gradient(145deg, #2a2a2a 0%, #222 100%)',
                    color: currentLesson === i ? 'white' : 'rgba(255,255,255,0.8)',
                    cursor: lesson.status === 'locked' ? 'not-allowed' : 'pointer', 
                    opacity: lesson.status === 'locked' ? 0.4 : 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10,
                    boxShadow: currentLesson === i 
                      ? '0 4px 12px rgba(139,69,19,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{lesson.status === 'completed' ? '✅' : lesson.status === 'in-progress' ? '▶️' : '🔒'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Inter Tight', sans-serif" }}>{lesson.title}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{lesson.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12, color: '#CD853F', fontSize: 13, fontFamily: "'Inter Tight', sans-serif" }}>📅 Diciembre 2025</div>
              {courseData.calendar.map((event, i) => (
                <div key={i} className="plastic-card" style={{ 
                  padding: 10, 
                  marginBottom: 8, 
                  borderLeft: '3px solid #CD853F', 
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Inter Tight', sans-serif",
                }}>
                  <strong style={{ color: '#CD853F' }}>Día {event.day}:</strong> {event.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ============ EL VÓRTICE BUROCRÁTICO - Survival Game ============
  const [vorticeGame, setVorticeGame] = useState({ started: false, gameOver: false, survived: false, time: 0, message: '' });
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  const startVorticeGame = () => {
    setVorticeGame({ started: true, gameOver: false, survived: false, time: 0, message: '' });
  };


  // Pong game against Rocío (AI never loses)
  const VorticeApp = () => {
    const [gameState, setGameState] = useState({ 
      running: false, 
      gameOver: false, 
      playerScore: 0,
      rocioScore: 0,
    });
    const gameCanvasRef = useRef(null);
    const animationRef = useRef(null);
    const ballRef = useRef({ x: 250, y: 200, vx: 4, vy: 3 });
    const playerPaddleRef = useRef({ y: 170 });
    const rocioPaddleRef = useRef({ y: 170 });
    const mouseYRef = useRef(200);

    // Rocío's quotes when she scores
    const rocioQuotes = [
      "¿Otra vez? Venga, que el Excel no se rellena solo... 📊",
      "¡Gol! Ahora imagina que la pelota son tus horas sin imputar 🎯",
      "Jajaja, ¿crees que puedes ganarme? Llevo 15 años en esto 💪",
      "¡Punto para Operaciones! Como siempre... 😏",
      "Hmm, ¿no deberías estar imputando en lugar de jugando? 🤔",
      "¡Otra vez! A este ritmo no llegas al día 26... ⏰",
      "¿Sabes qué es más fácil que ganarme? ¡IMPUTAR! 📋",
      "Error 404: Tus habilidades de Pong no encontradas 🔍",
    ];

    const [currentQuote, setCurrentQuote] = useState('');
    const [showQuote, setShowQuote] = useState(false);

    useEffect(() => {
      if (!gameState.running || gameState.gameOver) return;
      const canvas = gameCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const handleMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseYRef.current = e.clientY - rect.top;
      };
      canvas.addEventListener('mousemove', handleMouseMove);

      const PADDLE_HEIGHT = 70;
      const PADDLE_WIDTH = 12;
      const BALL_SIZE = 12;
      const CANVAS_WIDTH = 500;
      const CANVAS_HEIGHT = 350;

      const gameLoop = () => {
        const ball = ballRef.current;
        const playerPaddle = playerPaddleRef.current;
        const rocioPaddle = rocioPaddleRef.current;

        // Move player paddle toward mouse
        const targetY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, mouseYRef.current - PADDLE_HEIGHT / 2));
        playerPaddle.y += (targetY - playerPaddle.y) * 0.15;

        // Rocío AI - NEVER misses (tracks ball perfectly with slight delay for realism)
        const rocioTargetY = ball.y - PADDLE_HEIGHT / 2;
        const rocioSpeed = ball.vx > 0 ? 0.25 : 0.12;
        rocioPaddle.y += (rocioTargetY - rocioPaddle.y) * rocioSpeed;
        rocioPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, rocioPaddle.y));

        // Move ball
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball collision with top/bottom
        if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
          ball.vy *= -1;
          ball.y = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, ball.y));
        }

        // Ball collision with player paddle (left)
        if (ball.x <= 30 + PADDLE_WIDTH && ball.x > 20 &&
            ball.y + BALL_SIZE > playerPaddle.y && ball.y < playerPaddle.y + PADDLE_HEIGHT) {
          ball.vx = Math.abs(ball.vx) * 1.05;
          ball.vx = Math.min(ball.vx, 12);
          const hitPos = (ball.y - playerPaddle.y) / PADDLE_HEIGHT - 0.5;
          ball.vy = hitPos * 8;
        }

        // Ball collision with Rocío paddle (right)
        if (ball.x >= CANVAS_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE && ball.x < CANVAS_WIDTH - 20 &&
            ball.y + BALL_SIZE > rocioPaddle.y && ball.y < rocioPaddle.y + PADDLE_HEIGHT) {
          ball.vx = -Math.abs(ball.vx) * 1.05;
          ball.vx = Math.max(ball.vx, -12);
          const hitPos = (ball.y - rocioPaddle.y) / PADDLE_HEIGHT - 0.5;
          ball.vy = hitPos * 8;
        }

        // Score detection
        if (ball.x < 0) {
          // Rocío scores!
          setGameState(prev => {
            const newScore = prev.rocioScore + 1;
            if (newScore >= 5) {
              return { ...prev, rocioScore: newScore, gameOver: true };
            }
            return { ...prev, rocioScore: newScore };
          });
          setCurrentQuote(rocioQuotes[Math.floor(Math.random() * rocioQuotes.length)]);
          setShowQuote(true);
          setTimeout(() => setShowQuote(false), 2000);
          ball.x = CANVAS_WIDTH / 2;
          ball.y = CANVAS_HEIGHT / 2;
          ball.vx = 4;
          ball.vy = (Math.random() - 0.5) * 6;
        }
        if (ball.x > CANVAS_WIDTH) {
          // Player scores! (rare)
          setGameState(prev => ({ ...prev, playerScore: prev.playerScore + 1 }));
          ball.x = CANVAS_WIDTH / 2;
          ball.y = CANVAS_HEIGHT / 2;
          ball.vx = -4;
          ball.vy = (Math.random() - 0.5) * 6;
        }

        // Draw background
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw center line
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = '#2a4a6a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, 0);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw player paddle (green)
        ctx.fillStyle = '#4CAF50';
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 15;
        ctx.fillRect(30, playerPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.shadowBlur = 0;

        // Draw Rocío paddle (purple)
        ctx.fillStyle = '#9B59B6';
        ctx.shadowColor = '#9B59B6';
        ctx.shadowBlur = 15;
        ctx.fillRect(CANVAS_WIDTH - 30 - PADDLE_WIDTH, rocioPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.shadowBlur = 0;

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x + BALL_SIZE/2, ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI * 2);
        ctx.fillStyle = '#E74C3C';
        ctx.shadowColor = '#E74C3C';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw labels
        ctx.font = 'bold 11px Inter Tight, sans-serif';
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'center';
        ctx.fillText('TÚ', 36, 20);
        ctx.fillStyle = '#9B59B6';
        ctx.fillText('ROCÍO 👩‍💼', CANVAS_WIDTH - 36, 20);

        animationRef.current = requestAnimationFrame(gameLoop);
      };

      animationRef.current = requestAnimationFrame(gameLoop);
      return () => {
        cancelAnimationFrame(animationRef.current);
        canvas.removeEventListener('mousemove', handleMouseMove);
      };
    }, [gameState.running, gameState.gameOver]);

    const startGame = () => {
      ballRef.current = { x: 250, y: 175, vx: 4, vy: (Math.random() - 0.5) * 4 };
      playerPaddleRef.current = { y: 140 };
      rocioPaddleRef.current = { y: 140 };
      setGameState({ running: true, gameOver: false, playerScore: 0, rocioScore: 0 });
      setShowQuote(false);
    };

    return (
      <div style={{ padding: 24, background: '#0a1628', minHeight: 480, fontFamily: "'Inter Tight', sans-serif" }}>
        {!gameState.running && !gameState.gameOver && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🏓</div>
            <h2 style={{ color: '#E74C3C', margin: 0, fontSize: 24, fontWeight: 800 }}>PONG: Imputaciones Edition</h2>
            <p style={{ color: '#9B59B6', marginTop: 8, fontSize: 14, fontWeight: 600 }}>Tú vs Rocío (Directora de Imputaciones)</p>
            
            <div style={{ 
              background: 'linear-gradient(145deg, #1a2a4a 0%, #0f1e38 100%)', 
              borderRadius: 16, 
              padding: 20, 
              margin: '24px 0',
              border: '1px solid #2a4a6a',
              textAlign: 'left',
            }}>
              <div style={{ color: '#E74C3C', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚠️ ADVERTENCIA:</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Rocío lleva <strong style={{ color: '#9B59B6' }}>15 años</strong> persiguiendo imputaciones sin registrar. 
                Su reflejo está entrenado por miles de emails de seguimiento. <strong style={{ color: '#E74C3C' }}>Nadie la ha vencido jamás.</strong>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12, fontStyle: 'italic' }}>
                "Si no puedes con ella, al menos haz que se esfuerce..." - Antiguo empleado, 2019
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 30, margin: '20px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>😰</div>
                <div style={{ color: '#4CAF50', fontSize: 12, fontWeight: 600 }}>TÚ</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Probabilidad: 0.01%</div>
              </div>
              <div style={{ color: '#E74C3C', fontSize: 24, fontWeight: 800, alignSelf: 'center' }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>👩‍💼</div>
                <div style={{ color: '#9B59B6', fontSize: 12, fontWeight: 600 }}>ROCÍO</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Invicta desde 2009</div>
              </div>
            </div>

            <button 
              onClick={startGame} 
              className="plastic-btn"
              style={{ 
                padding: '16px 44px', 
                fontSize: 16, 
                background: 'linear-gradient(180deg, #E74C3C 0%, #C0392B 100%)', 
                color: 'white',
                boxShadow: '0 8px 20px rgba(231,76,60,0.4)',
              }}
            >🎮 Intentarlo (inútilmente)</button>
          </div>
        )}

        {gameState.running && !gameState.gameOver && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12, 
              padding: '12px 20px',
              background: 'linear-gradient(145deg, #1a2a4a 0%, #0f1e38 100%)',
              borderRadius: 12,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4CAF50', fontSize: 28, fontWeight: 800 }}>{gameState.playerScore}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>TÚ</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Primero a 5</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#9B59B6', fontSize: 28, fontWeight: 800 }}>{gameState.rocioScore}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>ROCÍO</div>
              </div>
            </div>

            {showQuote && (
              <div style={{
                background: 'linear-gradient(145deg, #4a2a6a 0%, #3a1a5a 100%)',
                padding: '10px 16px',
                borderRadius: 10,
                marginBottom: 12,
                border: '1px solid #6a3a8a',
              }}>
                <span style={{ color: '#9B59B6', fontWeight: 600 }}>Rocío: </span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{currentQuote}</span>
              </div>
            )}

            <canvas 
              ref={gameCanvasRef} 
              width={500} 
              height={350} 
              style={{ 
                border: '3px solid #2a4a6a', 
                borderRadius: 12, 
                cursor: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                display: 'block',
                margin: '0 auto',
              }} 
            />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 10 }}>
              Mueve el ratón arriba/abajo para controlar tu pala
            </p>
          </div>
        )}

        {gameState.gameOver && (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: 60, marginBottom: 10 }}>👩‍💼</div>
            <h2 style={{ color: '#9B59B6', fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>ROCÍO GANA (obviamente)</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Resultado final: TÚ {gameState.playerScore} - {gameState.rocioScore} ROCÍO
            </p>
            
            <div style={{ 
              background: 'linear-gradient(145deg, #2a1a1a 0%, #1a1010 100%)', 
              borderRadius: 16, 
              padding: 24, 
              margin: '24px 0',
              border: '2px solid #E74C3C',
            }}>
              <p style={{ 
                color: '#E74C3C', 
                fontSize: 18, 
                fontWeight: 700, 
                margin: 0,
                lineHeight: 1.5,
              }}>
                "Y ahora deja de perder el tiempo aquí y vete a imputar"
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12, fontStyle: 'italic' }}>
                — Rocío, después de cada partida (y cada email)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={startGame} 
                className="plastic-btn"
                style={{ 
                  padding: '14px 28px', 
                  fontSize: 14, 
                  background: 'linear-gradient(180deg, #E74C3C 0%, #C0392B 100%)', 
                  color: 'white',
                }}
              >🔄 Reintentar (no servirá)</button>
              <a 
                href="https://intranetgarajedeideas.com/login#"
                target="_blank"
                rel="noopener noreferrer"
                className="plastic-btn"
                style={{ 
                  padding: '14px 28px', 
                  fontSize: 14, 
                  background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)', 
                  color: 'white',
                  textDecoration: 'none',
                }}
              >📋 Ir a imputar (buena decisión)</a>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Market App - ¿Vas a llevar comida a la ofi?
  const MarketApp = () => {
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [notification, setNotification] = useState(null);

    const products = [
      { id: 1, name: 'Hummus de Garbanzo Bio', price: 4.50, emoji: '🥙', tags: ['vegano', 'sin gluten'] },
      { id: 2, name: 'Leche de Avena Barista', price: 3.20, emoji: '🥛', tags: ['vegano', 'sin azúcar'] },
      { id: 3, name: 'Pan Sin Gluten Artesano', price: 5.90, emoji: '🍞', tags: ['vegano', 'sin gluten'] },
      { id: 4, name: 'Kombucha de Jengibre', price: 3.80, emoji: '🍵', tags: ['vegano', 'sin alcohol', 'sin azúcar'] },
      { id: 5, name: 'Galletas de Avena (sin azúcar)', price: 4.20, emoji: '🍪', tags: ['vegano', 'sin azúcar'] },
      { id: 6, name: 'Tofu Ahumado Ecológico', price: 3.90, emoji: '🧈', tags: ['vegano', 'sin gluten'] },
      { id: 7, name: 'Cacao Puro en Polvo', price: 6.50, emoji: '🍫', tags: ['vegano', 'sin azúcar', 'sin gluten'] },
      { id: 8, name: 'Quinoa Tricolor Premium', price: 4.80, emoji: '🌾', tags: ['vegano', 'sin gluten'] },
      { id: 9, name: 'Zumo Verde Detox', price: 4.50, emoji: '🥤', tags: ['vegano', 'sin azúcar'] },
      { id: 10, name: 'Tempeh Marinado', price: 5.20, emoji: '🥓', tags: ['vegano', 'sin gluten'] },
      { id: 11, name: 'Agua de Coco Natural', price: 2.90, emoji: '🥥', tags: ['vegano', 'sin azúcar'] },
      { id: 12, name: 'Chips de Kale Crujiente', price: 3.50, emoji: '🥬', tags: ['vegano', 'sin gluten'] },
    ];

    const addToCart = (product) => {
      setCart(prev => {
        const existing = prev.find(p => p.id === product.id);
        let newCart;
        if (existing) {
          newCart = prev.map(p => p.id === product.id ? {...p, qty: p.qty + 1} : p);
        } else {
          newCart = [...prev, {...product, qty: 1}];
        }
        
        // Calculate new total items
        const newTotal = newCart.reduce((sum, p) => sum + p.qty, 0);
        const oldTotal = prev.reduce((sum, p) => sum + p.qty, 0);
        
        // Check for milestone notifications
        if (oldTotal < 5 && newTotal >= 5) {
          setNotification({
            type: 'catering',
            message: '¡Aviso! Hoy viene cliente. Se anticipa que sobrará catering 🦅',
          });
          setTimeout(() => setNotification(null), 4000);
        } else if (oldTotal < 10 && newTotal >= 10) {
          setNotification({
            type: 'slack',
            message: 'Alguien se te ha adelantado y ha dejado bizcocho en la sexta... añade más productos si quieres destacar por encima.',
          });
          setTimeout(() => setNotification(null), 5000);
        }
        
        return newCart;
      });
    };

    const removeFromCart = (productId) => {
      setCart(prev => prev.filter(p => p.id !== productId));
    };

    const totalItems = cart.reduce((sum, p) => sum + p.qty, 0);
    const totalPrice = cart.reduce((sum, p) => sum + p.price * p.qty, 0);

    return (
      <div style={{ padding: 24, background: '#1a1a1a', minHeight: 480, fontFamily: "'Inter Tight', sans-serif" }}>
        {/* Header con narrativa */}
        <div style={{ 
          background: 'linear-gradient(145deg, #1a3a2a 0%, #0f2518 100%)', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 20,
          border: '1px solid #2a5a3a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>🥗</span>
            <div>
              <h2 style={{ color: '#27AE60', margin: 0, fontSize: 20, fontWeight: 800 }}>¿Vas a llevar comida a la ofi?</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11 }}>Tienda oficial de Garaje de Ideas</p>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(231,76,60,0.1)', 
            border: '1px solid rgba(231,76,60,0.3)', 
            borderRadius: 10, 
            padding: 14,
          }}>
            <p style={{ color: '#E74C3C', fontWeight: 700, fontSize: 13, margin: '0 0 8px' }}>⚠️ COMUNICADO OFICIAL DE PEOPLE:</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Queridos compañeros, ya somos <strong style={{ color: '#27AE60' }}>más de 340 personas</strong> en Garaje. 
              Tras años de celebrar cumpleaños semanales con tartas, donuts y cervezas, hemos detectado un 
              <strong style={{ color: '#E74C3C' }}> incremento del 340% en niveles de glucosa</strong> en las últimas analíticas de empresa.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6, margin: '10px 0 0' }}>
              A partir de ahora, esta tienda solo ofrece productos <span style={{ color: '#27AE60' }}>veganos</span>, 
              <span style={{ color: '#3498DB' }}> sin azúcar</span>, <span style={{ color: '#F39C12' }}>sin gluten</span> y 
              <span style={{ color: '#9B59B6' }}> sin alcohol</span>. Lo sentimos, pero ya somos muchos y además somos 
              tremendamente inclusivos.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>
              — El Comité de Bienestar (y Supervivencia) 🏥
            </p>
          </div>
        </div>

        {/* Cart button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button 
            onClick={() => setShowCart(!showCart)}
            className="plastic-btn"
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              background: totalItems > 0 ? 'linear-gradient(180deg, #27AE60 0%, #1E8449 100%)' : 'linear-gradient(180deg, #444 0%, #333 100%)', 
              color: 'white',
            }}
          >
            🛒 Cesta ({totalItems}) - {totalPrice.toFixed(2)}€
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div style={{ 
            background: notification.type === 'slack' 
              ? 'linear-gradient(145deg, #4A154B 0%, #36104A 100%)' 
              : 'linear-gradient(145deg, #F39C12 0%, #D68910 100%)',
            borderRadius: 12, 
            padding: 14, 
            marginBottom: 16,
            border: notification.type === 'slack' ? '1px solid #611f69' : '1px solid #E67E22',
            animation: 'slideIn 0.3s ease',
          }}>
            {notification.type === 'slack' ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ 
                  background: '#E01E5A', 
                  borderRadius: 4, 
                  padding: '4px 6px', 
                  fontSize: 10, 
                  fontWeight: 700,
                  color: 'white',
                }}>Slack</div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4 }}>#general</div>
                  <p style={{ color: 'white', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{notification.message}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <p style={{ color: 'white', fontSize: 13, margin: 0, fontWeight: 600 }}>{notification.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Cart panel */}
        {showCart && cart.length > 0 && (
          <div style={{ 
            background: 'linear-gradient(145deg, #252525 0%, #1f1f1f 100%)', 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 20,
            border: '1px solid #27AE60',
          }}>
            <h4 style={{ color: '#27AE60', margin: '0 0 12px', fontSize: 14 }}>Tu cesta saludable:</h4>
            {cart.map(item => (
              <div key={item.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  {item.emoji} {item.name} x{item.qty}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#27AE60', fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)}€</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: 16 }}
                  >✕</button>
                </div>
              </div>
            ))}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 12,
              paddingTop: 12,
              borderTop: '2px solid rgba(39,174,96,0.3)',
            }}>
              <span style={{ color: 'white', fontWeight: 700 }}>Total:</span>
              <span style={{ color: '#27AE60', fontWeight: 800, fontSize: 16 }}>{totalPrice.toFixed(2)}€</span>
            </div>
            <button 
              onClick={() => setActiveApp(null)}
              className="plastic-btn"
              style={{ 
                width: '100%',
                marginTop: 12,
                padding: '12px', 
                fontSize: 13, 
                background: 'linear-gradient(180deg, #7f8c8d 0%, #606060 100%)', 
                color: 'white',
              }}
            >🚫 Paso, para comprar esto prefiero no llevar nada</button>
          </div>
        )}

        {/* Products grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 12,
        }}>
          {products.map(product => (
            <div 
              key={product.id}
              className="plastic-card"
              style={{ 
                padding: 14, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onClick={() => addToCart(product)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{product.emoji}</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600, marginBottom: 6, minHeight: 30 }}>
                {product.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ 
                    fontSize: 8, 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    background: tag === 'vegano' ? '#27AE60' : 
                               tag === 'sin azúcar' ? '#3498DB' : 
                               tag === 'sin gluten' ? '#F39C12' : '#9B59B6',
                    color: 'white',
                    fontWeight: 600,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ color: '#27AE60', fontWeight: 800, fontSize: 14 }}>{product.price.toFixed(2)}€</div>
            </div>
          ))}
        </div>

        <p style={{ 
          color: 'rgba(255,255,255,0.3)', 
          fontSize: 10, 
          textAlign: 'center', 
          marginTop: 20,
          fontStyle: 'italic',
        }}>
          * Los beneficios de esta tienda se destinan íntegramente al fondo "Detox Post-Navidad" 🎄
        </p>
      </div>
    );
  };

  const ConfiguracionApp = () => (
    <div style={{ padding: 24, background: '#1a1a1a', fontFamily: "'Inter Tight', sans-serif" }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#F39C12', fontSize: 18, fontWeight: 800, textShadow: '0 2px 8px rgba(243,156,18,0.3)' }}>⚙️ Configuración</h3>
      
      {/* TOGGLE OPTIONS */}
      <div className="plastic-card" style={{ padding: 16, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#F39C12' }} /> 
          🔊 Sonidos del sistema
        </label>
      </div>
      <div className="plastic-card" style={{ padding: 16, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#F39C12' }} /> 
          📊 Mostrar FPS
        </label>
      </div>
      
      {/* VOLUME SLIDER */}
      <div className="plastic-card" style={{ padding: 16, marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 10, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>🎵 Volumen música</label>
        <input type="range" min="0" max="100" defaultValue="70" style={{ width: '100%', height: 8, accentColor: '#F39C12' }} />
      </div>
      
      {/* SELECT */}
      <div className="plastic-card" style={{ padding: 16, marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 10, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>🎮 Calidad gráfica</label>
        <select className="plastic-input" style={{ width: '100%', padding: 12, borderRadius: 10, cursor: 'pointer' }}>
          <option>Alta</option>
          <option>Media</option>
          <option>Baja</option>
        </select>
      </div>
      
      {/* VERSION INFO */}
      <div style={{ 
        padding: 14, 
        background: 'linear-gradient(145deg, rgba(243,156,18,0.15) 0%, rgba(243,156,18,0.08) 100%)', 
        borderRadius: 12, 
        fontSize: 12,
        color: '#F39C12',
        fontWeight: 600,
        border: '1px solid rgba(243,156,18,0.2)',
        textAlign: 'center',
      }}>
        🎮 Garaje OS Village v1.0.0
      </div>
    </div>
  );

  // Pozo de los Deseos - Form state
  const [wishForm, setWishForm] = useState({
    titulo: '',
    objetivo: '',
    mecanica: '',
    area: '',
    nombre: '',
  });
  const [wishSubmitted, setWishSubmitted] = useState(false);

  const handleWishSubmit = () => {
    // Validate
    if (!wishForm.titulo || !wishForm.objetivo || !wishForm.nombre) {
      alert('Por favor completa al menos: Título, Objetivo y Tu nombre');
      return;
    }
    
    // Build email body
    const subject = encodeURIComponent(`🌟 Nueva idea para Aldea Garaje: ${wishForm.titulo}`);
    const body = encodeURIComponent(
`¡Nueva idea para la Aldea Garaje! ✨

📌 TÍTULO:
${wishForm.titulo}

🎯 OBJETIVO:
${wishForm.objetivo}

⚙️ MECÁNICA / FUNCIONALIDAD:
${wishForm.mecanica || '(No especificado)'}

🗺️ ÁREA PREFERIDA DEL MAPA:
${wishForm.area || '(Sin preferencia)'}

👤 ENVIADO POR:
${wishForm.nombre}

---
Enviado desde el Pozo de los Deseos 🪙✨`
    );
    
    // Open mailto
    window.open(`mailto:antonio.seijas@garajedeideas.com?subject=${subject}&body=${body}`, '_blank');
    
    // Show success
    setWishSubmitted(true);
    
    // Reset after delay
    setTimeout(() => {
      setWishForm({ titulo: '', objetivo: '', mecanica: '', area: '', nombre: '' });
      setWishSubmitted(false);
    }, 5000);
  };

  const wellContent = wishSubmitted ? (
    <div style={{ 
      padding: 40, 
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', 
      fontFamily: "'Inter Tight', sans-serif",
      textAlign: 'center',
      minHeight: 400,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🌟</div>
      <h2 style={{ color: '#FFD700', fontSize: 24, marginBottom: 12 }}>¡Deseo enviado!</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300 }}>
        Tu idea ha sido lanzada al pozo. Se abrirá tu cliente de correo para completar el envío.
      </p>
      <div style={{ 
        marginTop: 20, 
        padding: '12px 24px', 
        background: 'rgba(155, 89, 182, 0.3)', 
        borderRadius: 12,
        color: '#BB8FCE',
        fontSize: 12,
      }}>
        ✨ Gracias por contribuir a la Aldea
      </div>
    </div>
  ) : (
    <div style={{ 
      padding: 24, 
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', 
      fontFamily: "'Inter Tight', sans-serif",
      maxHeight: '70vh',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🪙✨</div>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: '#BB8FCE', 
          fontSize: 20, 
          fontWeight: 800,
          textShadow: '0 2px 12px rgba(155, 89, 182, 0.4)' 
        }}>
          Pozo de los Deseos
        </h3>
        <p style={{ 
          color: 'rgba(255,255,255,0.6)', 
          fontSize: 12, 
          margin: 0,
          maxWidth: 280,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Lanza tu moneda y propón una nueva app para nuestra Aldea. ¡Las mejores ideas cobrarán vida!
        </p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Título */}
        <div>
          <label style={{ 
            display: 'block', 
            color: '#BB8FCE', 
            fontSize: 11, 
            fontWeight: 700, 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Título de la app *
          </label>
          <input
            type="text"
            value={wishForm.titulo}
            onChange={(e) => setWishForm({...wishForm, titulo: e.target.value})}
            placeholder="Ej: Tablón de Kudos"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '2px solid rgba(155, 89, 182, 0.3)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Inter Tight', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Objetivo */}
        <div>
          <label style={{ 
            display: 'block', 
            color: '#BB8FCE', 
            fontSize: 11, 
            fontWeight: 700, 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Objetivo *
          </label>
          <textarea
            value={wishForm.objetivo}
            onChange={(e) => setWishForm({...wishForm, objetivo: e.target.value})}
            placeholder="¿Qué problema resuelve o qué valor aporta?"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '2px solid rgba(155, 89, 182, 0.3)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Inter Tight', sans-serif",
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Mecánica */}
        <div>
          <label style={{ 
            display: 'block', 
            color: '#BB8FCE', 
            fontSize: 11, 
            fontWeight: 700, 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Mecánica / Funcionalidad
          </label>
          <textarea
            value={wishForm.mecanica}
            onChange={(e) => setWishForm({...wishForm, mecanica: e.target.value})}
            placeholder="¿Cómo funcionaría? Describe la interacción..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '2px solid rgba(155, 89, 182, 0.3)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Inter Tight', sans-serif",
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Área */}
        <div>
          <label style={{ 
            display: 'block', 
            color: '#BB8FCE', 
            fontSize: 11, 
            fontWeight: 700, 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Área preferida del mapa
          </label>
          <select
            value={wishForm.area}
            onChange={(e) => setWishForm({...wishForm, area: e.target.value})}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '2px solid rgba(155, 89, 182, 0.3)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Inter Tight', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="">Sin preferencia</option>
            <option value="Plaza central (mercado)">🏪 Plaza central (mercado)</option>
            <option value="Zona norte (bosque/nieve)">🌲 Zona norte (bosque/nieve)</option>
            <option value="Zona sur (playa)">🏖️ Zona sur (playa)</option>
            <option value="Cerca del río">🌊 Cerca del río</option>
            <option value="Bar Las Nieves">🍺 Bar Las Nieves</option>
            <option value="Nueva ubicación">📍 Nueva ubicación</option>
          </select>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ 
            display: 'block', 
            color: '#BB8FCE', 
            fontSize: 11, 
            fontWeight: 700, 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Tu nombre *
          </label>
          <input
            type="text"
            value={wishForm.nombre}
            onChange={(e) => setWishForm({...wishForm, nombre: e.target.value})}
            placeholder="¿Quién lanza esta moneda al pozo?"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '2px solid rgba(155, 89, 182, 0.3)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Inter Tight', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleWishSubmit}
          style={{
            marginTop: 8,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Inter Tight', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(155, 89, 182, 0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(155, 89, 182, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(155, 89, 182, 0.4)';
          }}
        >
          <span>🪙</span> Lanzar deseo al pozo
        </button>

        <p style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: 10, 
          textAlign: 'center',
          margin: '8px 0 0 0',
        }}>
          * Campos obligatorios. Se abrirá tu cliente de correo.
        </p>
      </div>
    </div>
  );

  const renderAppContent = () => {
    if (!activeApp) return null;
    switch (activeApp.name) {
      case 'El Aula Magna': return <AulaMagnaApp />;
      case 'El Vórtice': return <VorticeApp />;
      case 'Configuración': return <ConfiguracionApp />;
      case 'Pozo de los Deseos': return wellContent;
      case '¿Vas a llevar comida a la ofi?': return <MarketApp />;
      case 'La Taberna': return tabernaContent;
      default: return <div style={{ padding: 20 }}>App no encontrada</div>;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* GARAJE OS BRANDING - Minimal */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 100,
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '2px 2px 0 #1a1a1a, 4px 4px 10px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 18,
          }}>G</span>
          <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 'normal' }}>Village Edition</span>
        </div>
      </div>

      {/* WATER OVERLAY - Gradual water covering as you go deeper */}
      {waterOverlay > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, 
            rgba(32, 178, 170, ${waterOverlay * 0.3}) 0%, 
            rgba(0, 128, 128, ${waterOverlay * 0.8}) 60%,
            rgba(0, 80, 80, ${waterOverlay}) 100%)`,
          pointerEvents: 'none',
          zIndex: 250,
          transition: 'all 0.5s ease',
        }}>
          {/* Bubbles effect */}
          {isDrowning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 80,
              animation: 'bubbleUp 1s ease-in-out infinite',
            }}>
              🫧
            </div>
          )}
        </div>
      )}

      {/* RESPAWN OVERLAY */}
      {isRespawning && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 400,
          animation: 'fadeOut 1s ease-out forwards',
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🌊</div>
          <div style={{ 
            color: 'white', 
            fontSize: 24, 
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 600,
          }}>
            Respawning...
          </div>
        </div>
      )}

      {/* SWIMMING MESSAGE - Shows when trying to swim too deep */}
      {swimmingMessage && (
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          background: isDrowning 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
            : 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: isDrowning ? 28 : 18,
          fontWeight: 600,
          textAlign: 'center',
          animation: isDrowning ? 'shake 0.5s ease-in-out' : 'bounceIn 0.4s ease-out',
        }}>
          <div style={{ fontSize: isDrowning ? 48 : 32, marginBottom: 10 }}>
            {isDrowning ? '💀🫧💀' : '🏊‍♂️🚫'}
          </div>
          {swimmingMessage}
        </div>
      )}

      {/* ENTER PROMPT - Shows when near building */}
      {nearBuilding && !activeApp && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          {nearBuilding.app.isTemple ? (
            /* HORN CTA FOR TEMPLE */
            <div 
              onClick={() => gameRef.current?.toggleCongregation()}
              style={{
                background: `linear-gradient(135deg, ${nearBuilding.app.color} 0%, #8B6914 50%, ${nearBuilding.app.color}dd 100%)`,
                color: 'white',
                padding: '18px 35px',
                borderRadius: 20,
                boxShadow: `0 8px 32px rgba(156,122,60,0.5), inset 0 2px 0 rgba(255,255,255,0.2)`,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                border: '2px solid rgba(255,215,0,0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(156,122,60,0.6), inset 0 2px 0 rgba(255,255,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(156,122,60,0.5), inset 0 2px 0 rgba(255,255,255,0.2)';
              }}
            >
              {/* Horn SVG Icon */}
              <svg width="48" height="36" viewBox="0 0 48 36" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                <path d="M4 18C4 18 8 8 20 8C32 8 38 4 44 4L44 32C38 32 32 28 20 28C8 28 4 18 4 18Z" 
                      fill="url(#hornGradient)" stroke="#5D4E37" strokeWidth="2"/>
                <ellipse cx="4" cy="18" rx="3" ry="6" fill="#8B7355"/>
                <ellipse cx="44" cy="18" rx="2" ry="14" fill="#6B5344"/>
                {/* Decorative rings */}
                <ellipse cx="14" cy="18" rx="1" ry="5" fill="rgba(255,215,0,0.4)"/>
                <ellipse cx="28" cy="18" rx="1" ry="7" fill="rgba(255,215,0,0.3)"/>
                <defs>
                  <linearGradient id="hornGradient" x1="4" y1="4" x2="44" y2="32">
                    <stop offset="0%" stopColor="#D4A85A"/>
                    <stop offset="50%" stopColor="#C4984A"/>
                    <stop offset="100%" stopColor="#8B6914"/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {isCongregating ? '🔔 Dispersar' : '📯 Convocar a Las Nieves'}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {isCongregating ? 'Liberar a todos' : 'Toca el cuerno vikingo'}
                </div>
              </div>
              <div style={{
                background: 'rgba(255,215,0,0.3)',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid rgba(255,215,0,0.4)',
              }}>
                <span style={{ fontSize: 18 }}>⏎</span> TOCAR
              </div>
            </div>
          ) : (
            /* NORMAL BUILDING PROMPT */
            <div style={{
              background: `linear-gradient(135deg, ${nearBuilding.app.color} 0%, ${nearBuilding.app.color}dd 100%)`,
              color: 'white',
              padding: '15px 30px',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              fontFamily: 'system-ui, sans-serif',
            }}>
              <span style={{ fontSize: 32 }}>{nearBuilding.app.icon}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>{nearBuilding.app.name}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{nearBuilding.app.description}</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⏎</span> ENTRAR
              </div>
            </div>
          )}
        </div>
      )}

      {/* APP WINDOW */}
      {activeApp && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
        }}>
          {/* PLASTICMORPHISM WINDOW */}
          <div style={{
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #151515 100%)',
            borderRadius: 24,
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.8),
              0 10px 20px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
            border: '1px solid rgba(255,255,255,0.05)',
            width: (activeApp.name === 'La Taberna' || activeApp.name === 'El Aula Magna' || activeApp.name === 'El Vórtice') ? 620 : 'auto',
            minWidth: (activeApp.name === 'La Taberna' || activeApp.name === 'El Aula Magna' || activeApp.name === 'El Vórtice') ? 580 : 420,
            maxWidth: 720,
            maxHeight: '85vh',
            overflow: 'hidden',
            fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
          }}>
            {/* PLASTICMORPHISM TITLE BAR */}
            <div style={{
              background: `linear-gradient(180deg, ${activeApp.color} 0%, ${activeApp.color}dd 100%)`,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  fontSize: 26,
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                }}>{activeApp.icon}</span>
                <span style={{ 
                  fontWeight: 700, 
                  color: 'white',
                  fontSize: 16,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  letterSpacing: '-0.02em',
                }}>{activeApp.name}</span>
              </div>
              <button 
                onClick={() => setActiveApp(null)}
                className="plastic-button-close"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s ease',
                }}
              >✕</button>
            </div>
            {/* WINDOW CONTENT */}
            <div style={{ 
              maxHeight: 'calc(80vh - 100px)', 
              overflow: 'auto',
              background: '#1a1a1a',
            }}>
              {renderAppContent()}
            </div>
            {/* PLASTICMORPHISM FOOTER */}
            <div style={{
              background: 'linear-gradient(180deg, #252525 0%, #1f1f1f 100%)',
              padding: '12px 18px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}>
              <span>🎮 Garaje OS Village</span>
              <span style={{ opacity: 0.7 }}>ESC para cerrar</span>
            </div>
          </div>
        </div>
      )}

      {/* PLASTICMORPHISM CSS STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.02); }
        }
        
        @keyframes bounceIn {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-52%) rotate(-3deg); }
          20%, 40%, 60%, 80% { transform: translateX(-48%) rotate(3deg); }
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes bubbleUp {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -70%) scale(1.2); opacity: 0.7; }
          100% { transform: translate(-50%, -90%) scale(0.8); opacity: 0; }
        }
        
        /* GUMMY BUTTON BASE */
        .plastic-btn {
          position: relative;
          border: none;
          border-radius: 14px;
          font-family: 'Inter Tight', system-ui, sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        .plastic-btn::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 10%;
          right: 10%;
          height: 35%;
          background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%);
          border-radius: 50% 50% 0 0;
          pointer-events: none;
        }
        
        .plastic-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        
        .plastic-btn:active {
          transform: translateY(2px) scale(0.98);
          filter: brightness(0.95);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
        }
        
        /* PLASTIC INPUT */
        .plastic-input {
          background: linear-gradient(180deg, #1a1a1a 0%, #252525 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: white;
          font-family: 'Inter Tight', system-ui, sans-serif;
          font-size: 14px;
          padding: 14px 18px;
          box-shadow: 
            inset 0 3px 6px rgba(0,0,0,0.4),
            inset 0 1px 2px rgba(0,0,0,0.3),
            0 1px 0 rgba(255,255,255,0.05);
          outline: none;
          transition: all 0.2s ease;
        }
        
        .plastic-input:focus {
          border-color: rgba(155,89,182,0.5);
          box-shadow: 
            inset 0 3px 6px rgba(0,0,0,0.4),
            inset 0 1px 2px rgba(0,0,0,0.3),
            0 0 0 3px rgba(155,89,182,0.2);
        }
        
        .plastic-input::placeholder {
          color: rgba(255,255,255,0.35);
        }
        
        /* PLASTIC CARD */
        .plastic-card {
          background: linear-gradient(145deg, #2a2a2a 0%, #1f1f1f 100%);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 
            0 8px 20px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
        }
        
        /* PLASTIC AVATAR */
        .plastic-avatar {
          border-radius: 50%;
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.3),
            inset 0 2px 4px rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.1);
        }
        
        /* MESSAGE BUBBLE PLASTIC */
        .plastic-bubble {
          border-radius: 18px;
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.15);
          position: relative;
        }
        
        .plastic-bubble::before {
          content: '';
          position: absolute;
          top: 4px;
          left: 12px;
          right: 12px;
          height: 30%;
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
          border-radius: 12px 12px 0 0;
          pointer-events: none;
        }
        
        /* SCROLLBAR PLASTIC STYLE */
        .plastic-scroll::-webkit-scrollbar {
          width: 8px;
        }
        
        .plastic-scroll::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        
        .plastic-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .plastic-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%);
        }
        
        /* CLOSE BUTTON */
        .plastic-button-close:hover {
          background: linear-gradient(180deg, rgba(255,100,100,0.4) 0%, rgba(255,100,100,0.2) 100%) !important;
          transform: scale(1.05);
        }
        
        .plastic-button-close:active {
          transform: scale(0.95);
        }
        
        /* LESSON ITEM */
        .plastic-lesson {
          background: linear-gradient(145deg, #2a2a2a 0%, #222 100%);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .plastic-lesson:hover {
          background: linear-gradient(145deg, #333 0%, #2a2a2a 100%);
          transform: translateX(4px);
          border-color: rgba(255,255,255,0.1);
        }
        
        /* TAB BUTTON */
        .plastic-tab {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          font-family: 'Inter Tight', system-ui, sans-serif;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .plastic-tab-active {
          background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%);
          color: white;
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }
        
        .plastic-tab-inactive {
          background: transparent;
          color: rgba(255,255,255,0.5);
        }
        
        .plastic-tab-inactive:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  );
}
