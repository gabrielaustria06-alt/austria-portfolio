// Gordon College — Smart Navigation Data
// Precision vector-map version.
// Coordinate system: this version uses the same 1672×941 SVG pixel space as the
// supplied floor-plan references, but it does NOT render the PNG plans as the map.
// Rooms, stair anchors, halls, and path nodes are manually calibrated against them.

export const BUILDING = {
  width: 1672,
  depth: 941,
  wallHeight: 3.5,
  floorHeight: 5,
  coordinateMode: 'image-pixel',
};

export const ROOM_COLORS = {
  // Architectural palette — soft, distinct category tints with enough
  // saturation to read clearly but gentle enough to stay easy on the eyes.
  office:      '#eef4fb',   // cool blue-white — professional / administrative
  classroom:   '#fef3e2',   // warm amber-cream — learning spaces
  lab:         '#e8f5fe',   // sky blue — science / technology
  facility:    '#f0faf4',   // soft green-mint — shared amenities
  comfort:     '#fef0f2',   // blush rose — restrooms
  stair:       '#f0eff0',   // neutral stone — circulation
  lobby:       '#fefce8',   // warm ivory — entrances / waiting
  corridor:    '#edf2f9',   // slate-blue — passages
  parking:     '#e8eaed',   // cool gray — vehicle areas
  storage:     '#f4f3f0',   // warm gray — storage
  utility:     '#eef3f8',   // blue-gray — mechanical / electrical
  special:     '#f3effe',   // soft violet — special purpose
};

const makeSpineNodes = (floorId, xs, y) => xs.map((x, index) => ({
  id: `f${floorId}_n${String(index).padStart(2, '0')}`,
  floor: floorId,
  x,
  z: y,
}));

// Returns the indices of the two spine nodes that bracket `x` (one on each side).
// If `x` is outside the spine range, returns the two nearest endpoints instead.
// Connecting a door to both bracket nodes means A* can freely choose which
// direction to travel along the spine without forced detours.
const bracketSpineIndices = (spineNodes, x) => {
  // Find the last spine node with x <= door.x (left bracket)
  let leftIdx = -1;
  for (let i = 0; i < spineNodes.length; i++) {
    if (spineNodes[i].x <= x) leftIdx = i;
    else break;
  }

  if (leftIdx === -1) {
    // Door is left of the entire spine — connect to first two nodes
    return [0, Math.min(1, spineNodes.length - 1)];
  }
  if (leftIdx === spineNodes.length - 1) {
    // Door is right of the entire spine — connect to last two nodes
    return [spineNodes.length - 2, spineNodes.length - 1];
  }
  // Normal case: bracket with the node to the left and the node to the right
  return [leftIdx, leftIdx + 1];
};

const makeDoorNode = (room, floorHall) => {
  const cx = room.x + room.w / 2;
  const cy = room.z + room.d / 2;
  const doorY = cy < floorHall.y ? floorHall.y : floorHall.y + floorHall.h;
  return {
    id: `${room.id}_door`,
    floor: room.floor,
    x: cx,
    z: doorY,
    roomId: room.id,
  };
};

const makeFloorGraph = (floorId, rooms, hall, stairX) => {
  const roomCenters = rooms
    .filter(room => room.type !== 'parking')
    .map(room => room.x + room.w / 2);
  const baseXs = [
    stairX.left,
    ...roomCenters,
    stairX.center,
    stairX.right,
  ]
    .filter(x => Number.isFinite(x))
    .sort((a, b) => a - b);

  // Keep a compact route spine while guaranteeing the stair anchors use n00/n06/n14,
  // because the UI uses those suffixes to recognise left/center/right stairs.
  const xs = [
    stairX.left,
    hall.x + hall.w * 0.10,
    hall.x + hall.w * 0.18,
    hall.x + hall.w * 0.28,
    hall.x + hall.w * 0.38,
    hall.x + hall.w * 0.48,
    stairX.center,
    hall.x + hall.w * 0.58,
    hall.x + hall.w * 0.66,
    hall.x + hall.w * 0.74,
    hall.x + hall.w * 0.82,
    hall.x + hall.w * 0.88,
    hall.x + hall.w * 0.92,
    hall.x + hall.w * 0.96,
    stairX.right,
  ].map(v => Math.round(v));

  const spineNodes = makeSpineNodes(floorId, xs, hall.y + hall.h / 2);
  const doorNodes = rooms
    // Exclude parking and stair rooms — parking has no door into the corridor,
    // and stair shafts are already connected via the dedicated STAIRS edges and
    // interior stair nodes (f{N}_sc). Generating door nodes for stairs creates
    // phantom waypoints in the hallway that A* zigzags through.
    .filter(room => room.type !== 'parking' && room.type !== 'stair')
    .map(room => makeDoorNode(room, hall));

  const edges = [];
  for (let i = 0; i < spineNodes.length - 1; i += 1) {
    edges.push([spineNodes[i].id, spineNodes[i + 1].id]);
  }
  doorNodes.forEach(door => {
    const [idxA, idxB] = bracketSpineIndices(spineNodes, door.x);
    // Connect each door to only its nearest spine node so the door is a dead end.
    // Wiring both bracket nodes created a V-shaped shortcut (spineA → door → spineB)
    // that A* would exploit instead of walking straight along the spine.
    const distA = Math.abs(spineNodes[idxA].x - door.x);
    const distB = Math.abs(spineNodes[idxB].x - door.x);
    const nearestIdx = distA <= distB ? idxA : idxB;
    edges.push([spineNodes[nearestIdx].id, door.id]);
  });

  return {
    nodes: [...spineNodes, ...doorNodes],
    edges,
  };
};

