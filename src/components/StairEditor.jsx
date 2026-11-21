import { useState, useRef, useCallback, useMemo } from "react";
// ─── Building data (1672×941 pixel space) ────────────────────────────────────
const VIEWBOX_W = 1672;
const VIEWBOX_H = 941;

const FLOORS_DATA = {
  1: {
    label: "1st Floor",
    bounds: { x1: 16, y1: 222, x2: 1655, y2: 640 },
    hall:   { x: 16, y: 394, w: 1639, h: 84 },
    rooms: [
      { id:"f1_cr_male",    name:"CR (Male)",        x:16,   z:222, w:96,  d:172, type:"comfort" },
      { id:"f1_cr_female",  name:"CR (Female)",      x:172,  z:222, w:82,  d:172, type:"comfort" },
      { id:"f1_lobby_n",    name:"Lobby",            x:254,  z:222, w:126, d:172, type:"lobby" },
      { id:"f1_canteen",    name:"Canteen",          x:380,  z:222, w:249, d:172, type:"facility" },
      { id:"f1_lobby_c",    name:"Lobby",            x:660,  z:222, w:94,  d:172, type:"lobby" },
      { id:"f1_shs_princ",  name:"SHS Principal",    x:754,  z:222, w:123, d:172, type:"office" },
      { id:"f1_shs_fac",    name:"SHS Faculty",      x:877,  z:222, w:115, d:172, type:"office" },
      { id:"f1_shs_cl1",    name:"SHS Classroom",    x:992,  z:222, w:114, d:172, type:"classroom" },
      { id:"f1_shs_cl2",    name:"SHS Classroom",    x:1106, z:222, w:111, d:172, type:"classroom" },
      { id:"f1_shs_cl3",    name:"SHS Classroom",    x:1217, z:222, w:110, d:172, type:"classroom" },
      { id:"f1_bed_spec",   name:"BED Spec Lab",     x:1327, z:222, w:130, d:172, type:"lab" },
      { id:"f1_cr_male2",   name:"CR (Male)",        x:1538, z:222, w:117, d:172, type:"comfort" },
      { id:"f1_elec",       name:"Electrical",       x:16,   z:478, w:138, d:162, type:"utility" },
      { id:"f1_bookstore",  name:"Bookstore",        x:154,  z:478, w:136, d:162, type:"facility" },
      { id:"f1_finance",    name:"Finance",          x:290,  z:478, w:196, d:162, type:"office" },
      { id:"f1_registrar",  name:"Registrar",        x:486,  z:478, w:143, d:162, type:"office" },
      { id:"f1_igs_fac",    name:"IGS Faculty",      x:629,  z:478, w:125, d:162, type:"office" },
      { id:"f1_discipline", name:"Discipline",       x:754,  z:478, w:123, d:162, type:"office" },
      { id:"f1_shs_cl4",    name:"SHS Classroom",    x:992,  z:478, w:114, d:162, type:"classroom" },
      { id:"f1_shs_cl5",    name:"SHS Classroom",    x:1106, z:478, w:111, d:162, type:"classroom" },
      { id:"f1_shs_cl6",    name:"SHS Classroom",    x:1217, z:478, w:110, d:162, type:"classroom" },
      { id:"f1_birthing",   name:"Birthing Clinic",  x:1327, z:478, w:130, d:162, type:"facility" },
      { id:"f1_club",       name:"Club",             x:1538, z:478, w:117, d:162, type:"facility" },
    ],
  },
  2: {
    label: "2nd Floor",
    bounds: { x1: 25, y1: 245, x2: 1640, y2: 642 },
    hall:   { x: 25, y: 394, w: 1615, h: 94 },
    rooms: [
      { id:"f2_cr_ml",   name:"CR (Male)",     x:25,   z:245, w:82,  d:149, type:"comfort" },
      { id:"f2_cr_fl",   name:"CR (Female)",   x:160,  z:245, w:96,  d:149, type:"comfort" },
      { id:"f2_cl_n1",   name:"Classroom",     x:256,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_cl_n2",   name:"Classroom",     x:368,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_cl_n3",   name:"Classroom",     x:480,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_cl_n4",   name:"Classroom",     x:592,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_cl_n5",   name:"Classroom",     x:704,  z:245, w:94,  d:149, type:"classroom" },
      { id:"f2_cl_n6",   name:"Classroom",     x:830,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_cl_n7",   name:"Classroom",     x:942,  z:245, w:112, d:149, type:"classroom" },
      { id:"f2_shs_n1",  name:"SHS Classroom", x:1054, z:245, w:112, d:149, type:"classroom" },
      { id:"f2_shs_n2",  name:"SHS Classroom", x:1166, z:245, w:112, d:149, type:"classroom" },
      { id:"f2_shs_n3",  name:"SHS Classroom", x:1278, z:245, w:112, d:149, type:"classroom" },
      { id:"f2_shs_n4",  name:"SHS Classroom", x:1390, z:245, w:95,  d:149, type:"classroom" },
      { id:"f2_cr_mr",   name:"CR (Male)",     x:1485, z:245, w:70,  d:149, type:"comfort" },
      { id:"f2_cr_fr",   name:"CR (Female)",   x:1555, z:245, w:85,  d:149, type:"comfort" },
      { id:"f2_elec",    name:"Electrical",    x:25,   z:488, w:82,  d:154, type:"utility" },
      { id:"f2_janitor", name:"Janitor",       x:107,  z:488, w:64,  d:154, type:"utility" },
      { id:"f2_ssc",     name:"SSC",           x:171,  z:488, w:82,  d:154, type:"office" },
      { id:"f2_lobby",   name:"Lobby",         x:253,  z:488, w:105, d:154, type:"lobby" },
      { id:"f2_cl_s1",   name:"Classroom",     x:358,  z:488, w:112, d:154, type:"classroom" },
      { id:"f2_cl_s2",   name:"Classroom",     x:470,  z:488, w:112, d:154, type:"classroom" },
      { id:"f2_cl_s3",   name:"Classroom",     x:582,  z:488, w:112, d:154, type:"classroom" },
      { id:"f2_cl_s4",   name:"Classroom",     x:694,  z:488, w:104, d:154, type:"classroom" },
      { id:"f2_cl_s5",   name:"Classroom",     x:830,  z:488, w:112, d:154, type:"classroom" },
      { id:"f2_cl_s6",   name:"Classroom",     x:942,  z:488, w:112, d:154, type:"classroom" },
      { id:"f2_shs_s1",  name:"SHS Classroom", x:1054, z:488, w:112, d:154, type:"classroom" },
      { id:"f2_shs_s2",  name:"SHS Classroom", x:1166, z:488, w:112, d:154, type:"classroom" },
      { id:"f2_shs_s3",  name:"SHS Classroom", x:1278, z:488, w:112, d:154, type:"classroom" },
      { id:"f2_shs_s4",  name:"SHS Classroom", x:1390, z:488, w:95,  d:154, type:"classroom" },
      { id:"f2_lobby_r", name:"Lobby",         x:1485, z:488, w:70,  d:154, type:"lobby" },
      { id:"f2_cl_s7",   name:"Classroom",     x:1555, z:488, w:85,  d:154, type:"classroom" },
    ],
  },
  3: {
    label: "3rd Floor",
    bounds: { x1: 121, y1: 312, x2: 1619, y2: 646 },
    hall:   { x: 121, y: 448, w: 1498, h: 60 },
    rooms: [
      { id:"f3_radio",     name:"Radio Station",    x:121,  z:508, w:95,  d:138, type:"office" },
      { id:"f3_mis",       name:"MIS",              x:216,  z:508, w:135, d:138, type:"office" },
      { id:"f3_lobby",     name:"Lobby",            x:351,  z:508, w:107, d:138, type:"lobby" },
      { id:"f3_bot",       name:"BOT Chairman",     x:458,  z:508, w:213, d:138, type:"office" },
      { id:"f3_personnel", name:"Personnel",        x:671,  z:508, w:109, d:138, type:"office" },
      { id:"f3_cans",      name:"CANS",             x:810,  z:508, w:94,  d:138, type:"office" },
      { id:"f3_techvoc",   name:"Tech Voc.",        x:994,  z:508, w:106, d:138, type:"office" },
      { id:"f3_cis",       name:"CIS Computer",     x:1100, z:508, w:110, d:138, type:"lab" },
      { id:"f3_ampli",     name:"Amphi-Theater",    x:1210, z:508, w:220, d:138, type:"special" },
      { id:"f3_cba",       name:"CBA",              x:1430, z:508, w:72,  d:138, type:"office" },
      { id:"f3_elec",      name:"Electrical",       x:1538, z:508, w:81,  d:138, type:"utility" },
      { id:"f3_pantry",    name:"Pantry",           x:209,  z:312, w:142, d:136, type:"facility" },
      { id:"f3_conf",      name:"Conf. Room",       x:351,  z:312, w:107, d:136, type:"special" },
      { id:"f3_president", name:"President's Off.", x:458,  z:312, w:108, d:136, type:"office" },
      { id:"f3_records",   name:"Records",          x:566,  z:312, w:178, d:136, type:"office" },
      { id:"f3_iss",       name:"ISS",              x:744,  z:312, w:85,  d:136, type:"office" },
      { id:"f3_cons_r",    name:"Consultant R&D",   x:829,  z:312, w:95,  d:136, type:"office" },
      { id:"f3_cons_a",    name:"Consultant Admin", x:994,  z:312, w:106, d:136, type:"office" },
      { id:"f3_nursery",   name:"Nursery Principal",x:1100, z:312, w:110, d:136, type:"office" },
      { id:"f3_guidance",  name:"Guidance",         x:1210, z:312, w:108, d:136, type:"office" },
      { id:"f3_vp",        name:"VP Gens",          x:1318, z:312, w:112, d:136, type:"office" },
      { id:"f3_dropout",   name:"Dropout",          x:1538, z:312, w:81,  d:136, type:"office" },
    ],
  },
  4: {
    label: "4th Floor",
    bounds: { x1: 109, y1: 246, x2: 1618, y2: 650 },
    hall:   { x: 109, y: 394, w: 1509, h: 93 },
    rooms: [
      { id:"f4_sup_n",   name:"Supplies",     x:109,  z:246, w:78,  d:148, type:"office" },
      { id:"f4_cl_n1",   name:"Classroom",    x:220,  z:246, w:111, d:148, type:"classroom" },
      { id:"f4_cl_n2",   name:"Classroom",    x:331,  z:246, w:109, d:148, type:"classroom" },
      { id:"f4_cl_n3",   name:"Classroom",    x:440,  z:246, w:107, d:148, type:"classroom" },
      { id:"f4_cl_n4",   name:"Classroom",    x:547,  z:246, w:109, d:148, type:"classroom" },
      { id:"f4_cl_n5",   name:"Classroom",    x:766,  z:246, w:107, d:148, type:"classroom" },
      { id:"f4_cl_n6",   name:"Classroom",    x:873,  z:246, w:107, d:148, type:"classroom" },
      { id:"f4_library", name:"Library",      x:980,  z:246, w:322, d:148, type:"special" },
      { id:"f4_cr_m",    name:"CR (Male)",    x:1405, z:246, w:75,  d:148, type:"comfort" },
      { id:"f4_cr_f",    name:"CR (Female)",  x:1538, z:246, w:80,  d:148, type:"comfort" },
      { id:"f4_sup_s",   name:"Supplies",     x:109,  z:487, w:78,  d:163, type:"office" },
      { id:"f4_janitor", name:"Janitorial",   x:187,  z:487, w:144, d:163, type:"utility" },
      { id:"f4_cl_s1",   name:"Classroom",    x:331,  z:487, w:109, d:163, type:"classroom" },
      { id:"f4_cl_s2",   name:"Classroom",    x:440,  z:487, w:107, d:163, type:"classroom" },
      { id:"f4_cl_s3",   name:"Classroom",    x:547,  z:487, w:109, d:163, type:"classroom" },
      { id:"f4_cl_s4",   name:"Classroom",    x:766,  z:487, w:107, d:163, type:"classroom" },
      { id:"f4_cl_s5",   name:"Classroom",    x:873,  z:487, w:107, d:163, type:"classroom" },
      { id:"f4_cl_s6",   name:"Classroom",    x:980,  z:487, w:106, d:163, type:"classroom" },
      { id:"f4_cl_s7",   name:"Classroom",    x:1086, z:487, w:107, d:163, type:"classroom" },
      { id:"f4_cl_s8",   name:"Classroom",    x:1300, z:487, w:108, d:163, type:"classroom" },
      { id:"f4_cl_s9",   name:"Classroom",    x:1408, z:487, w:100, d:163, type:"classroom" },
      { id:"f4_chapel",  name:"Chapel",       x:1538, z:487, w:80,  d:163, type:"special" },
    ],
  },
  5: {
    label: "5th Floor",
    bounds: { x1: 84, y1: 331, x2: 1631, y2: 650 },
    hall:   { x: 84, y: 461, w: 1547, h: 56 },
    rooms: [
      { id:"f5_paser",    name:"PASER Training",   x:160,  z:331, w:151, d:130, type:"lab" },
      { id:"f5_media",    name:"Media Center",     x:311,  z:331, w:113, d:130, type:"lab" },
      { id:"f5_speech",   name:"Speech Lab",       x:424,  z:331, w:109, d:130, type:"lab" },
      { id:"f5_cba_sim",  name:"CBA Simulation",   x:533,  z:331, w:110, d:130, type:"lab" },
      { id:"f5_abcom",    name:"ABCOM Sound Lab",  x:816,  z:331, w:154, d:130, type:"lab" },
      { id:"f5_comp1",    name:"Computer Lab",     x:970,  z:331, w:108, d:130, type:"lab" },
      { id:"f5_comp2",    name:"Computer Lab",     x:1078, z:331, w:108, d:130, type:"lab" },
      { id:"f5_comp3",    name:"Computer Lab",     x:1186, z:331, w:107, d:130, type:"lab" },
      { id:"f5_comp4",    name:"Computer Lab",     x:1293, z:331, w:109, d:130, type:"lab" },
      { id:"f5_fore",     name:"Fore Front",       x:1402, z:331, w:72,  d:130, type:"office" },
      { id:"f5_stock",    name:"Stock Room",       x:1544, z:331, w:87,  d:130, type:"storage" },
      { id:"f5_elec",     name:"Electrical",       x:84,   z:517, w:76,  d:133, type:"utility" },
      { id:"f5_janitor",  name:"Janitorial",       x:160,  z:517, w:56,  d:133, type:"utility" },
      { id:"f5_cl_s1",    name:"Classroom",        x:216,  z:517, w:95,  d:133, type:"classroom" },
      { id:"f5_cl_s2",    name:"Classroom",        x:311,  z:517, w:113, d:133, type:"classroom" },
      { id:"f5_cl_s3",    name:"Classroom",        x:424,  z:517, w:109, d:133, type:"classroom" },
      { id:"f5_cl_s4",    name:"Classroom",        x:533,  z:517, w:110, d:133, type:"classroom" },
      { id:"f5_electronics",name:"Electronics Lab",x:710,  z:517, w:106, d:133, type:"lab" },
      { id:"f5_game_dev", name:"Game Dev Lab",     x:816,  z:517, w:154, d:133, type:"lab" },
      { id:"f5_digital",  name:"Digital Drawing",  x:970,  z:517, w:108, d:133, type:"lab" },
      { id:"f5_multi",    name:"Multi-Media Lab",  x:1078, z:517, w:108, d:133, type:"lab" },
      { id:"f5_pe_hall",  name:"PE Hall",          x:1186, z:517, w:107, d:133, type:"facility" },
      { id:"f5_pe_coord", name:"PE Coordinator",   x:1293, z:517, w:109, d:133, type:"office" },
      { id:"f5_elec2",    name:"Electrical",       x:1544, z:517, w:87,  d:133, type:"utility" },
    ],
  },
  6: {
    label: "6th Floor",
    bounds: { x1: 118, y1: 365, x2: 1625, y2: 678 },
    hall:   { x: 118, y: 483, w: 1507, h: 72 },
    rooms: [
      { id:"f6_stock_n",  name:"Stock Nursing",    x:118,  z:365, w:82,  d:118, type:"storage" },
      { id:"f6_ceso",     name:"CESO/NSEP",        x:230,  z:365, w:106, d:118, type:"office" },
      { id:"f6_medifery", name:"Medi-Fery",        x:336,  z:365, w:108, d:118, type:"facility" },
      { id:"f6_bsm",      name:"BSM",              x:444,  z:365, w:107, d:118, type:"office" },
      { id:"f6_demo",     name:"Demo Room",        x:551,  z:365, w:109, d:118, type:"lab" },
      { id:"f6_chem_s",   name:"Chem Storage",     x:660,  z:365, w:52,  d:118, type:"storage" },
      { id:"f6_glass",    name:"Glassware",        x:712,  z:365, w:56,  d:118, type:"storage" },
      { id:"f6_alumni",   name:"Alumni",           x:768,  z:365, w:108, d:118, type:"special" },
      { id:"f6_hotel_fo", name:"Mini Hotel FO",    x:876,  z:365, w:109, d:118, type:"office" },
      { id:"f6_hotel",    name:"Mini Hotel",       x:985,  z:365, w:216, d:118, type:"special" },
      { id:"f6_cold_kit", name:"Cold Kitchen",     x:1201, z:365, w:108, d:118, type:"facility" },
      { id:"f6_hot_kit",  name:"Hot Kitchen",      x:1309, z:365, w:107, d:118, type:"facility" },
      { id:"f6_support",  name:"Support Room",     x:1416, z:365, w:88,  d:118, type:"utility" },
      { id:"f6_chem_r",   name:"Chem Storage",     x:1543, z:365, w:82,  d:118, type:"storage" },
      { id:"f6_elec_s",   name:"Electrical",       x:118,  z:555, w:82,  d:123, type:"utility" },
      { id:"f6_cl_s1",    name:"Classroom",        x:230,  z:555, w:106, d:123, type:"classroom" },
      { id:"f6_nursing",  name:"Nursing Skills",   x:336,  z:555, w:108, d:123, type:"lab" },
      { id:"f6_demo_n",   name:"Demo Nursing",     x:444,  z:555, w:107, d:123, type:"lab" },
      { id:"f6_chem_lab", name:"Chem Lab",         x:551,  z:555, w:109, d:123, type:"lab" },
      { id:"f6_bio",      name:"Bio-Lab",          x:660,  z:555, w:108, d:123, type:"lab" },
      { id:"f6_ana",      name:"Ana-Physio Lab",   x:768,  z:555, w:108, d:123, type:"lab" },
      { id:"f6_physics",  name:"Physics Lab",      x:876,  z:555, w:109, d:123, type:"lab" },
      { id:"f6_sci_cust", name:"Sci Custodian",    x:985,  z:555, w:108, d:123, type:"office" },
      { id:"f6_lecture",  name:"Lecture",          x:1093, z:555, w:108, d:123, type:"classroom" },
      { id:"f6_cl_s2",    name:"Classroom",        x:1201, z:555, w:108, d:123, type:"classroom" },
      { id:"f6_dining",   name:"Dining",           x:1309, z:555, w:107, d:123, type:"facility" },
      { id:"f6_elec_dr",  name:"Electrical/Dress", x:1543, z:555, w:82,  d:123, type:"utility" },
    ],
  },
};

// ─── Room type colors ─────────────────────────────────────────────────────────
const TYPE_FILL = {
  office:    "#f0f4ff",
  classroom: "#fff8ed",
  lab:       "#e8f6ff",
  facility:  "#f5f5f2",
  comfort:   "#fff1f2",
  lobby:     "#fffaf0",
  storage:   "#f5f5f4",
  utility:   "#f0f5fa",
  special:   "#f4f0ff",
  stair:     "#e7e5e4",
};
const TYPE_STROKE = {
  office:    "#c7d2fe",
  classroom: "#fed7aa",
  lab:       "#bae6fd",
  facility:  "#d1d5db",
  comfort:   "#fecdd3",
  lobby:     "#fde68a",
  storage:   "#d4d4d4",
  utility:   "#cbd5e1",
  special:   "#ddd6fe",
  stair:     "#a8a29e",
};

// ─── Initial stair data ───────────────────────────────────────────────────────
const INITIAL_STAIRS = {
  1: {
    left:   { cx: 142,  cy: 436, w: 62,  h: 112, label: "Left stairs" },
    center: { cx: 920,  cy: 555, w: 96,  h: 78,  label: "Center stairs" },
    right:  { cx: 1588, cy: 436, w: 72,  h: 116, label: "Right stairs" },
  },
  2: {
    left:   { cx: 150,  cy: 441, w: 70,  h: 118, label: "Left stairs" },
    center: { cx: 806,  cy: 548, w: 66,  h: 100, label: "Center stairs" },
    right:  { cx: 1588, cy: 441, w: 70,  h: 118, label: "Right stairs" },
  },
  3: {
    left:   { cx: 188,  cy: 390, w: 70,  h: 112, label: "Left stairs" },
    center: { cx: 906,  cy: 576, w: 70,  h: 112, label: "Center stairs" },
    right:  { cx: 1538, cy: 390, w: 54,  h: 98,  label: "Right stairs" },
  },
  4: {
    left:   { cx: 160,  cy: 440, w: 70,  h: 112, label: "Left stairs" },
    center: { cx: 720,  cy: 590, w: 68,  h: 112, label: "Center stairs" },
    right:  { cx: 1235, cy: 590, w: 68,  h: 112, label: "Right stairs" },
  },
  5: {
    left:   { cx: 160,  cy: 398, w: 70,  h: 108, label: "Left stairs" },
    center: { cx: 643,  cy: 582, w: 70,  h: 108, label: "Center stairs" },
    right:  { cx: 1402, cy: 588, w: 70,  h: 108, label: "Right stairs" },
  },
  6: {
    left:   { cx: 160,  cy: 520, w: 70,  h: 114, label: "Left stairs" },
    center: { cx: 660,  cy: 590, w: 70,  h: 108, label: "Center stairs" },
    right:  { cx: 1588, cy: 520, w: 70,  h: 114, label: "Right stairs" },
  },
};

const STAIR_COLORS = {
  left:   { fill: "rgba(234,88,12,0.18)",  stroke: "#ea580c", label: "#c2410c" },
  center: { fill: "rgba(22,163,74,0.18)",  stroke: "#16a34a", label: "#15803d" },
  right:  { fill: "rgba(124,58,237,0.18)", stroke: "#7c3aed", label: "#6d28d9" },
};

// ─── Code generator ───────────────────────────────────────────────────────────
function generateCode(stairs) {
  const lines = ["const STAIR_MARKERS = {"];
  for (let f = 1; f <= 6; f++) {
    lines.push(`  ${f}: {`);
    for (const key of ["left", "center", "right"]) {
      const s = stairs[f][key];
      lines.push(
        `    ${key.padEnd(6)}: { cx: ${String(Math.round(s.cx)).padStart(4)}, cy: ${String(Math.round(s.cy)).padStart(4)}, w: ${String(Math.round(s.w)).padStart(3)}, h: ${String(Math.round(s.h)).padStart(3)}, orientation: "vertical", label: "${s.label}" },`
      );
    }
    lines.push(f < 6 ? "  }," : "  },");
  }
  lines.push("};");
  return lines.join("\n");
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StairEditor() {
  const [activeFloor, setActiveFloor] = useState(1);
  const [stairs, setStairs] = useState(() =>
    JSON.parse(JSON.stringify(INITIAL_STAIRS))
  );
  const [selected, setSelected] = useState(null); // { key: "left"|"center"|"right" }
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const svgRef = useRef(null);
  const dragging = useRef(null); // { key, startSvgX, startSvgY, startCx, startCy }

  const floor = FLOORS_DATA[activeFloor];
  const floorStairs = stairs[activeFloor];

  // SVG coordinate helpers
  const getSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handleMouseDown = useCallback((key, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(key);
    const { x, y } = getSvgPoint(e.clientX, e.clientY);
    const s = stairs[activeFloor][key];
    dragging.current = { key, startSvgX: x, startSvgY: y, startCx: s.cx, startCy: s.cy };
  }, [getSvgPoint, stairs, activeFloor]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const { key, startSvgX, startSvgY, startCx, startCy } = dragging.current;
    const { x, y } = getSvgPoint(e.clientX, e.clientY);
    const dx = x - startSvgX;
    const dy = y - startSvgY;
    setStairs(prev => ({
      ...prev,
      [activeFloor]: {
        ...prev[activeFloor],
        [key]: {
          ...prev[activeFloor][key],
          cx: Math.round(startCx + dx),
          cy: Math.round(startCy + dy),
        },
      },
    }));
  }, [getSvgPoint, activeFloor]);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const updateSize = (key, field, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 10) return;
    setStairs(prev => ({
      ...prev,
      [activeFloor]: {
        ...prev[activeFloor],
        [key]: { ...prev[activeFloor][key], [field]: n },
      },
    }));
  };

  const resetFloor = () => {
    setStairs(prev => ({
      ...prev,
      [activeFloor]: JSON.parse(JSON.stringify(INITIAL_STAIRS[activeFloor])),
    }));
    setSelected(null);
  };

  const code = useMemo(() => generateCode(stairs), [stairs]);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", background: "#0f172a", color: "#e2e8f0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.96)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#f97316,#7c3aed)", display: "grid", placeItems: "center", fontSize: 16 }}>⬛</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.2, color: "#f1f5f9" }}>Stair Placement Editor</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>Drag stairs to reposition · resize via inputs below</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Floor tabs */}
        {[1,2,3,4,5,6].map(f => (
          <button
            key={f}
            onClick={() => { setActiveFloor(f); setSelected(null); }}
            style={{
              height: 34, minWidth: 48, borderRadius: 10,
              border: activeFloor === f ? "1.5px solid #f97316" : "1px solid rgba(255,255,255,0.12)",
              background: activeFloor === f ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
              color: activeFloor === f ? "#fb923c" : "#94a3b8",
              fontWeight: 900, cursor: "pointer", fontSize: 13,
            }}
          >{f}</button>
        ))}
        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.10)" }} />
        <button onClick={resetFloor} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.30)", background: "rgba(239,68,68,0.10)", color: "#f87171", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>Reset floor</button>
        <button onClick={() => setShowCode(v => !v)} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: showCode ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.10)", color: "#a5b4fc", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
          {showCode ? "Hide code" : "Show code"}
        </button>
        <button onClick={copyCode} style={{ height: 34, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(34,197,94,0.35)", background: copied ? "rgba(34,197,94,0.22)" : "rgba(34,197,94,0.10)", color: "#4ade80", fontWeight: 900, cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}>
          {copied ? "✓ Copied!" : "Copy code"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left: controls for selected stair */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "#475569", textTransform: "uppercase" }}>
            {FLOORS_DATA[activeFloor].label}
          </div>

          {["left", "center", "right"].map(key => {
            const s = floorStairs[key];
            const col = STAIR_COLORS[key];
            const isSel = selected === key;
            return (
              <div
                key={key}
                onClick={() => setSelected(isSel ? null : key)}
                style={{ borderRadius: 12, border: `1.5px solid ${isSel ? col.stroke : "rgba(255,255,255,0.10)"}`, background: isSel ? `${col.fill}` : "rgba(255,255,255,0.03)", padding: 12, cursor: "pointer", transition: "all 0.18s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: col.stroke }} />
                  <span style={{ fontWeight: 900, fontSize: 13, color: isSel ? "#f1f5f9" : "#94a3b8", textTransform: "capitalize" }}>{key} stairs</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[["cx","X"], ["cy","Y"], ["w","W"], ["h","H"]].map(([field, lbl]) => (
                    <label key={field} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{lbl}</span>
                      <input
                        type="number"
                        value={Math.round(s[field])}
                        onChange={e => updateSize(key, field, e.target.value)}
                        onClick={e => { e.stopPropagation(); setSelected(key); }}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "#e2e8f0", fontWeight: 700, fontSize: 13, outline: "none" }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: "auto", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            <b style={{ color: "#94a3b8" }}>How to use:</b><br />
            1. Select a stair box<br />
            2. Drag it on the map<br />
            3. Fine-tune X/Y/W/H<br />
            4. Copy code when done
          </div>
        </div>

        {/* Center: SVG map */}
        <div
          style={{ flex: 1, minWidth: 0, background: "#0a0f1a", position: "relative", overflow: "hidden" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
              <pattern id="grid-major" width="400" height="400" patternUnits="userSpaceOnUse">
                <path d="M 400 0 L 0 0 0 400" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="#0a0f1a" />
            <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#grid-major)" />
            <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#grid)" />

            {/* Building outline */}
            {(() => {
              const b = floor.bounds;
              return (
                <rect
                  x={b.x1} y={b.y1}
                  width={b.x2 - b.x1} height={b.y2 - b.y1}
                  rx="14"
                  fill="rgba(30,41,59,0.70)"
                  stroke="rgba(100,116,139,0.35)"
                  strokeWidth="3"
                />
              );
            })()}

            {/* Hallway */}
            <rect
              x={floor.hall.x} y={floor.hall.y}
              width={floor.hall.w} height={floor.hall.h}
              rx="16"
              fill="rgba(51,65,85,0.55)"
              stroke="rgba(100,116,139,0.25)"
              strokeWidth="1.5"
            />
            <text
              x={floor.hall.x + floor.hall.w / 2}
              y={floor.hall.y + floor.hall.h / 2 + 8}
              textAnchor="middle"
              fontSize="22"
              letterSpacing="14"
              fill="rgba(148,163,184,0.18)"
              fontWeight="900"
            >HALLWAY</text>

            {/* Rooms */}
            {floor.rooms.map(room => {
              const fill = TYPE_FILL[room.type] ?? "#f5f5f4";
              const stroke = TYPE_STROKE[room.type] ?? "#d1d5db";
              return (
                <g key={room.id} pointerEvents="none">
                  <rect
                    x={room.x} y={room.z}
                    width={room.w} height={room.d}
                    rx="7"
                    fill={fill}
                    fillOpacity="0.14"
                    stroke={stroke}
                    strokeOpacity="0.45"
                    strokeWidth="1.5"
                  />
                  {room.w > 60 && room.d > 30 && (
                    <text
                      x={room.x + room.w / 2}
                      y={room.z + room.d / 2 + 5}
                      textAnchor="middle"
                      fontSize={Math.min(16, Math.max(9, room.w / 10))}
                      fill="rgba(226,232,240,0.55)"
                      fontWeight="700"
                    >{room.name}</text>
                  )}
                </g>
              );
            })}

            {/* Stair markers — draggable */}
            {["left", "center", "right"].map(key => {
              const s = floorStairs[key];
              const col = STAIR_COLORS[key];
              const isSel = selected === key;
              const stepCount = 7;
              const bx = s.cx - s.w / 2;
              const by = s.cy - s.h / 2;

              return (
                <g
                  key={key}
                  style={{ cursor: "grab" }}
                  onMouseDown={e => handleMouseDown(key, e)}
                >
                  {/* Selection glow */}
                  {isSel && (
                    <rect
                      x={bx - 6} y={by - 6}
                      width={s.w + 12} height={s.h + 12}
                      rx="8"
                      fill="none"
                      stroke={col.stroke}
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      opacity="0.6"
                    />
                  )}
                  {/* Outer box */}
                  <rect
                    x={bx} y={by}
                    width={s.w} height={s.h}
                    rx="3"
                    fill={col.fill}
                    stroke={col.stroke}
                    strokeWidth={isSel ? 2.5 : 1.8}
                  />
                  {/* Tread lines */}
                  {Array.from({ length: stepCount - 1 }, (_, i) => {
                    const lineY = by + ((i + 1) / stepCount) * s.h;
                    return (
                      <line
                        key={i}
                        x1={bx} y1={lineY}
                        x2={bx + s.w} y2={lineY}
                        stroke={col.stroke}
                        strokeWidth={1.2}
                        opacity={0.6}
                      />
                    );
                  })}
                  {/* Center label */}
                  <text
                    x={s.cx}
                    y={s.cy + 5}
                    textAnchor="middle"
                    fontSize={Math.min(14, s.w * 0.28)}
                    fill={col.label}
                    fontWeight="900"
                    letterSpacing="0.5"
                    pointerEvents="none"
                  >{key.toUpperCase()[0]}</text>
                  {/* Coords badge */}
                  {isSel && (
                    <g pointerEvents="none">
                      <rect
                        x={bx + s.w + 6} y={by}
                        width="82" height="30"
                        rx="8"
                        fill="rgba(15,23,42,0.92)"
                        stroke={col.stroke}
                        strokeWidth="1.2"
                      />
                      <text
                        x={bx + s.w + 10} y={by + 12}
                        fontSize="10"
                        fill="#94a3b8"
                        fontWeight="700"
                      >cx {Math.round(s.cx)}</text>
                      <text
                        x={bx + s.w + 10} y={by + 24}
                        fontSize="10"
                        fill="#94a3b8"
                        fontWeight="700"
                      >cy {Math.round(s.cy)}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Floor label */}
            <g pointerEvents="none">
              <rect x="18" y="18" width="160" height="44" rx="12" fill="rgba(15,23,42,0.86)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
              <text x="38" y="48" fontSize="26" fontWeight="900" fill="#f97316">{activeFloor}</text>
              <text x="68" y="47" fontSize="14" fontWeight="700" fill="#94a3b8">{FLOORS_DATA[activeFloor].label}</text>
            </g>

            {/* Legend */}
            {[["left","L"],["center","C"],["right","R"]].map(([key, lbl], i) => (
              <g key={key} pointerEvents="none" transform={`translate(${18 + i * 72}, ${VIEWBOX_H - 44})`}>
                <rect width="66" height="30" rx="8" fill="rgba(15,23,42,0.86)" stroke={STAIR_COLORS[key].stroke} strokeWidth="1.2" />
                <circle cx="16" cy="15" r="6" fill={STAIR_COLORS[key].stroke} opacity="0.7" />
                <text x="28" y="19" fontSize="11" fontWeight="800" fill="#cbd5e1">{key}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right: code panel */}
        {showCode && (
          <div style={{ width: 420, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontWeight: 900, fontSize: 12, color: "#94a3b8", letterSpacing: 0.5 }}>STAIR_MARKERS CODE</span>
              <button
                onClick={copyCode}
                style={{ height: 28, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.30)", background: copied ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.08)", color: "#4ade80", fontWeight: 900, cursor: "pointer", fontSize: 11 }}
              >{copied ? "✓ Copied!" : "Copy"}</button>
            </div>
            <pre style={{ flex: 1, overflow: "auto", margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.7, color: "#94a3b8", fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', monospace", background: "#060c16" }}>
              <code style={{ color: "#e2e8f0" }}>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
