import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import React, { Suspense, useMemo, useState } from "react";
import * as THREE from "three";

// ── Floor 2 rooms — calibrated from buildingData.js ───────────────────────────
// Column grid: c=[26,142,253,364,475,586,697,808,919,1030,1141,1252,1363,1474,1530,1646]
// Row grid: rowA=160 (north top), rowB=380 (hall top), rowC=460 (hall bottom), rowD=660
const FLOOR2_ROOMS = [
  // ── North side (rowA–rowB, z:160, d:220) ─────────────────────────────────
  { id:'f2_cr_female_l',   name:'Comfort Room (Female)', x:26,   z:160, w:116, d:220, type:'comfort'   },
  { id:'f2_class_n1',      name:'Classroom',             x:142,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n2',      name:'Classroom',             x:253,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n3',      name:'Classroom',             x:364,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n4',      name:'Classroom',             x:475,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n5',      name:'Classroom',             x:586,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n6',      name:'Classroom',             x:697,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n_gap',   name:'Classroom',             x:808,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n7',      name:'Classroom',             x:919,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n8',      name:'Classroom',             x:1030, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n1',  name:'SHS Classroom',         x:1141, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n2',  name:'SHS Classroom',         x:1252, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n3',  name:'SHS Classroom',         x:1363, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_cr_male_r',     name:'Comfort Room (Male)',   x:1474, z:160, w:56,  d:220, type:'comfort'   },
  { id:'f2_cr_female_r',   name:'Comfort Room (Female)', x:1530, z:160, w:116, d:220, type:'comfort'   },

  // ── Hallway stair landings ────────────────────────────────────────────────
  { id:'f2_stair_left',    name:'Stairs (2a)',           x:26,   z:380, w:116, d:80,  type:'stair'     },
  { id:'f2_stair_right',   name:'Stairs (2d)',           x:1530, z:380, w:116, d:80,  type:'stair'     },

  // ── South side (rowC–rowD, z:460, d:200) ─────────────────────────────────
  // col1 split 3 ways: Electrical | Janitor | SSC
  { id:'f2_electrical',    name:'Electrical Room',       x:26,   z:460, w:39,  d:200, type:'utility'   },
  { id:'f2_janitor',       name:'Janitorial Room',       x:65,   z:460, w:38,  d:200, type:'utility'   },
  { id:'f2_ssc',           name:'SSC',                   x:103,  z:460, w:39,  d:200, type:'office'    },
  { id:'f2_lobby',         name:'Lobby',                 x:142,  z:460, w:111, d:200, type:'lobby'     },
  { id:'f2_class_s1',      name:'Classroom',             x:253,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s2',      name:'Classroom',             x:364,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s3',      name:'Classroom',             x:475,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_stair_centerb', name:'Stairs (2b)',           x:586,  z:460, w:111, d:200, type:'stair'     },
  { id:'f2_class_s4',      name:'Classroom',             x:697,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s5',      name:'Classroom',             x:808,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s6',      name:'Classroom',             x:919,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_stair_centerc', name:'Stairs (2c)',           x:1030, z:460, w:111, d:200, type:'stair'     },
  { id:'f2_shs_class_s1',  name:'SHS Classroom',         x:1141, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_shs_class_s2',  name:'SHS Classroom',         x:1252, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_shs_class_s3',  name:'SHS Classroom',         x:1363, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_lobby_r',       name:'Lobby',                 x:1474, z:460, w:56,  d:200, type:'lobby'     },
  { id:'f2_class_s7',      name:'Classroom',             x:1530, z:460, w:116, d:200, type:'classroom' },
];

const HALLWAY_F2 = { x: 26, z: 380, w: 1620, d: 80 };

// ── Floor 1 rooms — from buildingData.js ─────────────────────────────────────
const FLOOR1_ROOMS = [
  { id:'f1_cr_male',         name:'Comfort Room (Male)',       x:16,   z:222, w:116, d:161, type:'comfort'   },
  { id:'f1_pipe_chase_l',    name:'Pipe Chase',                x:132,  z:222, w:24,  d:161, type:'utility'   },
  { id:'f1_lobby_n',         name:'Lobby',                     x:156,  z:222, w:88,  d:161, type:'lobby'     },
  { id:'f1_canteen',         name:'Canteen',                   x:244,  z:222, w:445, d:161, type:'facility'  },
  { id:'f1_lobby_c',         name:'Lobby',                     x:689,  z:222, w:163, d:161, type:'lobby'     },
  { id:'f1_shs_principal',   name:"SHS Principal's Office",    x:852,  z:222, w:111, d:161, type:'office'    },
  { id:'f1_shs_faculty',     name:'SHS Faculty Office',        x:963,  z:222, w:111, d:161, type:'office'    },
  { id:'f1_shs_class1',      name:'SHS Classroom',             x:1074, z:222, w:112, d:161, type:'classroom' },
  { id:'f1_shs_class2',      name:'SHS Classroom',             x:1186, z:222, w:111, d:161, type:'classroom' },
  { id:'f1_shs_class3',      name:'SHS Classroom',             x:1297, z:222, w:112, d:161, type:'classroom' },
  { id:'f1_bed_presch_lab',  name:'BED Pre School Laboratory', x:1409, z:222, w:74,  d:161, type:'lab'       },
  { id:'f1_pipe_chase_r1',   name:'Pipe Chase',                x:1483, z:222, w:28,  d:161, type:'utility'   },
  { id:'f1_pipe_chase_r2',   name:'Pipe Chase',                x:1511, z:222, w:28,  d:161, type:'utility'   },
  { id:'f1_cr_female',       name:'Comfort Room (Female)',     x:1539, z:222, w:116, d:161, type:'comfort'   },
  { id:'f1_stair_left',      name:'Stairs (UP / DN)',          x:16,   z:383, w:116, d:96,  type:'stair'     },
  { id:'f1_stair_right',     name:'Stairs (DN)',               x:1539, z:383, w:116, d:96,  type:'stair'     },
  { id:'f1_electrical',      name:'Electrical Room',           x:16,   z:479, w:116, d:161, type:'utility'   },
  { id:'f1_bookstore',       name:'Bookstore',                 x:132,  z:479, w:112, d:161, type:'facility'  },
  { id:'f1_lobby_sw',        name:'Lobby',                     x:244,  z:479, w:111, d:161, type:'lobby'     },
  { id:'f1_finance',         name:'Finance',                   x:355,  z:479, w:112, d:161, type:'office'    },
  { id:'f1_registrar',       name:'Registrar',                 x:467,  z:479, w:111, d:161, type:'office'    },
  { id:'f1_igs_faculty',     name:'IGS Faculty',               x:578,  z:479, w:111, d:161, type:'office'    },
  { id:'f1_discipline',      name:'Discipline Office',         x:689,  z:479, w:82,  d:161, type:'office'    },
  { id:'f1_stair_mid',       name:'Stairs (UP)',               x:771,  z:479, w:81,  d:161, type:'stair'     },
  { id:'f1_lobby_sc',        name:'Lobby',                     x:852,  z:479, w:81,  d:161, type:'lobby'     },
  { id:'f1_shs_class4',      name:'SHS Classroom',             x:933,  z:479, w:95,  d:161, type:'classroom' },
  { id:'f1_stair_center',    name:'Stairs (UP / DN)',          x:1028, z:479, w:95,  d:161, type:'stair'     },
  { id:'f1_shs_class6',      name:'SHS Classroom',             x:1123, z:479, w:96,  d:161, type:'classroom' },
  { id:'f1_shs_class7',      name:'SHS Classroom',             x:1219, z:479, w:95,  d:161, type:'classroom' },
  { id:'f1_shs_class8',      name:'SHS Classroom',             x:1314, z:479, w:95,  d:161, type:'classroom' },
  { id:'f1_birthing_clinic', name:'Birthing Clinic',           x:1409, z:479, w:74,  d:161, type:'facility'  },
  { id:'f1_lobby_se',        name:'Lobby',                     x:1483, z:479, w:56,  d:161, type:'lobby'     },
  { id:'f1_club',            name:'Club',                      x:1539, z:479, w:116, d:161, type:'facility'  },
];

const HALLWAY_F1 = { x: 16, z: 383, w: 1639, d: 96 };

// ── Per-floor center offsets ───────────────────────────────────────────────────
const FLOOR_META = {
  1: { centerX: (16 + 1655) / 2,  centerZ: (222 + 640) / 2  },
  2: { centerX: (26 + 1646) / 2,  centerZ: (160 + 660) / 2  },
};

const SCALE  = 1 / 100;
const WALL_H = 1.6;
const WALL_T = 0.06;
const FLOOR_H = 0.04;

// ── Color palettes — F1 warm, F2 cool-blue ────────────────────────────────────
const PALETTE = {
  1: {
    wall:  { comfort:'#ede8e8', utility:'#dce3e8', lobby:'#f2f0e6', facility:'#e6f0e8', office:'#e8edf5', classroom:'#f5f0e6', lab:'#e6eef5', stair:'#e0e0e0' },
    floor: { comfort:'#d8d0d0', utility:'#c8d2d8', lobby:'#e0dcc8', facility:'#cce0d0', office:'#ccd4e8', classroom:'#e0d8c4', lab:'#c8d8e8', stair:'#c8c8c8' },
    hall:  '#d8dce4', ground: '#e8ebf0',
  },
  2: {
    wall:  { comfort:'#e8eaf5', utility:'#d8e2ec', lobby:'#edf0fa', facility:'#e0edf2', office:'#e0e8f8', classroom:'#e8eeff', lab:'#d8eaf8', stair:'#d8daea' },
    floor: { comfort:'#c8cce0', utility:'#bccad6', lobby:'#d0d6e8', facility:'#c4d4dc', office:'#c4cee0', classroom:'#c8d2ec', lab:'#b4c8e0', stair:'#c0c4d6' },
    hall:  '#c4cade', ground: '#d8dcea',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeTx(centerX) { return (px) => (px - centerX) * SCALE; }
function makeTz(centerZ) { return (pz) => (pz - centerZ) * SCALE; }
const tw = (pw) => pw * SCALE;

// ── Room mesh ─────────────────────────────────────────────────────────────────
function RoomMesh({ room, tx, tz, palette }) {
  const cx = tx(room.x + room.w / 2);
  const cz = tz(room.z + room.d / 2);
  const rw = tw(room.w);
  const rd = tw(room.d);

  const wallCol  = palette.wall[room.type]  ?? '#f0f0f0';
  const floorCol = palette.floor[room.type] ?? '#d0d0d0';
  const wallMat  = useMemo(() => new THREE.MeshLambertMaterial({ color: wallCol }),  [wallCol]);
  const floorMat = useMemo(() => new THREE.MeshLambertMaterial({ color: floorCol }), [floorCol]);

  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, FLOOR_H / 2, 0]} receiveShadow>
        <boxGeometry args={[rw, FLOOR_H, rd]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      <mesh position={[0, FLOOR_H + WALL_H / 2, -rd / 2 + WALL_T / 2]} castShadow receiveShadow>
        <boxGeometry args={[rw, WALL_H, WALL_T]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[0, FLOOR_H + WALL_H / 2, rd / 2 - WALL_T / 2]} castShadow receiveShadow>
        <boxGeometry args={[rw, WALL_H, WALL_T]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[-rw / 2 + WALL_T / 2, FLOOR_H + WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_T, WALL_H, rd]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[rw / 2 - WALL_T / 2, FLOOR_H + WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_T, WALL_H, rd]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {room.type === 'stair' && (
        <mesh position={[0, FLOOR_H + WALL_H + WALL_T / 2, 0]} receiveShadow>
          <boxGeometry args={[rw, WALL_T, rd]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
      )}
    </group>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ floorId }) {
  const rooms   = floorId === 1 ? FLOOR1_ROOMS : FLOOR2_ROOMS;
  const hallway = floorId === 1 ? HALLWAY_F1   : HALLWAY_F2;
  const meta    = FLOOR_META[floorId];
  const palette = PALETTE[floorId];

  const tx = makeTx(meta.centerX);
  const tz = makeTz(meta.centerZ);

  const hallCx = tx(hallway.x + hallway.w / 2);
  const hallCz = tz(hallway.z + hallway.d / 2);
  const hallRw = tw(hallway.w);
  const hallRd = tw(hallway.d);

  const hallMat   = useMemo(() => new THREE.MeshLambertMaterial({ color: palette.hall }),   [palette.hall]);
  const groundMat = useMemo(() => new THREE.MeshLambertMaterial({ color: palette.ground }), [palette.ground]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[-14, 12, 12]} fov={30} near={0.1} far={200} />

      <ambientLight intensity={0.75} color={floorId === 1 ? '#f0f4ff' : '#eef2ff'} />
      <directionalLight
        position={[-12, 20, 10]} intensity={1.4} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={100} shadow-camera-left={-20}
        shadow-camera-right={20} shadow-camera-top={15} shadow-camera-bottom={-15}
        color="#ffffff"
      />
      <directionalLight
        position={[10, 8, -8]} intensity={0.3}
        color={floorId === 1 ? '#c8d8ff' : '#b8c8ff'}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <primitive object={groundMat} attach="material" />
      </mesh>

      {/* Hallway floor */}
      <mesh position={[hallCx, FLOOR_H / 2, hallCz]} receiveShadow>
        <boxGeometry args={[hallRw, FLOOR_H, hallRd]} />
        <primitive object={hallMat} attach="material" />
      </mesh>

      {/* Rooms */}
      {rooms.map((room) => (
        <RoomMesh key={room.id} room={room} tx={tx} tz={tz} palette={palette} />
      ))}

      <OrbitControls
        enablePan enableZoom enableRotate
        minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.1}
        minDistance={4} maxDistance={30} target={[0, 0, 0]}
      />
    </>
  );
}

// ── Floor tab button ──────────────────────────────────────────────────────────
function FloorTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 14px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        border: active ? '1.5px solid #3b82f6' : '1.5px solid transparent',
        background: active ? '#3b82f6' : 'rgba(0,0,0,0.06)',
        color: active ? '#fff' : '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ── Legend item ───────────────────────────────────────────────────────────────
function LegendItem({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FloorPlan3D({ embedded = false }) {
  const [floorId, setFloorId] = useState(1);
  const palette = PALETTE[floorId];

  const containerStyle = embedded
    ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: palette.ground }
    : { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: palette.ground };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.08)',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
            Gordon College
          </p>
          <h1 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0, lineHeight: 1.3 }}>
            {floorId === 1 ? 'First' : 'Second'} Floor — 3D View
          </h1>
        </div>

        {/* Floor tabs */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', marginRight: 2, fontWeight: 600 }}>FLOOR</span>
          <FloorTab label="1F" active={floorId === 1} onClick={() => setFloorId(1)} />
          <FloorTab label="2F" active={floorId === 2} onClick={() => setFloorId(2)} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
          <LegendItem color={palette.wall.classroom} label="Classroom" />
          <LegendItem color={palette.wall.office}    label="Office" />
          <LegendItem color={palette.wall.facility}  label="Facility" />
          <LegendItem color={palette.wall.comfort}   label="Restroom" />
          <LegendItem color={palette.wall.utility}   label="Utility" />
          <LegendItem color={palette.wall.stair}     label="Stairs" />
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Canvas
          key={floorId}
          shadows
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%', background: palette.ground }}
        >
          <Suspense fallback={null}>
            <Scene floorId={floorId} />
          </Suspense>
        </Canvas>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: '#9ca3af', background: 'rgba(255,255,255,0.6)' }}>
        Drag to orbit · Scroll to zoom · Shift+drag to pan
      </div>
    </div>
  );
}

export default FloorPlan3D;