// Floor 1 — Gordon College 1st Floor
// Coordinates calibrated from the official Emergency / Evacuation Plan (1:200 MM).
// Column grid (px): col1=16, col2=132, col3=244, col4=355, col5=467, col6=578,
//   col7=689, col8=852, col9=963, col10=1074, col11=1186, col12=1297,
//   col13=1409, col14=1483, col15=1539, col16=1655
// Row grid: rowA=222, rowB=383 (hall top), rowC=479 (hall bottom), rowD=640
const floor1Rooms = [
  // ── North side rooms (rowA–rowB, z:222, d:161) ──────────────────────────
  { id:'f1_cr_male',         name:'Comfort Room (Male)',        floor:1, x:16,   z:222, w:116, d:161, type:'comfort'   },
  { id:'f1_pipe_chase_l',    name:'Pipe Chase',                 floor:1, x:132,  z:222, w:24,  d:161, type:'utility'   },
  { id:'f1_lobby_n',         name:'Lobby',                      floor:1, x:156,  z:222, w:88,  d:161, type:'lobby'     },
  { id:'f1_canteen',         name:'Canteen',                    floor:1, x:244,  z:222, w:445, d:161, type:'facility'  },
  // Expanded to fill gap between end of lobby (was x:772) and SHS Principal (starts x:852)
  { id:'f1_lobby_c',         name:'Lobby',                      floor:1, x:689,  z:222, w:163, d:161, type:'lobby'     },
  { id:'f1_shs_principal',   name:"SHS Principal's Office",     floor:1, x:852,  z:222, w:111, d:161, type:'office'    },
  { id:'f1_shs_faculty',     name:'SHS Faculty Office',         floor:1, x:963,  z:222, w:111, d:161, type:'office'    },
  { id:'f1_shs_class1',      name:'SHS Classroom',              floor:1, x:1074, z:222, w:112, d:161, type:'classroom' },
  { id:'f1_shs_class2',      name:'SHS Classroom',              floor:1, x:1186, z:222, w:111, d:161, type:'classroom' },
  { id:'f1_shs_class3',      name:'SHS Classroom',              floor:1, x:1297, z:222, w:112, d:161, type:'classroom' },
  { id:'f1_bed_presch_lab',  name:'BED Pre School Laboratory',  floor:1, x:1409, z:222, w:74,  d:161, type:'lab'       },
  { id:'f1_pipe_chase_r1',   name:'Pipe Chase',                 floor:1, x:1483, z:222, w:28,  d:161, type:'utility'   },
  { id:'f1_pipe_chase_r2',   name:'Pipe Chase',                 floor:1, x:1511, z:222, w:28,  d:161, type:'utility'   },
  { id:'f1_cr_female',       name:'Comfort Room (Female)',      floor:1, x:1539, z:222, w:116, d:161, type:'comfort'   },
  // ── Hallway stairs — LEFT and RIGHT ends sit IN the corridor strip (z:383, d:96) ──
  { id:'f1_stair_left',      name:'Stairs (UP / DN)',           floor:1, x:16,   z:383, w:116, d:96,  type:'stair'     },
  { id:'f1_stair_right',     name:'Stairs (DN)',                floor:1, x:1539, z:383, w:116, d:96,  type:'stair'     },
  // ── South side rooms (rowC–rowD, z:479, d:161) ──────────────────────────
  { id:'f1_electrical',      name:'Electrical Room',            floor:1, x:16,   z:479, w:116, d:161, type:'utility'   },
  { id:'f1_bookstore',       name:'Bookstore',                  floor:1, x:132,  z:479, w:112, d:161, type:'facility'  },
  { id:'f1_lobby_sw',        name:'Lobby',                      floor:1, x:244,  z:479, w:111, d:161, type:'lobby'     },
  { id:'f1_finance',         name:'Finance',                    floor:1, x:355,  z:479, w:112, d:161, type:'office'    },
  { id:'f1_registrar',       name:'Registrar',                  floor:1, x:467,  z:479, w:111, d:161, type:'office'    },
  { id:'f1_igs_faculty',     name:'IGS Faculty',                floor:1, x:578,  z:479, w:111, d:161, type:'office'    },
  { id:'f1_discipline',      name:'Discipline Office',          floor:1, x:689,  z:479, w:82,  d:161, type:'office'    },
  // Stair shaft between Discipline Office and Lobby, south zone — same row as adjacent rooms
  // SHS classrooms narrowed by ~16px each (equally) to free 81px for this stair
  { id:'f1_stair_mid',       name:'Stairs (UP)',                floor:1, x:771,  z:479, w:81,  d:161, type:'stair'     },
  { id:'f1_lobby_sc',        name:'Lobby',                      floor:1, x:852,  z:479, w:81,  d:161, type:'lobby'     },
  { id:'f1_shs_class4',      name:'SHS Classroom',              floor:1, x:933,  z:479, w:95,  d:161, type:'classroom' },
  // Center stair shaft — shifted right to maintain equal spacing after SHS classroom reduction
  { id:'f1_stair_center',    name:'Stairs (UP / DN)',           floor:1, x:1028, z:479, w:95,  d:161, type:'stair'     },
  { id:'f1_shs_class6',      name:'SHS Classroom',              floor:1, x:1123, z:479, w:96,  d:161, type:'classroom' },
  { id:'f1_shs_class7',      name:'SHS Classroom',              floor:1, x:1219, z:479, w:95,  d:161, type:'classroom' },
  { id:'f1_shs_class8',      name:'SHS Classroom',              floor:1, x:1314, z:479, w:95,  d:161, type:'classroom' },
  { id:'f1_birthing_clinic', name:'Birthing Clinic',            floor:1, x:1409, z:479, w:74,  d:161, type:'facility'  },
  { id:'f1_lobby_se',        name:'Lobby',                      floor:1, x:1483, z:479, w:56,  d:161, type:'lobby'     },
  { id:'f1_club',            name:'Club',                       floor:1, x:1539, z:479, w:116, d:161, type:'facility'  },
  // ── Parking (south exterior) ─────────────────────────────────────────────
  { id:'f1_parking',         name:'Parking',                    floor:1, x:963,  z:644, w:530, d:64,  type:'parking'   },
];

// Hall runs rowB to rowC; stairX aligned to column grid
// Left stairs: col2 (x=132) — UP/DN in hallway near left lobbies
// Center stairs: col10 (x=1040) — UP/DN between rows B–C, south side near SHS classrooms
// Right stairs: col15 (x=1539) — DN in hallway near right lobbies
// stairX.center updated to reflect new stair_center position: x:1028, w:95 → center=1075
const floor1Meta = {"bounds": {"x1": 16, "y1": 222, "x2": 1655, "y2": 640}, "hall": {"x": 16, "y": 383, "w": 1639, "h": 96}, "stairX": {"left": 74, "center": 1075, "right": 1597}};
const floor1Graph = makeFloorGraph(1, floor1Rooms, floor1Meta.hall, floor1Meta.stairX);
// f1_stair_center: x:1028, z:479, w:95, d:161 → interior center: (1075, 559)
const f1sc = { id: 'f1_sc', floor: 1, x: 1075, z: 559 };

// The bracket-connection fix in makeFloorGraph means every door is wired to
// its two neighbouring spine nodes, so left-side detours are no longer possible
// without a dedicated bridge node.
const floor1Nodes = [...floor1Graph.nodes, f1sc];
const floor1Edges = [
  ...floor1Graph.edges,
  ['f1_n06', 'f1_sc'],
];

