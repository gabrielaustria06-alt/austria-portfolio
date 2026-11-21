// Gordon College — Smart Navigation Data
// Coordinate system: X = left→right (0–140), Z = top→bottom (0–20)
// Each floor shares the same building footprint
// Rooms: { id, name, floor, x, z, w, d, type, color }
// Nodes: { id, floor, x, z } — walkable corridor points
// Edges: [[nodeId, nodeId], ...] — connections between nodes
// Stairs: { id, floor, x, z, connects: [stairId on other floor] }

export const BUILDING = {
  width: 140,   // total building width (units)
  depth: 20,    // total building depth (units)
  wallHeight: 3.5,
  floorHeight: 5, // vertical gap between floors in 3D
};

// Room type → color mapping
export const ROOM_COLORS = {
  office:      '#1e78ff',
  classroom:   '#f5a623',
  lab:         '#00c9a7',
  facility:    '#7b61ff',
  comfort:     '#ff6b6b',
  stair:       '#888888',
  lobby:       '#ffd700',
  corridor:    '#2a3a2a',
  parking:     '#444444',
  storage:     '#8B7355',
  utility:     '#666666',
  special:     '#ff9f43',
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 1
// ─────────────────────────────────────────────────────────────────────────────
const floor1Rooms = [
  // North row (z: 0–8.5)
  { id: 'f1_cr_male',        name: 'Comfort Room (Male)',        floor:1, x:0,    z:0,  w:6,   d:8.5, type:'comfort' },
  { id: 'f1_cr_female',      name: 'Comfort Room (Female)',      floor:1, x:6,    z:0,  w:6,   d:8.5, type:'comfort' },
  { id: 'f1_lobby_n',        name: 'Lobby',                      floor:1, x:12,   z:0,  w:10,  d:8.5, type:'lobby' },
  { id: 'f1_canteen',        name: 'Canteen',                    floor:1, x:22,   z:0,  w:18,  d:8.5, type:'facility' },
  { id: 'f1_lobby_c',        name: 'Lobby',                      floor:1, x:40,   z:0,  w:9,   d:8.5, type:'lobby' },
  { id: 'f1_shs_principal',  name: "SHS Principal's Office",     floor:1, x:49,   z:0,  w:9,   d:8.5, type:'office' },
  { id: 'f1_shs_faculty',    name: 'SHS Faculty Office',         floor:1, x:58,   z:0,  w:9,   d:8.5, type:'office' },
  { id: 'f1_shs_class1',     name: 'SHS Classroom',              floor:1, x:67,   z:0,  w:9,   d:8.5, type:'classroom' },
  { id: 'f1_shs_class2',     name: 'SHS Classroom',              floor:1, x:76,   z:0,  w:9,   d:8.5, type:'classroom' },
  { id: 'f1_shs_class3',     name: 'SHS Classroom',              floor:1, x:85,   z:0,  w:9,   d:8.5, type:'classroom' },
  { id: 'f1_bed_spec',       name: 'BED Spec School Laboratory', floor:1, x:94,   z:0,  w:9,   d:8.5, type:'lab' },
  { id: 'f1_cr_male2',       name: 'Comfort Room (Male)',        floor:1, x:130,  z:0,  w:8,   d:8.5, type:'comfort' },
  // South row (z: 11.5–20)
  { id: 'f1_electrical',     name: 'Electrical Room',            floor:1, x:0,    z:11.5, w:6,  d:8.5, type:'utility' },
  { id: 'f1_bookstore',      name: 'Bookstore',                  floor:1, x:6,    z:11.5, w:12, d:8.5, type:'facility' },
  { id: 'f1_finance',        name: 'Finance',                    floor:1, x:18,   z:11.5, w:12, d:8.5, type:'office' },
  { id: 'f1_registrar',      name: 'Registrar',                  floor:1, x:30,   z:11.5, w:12, d:8.5, type:'office' },
  { id: 'f1_igs_faculty',    name: 'IGS Faculty',                floor:1, x:42,   z:11.5, w:10, d:8.5, type:'office' },
  { id: 'f1_discipline',     name: 'Discipline Office',          floor:1, x:52,   z:11.5, w:10, d:8.5, type:'office' },
  { id: 'f1_shs_class4',     name: 'SHS Classroom',              floor:1, x:67,   z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f1_shs_class5',     name: 'SHS Classroom',              floor:1, x:76,   z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f1_shs_class6',     name: 'SHS Classroom',              floor:1, x:85,   z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f1_birthing',       name: 'Birthing Clinic',            floor:1, x:94,   z:11.5, w:11, d:8.5, type:'facility' },
  { id: 'f1_club',           name: 'Club',                       floor:1, x:115,  z:11.5, w:13, d:8.5, type:'facility' },
];

// Floor 1 corridor nodes (hallway spine + room door nodes)
const floor1Nodes = [
  // Main hallway spine (z=10, x varies)
  { id: 'f1_n00', floor:1, x:3,   z:10 }, // left stair area
  { id: 'f1_n01', floor:1, x:9,   z:10 },
  { id: 'f1_n02', floor:1, x:18,  z:10 },
  { id: 'f1_n03', floor:1, x:27,  z:10 },
  { id: 'f1_n04', floor:1, x:36,  z:10 },
  { id: 'f1_n05', floor:1, x:44,  z:10 },
  { id: 'f1_n06', floor:1, x:53,  z:10 }, // center stair area
  { id: 'f1_n07', floor:1, x:62,  z:10 },
  { id: 'f1_n08', floor:1, x:71,  z:10 },
  { id: 'f1_n09', floor:1, x:80,  z:10 },
  { id: 'f1_n10', floor:1, x:89,  z:10 },
  { id: 'f1_n11', floor:1, x:98,  z:10 },
  { id: 'f1_n12', floor:1, x:110, z:10 },
  { id: 'f1_n13', floor:1, x:120, z:10 },
  { id: 'f1_n14', floor:1, x:132, z:10 }, // right stair
  // Room door nodes (north side, z=8.5)
  { id: 'f1_d_cr_male',       floor:1, x:3,   z:8.5,  roomId:'f1_cr_male' },
  { id: 'f1_d_cr_female',     floor:1, x:9,   z:8.5,  roomId:'f1_cr_female' },
  { id: 'f1_d_lobby_n',       floor:1, x:17,  z:8.5,  roomId:'f1_lobby_n' },
  { id: 'f1_d_canteen',       floor:1, x:31,  z:8.5,  roomId:'f1_canteen' },
  { id: 'f1_d_lobby_c',       floor:1, x:44,  z:8.5,  roomId:'f1_lobby_c' },
  { id: 'f1_d_shs_principal', floor:1, x:53,  z:8.5,  roomId:'f1_shs_principal' },
  { id: 'f1_d_shs_faculty',   floor:1, x:62,  z:8.5,  roomId:'f1_shs_faculty' },
  { id: 'f1_d_shs_class1',    floor:1, x:71,  z:8.5,  roomId:'f1_shs_class1' },
  { id: 'f1_d_shs_class2',    floor:1, x:80,  z:8.5,  roomId:'f1_shs_class2' },
  { id: 'f1_d_shs_class3',    floor:1, x:89,  z:8.5,  roomId:'f1_shs_class3' },
  { id: 'f1_d_bed_spec',      floor:1, x:98,  z:8.5,  roomId:'f1_bed_spec' },
  // Room door nodes (south side, z=11.5)
  { id: 'f1_d_electrical',    floor:1, x:3,   z:11.5, roomId:'f1_electrical' },
  { id: 'f1_d_bookstore',     floor:1, x:12,  z:11.5, roomId:'f1_bookstore' },
  { id: 'f1_d_finance',       floor:1, x:24,  z:11.5, roomId:'f1_finance' },
  { id: 'f1_d_registrar',     floor:1, x:36,  z:11.5, roomId:'f1_registrar' },
  { id: 'f1_d_igs_faculty',   floor:1, x:47,  z:11.5, roomId:'f1_igs_faculty' },
  { id: 'f1_d_discipline',    floor:1, x:57,  z:11.5, roomId:'f1_discipline' },
  { id: 'f1_d_shs_class4',    floor:1, x:71,  z:11.5, roomId:'f1_shs_class4' },
  { id: 'f1_d_shs_class5',    floor:1, x:80,  z:11.5, roomId:'f1_shs_class5' },
  { id: 'f1_d_shs_class6',    floor:1, x:89,  z:11.5, roomId:'f1_shs_class6' },
  { id: 'f1_d_birthing',      floor:1, x:99,  z:11.5, roomId:'f1_birthing' },
  { id: 'f1_d_club',          floor:1, x:121, z:11.5, roomId:'f1_club' },
];

const floor1Edges = [
  // Hallway spine
  ['f1_n00','f1_n01'],['f1_n01','f1_n02'],['f1_n02','f1_n03'],['f1_n03','f1_n04'],
  ['f1_n04','f1_n05'],['f1_n05','f1_n06'],['f1_n06','f1_n07'],['f1_n07','f1_n08'],
  ['f1_n08','f1_n09'],['f1_n09','f1_n10'],['f1_n10','f1_n11'],['f1_n11','f1_n12'],
  ['f1_n12','f1_n13'],['f1_n13','f1_n14'],
  // North door connections
  ['f1_n00','f1_d_cr_male'],['f1_n01','f1_d_cr_female'],['f1_n02','f1_d_lobby_n'],
  ['f1_n03','f1_d_canteen'],['f1_n05','f1_d_lobby_c'],['f1_n06','f1_d_shs_principal'],
  ['f1_n07','f1_d_shs_faculty'],['f1_n08','f1_d_shs_class1'],['f1_n09','f1_d_shs_class2'],
  ['f1_n10','f1_d_shs_class3'],['f1_n11','f1_d_bed_spec'],
  // South door connections
  ['f1_n00','f1_d_electrical'],['f1_n01','f1_d_bookstore'],['f1_n02','f1_d_finance'],
  ['f1_n04','f1_d_registrar'],['f1_n05','f1_d_igs_faculty'],['f1_n06','f1_d_discipline'],
  ['f1_n08','f1_d_shs_class4'],['f1_n09','f1_d_shs_class5'],['f1_n10','f1_d_shs_class6'],
  ['f1_n11','f1_d_birthing'],['f1_n13','f1_d_club'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 2
// ─────────────────────────────────────────────────────────────────────────────
const floor2Rooms = [
  { id: 'f2_cr_male_l',   name: 'Comfort Room (Male)',   floor:2, x:0,   z:0,  w:5,  d:8.5, type:'comfort' },
  { id: 'f2_cr_female_l', name: 'Comfort Room (Female)', floor:2, x:5,   z:0,  w:6,  d:8.5, type:'comfort' },
  { id: 'f2_class_n1',    name: 'Classroom',             floor:2, x:11,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n2',    name: 'Classroom',             floor:2, x:20,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n3',    name: 'Classroom',             floor:2, x:29,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n4',    name: 'Classroom',             floor:2, x:38,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n5',    name: 'Classroom',             floor:2, x:47,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n6',    name: 'Classroom',             floor:2, x:62,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_n7',    name: 'Classroom',             floor:2, x:71,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_n1',name: 'SHS Classroom',         floor:2, x:80,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_n2',name: 'SHS Classroom',         floor:2, x:89,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_n3',name: 'SHS Classroom',         floor:2, x:98,  z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_n4',name: 'SHS Classroom',         floor:2, x:107, z:0,  w:9,  d:8.5, type:'classroom' },
  { id: 'f2_cr_male_r',   name: 'Comfort Room (Male)',   floor:2, x:122, z:0,  w:6,  d:8.5, type:'comfort' },
  { id: 'f2_cr_female_r', name: 'Comfort Room (Female)', floor:2, x:128, z:0,  w:6,  d:8.5, type:'comfort' },
  // South row
  { id: 'f2_electrical',  name: 'Electrical Room',       floor:2, x:0,   z:11.5, w:5,  d:8.5, type:'utility' },
  { id: 'f2_janitor',     name: 'Janitor Room',          floor:2, x:5,   z:11.5, w:5,  d:8.5, type:'utility' },
  { id: 'f2_ssc',         name: 'SSC',                   floor:2, x:10,  z:11.5, w:7,  d:8.5, type:'office' },
  { id: 'f2_lobby',       name: 'Lobby',                 floor:2, x:17,  z:11.5, w:9,  d:8.5, type:'lobby' },
  { id: 'f2_class_s1',    name: 'Classroom',             floor:2, x:26,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_s2',    name: 'Classroom',             floor:2, x:35,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_s3',    name: 'Classroom',             floor:2, x:44,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_s4',    name: 'Classroom',             floor:2, x:53,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_s5',    name: 'Classroom',             floor:2, x:66,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_class_s6',    name: 'Classroom',             floor:2, x:75,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_s1',name: 'SHS Classroom',         floor:2, x:84,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_s2',name: 'SHS Classroom',         floor:2, x:93,  z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_s3',name: 'SHS Classroom',         floor:2, x:102, z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_shs_class_s4',name: 'SHS Classroom',         floor:2, x:111, z:11.5, w:9,  d:8.5, type:'classroom' },
  { id: 'f2_lobby_r',     name: 'Lobby',                 floor:2, x:120, z:11.5, w:9,  d:8.5, type:'lobby' },
  { id: 'f2_class_s7',    name: 'Classroom',             floor:2, x:129, z:11.5, w:9,  d:8.5, type:'classroom' },
];

const floor2Nodes = [
  { id:'f2_n00', floor:2, x:3,   z:10 },
  { id:'f2_n01', floor:2, x:9,   z:10 },
  { id:'f2_n02', floor:2, x:18,  z:10 },
  { id:'f2_n03', floor:2, x:27,  z:10 },
  { id:'f2_n04', floor:2, x:36,  z:10 },
  { id:'f2_n05', floor:2, x:44,  z:10 },
  { id:'f2_n06', floor:2, x:53,  z:10 },
  { id:'f2_n07', floor:2, x:62,  z:10 },
  { id:'f2_n08', floor:2, x:71,  z:10 },
  { id:'f2_n09', floor:2, x:80,  z:10 },
  { id:'f2_n10', floor:2, x:89,  z:10 },
  { id:'f2_n11', floor:2, x:98,  z:10 },
  { id:'f2_n12', floor:2, x:110, z:10 },
  { id:'f2_n13', floor:2, x:120, z:10 },
  { id:'f2_n14', floor:2, x:132, z:10 },
];

const floor2Edges = [
  ['f2_n00','f2_n01'],['f2_n01','f2_n02'],['f2_n02','f2_n03'],['f2_n03','f2_n04'],
  ['f2_n04','f2_n05'],['f2_n05','f2_n06'],['f2_n06','f2_n07'],['f2_n07','f2_n08'],
  ['f2_n08','f2_n09'],['f2_n09','f2_n10'],['f2_n10','f2_n11'],['f2_n11','f2_n12'],
  ['f2_n12','f2_n13'],['f2_n13','f2_n14'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 3
// ─────────────────────────────────────────────────────────────────────────────
const floor3Rooms = [
  // North row
  { id:'f3_pantry',        name:'Pantry',                    floor:3, x:9,   z:0, w:9,  d:7.5, type:'facility' },
  { id:'f3_conf_room',     name:'College Conference Room',   floor:3, x:18,  z:0, w:9,  d:7.5, type:'special' },
  { id:'f3_president',     name:"College President's Office",floor:3, x:27,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_records',       name:'Inform Records Mgt.',       floor:3, x:36,  z:0, w:18, d:7.5, type:'office' },
  { id:'f3_iss',           name:'ISS Office',                floor:3, x:54,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_consultant_r',  name:'Consultant for Research',   floor:3, x:63,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_consultant_a',  name:'Consultant for Admin Services', floor:3, x:72,z:0,w:9, d:7.5, type:'office' },
  { id:'f3_nursery',       name:'Nursery Principal',         floor:3, x:81,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_guidance',      name:'Guidance Office',           floor:3, x:90,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_vp_gens',       name:'VP Gens',                   floor:3, x:99,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f3_dropout',       name:'Dropout',                   floor:3, x:121, z:0, w:9,  d:7.5, type:'office' },
  // South row
  { id:'f3_radio',         name:'Radio Station',             floor:3, x:0,   z:12.5, w:9,  d:7.5, type:'special' },
  { id:'f3_mis',           name:'MIS',                       floor:3, x:9,   z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f3_lobby',         name:'Lobby',                     floor:3, x:18,  z:12.5, w:9,  d:7.5, type:'lobby' },
  { id:'f3_bot_chairman',  name:'BOT Chairman Office',       floor:3, x:27,  z:12.5, w:18, d:7.5, type:'office' },
  { id:'f3_personnel',     name:'Personnel',                 floor:3, x:45,  z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f3_cans',          name:'CANS',                      floor:3, x:54,  z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f3_tech_voc',      name:'Tech Voc. Office',          floor:3, x:63,  z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f3_cis',           name:'CIS Computer Studies',      floor:3, x:72,  z:12.5, w:18, d:7.5, type:'lab' },
  { id:'f3_ampli',         name:'Ampli-Theater',             floor:3, x:90,  z:12.5, w:18, d:7.5, type:'special' },
  { id:'f3_cba',           name:'CBA',                       floor:3, x:108, z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f3_electrical',    name:'Electrical Room',           floor:3, x:126, z:12.5, w:9,  d:7.5, type:'utility' },
];

const floor3Nodes = [
  { id:'f3_n00', floor:3, x:3,   z:10 },
  { id:'f3_n01', floor:3, x:9,   z:10 },
  { id:'f3_n02', floor:3, x:18,  z:10 },
  { id:'f3_n03', floor:3, x:27,  z:10 },
  { id:'f3_n04', floor:3, x:36,  z:10 },
  { id:'f3_n05', floor:3, x:45,  z:10 },
  { id:'f3_n06', floor:3, x:54,  z:10 },
  { id:'f3_n07', floor:3, x:63,  z:10 },
  { id:'f3_n08', floor:3, x:72,  z:10 },
  { id:'f3_n09', floor:3, x:81,  z:10 },
  { id:'f3_n10', floor:3, x:90,  z:10 },
  { id:'f3_n11', floor:3, x:99,  z:10 },
  { id:'f3_n12', floor:3, x:110, z:10 },
  { id:'f3_n13', floor:3, x:121, z:10 },
  { id:'f3_n14', floor:3, x:130, z:10 },
];

const floor3Edges = [
  ['f3_n00','f3_n01'],['f3_n01','f3_n02'],['f3_n02','f3_n03'],['f3_n03','f3_n04'],
  ['f3_n04','f3_n05'],['f3_n05','f3_n06'],['f3_n06','f3_n07'],['f3_n07','f3_n08'],
  ['f3_n08','f3_n09'],['f3_n09','f3_n10'],['f3_n10','f3_n11'],['f3_n11','f3_n12'],
  ['f3_n12','f3_n13'],['f3_n13','f3_n14'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 4
// ─────────────────────────────────────────────────────────────────────────────
const floor4Rooms = [
  // North row
  { id:'f4_supplies_n',   name:'Supplies Office',      floor:4, x:0,   z:0, w:9,  d:7.5, type:'office' },
  { id:'f4_class_n1',     name:'Classroom',            floor:4, x:18,  z:0, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_n2',     name:'Classroom',            floor:4, x:27,  z:0, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_n3',     name:'Classroom',            floor:4, x:36,  z:0, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_n4',     name:'Classroom',            floor:4, x:45,  z:0, w:9,  d:7.5, type:'classroom' },
  { id:'f4_library',      name:'Library',              floor:4, x:63,  z:0, w:45, d:7.5, type:'special' },
  { id:'f4_cr_male',      name:'Comfort Room (Male)',  floor:4, x:108, z:0, w:9,  d:7.5, type:'comfort' },
  { id:'f4_cr_female',    name:'Comfort Room (Female)',floor:4, x:126, z:0, w:9,  d:7.5, type:'comfort' },
  // South row
  { id:'f4_supplies_s',   name:'Supplies Office',      floor:4, x:0,   z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f4_janitorial',   name:'Janitorial Room',      floor:4, x:9,   z:12.5, w:9,  d:7.5, type:'utility' },
  { id:'f4_class_s1',     name:'Classroom',            floor:4, x:18,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s2',     name:'Classroom',            floor:4, x:27,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s3',     name:'Classroom',            floor:4, x:36,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s4',     name:'Classroom',            floor:4, x:63,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s5',     name:'Classroom',            floor:4, x:72,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s6',     name:'Classroom',            floor:4, x:81,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s7',     name:'Classroom',            floor:4, x:90,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s8',     name:'Classroom',            floor:4, x:108, z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_class_s9',     name:'Classroom',            floor:4, x:117, z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f4_chapel',       name:'Chapel',               floor:4, x:126, z:12.5, w:9,  d:7.5, type:'special' },
];

const floor4Nodes = [
  { id:'f4_n00', floor:4, x:3,   z:10 },
  { id:'f4_n01', floor:4, x:9,   z:10 },
  { id:'f4_n02', floor:4, x:18,  z:10 },
  { id:'f4_n03', floor:4, x:27,  z:10 },
  { id:'f4_n04', floor:4, x:36,  z:10 },
  { id:'f4_n05', floor:4, x:45,  z:10 },
  { id:'f4_n06', floor:4, x:54,  z:10 },
  { id:'f4_n07', floor:4, x:63,  z:10 },
  { id:'f4_n08', floor:4, x:72,  z:10 },
  { id:'f4_n09', floor:4, x:81,  z:10 },
  { id:'f4_n10', floor:4, x:90,  z:10 },
  { id:'f4_n11', floor:4, x:99,  z:10 },
  { id:'f4_n12', floor:4, x:108, z:10 },
  { id:'f4_n13', floor:4, x:117, z:10 },
  { id:'f4_n14', floor:4, x:130, z:10 },
];

const floor4Edges = [
  ['f4_n00','f4_n01'],['f4_n01','f4_n02'],['f4_n02','f4_n03'],['f4_n03','f4_n04'],
  ['f4_n04','f4_n05'],['f4_n05','f4_n06'],['f4_n06','f4_n07'],['f4_n07','f4_n08'],
  ['f4_n08','f4_n09'],['f4_n09','f4_n10'],['f4_n10','f4_n11'],['f4_n11','f4_n12'],
  ['f4_n12','f4_n13'],['f4_n13','f4_n14'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 5
// ─────────────────────────────────────────────────────────────────────────────
const floor5Rooms = [
  // North row
  { id:'f5_paser',      name:'PASER N000 Training Room',       floor:5, x:9,   z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_media',      name:'Media Center',                   floor:5, x:18,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_speech',     name:'Speech Lab',                     floor:5, x:27,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_cba_sim',    name:'CBA Simulation',                 floor:5, x:36,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_abcom',      name:'ABCOM Sound Production & Recording Lab', floor:5, x:54, z:0, w:13, d:7.5, type:'lab' },
  { id:'f5_comp_lab1',  name:'Computer Lab',                   floor:5, x:67,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_comp_lab2',  name:'Computer Lab',                   floor:5, x:76,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_comp_lab3',  name:'Computer Lab',                   floor:5, x:85,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_comp_lab4',  name:'Computer Lab',                   floor:5, x:94,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f5_fore_front', name:'Fore Front',                     floor:5, x:103, z:0, w:9,  d:7.5, type:'office' },
  { id:'f5_stock_room', name:'Stock Room PASEI',               floor:5, x:121, z:0, w:9,  d:7.5, type:'storage' },
  // South row
  { id:'f5_electrical', name:'Electrical Room & Supplies',     floor:5, x:0,   z:12.5, w:9,  d:7.5, type:'utility' },
  { id:'f5_janitorial', name:'Janitorial Room',                floor:5, x:9,   z:12.5, w:9,  d:7.5, type:'utility' },
  { id:'f5_class_s1',   name:'Classroom',                      floor:5, x:18,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f5_class_s2',   name:'Classroom',                      floor:5, x:27,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f5_class_s3',   name:'Classroom',                      floor:5, x:36,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f5_class_s4',   name:'Classroom',                      floor:5, x:45,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f5_electronics',name:'Electronics Lab',                floor:5, x:63,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f5_game_dev',   name:'Game Development Lab',           floor:5, x:72,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f5_digital',    name:'Digital Drawing and Drafting',   floor:5, x:81,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f5_multimedia', name:'Multi-Media Lab',                floor:5, x:90,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f5_pe_hall',    name:'PE Hall',                        floor:5, x:99,  z:12.5, w:9,  d:7.5, type:'facility' },
  { id:'f5_pe_coord',   name:'PE Coordinator',                 floor:5, x:108, z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f5_electrical2',name:'Electrical Room',                floor:5, x:130, z:12.5, w:5,  d:7.5, type:'utility' },
];

const floor5Nodes = [
  { id:'f5_n00', floor:5, x:3,   z:10 },
  { id:'f5_n01', floor:5, x:9,   z:10 },
  { id:'f5_n02', floor:5, x:18,  z:10 },
  { id:'f5_n03', floor:5, x:27,  z:10 },
  { id:'f5_n04', floor:5, x:36,  z:10 },
  { id:'f5_n05', floor:5, x:45,  z:10 },
  { id:'f5_n06', floor:5, x:54,  z:10 },
  { id:'f5_n07', floor:5, x:63,  z:10 },
  { id:'f5_n08', floor:5, x:72,  z:10 },
  { id:'f5_n09', floor:5, x:81,  z:10 },
  { id:'f5_n10', floor:5, x:90,  z:10 },
  { id:'f5_n11', floor:5, x:99,  z:10 },
  { id:'f5_n12', floor:5, x:108, z:10 },
  { id:'f5_n13', floor:5, x:120, z:10 },
  { id:'f5_n14', floor:5, x:132, z:10 },
];

const floor5Edges = [
  ['f5_n00','f5_n01'],['f5_n01','f5_n02'],['f5_n02','f5_n03'],['f5_n03','f5_n04'],
  ['f5_n04','f5_n05'],['f5_n05','f5_n06'],['f5_n06','f5_n07'],['f5_n07','f5_n08'],
  ['f5_n08','f5_n09'],['f5_n09','f5_n10'],['f5_n10','f5_n11'],['f5_n11','f5_n12'],
  ['f5_n12','f5_n13'],['f5_n13','f5_n14'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR 6
// ─────────────────────────────────────────────────────────────────────────────
const floor6Rooms = [
  // North row
  { id:'f6_stock_nursing', name:'Stock Room Nursing',         floor:6, x:0,   z:0, w:9,  d:7.5, type:'storage' },
  { id:'f6_ceso',          name:'CESO/NSEP',                  floor:6, x:18,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f6_medifery',      name:'Medi-Fery Room',             floor:6, x:27,  z:0, w:9,  d:7.5, type:'facility' },
  { id:'f6_bsm',           name:'BSM',                        floor:6, x:36,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f6_demo_room',     name:'Demo Room',                  floor:6, x:45,  z:0, w:9,  d:7.5, type:'lab' },
  { id:'f6_chem_storage',  name:'Chemical Storage',           floor:6, x:54,  z:0, w:9,  d:7.5, type:'storage' },
  { id:'f6_glassware',     name:'Glassware Storage',          floor:6, x:63,  z:0, w:9,  d:7.5, type:'storage' },
  { id:'f6_alumni',        name:'Alumni',                     floor:6, x:72,  z:0, w:9,  d:7.5, type:'special' },
  { id:'f6_mini_hotel_fo', name:'Mini Hotel Front Office',    floor:6, x:81,  z:0, w:9,  d:7.5, type:'office' },
  { id:'f6_mini_hotel',    name:'Mini Hotel',                 floor:6, x:94,  z:0, w:13, d:7.5, type:'special' },
  { id:'f6_cold_kitchen',  name:'Cold Kitchen',               floor:6, x:107, z:0, w:9,  d:7.5, type:'facility' },
  { id:'f6_hot_kitchen',   name:'Hot Kitchen',                floor:6, x:116, z:0, w:9,  d:7.5, type:'facility' },
  { id:'f6_support_room',  name:'Support Room (Mech.)',       floor:6, x:125, z:0, w:9,  d:7.5, type:'utility' },
  // South row
  { id:'f6_electrical_s',  name:'Electrical Room',            floor:6, x:0,   z:12.5, w:9,  d:7.5, type:'utility' },
  { id:'f6_class_s1',      name:'Classroom',                  floor:6, x:9,   z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f6_nursing_skills',name:'Nursing Skills Lab',         floor:6, x:18,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_demo_nursing',  name:'Demonstration Room Nursing', floor:6, x:27,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_chem_lab',      name:'Chemistry Lab',              floor:6, x:36,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_bio_lab',       name:'Bio-Lab',                    floor:6, x:54,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_ana_physio',    name:'Ana-Physio Lab',             floor:6, x:63,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_physics',       name:'Physics Lab',                floor:6, x:72,  z:12.5, w:9,  d:7.5, type:'lab' },
  { id:'f6_sci_custodian', name:'Science Lab Custodian',      floor:6, x:81,  z:12.5, w:9,  d:7.5, type:'office' },
  { id:'f6_lecture',       name:'Lecture',                    floor:6, x:94,  z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f6_class_s2',      name:'Classroom',                  floor:6, x:103, z:12.5, w:9,  d:7.5, type:'classroom' },
  { id:'f6_dining',        name:'Dining',                     floor:6, x:112, z:12.5, w:9,  d:7.5, type:'facility' },
  { id:'f6_electrical_dr', name:'Electrical Room / Dressing Rm', floor:6, x:130, z:12.5, w:5, d:7.5, type:'utility' },
];

const floor6Nodes = [
  { id:'f6_n00', floor:6, x:3,   z:10 },
  { id:'f6_n01', floor:6, x:9,   z:10 },
  { id:'f6_n02', floor:6, x:18,  z:10 },
  { id:'f6_n03', floor:6, x:27,  z:10 },
  { id:'f6_n04', floor:6, x:36,  z:10 },
  { id:'f6_n05', floor:6, x:45,  z:10 },
  { id:'f6_n06', floor:6, x:54,  z:10 },
  { id:'f6_n07', floor:6, x:63,  z:10 },
  { id:'f6_n08', floor:6, x:72,  z:10 },
  { id:'f6_n09', floor:6, x:81,  z:10 },
  { id:'f6_n10', floor:6, x:90,  z:10 },
  { id:'f6_n11', floor:6, x:99,  z:10 },
  { id:'f6_n12', floor:6, x:108, z:10 },
  { id:'f6_n13', floor:6, x:117, z:10 },
  { id:'f6_n14', floor:6, x:130, z:10 },
];

const floor6Edges = [
  ['f6_n00','f6_n01'],['f6_n01','f6_n02'],['f6_n02','f6_n03'],['f6_n03','f6_n04'],
  ['f6_n04','f6_n05'],['f6_n05','f6_n06'],['f6_n06','f6_n07'],['f6_n07','f6_n08'],
  ['f6_n08','f6_n09'],['f6_n09','f6_n10'],['f6_n10','f6_n11'],['f6_n11','f6_n12'],
  ['f6_n12','f6_n13'],['f6_n13','f6_n14'],
];

// ─────────────────────────────────────────────────────────────────────────────
// STAIRCASES — vertical connections between floors
// Three staircase columns: LEFT (x≈3), CENTER (x≈56), RIGHT (x≈132)
// ─────────────────────────────────────────────────────────────────────────────
export const STAIRS = [
  // Left staircase — connects all floors
  { id:'stair_left_1_2',   fromFloor:1, toFloor:2, nodeFrom:'f1_n00', nodeTo:'f2_n00', x:3,   z:10, label:'Left Stairs' },
  { id:'stair_left_2_3',   fromFloor:2, toFloor:3, nodeFrom:'f2_n00', nodeTo:'f3_n00', x:3,   z:10, label:'Left Stairs' },
  { id:'stair_left_3_4',   fromFloor:3, toFloor:4, nodeFrom:'f3_n00', nodeTo:'f4_n00', x:3,   z:10, label:'Left Stairs' },
  { id:'stair_left_4_5',   fromFloor:4, toFloor:5, nodeFrom:'f4_n00', nodeTo:'f5_n00', x:3,   z:10, label:'Left Stairs' },
  { id:'stair_left_5_6',   fromFloor:5, toFloor:6, nodeFrom:'f5_n00', nodeTo:'f6_n00', x:3,   z:10, label:'Left Stairs' },
  // Center staircase — connects all floors
  { id:'stair_center_1_2', fromFloor:1, toFloor:2, nodeFrom:'f1_n06', nodeTo:'f2_n06', x:56,  z:10, label:'Center Stairs' },
  { id:'stair_center_2_3', fromFloor:2, toFloor:3, nodeFrom:'f2_n06', nodeTo:'f3_n06', x:56,  z:10, label:'Center Stairs' },
  { id:'stair_center_3_4', fromFloor:3, toFloor:4, nodeFrom:'f3_n06', nodeTo:'f4_n06', x:56,  z:10, label:'Center Stairs' },
  { id:'stair_center_4_5', fromFloor:4, toFloor:5, nodeFrom:'f4_n06', nodeTo:'f5_n06', x:56,  z:10, label:'Center Stairs' },
  { id:'stair_center_5_6', fromFloor:5, toFloor:6, nodeFrom:'f5_n06', nodeTo:'f6_n06', x:56,  z:10, label:'Center Stairs' },
  // Right staircase — connects all floors
  { id:'stair_right_1_2',  fromFloor:1, toFloor:2, nodeFrom:'f1_n14', nodeTo:'f2_n14', x:132, z:10, label:'Right Stairs' },
  { id:'stair_right_2_3',  fromFloor:2, toFloor:3, nodeFrom:'f2_n14', nodeTo:'f3_n14', x:132, z:10, label:'Right Stairs' },
  { id:'stair_right_3_4',  fromFloor:3, toFloor:4, nodeFrom:'f3_n14', nodeTo:'f4_n14', x:132, z:10, label:'Right Stairs' },
  { id:'stair_right_4_5',  fromFloor:4, toFloor:5, nodeFrom:'f4_n14', nodeTo:'f5_n14', x:132, z:10, label:'Right Stairs' },
  { id:'stair_right_5_6',  fromFloor:5, toFloor:6, nodeFrom:'f5_n14', nodeTo:'f6_n14', x:132, z:10, label:'Right Stairs' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const FLOORS = [
  { id:1, label:'1st Floor', rooms:floor1Rooms, nodes:floor1Nodes, edges:floor1Edges },
  { id:2, label:'2nd Floor', rooms:floor2Rooms, nodes:floor2Nodes, edges:floor2Edges },
  { id:3, label:'3rd Floor', rooms:floor3Rooms, nodes:floor3Nodes, edges:floor3Edges },
  { id:4, label:'4th Floor', rooms:floor4Rooms, nodes:floor4Nodes, edges:floor4Edges },
  { id:5, label:'5th Floor', rooms:floor5Rooms, nodes:floor5Nodes, edges:floor5Edges },
  { id:6, label:'6th Floor', rooms:floor6Rooms, nodes:floor6Nodes, edges:floor6Edges },
];

// All rooms flat list for search
export const ALL_ROOMS = FLOORS.flatMap(f => f.rooms);

// All nodes flat (including stair transition nodes)
export const ALL_NODES = FLOORS.flatMap(f => f.nodes);

// All edges flat + stair edges
export const ALL_EDGES = [
  ...FLOORS.flatMap(f => f.edges),
  ...STAIRS.map(s => [s.nodeFrom, s.nodeTo]),
];

// Kiosk "You Are Here" default positions per floor
// (can be overridden by admin)
export const KIOSK_POSITIONS = {
  1: 'f1_n03', // Near lobby/canteen area
  2: 'f2_n03',
  3: 'f3_n03',
  4: 'f4_n03',
  5: 'f5_n03',
  6: 'f6_n03',
};