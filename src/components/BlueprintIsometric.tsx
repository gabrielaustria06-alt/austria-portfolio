import React, { Suspense, useState, useContext, createContext, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { getNode } from "./pathfinder";

// Type shim for JS pathfinder module
declare module "./pathfinder" {
  export interface PathNode { id: string; floor: number; x: number; z: number; roomId?: string; }
  export function getNode(id: string): PathNode | null;
  export function findPath(a: string, b: string): string[];
  export function getNearestNodeForRoom(roomId: string): string | null;
}


// ── Floor 2 room data (from buildingData.js) ──────────────────────────────────
// Column grid: c=[26,142,253,364,475,586,697,808,919,1030,1141,1252,1363,1474,1530,1646]
// rowA=160, hallTop=380, hallBottom=460, rowD=660
const FLOOR2_ROOMS = [
  // North (z:160, d:220)
  { id:"f2_cr_female_l",  name:"Comfort Room (Female)", x:26,   z:160, w:116, d:220, type:"comfort"   },
  { id:"f2_class_n1",     name:"Classroom",             x:142,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n2",     name:"Classroom",             x:253,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n3",     name:"Classroom",             x:364,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n4",     name:"Classroom",             x:475,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n5",     name:"Classroom",             x:586,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n6",     name:"Classroom",             x:697,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n_gap",  name:"Classroom",             x:808,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n7",     name:"Classroom",             x:919,  z:160, w:111, d:220, type:"classroom" },
  { id:"f2_class_n8",     name:"Classroom",             x:1030, z:160, w:111, d:220, type:"classroom" },
  { id:"f2_shs_class_n1", name:"SHS Classroom",         x:1141, z:160, w:111, d:220, type:"classroom" },
  { id:"f2_shs_class_n2", name:"SHS Classroom",         x:1252, z:160, w:111, d:220, type:"classroom" },
  { id:"f2_shs_class_n3", name:"SHS Classroom",         x:1363, z:160, w:111, d:220, type:"classroom" },
  { id:"f2_cr_male_r",    name:"Comfort Room (Male)",   x:1474, z:160, w:56,  d:220, type:"comfort"   },
  { id:"f2_cr_female_r",  name:"Comfort Room (Female)", x:1530, z:160, w:116, d:220, type:"comfort"   },
  // Stair landings in hallway
  { id:"f2_stair_left",   name:"Stairs (2a)",           x:26,   z:380, w:116, d:80,  type:"stair"     },
  { id:"f2_stair_right",  name:"Stairs (2d)",           x:1530, z:380, w:116, d:80,  type:"stair"     },
  // South (z:460, d:200)
  { id:"f2_electrical",   name:"Electrical Room",       x:26,   z:460, w:39,  d:200, type:"utility"   },
  { id:"f2_janitor",      name:"Janitorial Room",       x:65,   z:460, w:38,  d:200, type:"utility"   },
  { id:"f2_ssc",          name:"SSC",                   x:103,  z:460, w:39,  d:200, type:"office"    },
  { id:"f2_lobby",        name:"Lobby",                 x:142,  z:460, w:111, d:200, type:"lobby"     },
  { id:"f2_class_s1",     name:"Classroom",             x:253,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_class_s2",     name:"Classroom",             x:364,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_class_s3",     name:"Classroom",             x:475,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_stair_centerb",name:"Stairs (2b)",           x:586,  z:460, w:111, d:200, type:"stair"     },
  { id:"f2_class_s4",     name:"Classroom",             x:697,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_class_s5",     name:"Classroom",             x:808,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_class_s6",     name:"Classroom",             x:919,  z:460, w:111, d:200, type:"classroom" },
  { id:"f2_stair_centerc",name:"Stairs (2c)",           x:1030, z:460, w:111, d:200, type:"stair"     },
  { id:"f2_shs_class_s1", name:"SHS Classroom",         x:1141, z:460, w:111, d:200, type:"classroom" },
  { id:"f2_shs_class_s2", name:"SHS Classroom",         x:1252, z:460, w:111, d:200, type:"classroom" },
  { id:"f2_shs_class_s3", name:"SHS Classroom",         x:1363, z:460, w:111, d:200, type:"classroom" },
  { id:"f2_lobby_r",      name:"Lobby",                 x:1474, z:460, w:56,  d:200, type:"lobby"     },
  { id:"f2_class_s7",     name:"Classroom",             x:1530, z:460, w:116, d:200, type:"classroom" },
];

// ── Floor 3 room data ──────────────────────────────────────────────────────────
// Calibrated from official 3rd Floor Emergency / Evacuation Plan (1:200 MM).
// bounds: x1=121, y1=312, x2=1619, y2=646
// hall:   x=121, y=448, w=1498, h=60   (hallTop=448, hallBottom=508)
// stairX: left=165 (3a), center=721 (3b), right=1575 (3d)
const FLOOR3_ROOMS = [
  // ── North side (z:312, d:136) ─────────────────────────────────────────────
  { id:"f3_pipe_chase_l",  name:"Pipe Chase",                         x:121,  z:312, w:88,  d:136, type:"utility"   },
  { id:"f3_pantry",        name:"Pantry",                             x:209,  z:312, w:142, d:136, type:"facility"  },
  { id:"f3_conf_room",     name:"Conference Room",                    x:351,  z:312, w:107, d:136, type:"special"   },
  { id:"f3_president",     name:"President's Office",                 x:458,  z:312, w:108, d:136, type:"office"    },
  { id:"f3_records",       name:"Infocom Records Mgt.",               x:566,  z:312, w:178, d:136, type:"office"    },
  { id:"f3_igs",           name:"IGS Office",                         x:744,  z:312, w:85,  d:136, type:"office"    },
  { id:"f3_consultant_r",  name:"Consultant for Research",            x:829,  z:312, w:95,  d:136, type:"office"    },
  { id:"f3_class_n_gap",   name:"Classroom",                          x:924,  z:312, w:70,  d:136, type:"classroom" },
  { id:"f3_consultant_a",  name:"Consultant for Admin Services",      x:994,  z:312, w:106, d:136, type:"office"    },
  { id:"f3_norsultant",    name:"Norsultant for Admin Services",      x:1100, z:312, w:110, d:136, type:"office"    },
  { id:"f3_guidance",      name:"Guidance Office",                    x:1210, z:312, w:108, d:136, type:"office"    },
  { id:"f3_vp_crs",        name:"VP CRS",                             x:1318, z:312, w:84,  d:136, type:"office"    },
  { id:"f3_ceas",          name:"CEAS",                               x:1402, z:312, w:54,  d:136, type:"office"    },
  { id:"f3_clinic",        name:"Clinic",                             x:1456, z:312, w:46,  d:136, type:"facility"  },
  { id:"f3_vp_admin_qa",   name:"VP Admin / QA",                      x:1502, z:312, w:36,  d:136, type:"office"    },
  { id:"f3_cba_n",         name:"CBA",                                x:1538, z:312, w:36,  d:136, type:"office"    },
  { id:"f3_pipe_chase_r",  name:"Pipe Chase",                         x:1574, z:312, w:27,  d:136, type:"utility"   },
  { id:"f3_discount",      name:"Discount",                           x:1601, z:312, w:18,  d:136, type:"facility"  },
  // ── Stair shafts (hallway zone z:448, d:60) ────────────────────────────────
  { id:"f3_stair_left",    name:"Stairs (3a)",                        x:121,  z:448, w:88,  d:60,  type:"stair"     },
  { id:"f3_stair_right",   name:"Stairs (3d)",                        x:1531, z:448, w:88,  d:60,  type:"stair"     },
  // ── South side (z:508, d:138) — stairs occupy full bays ───────────────────
  { id:"f3_radio",         name:"Radio Station",                      x:121,  z:508, w:95,  d:138, type:"office"    },
  { id:"f3_mis",           name:"MIS",                                x:216,  z:508, w:135, d:138, type:"office"    },
  { id:"f3_lobby",         name:"Lobby",                              x:351,  z:508, w:107, d:138, type:"lobby"     },
  { id:"f3_ict_comlab",    name:"ICT Comlab Office",                  x:458,  z:508, w:107, d:138, type:"lab"       },
  { id:"f3_personnel",     name:"Personnel",                          x:565,  z:508, w:109, d:138, type:"office"    },
  { id:"f3_stair_centerb", name:"Stairs (3b)",                        x:674,  z:508, w:94,  d:138, type:"stair"     },
  { id:"f3_cans",          name:"CANS",                               x:768,  z:508, w:95,  d:138, type:"office"    },
  { id:"f3_cis",           name:"CIS Computer Studies",               x:863,  z:508, w:84,  d:138, type:"lab"       },
  { id:"f3_stair_centerc", name:"Stairs (3c)",                        x:947,  z:508, w:103, d:138, type:"stair"     },
  { id:"f3_vp_ac",         name:"VP AC",                              x:1050, z:508, w:94,  d:138, type:"office"    },
  { id:"f3_cba",           name:"CBA",                                x:1144, z:508, w:72,  d:138, type:"office"    },
  { id:"f3_techvoc",       name:"Tech Voc. Office",                   x:1216, z:508, w:110, d:138, type:"office"    },
  { id:"f3_ampli",         name:"Amphi-Theater",                      x:1326, z:508, w:140, d:138, type:"special"   },
  { id:"f3_pipe_chase_s",  name:"Pipe Chase",                         x:1466, z:508, w:65,  d:138, type:"utility"   },
  { id:"f3_electrical",    name:"Electrical Room",                    x:1531, z:508, w:88,  d:138, type:"utility"   },
];

// ── Floor 4 room data ──────────────────────────────────────────────────────────
// Calibrated from official 4th Floor Emergency / Evacuation Plan (1:200 MM).
// bounds: x1=109, y1=246, x2=1618, y2=650
// hall:   x=109, y=394, w=1509, h=93  (hallTop=394, hallBottom=487)
// stairX: left=148 (4a), center=679 (4b), right=1563 (4d)
const FLOOR4_ROOMS = [
  // ── North side (z:246, d:148) ─────────────────────────────────────────────
  { id:"f4_supplies_n",   name:"Supplies Office",       x:109,  z:246, w:78,  d:148, type:"office"    },
  { id:"f4_class_n1",     name:"Classroom",             x:187,  z:246, w:111, d:148, type:"classroom" },
  { id:"f4_class_n2",     name:"Classroom",             x:298,  z:246, w:109, d:148, type:"classroom" },
  { id:"f4_class_n3",     name:"Classroom",             x:407,  z:246, w:107, d:148, type:"classroom" },
  { id:"f4_class_n4",     name:"Classroom",             x:514,  z:246, w:111, d:148, type:"classroom" },
  { id:"f4_class_n4b",    name:"Classroom",             x:625,  z:246, w:109, d:148, type:"classroom" },
  { id:"f4_class_n5",     name:"Classroom",             x:734,  z:246, w:107, d:148, type:"classroom" },
  { id:"f4_class_n6",     name:"Classroom",             x:841,  z:246, w:107, d:148, type:"classroom" },
  { id:"f4_library",      name:"Library",               x:948,  z:246, w:321, d:148, type:"special"   },
  { id:"f4_class_n7",     name:"Classroom",             x:1269, z:246, w:107, d:148, type:"classroom" },
  { id:"f4_cr_male",      name:"Comfort Room (Male)",   x:1376, z:246, w:75,  d:148, type:"comfort"   },
  { id:"f4_pipe_chase_n", name:"Pipe Chase",            x:1451, z:246, w:58,  d:148, type:"utility"   },
  { id:"f4_cr_female",    name:"Comfort Room (Female)", x:1509, z:246, w:109, d:148, type:"comfort"   },
  // ── Stair shafts ──────────────────────────────────────────────────────────
  { id:"f4_stair_left",    name:"Stairs (4a)",          x:109,  z:394, w:78,  d:93,  type:"stair"     },
  { id:"f4_stair_right",   name:"Stairs (4d)",          x:1502, z:394, w:116, d:80,  type:"stair"     },
  // ── South side (z:487, d:163) — stair bays replace rooms ─────────────────
  { id:"f4_supplies_s",   name:"Supplies Office",       x:109,  z:487, w:78,  d:163, type:"office"    },
  { id:"f4_janitorial",   name:"Janitorial Room",       x:187,  z:487, w:111, d:163, type:"utility"   },
  { id:"f4_class_s1",     name:"Classroom",             x:298,  z:487, w:109, d:163, type:"classroom" },
  { id:"f4_class_s2",     name:"Classroom",             x:407,  z:487, w:107, d:163, type:"classroom" },
  { id:"f4_class_s3",     name:"Classroom",             x:514,  z:487, w:111, d:163, type:"classroom" },
  { id:"f4_stair_centerb",name:"Stairs (4b)",           x:625,  z:487, w:109, d:163, type:"stair"     },
  { id:"f4_class_s4",     name:"Classroom",             x:734,  z:487, w:107, d:163, type:"classroom" },
  { id:"f4_class_s5",     name:"Classroom",             x:841,  z:487, w:107, d:163, type:"classroom" },
  { id:"f4_stair_centerc",name:"Stairs (4c)",           x:948,  z:487, w:107, d:163, type:"stair"     },
  { id:"f4_class_s6",     name:"Classroom",             x:1055, z:487, w:107, d:163, type:"classroom" },
  { id:"f4_class_s7",     name:"Classroom",             x:1162, z:487, w:107, d:163, type:"classroom" },
  { id:"f4_class_s8",     name:"Classroom",             x:1269, z:487, w:107, d:163, type:"classroom" },
  { id:"f4_pipe_chase_s", name:"Pipe Chase",            x:1376, z:487, w:55,  d:163, type:"utility"   },
  { id:"f4_chapel",       name:"Chapel",                x:1431, z:487, w:187, d:163, type:"special"   },
];

// ── Floor 5 room data ──────────────────────────────────────────────────────────
// Calibrated from official 5th Floor Emergency / Evacuation Plan (1:200 MM).
// bounds: x1=84, y1=331, x2=1631, y2=650
// hall:   x=84, y=461, w=1547, h=56  (hallTop=461, hallBottom=517)
// stairX: left=122 (5a), center=672 (5b), right=1596 (5d)
const FLOOR5_ROOMS = [
  // ── North side (z:331, d:130) ─────────────────────────────────────────────
  { id:"f5_class_n_gap",  name:"Classroom",                              x:84,   z:331, w:111, d:130, type:"classroom" },
  { id:"f5_paser",        name:"PASER N000 Training Room",               x:195,  z:331, w:212, d:130, type:"lab"       },
  { id:"f5_media",        name:"Media Center",                           x:407,  z:331, w:106, d:130, type:"lab"       },
  { id:"f5_speech",       name:"Speech Lab",                             x:513,  z:331, w:106, d:130, type:"lab"       },
  { id:"f5_cba_sim",      name:"CBA Simulation",                         x:619,  z:331, w:106, d:130, type:"lab"       },
  { id:"f5_abcom",        name:"ABCOM Sound Production & Recording Lab", x:725,  z:331, w:212, d:130, type:"lab"       },
  { id:"f5_comp_lab1",    name:"Computer Lab",                           x:937,  z:331, w:106, d:130, type:"lab"       },
  { id:"f5_comp_lab2",    name:"Computer Lab",                           x:1043, z:331, w:106, d:130, type:"lab"       },
  { id:"f5_comp_lab3",    name:"Computer Lab",                           x:1149, z:331, w:106, d:130, type:"lab"       },
  { id:"f5_comp_lab4",    name:"Computer Lab",                           x:1255, z:331, w:106, d:130, type:"lab"       },
  { id:"f5_fore_front",   name:"Fore Front",                             x:1361, z:331, w:106, d:130, type:"office"    },
  { id:"f5_front",        name:"Front",                                  x:1467, z:331, w:53,  d:130, type:"office"    },
  { id:"f5_stock_room",   name:"Stock Room PASEI",                       x:1520, z:331, w:111, d:130, type:"storage"   },
  // ── Stair shafts ──────────────────────────────────────────────────────────
  { id:"f5_stair_left",    name:"Stairs (5a)",                           x:84,   z:461, w:76,  d:56,  type:"stair"     },
  { id:"f5_stair_right",   name:"Stairs (5d)",                           x:1561, z:461, w:70,  d:56,  type:"stair"     },
  // ── South side (z:517, d:133) — stair bays replace rooms ─────────────────
  { id:"f5_electrical",   name:"Electrical Room & Supplies",             x:84,   z:517, w:111, d:133, type:"utility"   },
  { id:"f5_janitorial",   name:"Janitorial Room",                        x:195,  z:517, w:106, d:133, type:"utility"   },
  { id:"f5_class_s1",     name:"Classroom",                              x:301,  z:517, w:106, d:133, type:"classroom" },
  { id:"f5_class_s2",     name:"Classroom",                              x:407,  z:517, w:106, d:133, type:"classroom" },
  { id:"f5_class_s3",     name:"Classroom",                              x:513,  z:517, w:106, d:133, type:"classroom" },
  { id:"f5_stair_centerb",name:"Stairs (5b)",                            x:619,  z:517, w:106, d:133, type:"stair"     },
  { id:"f5_electronics",  name:"Electronics Lab",                        x:725,  z:517, w:106, d:133, type:"lab"       },
  { id:"f5_game_dev",     name:"Game Development Lab",                   x:831,  z:517, w:106, d:133, type:"lab"       },
  { id:"f5_stair_centerc",name:"Stairs (5c)",                            x:937,  z:517, w:106, d:133, type:"stair"     },
  { id:"f5_digital",      name:"Digital Drawing & Drafting",             x:1043, z:517, w:106, d:133, type:"lab"       },
  { id:"f5_multimedia",   name:"Multi-Media Lab",                        x:1149, z:517, w:106, d:133, type:"lab"       },
  { id:"f5_pe_hall",      name:"PE Hall",                                x:1255, z:517, w:106, d:133, type:"facility"  },
  { id:"f5_pe_coord",     name:"PE Coordinator",                         x:1361, z:517, w:106, d:133, type:"office"    },
  { id:"f5_class_s4",     name:"Classroom",                              x:1467, z:517, w:77,  d:133, type:"classroom" },
  { id:"f5_electrical2",  name:"Electrical Room",                        x:1544, z:517, w:87,  d:133, type:"utility"   },
];

// ── Floor 6 room data ──────────────────────────────────────────────────────────
// Calibrated from official 6th Floor Emergency / Evacuation Plan (1:200 MM).
// bounds: x1=118, y1=240, x2=1655, y2=700
// hall:   x=118, y=465, w=1537, h=68  (hallTop=465, hallBottom=533)
// stairX: left=176 (6a), center=511 (6b), right=1626 (6d)
const FLOOR6_ROOMS = [
  // ── North side (z:240, d:225) ─────────────────────────────────────────────
  { id:"f6_pipe_chase_ln", name:"Pipe Chase",                  x:118,  z:240, w:116, d:225, type:"utility"   },
  { id:"f6_stock_nursing", name:"Stock Room Nursing",          x:234,  z:240, w:111, d:225, type:"storage"   },
  { id:"f6_ceso_1",        name:"CESO / NSTP",                 x:345,  z:240, w:111, d:225, type:"office"    },
  { id:"f6_ceso_2",        name:"CESO / NSTP",                 x:456,  z:240, w:111, d:225, type:"office"    },
  { id:"f6_infirmary",     name:"Infirmary Room",              x:567,  z:240, w:111, d:225, type:"facility"  },
  { id:"f6_bsm",           name:"BSM",                         x:678,  z:240, w:111, d:225, type:"office"    },
  { id:"f6_demo_room",     name:"Demo Room",                   x:789,  z:240, w:111, d:225, type:"lab"       },
  { id:"f6_chem_storage",  name:"Chemical Storage",            x:900,  z:240, w:56,  d:225, type:"storage"   },
  { id:"f6_glassware",     name:"Glassware Storage",           x:956,  z:240, w:55,  d:225, type:"storage"   },
  { id:"f6_alumni",        name:"Alumni",                      x:1011, z:240, w:86,  d:225, type:"special"   },
  { id:"f6_mini_hotel_fo", name:"Mini Hotel Front Office",     x:1097, z:240, w:111, d:225, type:"office"    },
  { id:"f6_mini_hotel",    name:"Mini Hotel",                  x:1208, z:240, w:111, d:225, type:"special"   },
  { id:"f6_cold_kitchen",  name:"Cold Kitchen",                x:1319, z:240, w:111, d:225, type:"facility"  },
  { id:"f6_baking",        name:"Baking",                      x:1430, z:240, w:56,  d:225, type:"facility"  },
  { id:"f6_hot_kitchen",   name:"Hot Kitchen",                 x:1486, z:240, w:111, d:225, type:"facility"  },
  { id:"f6_cr_male",       name:"Comfort Room (Male)",         x:1597, z:240, w:58,  d:225, type:"comfort"   },
  // ── Stair shafts ──────────────────────────────────────────────────────────
  { id:"f6_stair_left",    name:"Stairs (6a)",                 x:118,  z:465, w:116, d:68,  type:"stair"     },
  { id:"f6_stair_right",   name:"Stairs (6d)",                 x:1597, z:465, w:58,  d:68,  type:"stair"     },
  // ── South side (z:533, d:167) — stair bays replace rooms ─────────────────
  { id:"f6_electrical_s",  name:"Electrical Room",             x:118,  z:533, w:116, d:167, type:"utility"   },
  { id:"f6_class_s1",      name:"Classroom",                   x:234,  z:533, w:111, d:167, type:"classroom" },
  { id:"f6_nursing_skills",name:"Nursing Skills Lab",          x:345,  z:533, w:111, d:167, type:"lab"       },
  { id:"f6_stair_centerb", name:"Stairs (6b)",                 x:456,  z:533, w:111, d:167, type:"stair"     },
  { id:"f6_deom_riti",     name:"Deom Riti Bab",               x:567,  z:533, w:111, d:167, type:"lab"       },
  { id:"f6_bio_lab",       name:"Bio-Lab",                     x:678,  z:533, w:111, d:167, type:"lab"       },
  { id:"f6_ana_physio",    name:"Ana-Physio Lab",              x:789,  z:533, w:111, d:167, type:"lab"       },
  { id:"f6_physics",       name:"Physics Lab",                 x:900,  z:533, w:111, d:167, type:"lab"       },
  { id:"f6_stair_centerc", name:"Stairs (6c)",                 x:1011, z:533, w:111, d:167, type:"stair"     },
  { id:"f6_lecture",       name:"Lecture",                     x:1122, z:533, w:86,  d:167, type:"classroom" },
  { id:"f6_class_s_gap",   name:"Classroom",                   x:1208, z:533, w:111, d:167, type:"classroom" },
  { id:"f6_class_s2",      name:"Classroom",                   x:1319, z:533, w:111, d:167, type:"classroom" },
  { id:"f6_dining",        name:"Dining",                      x:1430, z:533, w:56,  d:167, type:"facility"  },
  { id:"f6_pipe_chase_s",  name:"Pipe Chase",                  x:1486, z:533, w:56,  d:167, type:"utility"   },
  { id:"f6_electrical_dr", name:"Electrical / Dressing Room",  x:1542, z:533, w:113, d:167, type:"utility"   },
];

// ── Floor context — provides per-floor tx/tz and row detection ────────────────
interface FloorCtxType {
  ftx: (x: number) => number;
  ftz: (z: number) => number;
  hallTop: number;
  hallBottom: number;
  floorId: number;
}
const FloorCtx = createContext<FloorCtxType>({
  ftx: (px) => (px - (16 + 1655) / 2) * (1 / 24),
  ftz: (pz) => (pz - (222 + 640) / 2) * (1 / 24),
  hallTop: 383,
  hallBottom: 479,
  floorId: 1,
});

// ── Floor 1 room data ──────────────────────────────────────────────────────────
const FLOOR1_ROOMS = [
  { id: "f1_cr_male",        name: "Comfort Room (Male)",    x: 16,   z: 222, w: 116, d: 161, type: "comfort"   },
  { id: "f1_pipe_chase_l",   name: "Pipe Chase",             x: 132,  z: 222, w: 24,  d: 161, type: "utility"   },
  { id: "f1_lobby_n",        name: "Lobby",                  x: 156,  z: 222, w: 88,  d: 161, type: "lobby"     },
  { id: "f1_canteen",        name: "Canteen",                x: 244,  z: 222, w: 445, d: 161, type: "facility"  },
  { id: "f1_lobby_c",        name: "Lobby",                  x: 689,  z: 222, w: 163, d: 161, type: "lobby"     },
  { id: "f1_shs_principal",  name: "SHS Principal",          x: 852,  z: 222, w: 111, d: 161, type: "office"    },
  { id: "f1_shs_faculty",    name: "SHS Faculty",            x: 963,  z: 222, w: 111, d: 161, type: "office"    },
  { id: "f1_shs_class1",     name: "SHS Classroom",          x: 1074, z: 222, w: 112, d: 161, type: "classroom" },
  { id: "f1_shs_class2",     name: "SHS Classroom",          x: 1186, z: 222, w: 111, d: 161, type: "classroom" },
  { id: "f1_shs_class3",     name: "SHS Classroom",          x: 1297, z: 222, w: 112, d: 161, type: "classroom" },
  { id: "f1_bed_presch_lab", name: "BED Pre-School Lab",     x: 1409, z: 222, w: 74,  d: 161, type: "lab"       },
  { id: "f1_pipe_chase_r1",  name: "Pipe Chase",             x: 1483, z: 222, w: 28,  d: 161, type: "utility"   },
  { id: "f1_pipe_chase_r2",  name: "Pipe Chase",             x: 1511, z: 222, w: 28,  d: 161, type: "utility"   },
  { id: "f1_cr_female",      name: "Comfort Room (Female)",  x: 1539, z: 222, w: 116, d: 161, type: "comfort"   },
  { id: "f1_stair_left",     name: "Stairs UP/DN",           x: 16,   z: 383, w: 116, d: 96,  type: "stair"     },
  { id: "f1_stair_right",    name: "Stairs DN",              x: 1539, z: 383, w: 116, d: 96,  type: "stair"     },
  { id: "f1_electrical",     name: "Electrical Room",        x: 16,   z: 479, w: 116, d: 161, type: "utility"   },
  { id: "f1_bookstore",      name: "Bookstore",              x: 132,  z: 479, w: 112, d: 161, type: "facility"  },
  { id: "f1_lobby_sw",       name: "Lobby",                  x: 244,  z: 479, w: 111, d: 161, type: "lobby"     },
  { id: "f1_finance",        name: "Finance",                x: 355,  z: 479, w: 112, d: 161, type: "office"    },
  { id: "f1_registrar",      name: "Registrar",              x: 467,  z: 479, w: 111, d: 161, type: "office"    },
  { id: "f1_igs_faculty",    name: "IGS Faculty",            x: 578,  z: 479, w: 111, d: 161, type: "office"    },
  { id: "f1_discipline",     name: "Discipline Office",      x: 689,  z: 479, w: 82,  d: 161, type: "office"    },
  { id: "f1_stair_mid",      name: "Stairs UP",              x: 771,  z: 479, w: 81,  d: 161, type: "stair"     },
  { id: "f1_lobby_sc",       name: "Lobby",                  x: 852,  z: 479, w: 110, d: 161, type: "lobby"     },
  { id: "f1_shs_class4",     name: "SHS Classroom",          x: 962,  z: 479, w: 95,  d: 161, type: "classroom" },
  { id: "f1_stair_center",   name: "Stairs UP/DN",           x: 1057, z: 479, w: 95,  d: 161, type: "stair"     },
  { id: "f1_shs_class6",     name: "SHS Classroom",          x: 1152, z: 479, w: 96,  d: 161, type: "classroom" },
  { id: "f1_shs_class7",     name: "SHS Classroom",          x: 1248, z: 479, w: 95,  d: 161, type: "classroom" },
  { id: "f1_shs_class8",     name: "SHS Classroom",          x: 1343, z: 479, w: 95,  d: 161, type: "classroom" },
  { id: "f1_birthing_clinic",name: "Birthing Clinic",        x: 1438, z: 479, w: 74,  d: 161, type: "facility"  },
  { id: "f1_lobby_se",       name: "Lobby",                  x: 1512, z: 479, w: 56,  d: 161, type: "lobby"     },
  { id: "f1_club",           name: "Club",                   x: 1568, z: 479, w: 87,  d: 161, type: "facility"  },
];

const HALLWAY     = { x: 16, z: 383, w: 1639, d: 96  };
const HALLWAY_VIS = { x: 16, z: 370, w: 1639, d: 122 };

const SCALE   = 1 / 24;
const WALL_H  = 2.4;
const WALL_T  = 0.08;
const FLOOR_H = 0.05;

const CENTER_X = (16 + 1655) / 2;
const CENTER_Z = (222 + 640) / 2;

const tx = (px: number) => (px - CENTER_X) * SCALE;
const tz = (pz: number) => (pz - CENTER_Z) * SCALE;
const tw = (pw: number) => pw * SCALE;

const DOOR_W  = 0.95;
const DOOR_H  = WALL_H * 0.70;
const WIN_W   = 1.20;
const WIN_H   = WALL_H * 0.30;
const WIN_Y   = FLOOR_H + WALL_H * 0.60;
const WIN_EXT = 0.032;
const FM      = 0.20;

// ── Materials ──────────────────────────────────────────────────────────────────
const M = (c: string, s = 8, t = false, o = 1.0) =>
  new THREE.MeshPhongMaterial({ color: c, shininess: s, transparent: t, opacity: o });

const MAT_WALL_FRONT    = M("#f7f7f7",  6);
const MAT_WALL_SIDE     = M("#ededed",  4);
const MAT_WALL_BACK     = M("#e4e4e4",  2);
const MAT_FLOOR         = M("#d6d6d6",  2);
const MAT_HALL          = M("#d0d4d8",  2);
const MAT_GROUND        = M("#b8bcc0",  0);
const MAT_DOOR_FRAME    = M("#8a8a8a", 14);
const MAT_DOOR_VOID     = M("#161616",  0);
const MAT_DOOR_PANEL    = M("#b88c50", 22);
const MAT_DOOR_METAL    = M("#d4d4d4", 90);
const MAT_WIN_FRAME     = M("#c0c0c0", 25);
const MAT_WIN_GLASS     = M("#c4e0f8",160, true, 0.65);
const MAT_SLIDING_GLASS = M("#b4dcf4",200, true, 0.50);
const MAT_STAIR_LIGHT   = M("#d0d0d0",  6);
const MAT_STAIR_DARK    = M("#b4b4b4", 12);
const MAT_RAIL          = M("#888888", 50);
const MAT_TRACK         = M("#aaaaaa", 30);
const MAT_LIP           = M("#c0c0c0",  8);
const MAT_DESK_TOP      = M("#c8a460", 30);
const MAT_DESK_LEG      = M("#9a7030", 20);
const MAT_CHAIR_SEAT    = M("#4a6fa8", 14);
const MAT_CHAIR_BACK    = M("#3d5e90", 14);
const MAT_CHAIR_FRAME   = M("#404040", 40);
const MAT_COUNTER       = M("#b09070", 18);
const MAT_TABLE_TOP     = M("#c0a060", 22);
const MAT_TABLE_LEG     = M("#8c6828", 18);
const MAT_SHELF         = M("#a08060", 10);
const MAT_STALL         = M("#d4d4d4",  5);
const MAT_WHITEBOARD    = M("#f8f8f4", 20);
const MAT_BOARD_FRAME   = M("#2a5c3a", 10);
const MAT_BOARD_CORK    = M("#c8a870",  4);
const MAT_PAPER         = M("#f4f0e0",  6);
const MAT_PLANT_LEAF    = M("#38883c", 10);
const MAT_PLANT_POT     = M("#b85030", 12);
const MAT_SIGNAGE       = M("#f0f4ff", 14);
const MAT_SIGN_BLUE     = M("#2563eb", 12);
const MAT_SIGN_RED      = M("#dc2626", 12);
const MAT_TRASH         = M("#585858", 10);
const MAT_FOUNTAIN      = M("#e0e4e8", 30);
const MAT_HALL_CHAIR    = M("#5a7a9a", 14);
const MAT_HALL_CHAIR_FR = M("#383838", 40);

// ── Primitive helpers ─────────────────────────────────────────────────────────
function Box({
  pos, size, mat,
}: { pos: [number,number,number]; size: [number,number,number]; mat: THREE.Material }) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}


// ── Desk with legs ─────────────────────────────────────────────────────────────
function DeskMesh({
  w, d, topH = 0.08, legH = 0.38,
  matTop = MAT_DESK_TOP, matLeg = MAT_DESK_LEG,
}: { w: number; d: number; topH?: number; legH?: number; matTop?: THREE.Material; matLeg?: THREE.Material }) {
  const lx = w / 2 - 0.07, lz = d / 2 - 0.07;
  return (
    <group>
      <Box pos={[0, legH + topH / 2, 0]} size={[w, topH, d]} mat={matTop} />
      {([-lx, lx] as const).map(x => ([-lz, lz] as const).map(z => (
        <Box key={`${x}-${z}`} pos={[x, legH / 2, z]} size={[0.06, legH, 0.06]} mat={matLeg} />
      )))}
    </group>
  );
}

// ── Chair with seat, backrest, legs ───────────────────────────────────────────
function ChairMesh({
  x = 0, z = 0, rotY = 0, s = 0.60,
  matSeat = MAT_CHAIR_SEAT, matBack = MAT_CHAIR_BACK, matFrame = MAT_CHAIR_FRAME,
}: {
  x?: number; z?: number; rotY?: number; s?: number;
  matSeat?: THREE.Material; matBack?: THREE.Material; matFrame?: THREE.Material;
}) {
  const legH = 0.30, seatH = 0.07, backH = 0.38;
  const halfS = s / 2;
  const lOff  = halfS - 0.06;
  return (
    <group position={[x, FLOOR_H, z]} rotation={[0, rotY, 0]}>
      <Box pos={[0, legH + seatH / 2, 0]}                size={[s, seatH, s]}       mat={matSeat} />
      <Box pos={[0, legH + seatH + backH / 2, -halfS + 0.04]} size={[s, backH, 0.07]} mat={matBack} />
      {([-lOff, lOff] as const).map(lx => ([-lOff, lOff] as const).map(lz => (
        <Box key={`${lx}-${lz}`} pos={[lx, legH / 2, lz]} size={[0.04, legH, 0.04]} mat={matFrame} />
      )))}
    </group>
  );
}

// ── Bulletin board ────────────────────────────────────────────────────────────
function BulletinBoard({ w = 1.40, h = 0.90 }: { w?: number; h?: number }) {
  const papers: [number, number, number, number][] = [
    [-0.30, 0.20, 0.52, 0.30], [ 0.25, 0.20, 0.56, 0.30],
    [-0.32, -0.18, 0.48, 0.26], [ 0.22, -0.18, 0.54, 0.26],
    [-0.04, 0.05, 0.38, 0.20],
  ];
  return (
    <group>
      <Box pos={[0, 0, 0]}     size={[w + 0.10, h + 0.10, 0.044]} mat={MAT_BOARD_FRAME} />
      <Box pos={[0, 0, 0.023]} size={[w, h, 0.018]}               mat={MAT_BOARD_CORK}  />
      {papers.map(([px, py, pw, ph], i) => (
        <Box key={i} pos={[px, py, 0.034]} size={[pw, ph, 0.008]} mat={MAT_PAPER} />
      ))}
    </group>
  );
}

// ── School directional sign ───────────────────────────────────────────────────
function DirectionalSign({ labels = ["OFFICE", "CLINIC →"] }: { labels?: string[] }) {
  return (
    <group>
      <Box pos={[0, 0, 0]}          size={[1.20, 0.26, 0.040]} mat={MAT_SIGN_BLUE} />
      <Box pos={[0, 0, 0.022]}      size={[1.14, 0.20, 0.012]} mat={MAT_SIGNAGE}   />
      <Box pos={[0, -0.22, 0]}      size={[1.20, 0.22, 0.040]} mat={MAT_SIGN_RED}  />
      <Box pos={[0, -0.22, 0.022]}  size={[1.14, 0.16, 0.012]} mat={MAT_SIGNAGE}   />
    </group>
  );
}

// ── Room name plaque (beside door) ────────────────────────────────────────────
function RoomPlaque({ name }: { name: string }) {
  return (
    <group>
      <Box pos={[0, 0, 0]}      size={[0.50, 0.14, 0.028]} mat={MAT_SIGN_BLUE} />
      <Box pos={[0, 0, 0.015]}  size={[0.46, 0.10, 0.010]} mat={MAT_SIGNAGE}   />
    </group>
  );
}

// ── Plant ─────────────────────────────────────────────────────────────────────
function PlantPot() {
  return (
    <group>
      <Box pos={[0, 0.16, 0]}  size={[0.26, 0.32, 0.26]} mat={MAT_PLANT_POT} />
      <Box pos={[0, 0.46, 0]}  size={[0.30, 0.20, 0.30]} mat={MAT_PLANT_LEAF} />
      <Box pos={[0, 0.60, 0]}  size={[0.24, 0.18, 0.24]} mat={MAT_PLANT_LEAF} />
      <Box pos={[0, 0.74, 0]}  size={[0.16, 0.16, 0.16]} mat={MAT_PLANT_LEAF} />
    </group>
  );
}

// ── Water fountain ────────────────────────────────────────────────────────────
function WaterFountain() {
  return (
    <group>
      <Box pos={[0, 0.22, 0]}   size={[0.32, 0.44, 0.22]} mat={MAT_FOUNTAIN} />
      <Box pos={[0, 0.46, 0.06]} size={[0.26, 0.06, 0.12]} mat={MAT_DOOR_METAL} />
    </group>
  );
}

// ── Trash can ─────────────────────────────────────────────────────────────────
function TrashCan() {
  return (
    <group>
      <Box pos={[0, 0.20, 0]} size={[0.22, 0.40, 0.22]} mat={MAT_TRASH} />
      <Box pos={[0, 0.41, 0]} size={[0.24, 0.02, 0.24]} mat={MAT_DOOR_FRAME} />
    </group>
  );
}

// ── Hallway chair ─────────────────────────────────────────────────────────────
function HallChair({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  const legH = 0.30, s = 0.54, seatH = 0.06;
  const lOff = s / 2 - 0.05;
  return (
    <group position={[x, FLOOR_H, z]} rotation={[0, rotY, 0]}>
      <Box pos={[0, legH + seatH / 2, 0]}                   size={[s, seatH, s]}      mat={MAT_HALL_CHAIR}    />
      <Box pos={[0, legH + seatH + 0.30, -s / 2 + 0.04]}   size={[s, 0.32, 0.06]}   mat={MAT_HALL_CHAIR}    />
      {([-lOff, lOff] as const).map(lx => ([-lOff, lOff] as const).map(lz => (
        <Box key={`${lx}-${lz}`} pos={[lx, legH / 2, lz]} size={[0.04, legH, 0.04]} mat={MAT_HALL_CHAIR_FR} />
      )))}
    </group>
  );
}

// ── StairGeometry ─────────────────────────────────────────────────────────────
function StairGeometry({
  rw, rd, direction = "ns", ascendDir = 1,
}: { rw: number; rd: number; direction?: "ns" | "ew"; ascendDir?: 1 | -1 }) {
  const mainLen = (direction === "ew" ? rw : rd) * 0.86;
  const perpLen = (direction === "ew" ? rd : rw) * 0.80;
  const N       = mainLen > 1.6 ? 9 : 6;
  const stepLen = mainLen / N;
  const topH    = WALL_H * 0.84;
  return (
    <group>
      {Array.from({ length: N }, (_, i) => {
        const h   = ascendDir === 1 ? ((i + 1) / N) * WALL_H : ((N - i) / N) * WALL_H;
        const pos = -mainLen / 2 + (i + 0.5) * stepLen;
        const position: [number,number,number] = direction === "ns" ? [0, FLOOR_H + h/2, pos] : [pos, FLOOR_H + h/2, 0];
        const args:     [number,number,number] = direction === "ns" ? [perpLen, h, stepLen] : [stepLen, h, perpLen];
        return (
          <mesh key={i} position={position}>
            <boxGeometry args={args} />
            <primitive object={i % 2 === 0 ? MAT_STAIR_LIGHT : MAT_STAIR_DARK} attach="material" />
          </mesh>
        );
      })}
      {([-1, 1] as const).map(side => {
        const railPos: [number,number,number] = direction === "ns"
          ? [side * (perpLen / 2 - 0.05), FLOOR_H + topH, 0]
          : [0, FLOOR_H + topH, side * (perpLen / 2 - 0.05)];
        const railArgs: [number,number,number] = direction === "ns" ? [0.028, 0.028, mainLen] : [mainLen, 0.028, 0.028];
        return <mesh key={side} position={railPos} ><boxGeometry args={railArgs} /><primitive object={MAT_RAIL} attach="material" /></mesh>;
      })}
      {([-1, 1] as const).map(side => [0.18, 0.5, 0.82].map((t, pi) => {
        const ph   = topH * (t * 0.36 + 0.66);
        const along = -mainLen / 2 + mainLen * t;
        const pos: [number,number,number] = direction === "ns"
          ? [side * (perpLen / 2 - 0.05), FLOOR_H + ph / 2, along]
          : [along, FLOOR_H + ph / 2, side * (perpLen / 2 - 0.05)];
        return <mesh key={`${side}-${pi}`} position={pos} ><boxGeometry args={[0.030, ph, 0.030]} /><primitive object={MAT_RAIL} attach="material" /></mesh>;
      }))}
    </group>
  );
}

// ── StairOpenFrame ─────────────────────────────────────────────────────────────
function StairOpenFrame({ rw, rd }: { rw: number; rd: number }) {
  const lipH = 0.10, lipT = 0.055, lipY = FLOOR_H + lipH / 2;
  return (
    <group>
      <Box pos={[0, FLOOR_H / 2, 0]}             size={[rw, FLOOR_H, rd]} mat={MAT_FLOOR} />
      <Box pos={[0, lipY, -(rd/2 - lipT/2)]}     size={[rw, lipH, lipT]}  mat={MAT_LIP}   />
      <Box pos={[0, lipY,  (rd/2 - lipT/2)]}     size={[rw, lipH, lipT]}  mat={MAT_LIP}   />
      <Box pos={[-(rw/2 - lipT/2), lipY, 0]}     size={[lipT, lipH, rd]}  mat={MAT_LIP}   />
      <Box pos={[ (rw/2 - lipT/2), lipY, 0]}     size={[lipT, lipH, rd]}  mat={MAT_LIP}   />
    </group>
  );
}

// ── DoorPanel — actual door ────────────────────────────────────────────────────
function DoorPanel({ wallZ, swingToward }: { wallZ: number; swingToward: 1 | -1 }) {
  const angle = Math.PI * 0.38 * swingToward; // ~68° into room
  const dH    = DOOR_H, dW = DOOR_W;
  return (
    <group position={[-dW / 2, FLOOR_H, wallZ]}>
      <group rotation={[0, angle, 0]}>
        <Box pos={[dW/2, dH/2, 0]}                       size={[dW, dH, 0.046]}         mat={MAT_DOOR_PANEL} />
        <Box pos={[dW/2, dH*0.72, 0.025]}                size={[dW*0.66, dH*0.34, 0.010]} mat={MAT_DOOR_FRAME} />
        <Box pos={[dW/2, dH*0.28, 0.025]}                size={[dW*0.66, dH*0.26, 0.010]} mat={MAT_DOOR_FRAME} />
        <Box pos={[dW/2, dH/2,   -0.025]}                size={[dW*0.66, dH*0.86, 0.010]} mat={MAT_DOOR_FRAME} />
        <mesh position={[dW*0.84, dH*0.48, 0.065]}>
          <sphereGeometry args={[0.050, 8, 6]} />
          <primitive object={MAT_DOOR_METAL} attach="material" />
        </mesh>
        <mesh position={[dW*0.84, dH*0.48, -0.065]}>
          <sphereGeometry args={[0.050, 8, 6]} />
          <primitive object={MAT_DOOR_METAL} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

// ── DoorWall ───────────────────────────────────────────────────────────────────
function DoorWall({
  rw, wallZ, mat, swingToward, showPlaque = false, plaqueName = "",
}: { rw: number; wallZ: number; mat: THREE.Material; swingToward: 1 | -1; showPlaque?: boolean; plaqueName?: string }) {
  const canFit = rw > DOOR_W * 1.9;
  const wallY  = FLOOR_H + WALL_H / 2;
  if (!canFit) {
    return <Box pos={[0, wallY, wallZ]} size={[rw, WALL_H, WALL_T]} mat={mat} />;
  }
  const sw  = (rw - DOOR_W) / 2;
  const sx  = (rw - sw) / 2;
  const topH = WALL_H - DOOR_H;
  const topY = FLOOR_H + DOOR_H + topH / 2;
  const midY = FLOOR_H + DOOR_H / 2;
  const WT   = WALL_T / 2;
  const pz   = wallZ + 0.06; // plaque offset from wall
  return (
    <>
      {([-1, 1] as const).map(s => <Box key={s} pos={[s*sx, wallY, wallZ]} size={[sw, WALL_H, WALL_T]} mat={mat} />)}
      <Box pos={[0, topY, wallZ]}                      size={[DOOR_W, topH, WALL_T]} mat={MAT_DOOR_FRAME} />
      {([-1, 1] as const).map(s => <Box key={s} pos={[s*(DOOR_W/2 - 0.020), midY, wallZ]} size={[0.040, DOOR_H, WALL_T*1.5]} mat={MAT_DOOR_FRAME} />)}
      <Box pos={[0, FLOOR_H + 0.008, wallZ]} size={[DOOR_W + 0.04, 0.016, WALL_T*1.4]} mat={MAT_DOOR_FRAME} />
      <DoorPanel wallZ={wallZ} swingToward={swingToward} />
      {showPlaque && (
        <group position={[sw/2 + 0.28, FLOOR_H + WALL_H*0.62, wallZ + 0.020]}>
          <RoomPlaque name={plaqueName} />
        </group>
      )}
    </>
  );
}

// ── WindowWall ────────────────────────────────────────────────────────────────
function WindowWall({
  rw, wallZ, nWin, mat, extDir,
}: { rw: number; wallZ: number; nWin: number; mat: THREE.Material; extDir: 1 | -1 }) {
  const wallY = FLOOR_H + WALL_H / 2;
  const xs    = Array.from({ length: nWin }, (_, i) => (2*i+1-nWin)*rw/(2*nWin));
  const ef    = wallZ + extDir * WALL_T * 0.5;
  return (
    <>
      <Box pos={[0, wallY, wallZ]} size={[rw, WALL_H, WALL_T]} mat={mat} />
      {xs.map((wx, i) => (
        <group key={i}>
          <Box pos={[wx, WIN_Y, ef + extDir*WIN_EXT*0.5]} size={[WIN_W+0.06, WIN_H+0.06, WIN_EXT]} mat={MAT_WIN_FRAME} />
          <Box pos={[wx, WIN_Y - WIN_H/2 - 0.014, ef + extDir*WIN_EXT]} size={[WIN_W+0.09, 0.028, WIN_EXT+0.030]} mat={MAT_WIN_FRAME} />
          <Box pos={[wx, WIN_Y, ef + extDir*WIN_EXT]} size={[WIN_W, WIN_H, 0.009]} mat={MAT_WIN_GLASS} />
          <Box pos={[wx, WIN_Y, ef + extDir*WIN_EXT]} size={[WIN_W, 0.020, 0.014]} mat={MAT_WIN_FRAME} />
          <Box pos={[wx, WIN_Y, ef + extDir*WIN_EXT]} size={[0.020, WIN_H, 0.014]} mat={MAT_WIN_FRAME} />
        </group>
      ))}
    </>
  );
}

// ── SlidingDoorWall ───────────────────────────────────────────────────────────
function SlidingDoorWall({ rw, wallZ, mat, extDir }: { rw: number; wallZ: number; mat: THREE.Material; extDir: 1 | -1 }) {
  const openW  = rw * 0.88, stubW = (rw-openW)/2, stubX = (rw-stubW)/2;
  const wallY  = FLOOR_H + WALL_H / 2;
  const pW     = openW * 0.46, pH = DOOR_H, pY = FLOOR_H + pH/2, pX = openW*0.22;
  const topH   = WALL_H - DOOR_H, topY = FLOOR_H + DOOR_H + topH/2;
  const panelZ = wallZ + extDir * (WALL_T/2 + 0.012);
  return (
    <>
      {stubW > 0.01 && ([-1, 1] as const).map(s => <Box key={s} pos={[s*stubX, wallY, wallZ]} size={[stubW, WALL_H, WALL_T]} mat={mat} />)}
      <Box pos={[0, topY, wallZ]}  size={[openW, topH, WALL_T]}          mat={MAT_DOOR_FRAME} />
      <Box pos={[0, FLOOR_H+0.009, wallZ]} size={[openW, 0.018, 0.060]} mat={MAT_TRACK} />
      {([-1, 1] as const).map(s => (
        <Box key={s} pos={[s*pX, pY, panelZ]} size={[pW, pH, 0.015]} mat={MAT_SLIDING_GLASS} />
      ))}
    </>
  );
}

// ── Whiteboard (in classrooms & offices) ─────────────────────────────────────
function Whiteboard({ rw, wallZ, extDir }: { rw: number; wallZ: number; extDir: 1 | -1 }) {
  const wbW = Math.min(rw * 0.65, 2.2), wbH = 0.90;
  const wbY = FLOOR_H + WALL_H * 0.68;
  const wbZ = wallZ + extDir * (WALL_T / 2 + 0.015);
  return (
    <>
      <Box pos={[0, wbY, wbZ]}         size={[wbW+0.10, wbH+0.10, 0.032]} mat={MAT_DOOR_FRAME} />
      <Box pos={[0, wbY, wbZ+extDir*0.018]} size={[wbW, wbH, 0.010]}       mat={MAT_WHITEBOARD}  />
      <Box pos={[0, wbY-wbH/2-0.02, wbZ+extDir*0.020]} size={[wbW+0.04, 0.040, 0.040]} mat={MAT_DOOR_FRAME} />
    </>
  );
}

// ── Furniture ─────────────────────────────────────────────────────────────────
type FP = { iW: number; iD: number; isNorth: boolean };

function OfficeFurniture({ iW, iD, isNorth }: FP) {
  const corrDir  = isNorth ? 1 : -1;
  const extDir   = -corrDir;
  const DW       = Math.min(iW * 0.58, 1.90), DD = 1.00;
  const deskZ    = extDir * (iD / 2 - FM - DD / 2);
  const chairZ   = deskZ + corrDir * (DD / 2 + 0.14 + 0.30 + 0.06);
  const visitZ   = corrDir * Math.min(Math.abs(chairZ) + 0.85, iD / 2 - FM - 0.30 - 0.06);
  const vx1      = iW * 0.20, vx2 = -vx1;

  return (
    <group position={[0, FLOOR_H, 0]}>
      <DeskMesh w={DW} d={DD} />
      <ChairMesh x={0} z={chairZ} rotY={corrDir === 1 ? Math.PI : 0} />
      {iW > 3.0 && <>
        <ChairMesh x={vx1} z={visitZ} rotY={corrDir === 1 ? 0 : Math.PI} />
        <ChairMesh x={vx2} z={visitZ} rotY={corrDir === 1 ? 0 : Math.PI} />
      </>}
    </group>
  );
}

function ClassroomFurniture({ iW, iD, isNorth }: FP) {
  const corrDir  = isNorth ? 1 : -1;
  const extDir   = -corrDir;
  const TDW      = Math.min(iW * 0.50, 1.40), TDD = 1.00, TC = 0.66;
  const SDW      = 0.80, SDD = 0.62, SC = 0.56;
  const rowGap   = 1.30;
  const cols     = iW > 3.4 ? 2 : 1;
  const colX     = iW * 0.24;
  const tDeskZ   = extDir * (iD / 2 - FM - TDD / 2);
  const tChairZ  = tDeskZ + corrDir * (TDD / 2 + 0.14 + 0.30 + 0.06);
  const sStart   = tChairZ + corrDir * (0.30 + 0.06 + 0.45 + SDD / 2);
  const maxFront = corrDir * (iD / 2 - FM - SC / 2 - 0.14);
  const rows: number[] = [];
  let z = sStart;
  while (corrDir * z <= corrDir * maxFront && rows.length < 5) { rows.push(z); z += corrDir * rowGap; }

  return (
    <group position={[0, FLOOR_H, 0]}>
      <DeskMesh w={TDW} d={TDD} />
      <ChairMesh x={0} z={tChairZ} rotY={corrDir === 1 ? Math.PI : 0} />
      {rows.map((rz, r) =>
        Array.from({ length: cols }, (_, c) => {
          const x      = cols === 1 ? 0 : (c === 0 ? -colX : colX);
          const czRaw  = rz + corrDir * (SDD / 2 + 0.12 + SC / 2);
          const czSafe = corrDir * Math.min(corrDir * czRaw, corrDir * maxFront);
          return (
            <group key={`${r}-${c}`} position={[x, 0, 0]}>
              <group position={[0, 0, rz]}><DeskMesh w={SDW} d={SDD} legH={0.30} /></group>
              <ChairMesh x={0} z={czSafe} rotY={corrDir === 1 ? Math.PI : 0} s={SC} />
            </group>
          );
        })
      )}
    </group>
  );
}

function CanteenFurniture({ iW, iD, isNorth }: FP) {
  const corrDir  = isNorth ? 1 : -1;
  const extDir   = -corrDir;
  const counterW = iW * 0.70;
  const counterZ = extDir * (iD / 2 - FM - 0.50);
  const nCols    = Math.max(3, Math.floor(iW * 0.72 / 1.80));
  const xStep    = (iW * 0.72) / nCols;
  const xStart   = -iW * 0.34;
  const row0Z    = counterZ + corrDir * (0.50 + 0.70 + 0.72);
  const rows     = [row0Z, row0Z + corrDir * 1.85, row0Z + corrDir * 3.70].filter(
    z => Math.abs(z) + 0.74 < iD / 2 - FM
  );
  const safeZ    = (z: number) => Math.max(-iD/2+FM+0.38, Math.min(iD/2-FM-0.38, z));

  return (
    <group position={[0, FLOOR_H, 0]}>
      <DeskMesh w={counterW} d={0.96} topH={0.12} legH={0.55} matTop={MAT_COUNTER} matLeg={MAT_COUNTER} />
      {rows.map((rz, ri) =>
        Array.from({ length: nCols }, (_, ci) => {
          const x = xStart + ci * xStep + xStep * 0.5;
          return (
            <group key={`${ri}-${ci}`}>
              <group position={[x, 0, rz]}>
                <DeskMesh w={1.40} d={1.20} topH={0.07} legH={0.36} matTop={MAT_TABLE_TOP} matLeg={MAT_TABLE_LEG} />
              </group>
              {[[x, rz-0.90], [x, rz+0.90], [x-0.96, rz], [x+0.96, rz]].map(([cx, cz], ci2) => (
                <ChairMesh key={ci2} x={cx as number} z={safeZ(cz as number)} s={0.52}
                  matSeat={MAT_HALL_CHAIR} matBack={MAT_HALL_CHAIR} matFrame={MAT_CHAIR_FRAME} />
              ))}
            </group>
          );
        })
      )}
    </group>
  );
}

function BookstoreFurniture({ iW, iD }: { iW: number; iD: number }) {
  const n = Math.max(3, Math.floor(iW / 1.30));
  const shelfH = WALL_H * 0.68;
  const step = (iW * 0.82) / Math.max(1, n - 1);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -iW * 0.40 + i * step;
        const sH = shelfH, sW = iD * 0.54;
        return (
          <group key={i} position={[x, FLOOR_H + sH/2, 0]}>
            <Box pos={[0, 0, 0]}        size={[0.32, sH, sW]}     mat={MAT_SHELF} />
            {[0.22, 0.44, 0.66, 0.88].map(t => (
              <Box key={t} pos={[0, sH*(t-0.5), 0]} size={[0.36, 0.036, sW+0.04]} mat={MAT_DESK_LEG} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function LabFurniture({ iW, iD, isNorth }: FP) {
  const corrDir = isNorth ? 1 : -1;
  const extDir  = -corrDir;
  const benchZ  = extDir * (iD / 2 - FM - 0.50);
  const sideX   = iW / 2 - FM - 0.50;
  return (
    <group position={[0, FLOOR_H, 0]}>
      <group position={[0, 0, benchZ]}>
        <DeskMesh w={iW*0.78} d={1.00} legH={0.44} matTop={MAT_COUNTER} matLeg={MAT_COUNTER} />
      </group>
      <group position={[sideX, 0, 0]}>
        <DeskMesh w={1.00} d={iD*0.52} legH={0.44} matTop={MAT_COUNTER} matLeg={MAT_COUNTER} />
      </group>
      {[-0.28, 0, 0.28].map((xf, i) => (
        <ChairMesh key={i} x={xf*iW} z={corrDir * 0.74} rotY={corrDir===1?Math.PI:0} s={0.52} />
      ))}
    </group>
  );
}

function ToiletFurniture({ iW, iD }: { iW: number; iD: number }) {
  const n = Math.max(2, Math.floor(iW / 1.10));
  const stallW = iW / n, divH = WALL_H * 0.62, stallD = iD * 0.52;
  return (
    <group>
      {Array.from({ length: n-1 }, (_, i) => (
        <Box key={i} pos={[-iW/2+(i+1)*stallW, FLOOR_H+divH/2, 0]} size={[0.06, divH, stallD]} mat={MAT_STALL} />
      ))}
      <Box pos={[0, FLOOR_H+divH/2, stallD/2]}         size={[iW, divH, 0.06]}             mat={MAT_STALL} />
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} pos={[-iW/2+(i+0.5)*stallW, FLOOR_H+0.065/2, iD*0.18]} size={[stallW*0.54, 0.065, 0.52]} mat={MAT_FLOOR} />
      ))}
    </group>
  );
}

function ClinicFurniture({ iW, iD, isNorth }: FP) {
  const corrDir = isNorth ? 1 : -1;
  const extDir  = -corrDir;
  const bedZ    = extDir * (iD / 2 - FM - 0.72);
  const deskZ   = corrDir * (iD / 2 - FM - 0.55);
  const chairZ  = corrDir * Math.min(Math.abs(deskZ)+0.74, iD/2-FM-0.38);
  return (
    <group position={[0, FLOOR_H, 0]}>
      <group position={[iW*0.12, 0, bedZ]}>
        <DeskMesh w={iW*0.46} d={1.45} legH={0.32} topH={0.10} matTop={MAT_COUNTER} matLeg={MAT_COUNTER} />
      </group>
      <group position={[-iW*0.22, 0, deskZ]}>
        <DeskMesh w={iW*0.44} d={0.92} />
      </group>
      <ChairMesh x={-iW*0.22} z={chairZ} rotY={corrDir===1?Math.PI:0} s={0.62} />
    </group>
  );
}

interface Room {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  type: string;
  floor?: number;
}

function RoomFurniture({ room, rw, rd }: { room: Room; rw: number; rd: number }) {
  const { hallTop } = useContext(FloorCtx);
  const isNorth = room.z < hallTop;
  const iW = rw - WALL_T * 2, iD = rd - WALL_T * 2;
  const p  = { iW, iD, isNorth };
  switch (room.type) {
    case "office":    return <OfficeFurniture {...p} />;
    case "classroom": return <ClassroomFurniture {...p} />;
    case "lab":       return <LabFurniture {...p} />;
    case "comfort":   return <ToiletFurniture {...p} />;
    case "facility":
      if (room.id === "f1_canteen")         return <CanteenFurniture {...p} />;
      if (room.id === "f1_bookstore")       return <BookstoreFurniture {...p} />;
      if (room.id === "f1_birthing_clinic") return <ClinicFurniture {...p} />;
      return null;
    default: return null;
  }
}

// ── Room label ─────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  office: "#1d4ed8", classroom: "#15803d", facility: "#b45309",
  comfort: "#7c3aed", stair: "#374151", lobby: "#0369a1",
  utility: "#9ca3af", lab: "#0891b2",
};

function RoomLabel({ room }: { room: Room }) {
  const color = TYPE_COLOR[room.type] ?? "#374151";
  if (room.type === "utility") return null;
  return (
    <Html center position={[0, WALL_H + 0.35, 0]} zIndexRange={[0, 5]} style={{ pointerEvents: "none" }}>
      <div style={{
        background: "rgba(255,255,255,0.94)",
        border: `1.5px solid ${color}`,
        borderRadius: "3px",
        padding: "2px 7px",
        fontSize: "6.5px",
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
        letterSpacing: "0.04em",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        fontFamily: "system-ui, sans-serif",
      }}>
        {room.name.toUpperCase()}
      </div>
    </Html>
  );
}

// ── 3D Path rendering ─────────────────────────────────────────────────────────

// Single segment: a flat box "decal" sitting on the floor between two points
function PathSegment({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#2563eb", transparent: true, opacity: 0.88 }), []);
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.001) return null;
  const angle = Math.atan2(dx, dz);
  return (
    <mesh position={[(ax + bx) / 2, FLOOR_H + 0.018, (az + bz) / 2]} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.10, 0.028, len]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// PathMarker is defined in the Scene section below (supports yOffset for multi-floor)

// Stair indicator: arrow pointing up or down
function StairMarker({ x, z }: { x: number; z: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f59e0b" }), []);
  return (
    <group position={[x, FLOOR_H + 0.02, z]}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 6]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Vertical post */}
      <mesh position={[0, 0.30, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.50, 6]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
}

// ── CameraFollower ─────────────────────────────────────────────────────────────
// Keeps the orthographic camera behind and above the walking figure.
// "Behind" means: offset in the opposite direction the figure is facing,
// so as the figure turns the camera smoothly swings around to its back.

const CAM_LERP        = 0.05;   // position smoothing (lower = smoother but laggier)
const CAM_ROT_LERP    = 0.04;   // angle smoothing
const CAM_BACK_DIST   = 28;     // world-units behind the figure
const CAM_HEIGHT      = 22;     // world-units above the figure
const CAM_SIDE_DIST   = 18;     // slight side offset for isometric feel
const CAM_ZOOM        = 14;     // orthographic zoom while following

function CameraFollower({ figurePos }: { figurePos: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree() as { camera: THREE.OrthographicCamera & THREE.Camera };
  const camYawRef  = useRef(Math.PI * 0.25);  // start at roughly isometric angle
  const prevPosRef = useRef(new THREE.Vector3());
  const targetRef  = useRef(new THREE.Vector3());

  // Set initial zoom once
  useEffect(() => {
    if ((camera as any).isOrthographicCamera) {
      (camera as any).zoom = CAM_ZOOM;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame((_, delta) => {
    const fp = figurePos.current;

    // Derive figure's yaw from its velocity (movement direction) each frame
    const dx = fp.x - prevPosRef.current.x;
    const dz = fp.z - prevPosRef.current.z;
    if (Math.hypot(dx, dz) > 0.0005) {
      const movYaw = Math.atan2(dx, dz); // yaw the figure is heading toward
      // Camera sits BEHIND the figure — 180° opposite of movement direction
      const desiredCamYaw = movYaw + Math.PI;
      // Shortest-angle lerp
      let diff = desiredCamYaw - camYawRef.current;
      if (diff >  Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      camYawRef.current += diff * Math.min(1, delta * 3.5);
    }
    prevPosRef.current.copy(fp);

    // Build desired camera position: behind + above + slight right offset
    const yaw   = camYawRef.current;
    const back  = new THREE.Vector3(Math.sin(yaw) * CAM_BACK_DIST, 0, Math.cos(yaw) * CAM_BACK_DIST);
    const right = new THREE.Vector3(Math.cos(yaw) * CAM_SIDE_DIST, 0, -Math.sin(yaw) * CAM_SIDE_DIST);
    const desired = new THREE.Vector3(
      fp.x + back.x + right.x,
      fp.y + CAM_HEIGHT,
      fp.z + back.z + right.z,
    );

    // Smooth target (what camera looks at) tracks figure position
    targetRef.current.lerp(fp, CAM_LERP * 2);

    // Smooth camera position
    camera.position.lerp(desired, CAM_LERP);
    camera.lookAt(targetRef.current);
    camera.updateMatrixWorld();
  });

  return null;
}

// ── Walking figure ────────────────────────────────────────────────────────────
// Simple low-poly humanoid that walks along the path points on the current floor.
// Geometry uses only Box + Sphere + Cylinder (safe for Three.js r128).

const WALK_SPEED = 7.0; // world-units per second

// Materials (module-level singletons — reused across re-renders)
const MAT_SKIN   = new THREE.MeshLambertMaterial({ color: "#fcd5a8" });
const MAT_SHIRT  = new THREE.MeshLambertMaterial({ color: "#1d4ed8" });
const MAT_PANTS  = new THREE.MeshLambertMaterial({ color: "#1e293b" });
const MAT_SHOES  = new THREE.MeshLambertMaterial({ color: "#292524" });
const MAT_HAIR   = new THREE.MeshLambertMaterial({ color: "#3b1a08" });

function FigureGeometry({ t }: { t: number }): React.ReactElement {
  // Pure rotation-based limb swing — no position offsets that cause feet to drift.
  // Each limb pivots from its joint (hip/shoulder) with the mesh offset inside the group.
  const swing    =  Math.sin(t * Math.PI * 2);   // -1..1
  const legAngle =  swing * 0.50;                 // max ±~29° leg swing
  const armAngle = -swing * 0.40;                 // arms opposite legs
  const bodyBob  =  Math.abs(swing) * 0.010;      // subtle vertical bob

  return (
    <group position={[0, bodyBob, 0]}>

      {/* ── Right leg: pivot group at hip joint y=0.52, mesh hangs down ── */}
      <group position={[ 0.07, 0.52, 0]} rotation={[legAngle, 0, 0]}>
        <mesh position={[0, -0.10, 0]}>
          <boxGeometry args={[0.10, 0.20, 0.10]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        {/* Knee sub-pivot: at y=-0.22 relative to hip; only bends when leg swings back */}
        <group position={[0, -0.22, 0]} rotation={[Math.max(0, -legAngle) * 0.6, 0, 0]}>
          <mesh position={[0, -0.11, 0]}>
            <boxGeometry args={[0.08, 0.22, 0.08]} />
            <primitive object={MAT_PANTS} attach="material" />
          </mesh>
          <mesh position={[0, -0.24, 0.04]}>
            <boxGeometry args={[0.09, 0.06, 0.16]} />
            <primitive object={MAT_SHOES} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ── Left leg: opposite phase ── */}
      <group position={[-0.07, 0.52, 0]} rotation={[-legAngle, 0, 0]}>
        <mesh position={[0, -0.10, 0]}>
          <boxGeometry args={[0.10, 0.20, 0.10]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        <group position={[0, -0.22, 0]} rotation={[Math.max(0, legAngle) * 0.6, 0, 0]}>
          <mesh position={[0, -0.11, 0]}>
            <boxGeometry args={[0.08, 0.22, 0.08]} />
            <primitive object={MAT_PANTS} attach="material" />
          </mesh>
          <mesh position={[0, -0.24, 0.04]}>
            <boxGeometry args={[0.09, 0.06, 0.16]} />
            <primitive object={MAT_SHOES} attach="material" />
          </mesh>
        </group>
      </group>

      {/* Torso */}
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.26, 0.28, 0.16]} />
        <primitive object={MAT_SHIRT} attach="material" />
      </mesh>

      {/* ── Right arm: pivot from shoulder at y=0.78 ── */}
      <group position={[ 0.17, 0.78, 0]} rotation={[armAngle, 0, 0.10]}>
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.08, 0.26, 0.08]} />
          <primitive object={MAT_SHIRT} attach="material" />
        </mesh>
      </group>

      {/* ── Left arm ── */}
      <group position={[-0.17, 0.78, 0]} rotation={[-armAngle, 0, -0.10]}>
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.08, 0.26, 0.08]} />
          <primitive object={MAT_SHIRT} attach="material" />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.10, 8]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Hair cap */}
      <mesh position={[0, 1.04, 0]}>
        <sphereGeometry args={[0.135, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>
    </group>
  );
}

function WalkingFigure({
  points,
  loop = true,
  onReachedEnd,
  figurePos,
}: {
  points: Array<{ x: number; y: number; z: number }>;
  loop?: boolean;
  onReachedEnd?: () => void;
  figurePos?: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef    = useRef<THREE.Group | null>(null);
  const limbRef     = useRef<THREE.Group | null>(null);  // inner group for limb animation
  const progressRef = useRef(0);
  const cycleRef    = useRef(0);
  const doneRef     = useRef(false);
  const prevKeyRef  = useRef('');
  const facingRef   = useRef(0);   // current yaw (radians), smoothed

  // Reset progress whenever points change (new route)
  const pointsKey = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`).join('|');
  if (prevKeyRef.current !== pointsKey) {
    prevKeyRef.current = pointsKey;
    progressRef.current = 0;
    doneRef.current = false;
    // Snap facing to initial direction on new route
    if (points.length >= 2) {
      facingRef.current = Math.atan2(points[1].x - points[0].x, points[1].z - points[0].z);
    }
  }

  const { cumDist, totalDist } = useMemo(() => {
    const cumDist = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dz = points[i].z - points[i - 1].z;
      cumDist.push(cumDist[i - 1] + Math.hypot(dx, dy, dz));
    }
    return { cumDist, totalDist: cumDist[cumDist.length - 1] || 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  const onReachedEndRef = useRef(onReachedEnd);
  onReachedEndRef.current = onReachedEnd;

  useFrame((_, delta) => {
    if (!groupRef.current || !limbRef.current || points.length < 2 || totalDist < 0.001) return;
    if (doneRef.current && !loop) return;

    progressRef.current += WALK_SPEED * delta;

    if (!loop && progressRef.current >= totalDist) {
      progressRef.current = totalDist;
      if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(() => onReachedEndRef.current?.(), 350);
      }
    } else if (loop) {
      progressRef.current = progressRef.current % totalDist;
    }

    const dist = Math.min(progressRef.current, totalDist);

    // Find which segment we're on
    let seg = 0;
    for (let i = 1; i < cumDist.length; i++) {
      if (cumDist[i] >= dist) { seg = i - 1; break; }
      seg = i - 1;
    }
    const segLen = cumDist[seg + 1] - cumDist[seg];
    const t      = segLen > 0 ? (dist - cumDist[seg]) / segLen : 0;
    const a = points[seg], b = points[Math.min(seg + 1, points.length - 1)];

    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    const pz = a.z + (b.z - a.z) * t;

    groupRef.current.position.set(px, py, pz);
    if (figurePos) figurePos.current.set(px, py, pz);

    // ── Smooth yaw (rotation.y) — only from horizontal movement ──────────────
    const dx = b.x - a.x, dz = b.z - a.z;
    const horizDist = Math.hypot(dx, dz);
    if (horizDist > 0.001) {
      const targetYaw = Math.atan2(dx, dz);
      // Shortest-angle lerp to avoid 360° spin
      let diff = targetYaw - facingRef.current;
      if (diff >  Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      facingRef.current += diff * Math.min(1, delta * 12); // fast but smooth
      groupRef.current.rotation.y = facingRef.current;
    }

    // ── Pitch (rotation.x): tilt figure on stairs, but keep it gentle ────────
    // Apply to the group directly — rotation.y is already set so this tilts
    // along the figure's own forward axis (local X in Three.js is not used here;
    // we tilt the outer group on world X which looks correct from isometric view).
    const dy = b.y - a.y;
    if (dy !== 0 && horizDist > 0.001) {
      const pitch = Math.atan2(dy, horizDist) * 0.5;  // halve for visual comfort
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pitch, delta * 8);
    } else {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
    }

    // ── Walk cycle: drive limb animation via ref mutation, no setState ────────
    cycleRef.current = (cycleRef.current + delta * WALK_SPEED * 1.5) % 1;
    const swing = Math.sin(cycleRef.current * Math.PI * 2);
    const legAngle = swing * 0.50;
    const armAngle = -swing * 0.40;
    const bodyBob  = Math.abs(swing) * 0.010;

    // limbRef points to the inner <group position={[0,bodyBob,0]}> of FigureGeometry.
    // We directly mutate its children by index instead of re-rendering via setState.
    const fig = limbRef.current;
    if (fig && fig.children.length >= 8) {
      // child index map (see FigureGeometry order):
      // 0 = right hip group, 1 = left hip group,
      // 2 = torso, 3 = right shoulder group, 4 = left shoulder group
      // 5 = neck, 6 = head, 7 = hair
      fig.position.y = bodyBob;
      const rHip = fig.children[0] as THREE.Group;
      const lHip = fig.children[1] as THREE.Group;
      const rSho = fig.children[3] as THREE.Group;
      const lSho = fig.children[4] as THREE.Group;
      if (rHip) { rHip.rotation.x = legAngle; }
      if (lHip) { lHip.rotation.x = -legAngle; }
      // Knee sub-pivot (first child of each hip group)
      const rKnee = rHip?.children[1] as THREE.Group;
      const lKnee = lHip?.children[1] as THREE.Group;
      if (rKnee) rKnee.rotation.x = Math.max(0, -legAngle) * 0.6;
      if (lKnee) lKnee.rotation.x = Math.max(0, legAngle) * 0.6;
      if (rSho) rSho.rotation.x = armAngle;
      if (lSho) lSho.rotation.x = -armAngle;
    }
  });

  if (points.length < 2) return null;

  return (
    <group ref={groupRef}>
      {/* Inner group ref for direct limb mutation each frame */}
      <group ref={limbRef}>
        <FigureGeometry t={0} />
      </group>
    </group>
  );
}

// RoutePath replaced by UnifiedRoutePath in the Scene section below.
// Keeping a stub so any stray references don't break TypeScript.
function RoutePath(_props: any) { return null; }

// ── RoomMesh ──────────────────────────────────────────────────────────────────
function RoomMesh({ room, hideLabel = false }: { room: Room; hideLabel?: boolean }) {
  const { ftx, ftz, hallTop, hallBottom } = useContext(FloorCtx);
  const cx = ftx(room.x + room.w / 2);
  const cz = ftz(room.z + room.d / 2);
  const rw = tw(room.w), rd = tw(room.d);

  const isStair    = room.type === "stair";
  const isLobby    = room.type === "lobby";
  const noDecor    = room.type === "utility" || room.id.includes("pipe");
  // Dynamic row detection using per-floor hallway bounds
  const isNorthRow = room.z < hallTop;
  const isSouthRow = room.z >= hallBottom;

  // Stair direction: end stairs (left/right) are east-west, center stairs are north-south
  const isEndStair = room.id.endsWith("_left") || room.id.endsWith("_right");
  const stairDir:  "ew" | "ns" = isEndStair ? "ew" : "ns";
  const ascendDir: 1 | -1      = room.id.endsWith("_left") ? -1 : 1;

  const nWin    = (!noDecor && !isStair && !isLobby && rw >= 0.60)
    ? Math.min(5, Math.max(1, Math.floor(rw / 1.30)))
    : 0;
  const hasDoor = !noDecor && !isStair && rw > DOOR_W * 1.9 && (isNorthRow || isSouthRow);

  const WT     = WALL_T / 2;
  const northZ = -(rd / 2 - WT);
  const southZ =  (rd / 2 - WT);

  // Whiteboards appear on the exterior wall of classrooms/offices facing inward
  const hasWB  = (room.type === "classroom" || room.type === "office") && rw > 0.8;
  const wbWallZ = isNorthRow ? northZ : southZ;
  const wbExtDir: 1 | -1 = isNorthRow ? -1 : 1;

  // ── Stairwell ───────────────────────────────────────────────────────────────
  if (isStair) {
    // Hallway-end stairs (left/right) get side enclosure walls
    const isLeftStair  = room.id.endsWith("_stair_left");
    const isRightStair = room.id.endsWith("_stair_right");
    // South-side stairs (centerb, centerc, mid) sit below the hallway
    const isSouthStair = room.id.includes("_stair_center") || room.id.includes("_stair_mid");
    return (
      <group position={[cx, 0, cz]}>
        <StairOpenFrame rw={rw} rd={rd} />
        <StairGeometry rw={rw} rd={rd} direction={stairDir} ascendDir={ascendDir} />
        {isLeftStair  && <Box pos={[-(rw/2-WT), FLOOR_H+WALL_H/2, 0]} size={[WALL_T, WALL_H, rd]} mat={MAT_WALL_SIDE} />}
        {isRightStair && <Box pos={[ (rw/2-WT), FLOOR_H+WALL_H/2, 0]} size={[WALL_T, WALL_H, rd]} mat={MAT_WALL_SIDE} />}
        {isSouthStair && <Box pos={[0, FLOOR_H+WALL_H/2, rd/2-WT]}    size={[rw, WALL_H, WALL_T]}  mat={MAT_WALL_BACK} />}
        {isSouthStair && <Box pos={[0, FLOOR_H+WALL_H*0.18, -(rd/2-WT)]} size={[rw, WALL_H*0.36, WALL_T]} mat={MAT_LIP} />}
        {!hideLabel && <RoomLabel room={room} />}
      </group>
    );
  }

  // ── Lobby ────────────────────────────────────────────────────────────────────
  if (isLobby && (isNorthRow || isSouthRow)) {
    const extWallZ: number = isNorthRow ? northZ : southZ;
    const extDir: 1 | -1  = isNorthRow ? -1 : 1;
    const extMat           = isNorthRow ? MAT_WALL_FRONT : MAT_WALL_BACK;
    return (
      <group position={[cx, 0, cz]}>
        <Box pos={[0, FLOOR_H/2, 0]} size={[rw, FLOOR_H, rd]} mat={MAT_FLOOR} />
        <SlidingDoorWall rw={rw} wallZ={extWallZ} mat={extMat} extDir={extDir} />
        {([-1, 1] as const).map(s => (
          <Box key={s} pos={[s*(rw/2-WT), FLOOR_H+WALL_H/2, 0]} size={[WALL_T, WALL_H, rd]} mat={MAT_WALL_SIDE} />
        ))}
        {/* Potted plants in lobby corners */}
        <group position={[-rw/2+FM+0.18, FLOOR_H, isNorthRow ? northZ+0.36 : southZ-0.36]}>
          <PlantPot />
        </group>
        {!hideLabel && <RoomLabel room={room} />}
      </group>
    );
  }

  // ── Standard room ─────────────────────────────────────────────────────────
  return (
    <group position={[cx, 0, cz]}>
      <Box pos={[0, FLOOR_H/2, 0]} size={[rw, FLOOR_H, rd]} mat={MAT_FLOOR} />

      {/* NORTH wall */}
      {isNorthRow && nWin > 0
        ? <WindowWall rw={rw} wallZ={northZ} nWin={nWin} mat={MAT_WALL_FRONT} extDir={-1} />
        : isSouthRow && hasDoor
          ? <DoorWall rw={rw} wallZ={northZ} mat={MAT_WALL_FRONT} swingToward={1} showPlaque plaqueName={room.name} />
          : <Box pos={[0, FLOOR_H+WALL_H/2, northZ]} size={[rw, WALL_H, WALL_T]} mat={MAT_WALL_FRONT} />
      }

      {/* SOUTH wall */}
      {isSouthRow && nWin > 0
        ? <WindowWall rw={rw} wallZ={southZ} nWin={nWin} mat={MAT_WALL_BACK} extDir={1} />
        : isNorthRow && hasDoor
          ? <DoorWall rw={rw} wallZ={southZ} mat={MAT_WALL_BACK} swingToward={-1} showPlaque plaqueName={room.name} />
          : <Box pos={[0, FLOOR_H+WALL_H/2, southZ]} size={[rw, WALL_H, WALL_T]} mat={MAT_WALL_BACK} />
      }

      {/* SIDE walls */}
      {([-1, 1] as const).map(s => (
        <Box key={s} pos={[s*(rw/2-WT), FLOOR_H+WALL_H/2, 0]} size={[WALL_T, WALL_H, rd]} mat={MAT_WALL_SIDE} />
      ))}

      {/* Whiteboard */}
      {hasWB && <Whiteboard rw={rw} wallZ={wbWallZ} extDir={wbExtDir} />}

      <RoomFurniture room={room} rw={rw} rd={rd} />
      {!hideLabel && <RoomLabel room={room} />}
    </group>
  );
}

// ── Hallway decor ──────────────────────────────────────────────────────────────
function HallwayDecor() {
  // Hallway walls z in SVG: north = 383, south = 479. Chairs sit just inside.
  const northRowZ = tz(383 + 16);  // chairs along north hallway wall
  const southRowZ = tz(479 - 16);  // chairs along south hallway wall

  // Chair clusters at waiting zones (SVG x positions)
  const northChairGroups = [
    [200, 240, 280],      // near north lobby
    [780, 820],           // near stair_mid
    [1070, 1110],         // near stair_center
    [1380, 1420],         // east section
  ];
  const southChairGroups = [
    [300, 340],           // near south lobby SW
    [600, 640],           // near igs faculty
    [980, 1020, 1060],    // near class4
    [1200, 1240],         // east south section
  ];

  // Bulletin boards along hallway walls (at south face of north rooms and north face of south rooms)
  const northBoardXs = [460, 680, 980, 1240]; // x positions in SVG
  const southBoardXs = [400, 700, 1050, 1300];

  // Direction signs in hallway center
  const signXs = [590, 1020, 1330];

  // Plants at lobby corners (already handled in lobby), add a few extra
  const plantPositions = [
    { x: tx(152), z: tz(430) },
    { x: tx(1652), z: tz(430) },
  ];

  return (
    <group>
      {/* North-side hallway chairs (facing south = rotY=0) */}
      {northChairGroups.flatMap((group, gi) =>
        group.map((svgX, ci) => (
          <HallChair key={`nc-${gi}-${ci}`} x={tx(svgX)} z={northRowZ} rotY={0} />
        ))
      )}

      {/* South-side hallway chairs (facing north = rotY=Math.PI) */}
      {southChairGroups.flatMap((group, gi) =>
        group.map((svgX, ci) => (
          <HallChair key={`sc-${gi}-${ci}`} x={tx(svgX)} z={southRowZ} rotY={Math.PI} />
        ))
      )}

      {/* Bulletin boards on north hallway wall (south face of north row) */}
      {northBoardXs.map((svgX, i) => (
        <group key={`nb-${i}`} position={[tx(svgX), FLOOR_H + WALL_H * 0.62, tz(383) + WALL_T/2 + 0.022]}>
          <BulletinBoard w={1.40} h={0.92} />
        </group>
      ))}

      {/* Bulletin boards on south hallway wall (north face of south row) */}
      {southBoardXs.map((svgX, i) => (
        <group key={`sb-${i}`} position={[tx(svgX), FLOOR_H + WALL_H * 0.62, tz(479) - WALL_T/2 - 0.022]} rotation={[0, Math.PI, 0]}>
          <BulletinBoard w={1.40} h={0.92} />
        </group>
      ))}

      {/* Directional signs on a post in hallway center */}
      {signXs.map((svgX, i) => (
        <group key={`sign-${i}`} position={[tx(svgX), FLOOR_H + WALL_H * 0.78, tz(431)]}>
          <Box pos={[0, -WALL_H*0.28, 0]} size={[0.040, WALL_H*0.56, 0.040]} mat={MAT_DOOR_FRAME} />
          <DirectionalSign />
        </group>
      ))}

      {/* Water fountain near male restroom */}
      <group position={[tx(130), FLOOR_H, tz(420)]}>
        <WaterFountain />
      </group>

      {/* Trash cans near lobbies */}
      {[tx(248), tx(690), tx(860), tx(1568)].map((x, i) => (
        <group key={`trash-${i}`} position={[x, FLOOR_H, tz(410)]}>
          <TrashCan />
        </group>
      ))}

      {/* Extra plants at hallway ends */}
      {plantPositions.map((pos, i) => (
        <group key={`plant-${i}`} position={[pos.x, FLOOR_H, pos.z]}>
          <PlantPot />
        </group>
      ))}
    </group>
  );
}

// ── Hallway centre dashes ──────────────────────────────────────────────────────
function HallwayCenterLine() {
  const cx  = tx(HALLWAY.x + HALLWAY.w / 2);
  const cz  = tz(HALLWAY.z + HALLWAY.d / 2);
  const hw  = tw(HALLWAY.w);
  const n   = 32;
  const dw  = hw / (n * 2);
  const mat = new THREE.MeshPhongMaterial({ color: "#b8bcbf" });
  return (
    <group position={[cx, FLOOR_H + 0.002, cz]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-hw/2 + dw*(2*i+0.5), 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[dw*0.55, 0.10]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ── School exterior banner ────────────────────────────────────────────────────
function ExteriorSignage() {
  // Large "GORDON COLLEGE" sign above the main north lobby exterior (above f1_lobby_c)
  const lobbyCx = tx(689 + 163/2);
  const northWallZ = tz(222) - WALL_T / 2 - 0.05;
  const bannerY = FLOOR_H + WALL_H + 0.28;
  return (
    <group>
      {/* Main banner backing */}
      <group position={[lobbyCx, bannerY, northWallZ]}>
        <Box pos={[0, 0, 0]}       size={[3.20, 0.55, 0.055]} mat={MAT_SIGN_BLUE}  />
        <Box pos={[0, 0, 0.030]}   size={[3.08, 0.43, 0.014]} mat={MAT_SIGNAGE}    />
        <Box pos={[0, -0.34, 0]}   size={[3.20, 0.16, 0.042]} mat={MAT_SIGN_RED}   />
        <Box pos={[0, -0.34, 0.024]} size={[3.08, 0.08, 0.010]} mat={MAT_SIGNAGE}  />
      </group>
      {/* Small department signs above room windows (canteen area) */}
      <group position={[tx(244+222), bannerY - 0.05, northWallZ]}>
        <Box pos={[0, 0, 0]}     size={[1.60, 0.32, 0.040]} mat={MAT_SIGN_BLUE} />
        <Box pos={[0, 0, 0.022]} size={[1.52, 0.24, 0.012]} mat={MAT_SIGNAGE}   />
      </group>
    </group>
  );
}


// ── Per-floor layout config ────────────────────────────────────────────────────
// All floors share the same ftx/ftz coordinate origin (Floor-1 center) so that
// a single WalkingFigure can walk straight from floor 1 to floor 6 without any
// per-floor coordinate re-mapping.  Each floor group is simply lifted on the Y
// axis by (floorIndex * INTER_FLOOR_H).

const INTER_FLOOR_H = 6.0; // world-units between floor levels

const FLOOR_CONFIGS_ALL: Record<number, {
  rooms:      typeof FLOOR1_ROOMS;
  hallData:   { x: number; z: number; w: number; d: number };
  hallTop:    number;
  hallBottom: number;
  centerX:    number;
  centerZ:    number;
}> = {
  1: {
    rooms:    FLOOR1_ROOMS,
    hallData: { x: 16,  z: 370, w: 1639, d: 122 },
    hallTop:  383, hallBottom: 479,
    centerX:  (16 + 1655) / 2,   centerZ: (222 + 640) / 2,
  },
  2: {
    rooms:    FLOOR2_ROOMS,
    hallData: { x: 26,  z: 380, w: 1620, d: 80 },
    hallTop:  380, hallBottom: 460,
    centerX:  (26 + 1646) / 2,   centerZ: (160 + 660) / 2,
  },
  3: {
    rooms:    FLOOR3_ROOMS,
    hallData: { x: 121, z: 448, w: 1498, d: 60 },
    hallTop:  448, hallBottom: 508,
    centerX:  (121 + 1619) / 2,  centerZ: (312 + 646) / 2,
  },
  4: {
    rooms:    FLOOR4_ROOMS,
    hallData: { x: 109, z: 394, w: 1509, d: 93 },
    hallTop:  394, hallBottom: 487,
    centerX:  (109 + 1618) / 2,  centerZ: (246 + 650) / 2,
  },
  5: {
    rooms:    FLOOR5_ROOMS,
    hallData: { x: 84,  z: 461, w: 1547, d: 56 },
    hallTop:  461, hallBottom: 517,
    centerX:  (84 + 1631) / 2,   centerZ: (331 + 650) / 2,
  },
  6: {
    rooms:    FLOOR6_ROOMS,
    hallData: { x: 118, z: 465, w: 1537, d: 68 },
    hallTop:  465, hallBottom: 533,
    centerX:  (118 + 1655) / 2,  centerZ: (240 + 700) / 2,
  },
};

// Shared (Floor-1) coordinate transform — used for ALL floors so path node
// coordinates are directly comparable with geometry coordinates.
const SHARED_CX = (16 + 1655) / 2;
const SHARED_CZ = (222 + 640) / 2;
const stx = (px: number) => (px - SHARED_CX) * SCALE;
const stz = (pz: number) => (pz - SHARED_CZ) * SCALE;

// ── UnifiedRoutePath ───────────────────────────────────────────────────────────
// Renders the complete multi-floor path in one pass.
// Path points are computed in absolute 3D world space (x, y, z) where
//   y = (floor - 1) * INTER_FLOOR_H  +  FLOOR_H
// so the figure walks continuously from floor to floor.

interface UnifiedRouteProps {
  route:         string[];
  startNodeId?:  string;
  destNodeId?:   string;
  figurePos?:    React.MutableRefObject<THREE.Vector3>;
}

function UnifiedRoutePath({ route, startNodeId, destNodeId, figurePos }: UnifiedRouteProps) {
  // Build absolute 3D points for every node in the route
  const allPoints = useMemo(() => {
    return route
      .map(id => getNode(id))
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .map(n => ({
        x: stx(n.x),
        y: (n.floor - 1) * INTER_FLOOR_H + FLOOR_H,
        z: stz(n.z),
        floor: n.floor,
        id: n.id,
      }));
  }, [route]);

  // Path segments (flat boxes on each floor level; skip cross-floor jumps)
  const segments = useMemo(() => {
    const segs: React.ReactElement[] = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const a = allPoints[i], b = allPoints[i + 1];
      if (a.floor !== b.floor) continue; // stair edge — no visible corridor segment
      const dx = b.x - a.x, dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.001) continue;
      const angle = Math.atan2(dx, dz);
      const mat = new THREE.MeshBasicMaterial({ color: "#2563eb", transparent: true, opacity: 0.88 });
      segs.push(
        <mesh
          key={`seg-${i}`}
          position={[(a.x + b.x) / 2, a.y + 0.018, (a.z + b.z) / 2]}
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.10, 0.028, len]} />
          <primitive object={mat} attach="material" />
        </mesh>
      );
    }
    return segs;
  }, [allPoints]);

  // Stair transition nodes
  const stairSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < route.length - 1; i++) {
      const a = getNode(route[i]), b = getNode(route[i + 1]);
      if (a && b && a.floor !== b.floor) { s.add(a.id); s.add(b.id); }
    }
    return s;
  }, [route]);

  // Start / destination marker nodes
  const startNode = startNodeId ? getNode(startNodeId) : null;
  const destNode  = destNodeId  ? getNode(destNodeId)  : null;

  if (allPoints.length < 2) return null;

  return (
    <group>
      {segments}

      {/* Stair markers */}
      {allPoints
        .filter(p => stairSet.has(p.id))
        .map(p => {
          const mat = new THREE.MeshBasicMaterial({ color: "#f59e0b" });
          return (
            <group key={`stair-${p.id}`} position={[p.x, p.y + 0.02, p.z]}>
              <mesh>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 6]} />
                <primitive object={mat} attach="material" />
              </mesh>
              <mesh position={[0, 0.30, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.50, 6]} />
                <primitive object={mat} attach="material" />
              </mesh>
            </group>
          );
        })
      }

      {/* Start marker */}
      {startNode && (
        <PathMarker
          x={stx(startNode.x)}
          z={stz(startNode.z)}
          yOffset={(startNode.floor - 1) * INTER_FLOOR_H}
          color="#16a34a"
          pulse
        />
      )}

      {/* Destination marker */}
      {destNode && (
        <PathMarker
          x={stx(destNode.x)}
          z={stz(destNode.z)}
          yOffset={(destNode.floor - 1) * INTER_FLOOR_H}
          color="#dc2626"
          pulse
        />
      )}

      {/* Single WalkingFigure that walks the ENTIRE multi-floor path */}
      {allPoints.length >= 2 && (
        <WalkingFigure
          key={route.join(',')}
          points={allPoints}
          loop={false}
          onReachedEnd={undefined}
          figurePos={figurePos}
        />
      )}
    </group>
  );
}

// ── PathMarker (extended with yOffset for multi-floor) ────────────────────────
// Replaces the original PathMarker which assumed y = FLOOR_H
function PathMarker({ x, z, color, pulse = false, yOffset = 0 }: {
  x: number; z: number; color: string; pulse?: boolean; yOffset?: number;
}) {
  const ref = useRef<THREE.Mesh | null>(null);
  useFrame(({ clock }) => {
    if (ref.current && pulse) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.22;
      ref.current.scale.setScalar(s);
    }
  });
  const mat     = useMemo(() => new THREE.MeshBasicMaterial({ color }), [color]);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 }), [color]);
  const y = yOffset + FLOOR_H + 0.18;
  return (
    <group position={[x, y, z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, -(0.18 - 0.01), 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.36, 20]} />
        <primitive object={ringMat} attach="material" />
      </mesh>
    </group>
  );
}

// ── SingleFloorGeometry ────────────────────────────────────────────────────────
// Renders all the rooms + decor for ONE floor at a time.
// Only the active floor is mounted — all others return null immediately so
// zero GPU memory is used for invisible floors. This is the primary
// low-end-device optimisation: only one floor's geometry exists in the scene.
interface SFGProps {
  floorId:    number;
  yBase:      number;   // world Y offset (always 0 in single-floor mode)
  showLabels: boolean;
}

function SingleFloorGeometry({ floorId, yBase, showLabels }: SFGProps) {
  const cfg = FLOOR_CONFIGS_ALL[floorId];
  if (!cfg) return null;

  const { rooms, hallData, hallTop, hallBottom } = cfg;
  const isF1 = floorId === 1;

  // ALL floors use the Floor-1 (shared) coordinate center so every floor
  // renders at exactly the same footprint and scale as floor 1.
  const ftx = (px: number) => (px - SHARED_CX) * SCALE;
  const ftz = (pz: number) => (pz - SHARED_CZ) * SCALE;

  const hallCx = ftx(hallData.x + hallData.w / 2);
  const hallCz = ftz(hallData.z + hallData.d / 2);

  const ctxValue = useMemo(
    () => ({ ftx, ftz, hallTop, hallBottom, floorId }),
    [floorId]
  );

  return (
    // Single-floor mode: this group is only mounted when the floor is active,
    // so no visibility toggle needed — being in the scene means being visible.
    <group position={[0, yBase, 0]}>
      <FloorCtx.Provider value={ctxValue}>
        {/* Floor slab / hallway */}
        <Box
          pos={[hallCx, FLOOR_H / 2 - 0.007, hallCz]}
          size={[tw(hallData.w), FLOOR_H, tw(hallData.d)]}
          mat={MAT_HALL}
        />

        {isF1 && <HallwayCenterLine />}
        {isF1 && <HallwayDecor />}
        {isF1 && <ExteriorSignage />}

        {rooms.map(room => (
          <RoomMesh
            key={room.id}
            room={room as Room}
            hideLabel={!showLabels}
          />
        ))}
      </FloorCtx.Provider>
    </group>
  );
}

// ── Scene ──────────────────────────────────────────────────────────────────────
interface SceneProps {
  viewFloorId:  number;             // floor the user is viewing (and the only one rendered)
  route?:       string[];
  startNodeId?: string;
  destNodeId?:  string;
  destFloor?:   number;
  startFloor?:  number;
  figureFloor?: number;             // floor the walking figure is currently on
  figurePosRef?: React.MutableRefObject<THREE.Vector3>;
}

function Scene({
  viewFloorId,
  route = [],
  startNodeId,
  destNodeId,
  figureFloor,
  figurePosRef,
}: SceneProps) {
  // Use the shared ref passed from BlueprintIsometric so the parent's polling
  // interval reads the same object that WalkingFigure writes to every frame.
  // Fall back to a local ref if Scene is ever used standalone.
  const localFigurePos = useRef(new THREE.Vector3(0, FLOOR_H, 0));
  const figurePos = figurePosRef ?? localFigurePos;

  return (
    <>
      <OrthographicCamera makeDefault position={[-38, 32, 38]} zoom={10} near={0.1} far={700} />

      <ambientLight intensity={0.55} color="#f5f8ff" />
      <directionalLight
        position={[-26, 46, 18]}
        intensity={1.55}
        color="#ffffff"
      />
      <directionalLight position={[22, 16, -22]} intensity={0.22} color="#d8e4ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 70]} />
        <primitive object={MAT_GROUND} attach="material" />
      </mesh>

      {/* ── Single-floor render ────────────────────────────────────────────────
          Only the currently active floor is mounted. When the user switches
          floors (tab click or figure reaching a new floor) the old floor is
          fully unmounted (zero GPU memory) and the new one is freshly mounted.
          yBase is always 0 — the figure's absolute Y already encodes floor height
          so the geometry itself doesn't need to be stacked.                    */}
      {(() => {
        // The floor to actually render: follow the figure when navigating,
        // otherwise show whatever tab the user picked.
        const activeFloor = (route.length > 0 && figureFloor) ? figureFloor : viewFloorId;
        return (
          <SingleFloorGeometry
            key={activeFloor}          // key change forces clean unmount/remount on floor switch
            floorId={activeFloor}
            yBase={(activeFloor - 1) * INTER_FLOOR_H}
            showLabels
          />
        );
      })()}

      {/* Camera follows the walking figure */}
      {route.length > 0 && <CameraFollower figurePos={figurePos} />}

      {/* Unified multi-floor route path + single walking figure */}
      {route.length > 0 && (
        <UnifiedRoutePath
          route={route}
          startNodeId={startNodeId}
          destNodeId={destNodeId}
          figurePos={figurePos}
        />
      )}

      <OrbitControls
        enablePan={route.length === 0}
        enableZoom
        enableRotate={route.length === 0}
        minPolarAngle={Math.PI / 7}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={350}
      />
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────
type BlueprintIsometricProps = {
  embedded?:    boolean;
  route?:       string[];
  destination?: { id: string; floor: number; name: string } | null;
  startNodeId?: string | null;
};

export function BlueprintIsometric({
  embedded    = false,
  route       = [],
  destination = null,
  startNodeId = null,
}: BlueprintIsometricProps) {
  // floorId: the floor currently shown via tabs (the only floor rendered)
  const [floorId, setFloorId] = useState(1);

  // Track which floor the walking figure is currently on so we can
  // auto-switch the view and tell Scene which floor to render.
  const [figureFloor, setFigureFloor] = useState<number>(1);

  // figurePos ref — written every frame by WalkingFigure, read by the floor
  // tracker below to auto-advance the viewed floor tab while navigating.
  const figurePosRef = useRef(new THREE.Vector3());

  // Derive ordered list of floors touched by the route
  const routeFloors = useMemo(() => {
    const seen: number[] = [];
    route.forEach(id => {
      const n = getNode(id);
      if (n && !seen.includes(n.floor)) seen.push(n.floor);
    });
    return seen;
  }, [route.join(',')]);

  // Reset viewed floor to route start when route changes
  useEffect(() => {
    if (routeFloors.length > 0) {
      setFloorId(routeFloors[0]);
      setFigureFloor(routeFloors[0]);
    }
  }, [route.join(',')]);

  // Auto-advance the viewed floor tab to follow the figure while navigating.
  // We poll figurePos.y every 300 ms (cheap) and snap the tab to whichever
  // floor the figure is closest to.
  useEffect(() => {
    if (route.length === 0) return;
    const interval = setInterval(() => {
      const y = figurePosRef.current.y;
      // y = (floor-1)*INTER_FLOOR_H + FLOOR_H  =>  floor = round(y/INTER_FLOOR_H) + 1
      const estimated = Math.round(y / INTER_FLOOR_H) + 1;
      const clamped   = Math.max(1, Math.min(6, estimated));
      setFigureFloor(clamped);
      // Auto-switch the view tab to follow the character
      setFloorId(clamped);
    }, 300);
    return () => clearInterval(interval);
  }, [route.length]);

  const destNodeId         = destination ? `${destination.id}_door` : undefined;
  const resolvedStartNode  = startNodeId ?? undefined;

  const startFloor = routeFloors[0];
  const destFloor  = destination?.floor;

  const shellStyle: React.CSSProperties = embedded
    ? {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "#c8cdd4", overflow: "hidden", borderRadius: "22px",
        position: "relative",
      }
    : {
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        background: "#c8cdd4", overflow: "hidden",
      };

  const canvasWrapStyle: React.CSSProperties = embedded
    ? { flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }
    : { flex: 1, minHeight: 0, position: "relative" };

  return (
    <div style={shellStyle}>
      {/* Header */}
      {embedded ? (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, display: "flex", gap: 6, background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(8px)", borderRadius: 999,
          padding: "5px 10px", border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
        }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, alignSelf: "center", marginRight: 2 }}>FLOOR</span>
          {[1, 2, 3, 4, 5, 6].map(f => (
            <button key={f} onClick={() => { setFloorId(f); }} style={{
              padding: "3px 13px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: floorId === f ? "1.5px solid #2563eb" : "1.5px solid transparent",
              background: floorId === f ? "#2563eb" : "rgba(0,0,0,0.06)",
              color: floorId === f ? "#fff" : "#6b7280", cursor: "pointer",
              // Highlight tabs that are in the route
              boxShadow: routeFloors.includes(f) && floorId !== f
                ? "0 0 0 1.5px #93c5fd" : "none",
            }}>{f}F</button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-300">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase">Gordon College</p>
            <h1 className="text-sm font-bold text-gray-800 tracking-tight">
              {floorId === 1 ? "First" : floorId === 2 ? "Second" : floorId === 3 ? "Third"
                : floorId === 4 ? "Fourth" : floorId === 5 ? "Fifth" : "Sixth"} Floor — Blueprint View
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono font-semibold">FLOOR</span>
            {[1, 2, 3, 4, 5, 6].map(f => (
              <button key={f} onClick={() => { setFloorId(f); }}
                className="text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border transition-all"
                style={{
                  background:   floorId === f ? "#2563eb" : "transparent",
                  color:        floorId === f ? "#fff"    : "#6b7280",
                  borderColor:  floorId === f ? "#2563eb" : "#d1d5db",
                  boxShadow:    routeFloors.includes(f) && floorId !== f ? "0 0 0 1.5px #93c5fd" : "none",
                }}
              >{f}F</button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            {[
              { color: "#1d4ed8", label: "Office"    },
              { color: "#15803d", label: "Classroom" },
              { color: "#b45309", label: "Facility"  },
              { color: "#0369a1", label: "Lobby"     },
              { color: "#7c3aed", label: "Comfort"   },
              { color: "#0891b2", label: "Lab"       },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded">ORTHOGRAPHIC</span>
          </div>
        </div>
      )}

      <div style={canvasWrapStyle}>
        <Canvas
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%", display: "block", background: "#c8cdd4" }}
        >
          <Suspense fallback={null}>
            <Scene
              viewFloorId={floorId}
              route={route}
              startNodeId={resolvedStartNode}
              destNodeId={destNodeId}
              startFloor={startFloor}
              destFloor={destFloor}
              figureFloor={figureFloor}
              figurePosRef={figurePosRef}
            />
          </Suspense>
        </Canvas>
      </div>

      {!embedded && (
        <div className="text-center py-1.5 text-[10px] text-gray-400 bg-white border-t border-gray-200 font-mono tracking-widest">
          DRAG · SCROLL TO ZOOM · PAN — ORTHOGRAPHIC PROJECTION
        </div>
      )}
    </div>
  );
}