// Floor 2 — Gordon College 2nd Floor
// Re-calibrated from official 2nd Floor Emergency / Evacuation Plan (1:200 MM).
// Column grid (px) — 16 columns scaled to 1672px canvas (margin 26px, 1620px usable):
//   Bay widths: 9400mm→116px, then 13×9000mm→111px each, 4500mm→56px, 9400mm→116px
//   c = [26,142,253,364,475,586,697,808,919,1030,1141,1252,1363,1474,1530,1646]
// Row grid: rowA=160 (north top), rowB=380 (hall top), rowC=460 (hall bottom), rowD=660
// North (rowA–rowB, d:220): CR-Female-L | Cls×6 | [col8 gap/window] | Cls×2 | SHS×3 | CR-Male | CR-Female-R
// Hall  (rowB–rowC, d:80):  Stair-2a(left) ←——————————————————————————————→ Stair-2d(right)
// South (rowC–rowD, d:200): Elec|Jan|SSC | Lobby | Cls×3 | Stair-2b | Cls×3 | Stair-2c | SHS×3 | Lobby | Cls
// Stairs 2b & 2c each occupy a full bay so NO room overlaps.
const floor2Rooms = [
  // ── North side (rowA–rowB) ─────────────────────────────────────────────
  { id:'f2_cr_female_l',  name:'Comfort Room (Female)', floor:2, x:26,   z:160, w:116, d:220, type:'comfort'   },
  { id:'f2_class_n1',     name:'Classroom',             floor:2, x:142,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n2',     name:'Classroom',             floor:2, x:253,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n3',     name:'Classroom',             floor:2, x:364,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n4',     name:'Classroom',             floor:2, x:475,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n5',     name:'Classroom',             floor:2, x:586,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n6',     name:'Classroom',             floor:2, x:697,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n_gap', name:'Classroom',             floor:2, x:808,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n7',     name:'Classroom',             floor:2, x:919,  z:160, w:111, d:220, type:'classroom' },
  { id:'f2_class_n8',     name:'Classroom',             floor:2, x:1030, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n1', name:'SHS Classroom',         floor:2, x:1141, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n2', name:'SHS Classroom',         floor:2, x:1252, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_shs_class_n3', name:'SHS Classroom',         floor:2, x:1363, z:160, w:111, d:220, type:'classroom' },
  { id:'f2_cr_male_r',    name:'Comfort Room (Male)',   floor:2, x:1474, z:160, w:56,  d:220, type:'comfort'   },
  { id:'f2_cr_female_r',  name:'Comfort Room (Female)', floor:2, x:1530, z:160, w:116, d:220, type:'comfort'   },
  // ── Stair shafts — hallway ends (rowB–rowC) ────────────────────────────
  // Stair 2a: leftmost bay, same column as CR-Female-L
  { id:'f2_stair_left',   name:'Stairs (2a)', floor:2, x:26,   z:380, w:116, d:80, type:'stair' },
  // Stair 2d: rightmost bay, same column as CR-Female-R
  { id:'f2_stair_right',  name:'Stairs (2d)', floor:2, x:1530, z:380, w:116, d:80, type:'stair' },
  // ── South side (rowC–rowD) — stairs occupy full bays, ZERO overlap ─────
  // col1 split 3 ways for narrow utility rooms
  { id:'f2_electrical',     name:'Electrical Room',  floor:2, x:26,   z:460, w:39,  d:200, type:'utility'   },
  { id:'f2_janitor',        name:'Janitorial Room',  floor:2, x:65,   z:460, w:38,  d:200, type:'utility'   },
  { id:'f2_ssc',            name:'SSC',              floor:2, x:103,  z:460, w:39,  d:200, type:'office'    },
  { id:'f2_lobby',          name:'Lobby',            floor:2, x:142,  z:460, w:111, d:200, type:'lobby'     },
  { id:'f2_class_s1',       name:'Classroom',        floor:2, x:253,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s2',       name:'Classroom',        floor:2, x:364,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s3',       name:'Classroom',        floor:2, x:475,  z:460, w:111, d:200, type:'classroom' },
  // Stair 2b — col6 bay (586–697), south side, full bay width
  { id:'f2_stair_centerb',  name:'Stairs (2b)', floor:2, x:586,  z:460, w:111, d:200, type:'stair' },
  { id:'f2_class_s4',       name:'Classroom',        floor:2, x:697,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s5',       name:'Classroom',        floor:2, x:808,  z:460, w:111, d:200, type:'classroom' },
  { id:'f2_class_s6',       name:'Classroom',        floor:2, x:919,  z:460, w:111, d:200, type:'classroom' },
  // Stair 2c — col10 bay (1030–1141), south side, full bay width
  { id:'f2_stair_centerc',  name:'Stairs (2c)', floor:2, x:1030, z:460, w:111, d:200, type:'stair' },
  { id:'f2_shs_class_s1',   name:'SHS Classroom',    floor:2, x:1141, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_shs_class_s2',   name:'SHS Classroom',    floor:2, x:1252, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_shs_class_s3',   name:'SHS Classroom',    floor:2, x:1363, z:460, w:111, d:200, type:'classroom' },
  { id:'f2_lobby_r',        name:'Lobby',            floor:2, x:1474, z:460, w:56,  d:200, type:'lobby'     },
  { id:'f2_class_s7',       name:'Classroom',        floor:2, x:1530, z:460, w:116, d:200, type:'classroom' },
];

// stairX: left=center of stair2a(26+58=84), center=center of stair2b(586+55=641), right=center of stair2d(1530+58=1588)
const floor2Meta = {"bounds": {"x1": 26, "y1": 160, "x2": 1646, "y2": 660}, "hall": {"x": 26, "y": 380, "w": 1620, "h": 80}, "stairX": {"left": 84, "center": 641, "right": 1588}};
const floor2Graph = makeFloorGraph(2, floor2Rooms, floor2Meta.hall, floor2Meta.stairX);
// f2_stair_centerb: x:586, z:460, w:111, d:200 → interior center: (641, 560)
const f2sc = { id: 'f2_sc', floor: 2, x: 641, z: 560 };
const floor2Nodes = [...floor2Graph.nodes, f2sc];
const floor2Edges = [...floor2Graph.edges, ['f2_n06', 'f2_sc']];

// Floor 3 — Gordon College 3rd Floor
// Calibrated from official 3rd Floor Emergency / Evacuation Plan (1:200 MM).
// Column grid (px): col1≈121, col2≈209, col3≈351, col4≈458, col5≈566, col6≈744,
//   col7≈829, stair3b≈829(south), col8≈924, col9≈994, stair3c≈924(south),
//   col10≈1100, col11≈1210, col12≈1318, col13≈1430, col14≈1502, col15≈1538, col16≈1619
// North row (z:312, d:136): Pipe Chase, Pantry, Conf. Room, President, Records,
//   IGS Office, Consultant Research, [open/mailbox], Consultant Admin, Norsultant Admin,
//   Guidance, VP CRS, CEAS, Clinic, VP Admin QA, CBA, Pipe Chase, Discount
// South row (z:508, d:138): Radio Station, MIS, Lobby, ICT Comlab, Personnel, CANS,
//   CIS Computer, VP AC, CBA, Tech Voc, Amphi-Theater, Pipe Chase, Electrical
const floor3Rooms = [
  // ── North side (rowA–rowB) ─────────────────────────────────────────────
  { id:'f3_pipe_chase_l',    name:'Pipe Chase',                        floor:3, x:121,  z:312, w:88,  d:136, type:'utility'   },
  { id:'f3_pantry',          name:'Pantry',                            floor:3, x:209,  z:312, w:142, d:136, type:'facility'  },
  { id:'f3_conf_room',       name:'College Conference Room',           floor:3, x:351,  z:312, w:107, d:136, type:'special'   },
  { id:'f3_president',       name:"College President's Office",        floor:3, x:458,  z:312, w:108, d:136, type:'office'    },
  { id:'f3_records',         name:'Infocom Records Mgt.',              floor:3, x:566,  z:312, w:178, d:136, type:'office'    },
  { id:'f3_igs',             name:'IGS Office',                        floor:3, x:744,  z:312, w:85,  d:136, type:'office'    },
  { id:'f3_consultant_r',    name:'Consultant for Research',           floor:3, x:829,  z:312, w:95,  d:136, type:'office'    },
  { id:'f3_class_n_gap',     name:'Classroom',                         floor:3, x:924,  z:312, w:70,  d:136, type:'classroom' },
  { id:'f3_consultant_a',    name:'Consultant for Admin Services',     floor:3, x:994,  z:312, w:106, d:136, type:'office'    },
  { id:'f3_norsultant',      name:'Norsultant for Admin Services',     floor:3, x:1100, z:312, w:110, d:136, type:'office'    },
  { id:'f3_guidance',        name:'Guidance Office',                   floor:3, x:1210, z:312, w:108, d:136, type:'office'    },
  { id:'f3_vp_crs',          name:'VP CRS',                            floor:3, x:1318, z:312, w:84,  d:136, type:'office'    },
  { id:'f3_ceas',            name:'CEAS',                               floor:3, x:1402, z:312, w:54,  d:136, type:'office'    },
  { id:'f3_clinic',          name:'Clinic',                             floor:3, x:1456, z:312, w:46,  d:136, type:'facility'  },
  { id:'f3_vp_admin_qa',     name:'VP Admin Services / Quality Assurance', floor:3, x:1502, z:312, w:36,  d:136, type:'office' },
  { id:'f3_cba_n',           name:'CBA',                               floor:3, x:1538, z:312, w:36,  d:136, type:'office'    },
  { id:'f3_pipe_chase_r',    name:'Pipe Chase',                        floor:3, x:1574, z:312, w:27,  d:136, type:'utility'   },
  { id:'f3_discount',        name:'Discount',                          floor:3, x:1601, z:312, w:18,  d:136, type:'facility'  },
  // ── Stair shafts — Floor 3, calibrated from 3rd Floor plan ──────────────
  // Stair 3a: left end, spans hallway (rowB–rowC)
  { id:'f3_stair_left',    name:'Stairs (3a)', floor:3, x:121,  z:448, w:88,  d:60,  type:'stair' },
  // Stair 3b: center-left, south side — fills gap between Personnel (ends 674) and CANS (starts 768)
  { id:'f3_stair_centerb', name:'Stairs (3b)', floor:3, x:674,  z:508, w:94,  d:138, type:'stair' },
  // Stair 3c: center-right, south side — col9–10 gap (CIS trimmed to end at 947)
  { id:'f3_stair_centerc', name:'Stairs (3c)', floor:3, x:947,  z:508, w:103, d:138, type:'stair' },
  // Stair 3d: right end, spans hallway (rowB–rowC)
  { id:'f3_stair_right',   name:'Stairs (3d)', floor:3, x:1531, z:448, w:88,  d:60,  type:'stair' },
  // ── South side (rowC–rowD) ─────────────────────────────────────────────
  { id:'f3_radio',           name:'Radio Station',                     floor:3, x:121,  z:508, w:95,  d:138, type:'office'    },
  { id:'f3_mis',             name:'MIS',                               floor:3, x:216,  z:508, w:135, d:138, type:'office'    },
  { id:'f3_lobby',           name:'Lobby',                             floor:3, x:351,  z:508, w:107, d:138, type:'lobby'     },
  { id:'f3_ict_comlab',      name:'ICT Comlab Office',                 floor:3, x:458,  z:508, w:107, d:138, type:'lab'       },
  { id:'f3_personnel',       name:'Personnel',                         floor:3, x:565,  z:508, w:109, d:138, type:'office'    },
  { id:'f3_cans',            name:'CANS',                              floor:3, x:768,  z:508, w:95,  d:138, type:'office'    },
  { id:'f3_cis',             name:'CIS Computer Studies',              floor:3, x:863,  z:508, w:84,  d:138, type:'lab'       },
  { id:'f3_vp_ac',           name:'VP AC',                             floor:3, x:1050, z:508, w:94,  d:138, type:'office'    },
  { id:'f3_cba',             name:'CBA',                               floor:3, x:1144, z:508, w:72,  d:138, type:'office'    },
  { id:'f3_techvoc',         name:'Tech Voc. Office',                  floor:3, x:1216, z:508, w:110, d:138, type:'office'    },
  { id:'f3_ampli',           name:'Amphi-Theater',                     floor:3, x:1326, z:508, w:140, d:138, type:'special'   },
  { id:'f3_pipe_chase_s',    name:'Pipe Chase',                        floor:3, x:1466, z:508, w:65,  d:138, type:'utility'   },
  { id:'f3_electrical',      name:'Electrical Room',                   floor:3, x:1531, z:508, w:88,  d:138, type:'utility'   },
];

const floor3Meta = {"bounds": {"x1": 121, "y1": 312, "x2": 1619, "y2": 646}, "hall": {"x": 121, "y": 448, "w": 1498, "h": 60}, "stairX": {"left": 165, "center": 721, "right": 1575}};
// stairX: left=3a center(121+44=165), center=3b center(674+47=721), right=3d center(1531+44=1575)
const floor3Graph = makeFloorGraph(3, floor3Rooms, floor3Meta.hall, floor3Meta.stairX);
// f3_stair_centerb: x:674, z:508, w:94, d:138 → interior center: (721, 577)
const f3sc = { id: 'f3_sc', floor: 3, x: 721, z: 577 };
const floor3Nodes = [...floor3Graph.nodes, f3sc];
const floor3Edges = [...floor3Graph.edges, ['f3_n06', 'f3_sc']];

// Floor 4 — Gordon College 4th Floor
// Calibrated from official 4th Floor Emergency / Evacuation Plan (1:200 MM).
// North (z:246, d:148): Supplies, Classrooms x4, [stair 4a gap], Classrooms x2, Library (3 bays), CR Male, CR Female
// South (z:487, d:163): Supplies, Janitorial, Classrooms x3, Stair 4b, Classrooms x3, Stair 4c, Classrooms x2, Chapel
const floor4Rooms = [
  // ── North side ────────────────────────────────────────────────────────
  { id:'f4_supplies_n',  name:'Supplies Office',        floor:4, x:109,  z:246, w:78,  d:148, type:'office'    },
  { id:'f4_class_n1',   name:'Classroom',               floor:4, x:187,  z:246, w:111, d:148, type:'classroom' },
  { id:'f4_class_n2',   name:'Classroom',               floor:4, x:298,  z:246, w:109, d:148, type:'classroom' },
  { id:'f4_class_n3',   name:'Classroom',               floor:4, x:407,  z:246, w:107, d:148, type:'classroom' },
  { id:'f4_class_n4',   name:'Classroom',               floor:4, x:514,  z:246, w:111, d:148, type:'classroom' },
  { id:'f4_class_n4b',  name:'Classroom',               floor:4, x:625,  z:246, w:109, d:148, type:'classroom' },
  { id:'f4_class_n5',   name:'Classroom',               floor:4, x:734,  z:246, w:107, d:148, type:'classroom' },
  { id:'f4_class_n6',   name:'Classroom',               floor:4, x:841,  z:246, w:107, d:148, type:'classroom' },
  { id:'f4_library',    name:'Library',                 floor:4, x:948,  z:246, w:321, d:148, type:'special'   },
  { id:'f4_class_n7',   name:'Classroom',               floor:4, x:1269, z:246, w:107, d:148, type:'classroom' },
  { id:'f4_cr_male',    name:'Comfort Room (Male)',     floor:4, x:1376, z:246, w:75,  d:148, type:'comfort'   },
  { id:'f4_pipe_chase_n',name:'Pipe Chase',            floor:4, x:1451, z:246, w:58,  d:148, type:'utility'   },
  { id:'f4_cr_female',  name:'Comfort Room (Female)',   floor:4, x:1509, z:246, w:109, d:148, type:'comfort'   },
  // ── Stair shafts — Floor 4, calibrated from 4th Floor plan ──────────────
  // Stair 4a: left end, spans hallway (rowB–rowC)
  { id:'f4_stair_left',    name:'Stairs (4a)', floor:4, x:109,  z:394, w:78,  d:93,  type:'stair' },
  // Stair 4b: center-left, south side — fills gap between class_s3 (ends 625) and class_s4 (starts 734)
  { id:'f4_stair_centerb', name:'Stairs (4b)', floor:4, x:625,  z:487, w:109, d:163, type:'stair' },
  // Stair 4c: center-right, south side — col9 position (x:948), correct per sketch
  { id:'f4_stair_centerc', name:'Stairs (4c)', floor:4, x:948,  z:487, w:107, d:163, type:'stair' },
  // Stair 4d: right end, spans hallway (rowB–rowC) — flush to right boundary at x:1502 (1618-116=1502)
  { id:'f4_stair_right',   name:'Stairs (4d)', floor:4, x:1502, z:394, w:116, d:80,  type:'stair' },
  // ── South side ────────────────────────────────────────────────────────
  { id:'f4_supplies_s', name:'Supplies Office',         floor:4, x:109,  z:487, w:78,  d:163, type:'office'    },
  { id:'f4_janitorial', name:'Janitorial Room',         floor:4, x:187,  z:487, w:111, d:163, type:'utility'   },
  { id:'f4_class_s1',   name:'Classroom',               floor:4, x:298,  z:487, w:109, d:163, type:'classroom' },
  { id:'f4_class_s2',   name:'Classroom',               floor:4, x:407,  z:487, w:107, d:163, type:'classroom' },
  { id:'f4_class_s3',   name:'Classroom',               floor:4, x:514,  z:487, w:111, d:163, type:'classroom' },
  // gap col6–7 filled by stair_4b above
  { id:'f4_class_s4',   name:'Classroom',               floor:4, x:734,  z:487, w:107, d:163, type:'classroom' },
  { id:'f4_class_s5',   name:'Classroom',               floor:4, x:841,  z:487, w:107, d:163, type:'classroom' },
  // gap col9–10 filled by stair_4c above
  { id:'f4_class_s6',   name:'Classroom',               floor:4, x:1055, z:487, w:107, d:163, type:'classroom' },
  { id:'f4_class_s7',   name:'Classroom',               floor:4, x:1162, z:487, w:107, d:163, type:'classroom' },
  { id:'f4_class_s8',   name:'Classroom',               floor:4, x:1269, z:487, w:107, d:163, type:'classroom' },
  { id:'f4_pipe_chase_s',name:'Pipe Chase',             floor:4, x:1376, z:487, w:55,  d:163, type:'utility'   },
  { id:'f4_chapel',     name:'Chapel',                  floor:4, x:1431, z:487, w:187, d:163, type:'special'   },
];

const floor4Meta = {"bounds": {"x1": 109, "y1": 246, "x2": 1618, "y2": 650}, "hall": {"x": 109, "y": 394, "w": 1509, "h": 93}, "stairX": {"left": 148, "center": 679, "right": 1563}};
// stairX: left=4a center(109+39=148), center=4b center(625+54=679), right=4d center(1509+54=1563)
const floor4Graph = makeFloorGraph(4, floor4Rooms, floor4Meta.hall, floor4Meta.stairX);
// f4_stair_centerb: x:625, z:487, w:109, d:163 → interior center: (679, 568)
const f4sc = { id: 'f4_sc', floor: 4, x: 679, z: 568 };
const floor4Nodes = [...floor4Graph.nodes, f4sc];
const floor4Edges = [...floor4Graph.edges, ['f4_n06', 'f4_sc']];

// Floor 5 — Gordon College 5th Floor
// Calibrated from official 5th Floor Emergency / Evacuation Plan (1:200 MM).
// North (z:331, d:130): Stair5a, PASER, Media Center, Speech Lab, CBA Simulation,
//   Stair5b, ABCOM Sound Lab, Computer Labs x4, Fore Front, Stair5d, Stock Room PASEI
// South (z:517, d:133): Electrical & Supplies, Janitorial, Classrooms x4,
//   Stair5b, Electronics Lab, Game Dev Lab, Digital Drawing, Multi-Media, PE Hall,
//   PE Coordinator, Stair5c, Electrical Room
const floor5Rooms = [
  // ── North side ───────────────────────────────────────────────────────
  // Stair 5a occupies col1 hallway end (x:84–160). North rooms start col2.
  { id:'f5_class_n_gap',  name:'Classroom',                             floor:5, x:84,   z:331, w:111, d:130, type:'classroom' },
  { id:'f5_paser',        name:'PASER N000 Training Room',              floor:5, x:195,  z:331, w:212, d:130, type:'lab'     },
  { id:'f5_media',        name:'Media Center',                          floor:5, x:407,  z:331, w:106, d:130, type:'lab'     },
  { id:'f5_speech',       name:'Speech Lab',                            floor:5, x:513,  z:331, w:106, d:130, type:'lab'     },
  // col6 area: external window gap (no room), stair 5b shaft below in south
  { id:'f5_cba_sim',      name:'CBA Simulation',                        floor:5, x:619,  z:331, w:106, d:130, type:'lab'     },
  { id:'f5_abcom',        name:'ABCOM Sound Production & Recording Lab',floor:5, x:725,  z:331, w:212, d:130, type:'lab'     },
  { id:'f5_comp_lab1',    name:'Computer Lab',                          floor:5, x:937,  z:331, w:106, d:130, type:'lab'     },
  { id:'f5_comp_lab2',    name:'Computer Lab',                          floor:5, x:1043, z:331, w:106, d:130, type:'lab'     },
  { id:'f5_comp_lab3',    name:'Computer Lab',                          floor:5, x:1149, z:331, w:106, d:130, type:'lab'     },
  { id:'f5_comp_lab4',    name:'Computer Lab',                          floor:5, x:1255, z:331, w:106, d:130, type:'lab'     },
  { id:'f5_fore_front',   name:'Fore Front',                            floor:5, x:1361, z:331, w:106, d:130, type:'office'  },
  { id:'f5_front',        name:'Front',                                 floor:5, x:1467, z:331, w:53,  d:130, type:'office'  },
  { id:'f5_stock_room',   name:'Stock Room PASEI',                      floor:5, x:1520, z:331, w:111, d:130, type:'storage' },
  // ── Stair shafts — Floor 5, calibrated from 5th Floor plan ──────────────
  // Stair 5a: left end, spans hallway zone
  { id:'f5_stair_left',    name:'Stairs (5a)', floor:5, x:84,   z:461, w:76,  d:56,  type:'stair' },
  // Stair 5b: col6–7, south side — after 4 classrooms, before Electronics Lab
  { id:'f5_stair_centerb', name:'Stairs (5b)', floor:5, x:619,  z:517, w:106, d:133, type:'stair' },
  // Stair 5c: col9–10, south side — after Game Dev Lab, before Digital Drawing
  { id:'f5_stair_centerc', name:'Stairs (5c)', floor:5, x:937,  z:517, w:106, d:133, type:'stair' },
  // Stair 5d: right end, spans hallway zone — flush to right boundary (1631-70=1561)
  { id:'f5_stair_right',   name:'Stairs (5d)', floor:5, x:1561, z:461, w:70,  d:56,  type:'stair' },
  // ── South side ───────────────────────────────────────────────────────
  { id:'f5_electrical',   name:'Electrical Room & Supplies',            floor:5, x:84,   z:517, w:111, d:133, type:'utility' },
  { id:'f5_janitorial',   name:'Janitorial Room',                       floor:5, x:195,  z:517, w:106, d:133, type:'utility' },
  { id:'f5_class_s1',     name:'Classroom',                             floor:5, x:301,  z:517, w:106, d:133, type:'classroom'},
  { id:'f5_class_s2',     name:'Classroom',                             floor:5, x:407,  z:517, w:106, d:133, type:'classroom'},
  { id:'f5_class_s3',     name:'Classroom',                             floor:5, x:513,  z:517, w:106, d:133, type:'classroom'},
  // gap col6–7 filled by stair_5b above (x:619–725)
  { id:'f5_electronics',  name:'Electronics Lab',                       floor:5, x:725,  z:517, w:106, d:133, type:'lab'     },
  { id:'f5_game_dev',     name:'Game Development Lab',                  floor:5, x:831,  z:517, w:106, d:133, type:'lab'     },
  // gap col9–10 filled by stair_5c above (x:937–1043)
  { id:'f5_digital',      name:'Digital Drawing and Drafting',          floor:5, x:1043, z:517, w:106, d:133, type:'lab'     },
  { id:'f5_multimedia',   name:'Multi-Media Lab',                       floor:5, x:1149, z:517, w:106, d:133, type:'lab'     },
  { id:'f5_pe_hall',      name:'PE Hall',                               floor:5, x:1255, z:517, w:106, d:133, type:'facility'},
  { id:'f5_pe_coord',     name:'PE Coordinator',                        floor:5, x:1361, z:517, w:106, d:133, type:'office'  },
  { id:'f5_class_s4',     name:'Classroom',                             floor:5, x:1467, z:517, w:77,  d:133, type:'classroom' },
  { id:'f5_electrical2',  name:'Electrical Room',                       floor:5, x:1544, z:517, w:87,  d:133, type:'utility' },
];

const floor5Meta = {"bounds": {"x1": 84, "y1": 331, "x2": 1631, "y2": 650}, "hall": {"x": 84, "y": 461, "w": 1547, "h": 56}, "stairX": {"left": 122, "center": 672, "right": 1596}};
// stairX: left=5a center(84+38=122), center=5b center(619+53=672), right=5d center(1561+35=1596)
const floor5Graph = makeFloorGraph(5, floor5Rooms, floor5Meta.hall, floor5Meta.stairX);
// f5_stair_centerb: x:619, z:517, w:106, d:133 → interior center: (672, 583)
const f5sc = { id: 'f5_sc', floor: 5, x: 672, z: 583 };
const floor5Nodes = [...floor5Graph.nodes, f5sc];
const floor5Edges = [...floor5Graph.edges, ['f5_n06', 'f5_sc']];

// Floor 6 — Gordon College 6th Floor
// Fully re-calibrated from official 6th Floor Emergency / Evacuation Plan (1:200 MM).
// Column grid (px, 16 cols, total canvas 1672px):
//   col1=118, col2=234, col3=345, col4=456, col5=567, col6=678, col7=789,
//   col8=900 (chem/glass ~half-bays at 900 & 956), col9=1011, col10=1097,
//   col11=1208, col12=1319, col13=1430, col14=1486, col15=1542, col16=1598
// Row grid: rowA=240 (north top), rowB=465 (hall top), rowC=533 (hall bottom), rowD=700
// North (rowA–rowB, d:225):
//   Stair6a(left) | Stock Rm Nursing | CESO/NSTP | CESO/NSTP | Infirmary Rm |
//   BSM | Demo Rm | Chem Storage | Glassware Storage | Alumni |
//   Mini Hotel FO | Mini Hotel (2 bays) | Cold Kitchen | Baking |
//   Hot Kitchen | CR Male | Pipe Chase | Comfort Complex (Female) | Stair6d(right)
// Hall (rowB–rowC, d:68): ← hallway →
// South (rowC–rowD, d:167):
//   Elec Rm | Classroom | Nursing Skills Lab | Stair6b |
//   Deom Riti Bab | Bio-Lab | Ana-Physio Lab | Physics Lab |
//   Stair6c | Lecture | Classroom | Dining | Pipe Chase | Elec Rm/Dressing Rm
const floor6Rooms = [
  // ── North side rooms (rowA–rowB, z:240, d:225) ──────────────────────────
  // col1 zone: Pipe Chase (upper half shares space with Stair6a hallway end)
  { id:'f6_pipe_chase_ln',  name:'Pipe Chase',                   floor:6, x:118,  z:240, w:116, d:112, type:'utility'   },
  // col2 onward: north rooms
  { id:'f6_stock_nursing',  name:'Stock Room Nursing',           floor:6, x:234,  z:240, w:111, d:225, type:'storage'   },
  { id:'f6_ceso_1',         name:'CESO / NSTP',                  floor:6, x:345,  z:240, w:111, d:225, type:'office'    },
  { id:'f6_ceso_2',         name:'CESO / NSTP',                  floor:6, x:456,  z:240, w:111, d:225, type:'office'    },
  { id:'f6_infirmary',      name:'Infirmary Room',               floor:6, x:567,  z:240, w:111, d:225, type:'facility'  },
  { id:'f6_bsm',            name:'BSM',                          floor:6, x:678,  z:240, w:111, d:225, type:'office'    },
  { id:'f6_demo_room',      name:'Demo Room',                    floor:6, x:789,  z:240, w:111, d:225, type:'lab'       },
  // col8 split: Chemical Storage + Glassware Storage (each ~half-bay)
  { id:'f6_chem_storage',   name:'Chemical Storage',             floor:6, x:900,  z:240, w:56,  d:225, type:'storage'   },
  { id:'f6_glassware',      name:'Glassware Storage',            floor:6, x:956,  z:240, w:55,  d:225, type:'storage'   },
  { id:'f6_alumni',         name:'Alumni',                       floor:6, x:1011, z:240, w:86,  d:225, type:'special'   },
  { id:'f6_mini_hotel_fo',  name:'Mini Hotel Front Office',      floor:6, x:1097, z:240, w:111, d:225, type:'office'    },
  // Mini Hotel: 2 full bays wide (col11–col12, 222px)
  { id:'f6_mini_hotel',     name:'Mini Hotel',                   floor:6, x:1208, z:240, w:111, d:225, type:'special'   },
  // North-right corner: top row = kitchens (z:240–352), bottom row = comfort rooms (z:352–465)
  // Col13 (x:1319): Cold Kitchen (top) | CR Male (bottom)
  // Col14 (x:1430): Baking (top) | Pipe Chase (bottom, narrow)
  // Col15-16 (x:1486-1597): Hot Kitchen (top) | Comfort Complex Female (bottom)
  { id:'f6_cold_kitchen',   name:'Cold Kitchen',                 floor:6, x:1319, z:240, w:111, d:225, type:'facility'  },
  { id:'f6_baking',         name:'Baking',                       floor:6, x:1430, z:240, w:56,  d:225, type:'facility'  },
  { id:'f6_hot_kitchen',    name:'Hot Kitchen',                  floor:6, x:1486, z:240, w:111, d:225, type:'facility'  },

  { id:'f6_cr_male',        name:'Comfort Room (Male)',          floor:6, x:1597, z:240, w:58,  d:225, type:'comfort'   },
  // ── Stair shafts ─────────────────────────────────────────────────────────
  // Stair 6a: left end, occupies hallway zone (to Ground Floor via Exit 1 & 5)
  { id:'f6_stair_left',     name:'Stairs (6a)',  floor:6, x:118,  z:465, w:116, d:68,  type:'stair' },
  // Stair 6b: center-left, south side (col4-5 zone, between Nursing Skills Lab & Deom Riti Bab)
  { id:'f6_stair_centerb',  name:'Stairs (6b)',  floor:6, x:456,  z:533, w:111, d:167, type:'stair' },
  // Stair 6c: center-right, south side (col10 zone x:1011, between Physics Lab and Lecture)
  { id:'f6_stair_centerc',  name:'Stairs (6c)',  floor:6, x:1011, z:533, w:111, d:167, type:'stair' },
  // Stair 6d: right end, occupies hallway zone (far right, to Ground Floor)
  { id:'f6_stair_right',    name:'Stairs (6d)',  floor:6, x:1597, z:465, w:58,  d:68,  type:'stair' },

  // ── South side rooms (rowC–rowD, z:533, d:167) ───────────────────────────
  { id:'f6_electrical_s',   name:'Electrical Room',              floor:6, x:118,  z:533, w:116, d:167, type:'utility'   },
  { id:'f6_class_s1',       name:'Classroom',                    floor:6, x:234,  z:533, w:111, d:167, type:'classroom' },
  { id:'f6_nursing_skills', name:'Nursing Skills Lab',           floor:6, x:345,  z:533, w:111, d:167, type:'lab'       },
  // gap col4 (x:456–567) filled by stair_6b above
  { id:'f6_deom_riti',      name:'Deom Riti Bab',               floor:6, x:567,  z:533, w:111, d:167, type:'lab'       },
  { id:'f6_bio_lab',        name:'Bio-Lab',                      floor:6, x:678,  z:533, w:111, d:167, type:'lab'       },
  { id:'f6_ana_physio',     name:'Ana-Physio Lab',               floor:6, x:789,  z:533, w:111, d:167, type:'lab'       },
  { id:'f6_physics',        name:'Physics Lab',                  floor:6, x:900,  z:533, w:111, d:167, type:'lab'       },
  // gap col10 (x:1011–1122) filled by stair_6c above (Physics Lab ends at 1011)
  { id:'f6_lecture',        name:'Lecture',                      floor:6, x:1122, z:533, w:86,  d:167, type:'classroom' },
  { id:'f6_class_s_gap',    name:'Classroom',                    floor:6, x:1208, z:533, w:111, d:167, type:'classroom' },
  { id:'f6_class_s2',       name:'Classroom',                    floor:6, x:1319, z:533, w:111, d:167, type:'classroom' },
  { id:'f6_dining',         name:'Dining',                       floor:6, x:1430, z:533, w:56,  d:167, type:'facility'  },
  { id:'f6_pipe_chase_s',   name:'Pipe Chase',                   floor:6, x:1486, z:533, w:56,  d:167, type:'utility'   },
  { id:'f6_electrical_dr',  name:'Electrical Room / Dressing Rm',floor:6, x:1542, z:533, w:113, d:167, type:'utility'   },
];

// stairX: left=6a center(118+58=176), center=6b center(456+55=511), right=6d center(1597+29=1626)
const floor6Meta = {
  "bounds": {"x1": 118, "y1": 240, "x2": 1655, "y2": 700},
  "hall":   {"x": 118, "y": 465, "w": 1537, "h": 68},
  "stairX": {"left": 176, "center": 511, "right": 1626},
};
const floor6Graph = makeFloorGraph(6, floor6Rooms, floor6Meta.hall, floor6Meta.stairX);
// f6_stair_centerb: x:456, z:533, w:111, d:167 → interior center: (511, 616)
const f6sc = { id: 'f6_sc', floor: 6, x: 511, z: 616 };
const floor6Nodes = [...floor6Graph.nodes, f6sc];
const floor6Edges = [...floor6Graph.edges, ['f6_n06', 'f6_sc']];

export const STAIRS = [
  { id:'stair_left_1_2', fromFloor:1, toFloor:2, nodeFrom:'f1_n00', nodeTo:'f2_n00', x:0, z:0, label:'Left Stairs' },
  { id:'stair_left_2_3', fromFloor:2, toFloor:3, nodeFrom:'f2_n00', nodeTo:'f3_n00', x:0, z:0, label:'Left Stairs' },
  { id:'stair_left_3_4', fromFloor:3, toFloor:4, nodeFrom:'f3_n00', nodeTo:'f4_n00', x:0, z:0, label:'Left Stairs' },
  { id:'stair_left_4_5', fromFloor:4, toFloor:5, nodeFrom:'f4_n00', nodeTo:'f5_n00', x:0, z:0, label:'Left Stairs' },
  { id:'stair_left_5_6', fromFloor:5, toFloor:6, nodeFrom:'f5_n00', nodeTo:'f6_n00', x:0, z:0, label:'Left Stairs' },
  // Center stair transitions now use interior stair nodes (f{N}_sc) that sit inside the
  // stair block itself, not the hallway spine node. This ensures the stair animation and
  // floor-change marker render inside the visible stair block rather than in the corridor.
  { id:'stair_center_1_2', fromFloor:1, toFloor:2, nodeFrom:'f1_sc', nodeTo:'f2_sc', x:0, z:0, label:'Center Stairs' },
  { id:'stair_center_2_3', fromFloor:2, toFloor:3, nodeFrom:'f2_sc', nodeTo:'f3_sc', x:0, z:0, label:'Center Stairs' },
  { id:'stair_center_3_4', fromFloor:3, toFloor:4, nodeFrom:'f3_sc', nodeTo:'f4_sc', x:0, z:0, label:'Center Stairs' },
  { id:'stair_center_4_5', fromFloor:4, toFloor:5, nodeFrom:'f4_sc', nodeTo:'f5_sc', x:0, z:0, label:'Center Stairs' },
  { id:'stair_center_5_6', fromFloor:5, toFloor:6, nodeFrom:'f5_sc', nodeTo:'f6_sc', x:0, z:0, label:'Center Stairs' },
  { id:'stair_right_1_2', fromFloor:1, toFloor:2, nodeFrom:'f1_n14', nodeTo:'f2_n14', x:0, z:0, label:'Right Stairs' },
  { id:'stair_right_2_3', fromFloor:2, toFloor:3, nodeFrom:'f2_n14', nodeTo:'f3_n14', x:0, z:0, label:'Right Stairs' },
  { id:'stair_right_3_4', fromFloor:3, toFloor:4, nodeFrom:'f3_n14', nodeTo:'f4_n14', x:0, z:0, label:'Right Stairs' },
  { id:'stair_right_4_5', fromFloor:4, toFloor:5, nodeFrom:'f4_n14', nodeTo:'f5_n14', x:0, z:0, label:'Right Stairs' },
  { id:'stair_right_5_6', fromFloor:5, toFloor:6, nodeFrom:'f5_n14', nodeTo:'f6_n14', x:0, z:0, label:'Right Stairs' },
];

export const FLOORS = [
  { id:1, label:'1st Floor', bounds:{"x1": 16, "y1": 222, "x2": 1655, "y2": 640}, hall:{"x": 16, "y": 383, "w": 1639, "h": 96}, stairX:{"left": 74, "center": 1018, "right": 1597}, rooms:floor1Rooms, nodes:floor1Nodes, edges:floor1Edges },
  { id:2, label:'2nd Floor', bounds:{"x1": 26, "y1": 160, "x2": 1646, "y2": 660}, hall:{"x": 26, "y": 380, "w": 1620, "h": 80}, stairX:{"left": 84, "center": 641, "right": 1588}, rooms:floor2Rooms, nodes:floor2Nodes, edges:floor2Edges },
  { id:3, label:'3rd Floor', bounds:{"x1": 121, "y1": 312, "x2": 1619, "y2": 646}, hall:{"x": 121, "y": 448, "w": 1498, "h": 60}, stairX:{"left": 165, "center": 721, "right": 1575}, rooms:floor3Rooms, nodes:floor3Nodes, edges:floor3Edges },
  { id:4, label:"4th Floor", bounds:{"x1": 109, "y1": 246, "x2": 1618, "y2": 650}, hall:{"x": 109, "y": 394, "w": 1509, "h": 93}, stairX:{"left": 148, "center": 679, "right": 1563}, rooms:floor4Rooms, nodes:floor4Nodes, edges:floor4Edges },
  { id:5, label:"5th Floor", bounds:{"x1": 84, "y1": 331, "x2": 1631, "y2": 650}, hall:{"x": 84, "y": 461, "w": 1547, "h": 56}, stairX:{"left": 122, "center": 672, "right": 1596}, rooms:floor5Rooms, nodes:floor5Nodes, edges:floor5Edges },
  { id:6, label:'6th Floor', bounds:{"x1": 118, "y1": 240, "x2": 1655, "y2": 700}, hall:{"x": 118, "y": 465, "w": 1537, "h": 68}, stairX:{"left": 176, "center": 511, "right": 1626}, rooms:floor6Rooms, nodes:floor6Nodes, edges:floor6Edges },
];

export const ALL_ROOMS = FLOORS.flatMap(f => f.rooms);
export const ALL_NODES = FLOORS.flatMap(f => f.nodes);
export const ALL_EDGES = [
  ...FLOORS.flatMap(f => f.edges),
  ...STAIRS.map(s => [s.nodeFrom, s.nodeTo]),
];

export const KIOSK_POSITIONS = {
  1: 'f1_lobby_sc_door',
  2: 'f2_n03',
  3: 'f3_n03',
  4: 'f4_n03',
  5: 'f5_n03',
  6: 'f6_n03',
};