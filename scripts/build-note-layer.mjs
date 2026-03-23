import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();

function yamlScalar(value) {
  if (value == null) return '""';
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function frontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (!value.length) {
        lines.push(`${key}: []`);
        continue;
      }
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${yamlScalar(item)}`);
      continue;
    }
    lines.push(`${key}: ${yamlScalar(value)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function section(title, items) {
  if (!items?.length) return "";
  return `## ${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function render(note) {
  return [
    frontmatter({
      type: note.type,
      aliases: note.aliases ?? [],
      tags: note.tags ?? [],
      status: note.status ?? "seed",
      themes: note.themes ?? [],
      related: note.related ?? [],
      sources: note.sources ?? [],
    }),
    `# ${note.title}`,
    "",
    "## Summary",
    "",
    note.summary.trim(),
    note.related?.length ? `\n${section("Connected Notes", note.related)}` : "",
    note.claims?.length ? `\n${section("Claims", note.claims)}` : "",
    note.sources?.length ? `\n${section("Sources", note.sources)}` : "",
    "",
  ].join("\n");
}

async function writeVaultFile(relativePath, content) {
  const fullPath = join(root, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, "utf8");
}

const sourceTitles = [
  "Source - ERIC ED056243 - Marland Report",
  "Source - LAO 1988 GATE sunset review",
  "Source - California Mentally Gifted Minor Program brief history",
  "Source - Congressional Record 1975 Office of the Gifted and Talented",
  "Source - Federal Register 1979 Office for the Gifted and Talented notice",
  "Source - Congress.gov Javits gifted legislation history",
  "Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth",
  "Source - Senate 1977 MKULTRA hearing",
  "Source - Rockefeller Commission report",
  "Source - CIA document 00017369 - MKULTRA Subproject 112",
  "Source - CIA document 00017445 - MKULTRA Subproject 47",
  "Source - CIA Remote Viewing Training Protocol",
  "Source - CIA Gateway assessment",
  "Source - CIA PAS screening report",
  "Source - CIA PAS review report",
  "Source - CIA gifted individuals proposal",
  "Source - CIA Maimonides precedent report",
  "Source - CIA AIR evaluation of Remote Viewing",
  "Source - CIA Dream Laboratory bulletin 1969",
  "Source - CIA Esalen hot-tub diplomacy document",
  "Source - DVIDS PACMIRS history",
  "Source - Harold C. Lyon obituary",
  "Source - West Point record for Harold C. Lyon Jr.",
  "Source - Esalen memorial for George Leonard",
  "Source - Duke exhibit on parapsychology",
  "Source - Duke Today on Duke TIP",
  "Source - Scholars@Duke on Duke TIP",
  "Source - NAGC on E. Paul Torrance",
  "Source - Stanley Krippner bibliography 1960-1965",
  "Source - Yahoo News Jan 2025 on GATE recollections",
];

const notes = [
  {
    path: "00 Maps/Vault Home.md",
    title: "Vault Home",
    type: "map",
    status: "curated",
    tags: ["map/home", "research/hub"],
    related: [
      "[[GATE Program]]",
      "[[Gifted Education]]",
      "[[Federal Gifted Policy]]",
      "[[California GATE]]",
      "[[Defense and Intelligence]]",
      "[[Parapsychology and ESP]]",
      "[[Psychometrics and Testing]]",
      "[[Source Index]]",
      "[[Claims Index]]",
      "[[GATE Timeline]]",
      "[[Original Notion Export - GATE Outline]]",
    ],
    summary:
      "This is the entry point for the vault. The note graph is organized around hub notes, entity notes, claim notes, and source notes so you can follow both the hard administrative history of gifted education and the more interpretive bridges into remote viewing, MKULTRA, Esalen, psychometrics, and consciousness research.",
  },
  {
    path: "00 Maps/GATE Program.md",
    title: "GATE Program",
    type: "map",
    status: "curated",
    tags: ["map/gate", "education/gifted"],
    themes: ["[[Gifted Education]]", "[[California GATE]]"],
    related: [
      "[[Classroom recollections of GATE]]",
      "[[Gifted Education]]",
      "[[Federal Gifted Policy]]",
      "[[California GATE]]",
      "[[Parapsychology and ESP]]",
      "[[Psychometrics and Testing]]",
      "[[GATE Timeline]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble remote-viewing protocols]]",
      "[[Claim - GATE classroom recollections resemble Gateway-style exercises]]",
      "[[Claim - No direct document places CIA operatives inside GATE classrooms]]",
      "[[Claim - GATE memories form an anecdotal pattern rather than verified program history]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - LAO 1988 GATE sunset review]]",
      "[[Source - California Mentally Gifted Minor Program brief history]]",
      "[[Source - Yahoo News Jan 2025 on GATE recollections]]",
    ],
    summary:
      "The vault uses [[GATE Program]] as the main bridge between formal gifted-education history and the later memory-and-theory discourse around unusual classroom exercises. The graph here is intentionally dense, but the claims layer keeps anecdotal recollections separate from documentary evidence.",
  },
  {
    path: "00 Maps/Gifted Education.md",
    title: "Gifted Education",
    type: "map",
    status: "curated",
    tags: ["map/gifted-ed", "education/policy"],
    related: [
      "[[Federal Gifted Policy]]",
      "[[California GATE]]",
      "[[Office of Gifted and Talented]]",
      "[[California Mentally Gifted Minor Program]]",
      "[[Gifted identification methods]]",
      "[[Duke TIP]]",
      "[[Marland Report]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - LAO 1988 GATE sunset review]]",
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
    ],
    summary:
      "This map keeps the educational spine of the project visible: federal gifted policy, California program lineage, identification methods, and the talent-search ecosystem. It is the anchor that prevents the vault from collapsing into pure intelligence speculation.",
  },
  {
    path: "00 Maps/Federal Gifted Policy.md",
    title: "Federal Gifted Policy",
    type: "map",
    status: "curated",
    tags: ["map/federal-policy", "education/policy"],
    related: [
      "[[Sidney P. Marland Jr.]]",
      "[[Marland Report]]",
      "[[Office of Gifted and Talented]]",
      "[[Harold C. Lyon Jr.]]",
      "[[Jacob K. Javits Gifted and Talented Students Education Act]]",
    ],
    claims: [
      "[[Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control]]",
      "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
      "[[Source - Federal Register 1979 Office for the Gifted and Talented notice]]",
      "[[Source - Congress.gov Javits gifted legislation history]]",
    ],
    summary:
      "This map is the cleanest route into the documented federal record: Marland defines the category, Lyon runs the office, and Javits legislation extends the policy line. It is where the personnel-network story has to stay accountable to actual federal documents.",
  },
  {
    path: "00 Maps/California GATE.md",
    title: "California GATE",
    type: "map",
    status: "curated",
    tags: ["map/california-gate", "education/state"],
    related: [
      "[[California Mentally Gifted Minor Program]]",
      "[[GATE Program]]",
      "[[Gifted identification methods]]",
      "[[Classroom recollections of GATE]]",
      "[[E. Paul Torrance]]",
      "[[Duke TIP]]",
    ],
    sources: [
      "[[Source - LAO 1988 GATE sunset review]]",
      "[[Source - California Mentally Gifted Minor Program brief history]]",
    ],
    summary:
      "California gives the vault its strongest state-level continuity: MGM becomes GATE, and a real program history exists alongside later recollections. This is the best place to trace what is documented versus what is inferred.",
  },
  {
    path: "00 Maps/Defense and Intelligence.md",
    title: "Defense and Intelligence",
    type: "map",
    status: "curated",
    tags: ["map/defense", "intelligence/history"],
    related: [
      "[[MKULTRA]]",
      "[[Stargate Project (U.S. Army)]]",
      "[[Recondo School]]",
      "[[Sidney P. Marland Jr.]]",
      "[[Harold C. Lyon Jr.]]",
      "[[John W. Gittinger]]",
      "[[Esalen Institute]]",
    ],
    claims: [
      "[[Claim - CIA research involving children overlapped with selection and steering questions]]",
      "[[Claim - Similar methods do not prove CIA control of GATE classrooms]]",
    ],
    sources: [
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - Rockefeller Commission report]]",
      "[[Source - CIA PAS screening report]]",
      "[[Source - DVIDS PACMIRS history]]",
    ],
    summary:
      "This map tracks the institutional side of the story: intelligence programs, military training schools, and personnel who later appear in education or consciousness-research contexts. It is deliberately broader than a single-GATE theory note.",
  },
  {
    path: "00 Maps/Parapsychology and ESP.md",
    title: "Parapsychology and ESP",
    type: "map",
    status: "curated",
    tags: ["map/parapsychology", "consciousness/psi"],
    related: [
      "[[Remote Viewing]]",
      "[[Gateway Process]]",
      "[[Dream Telepathy]]",
      "[[Maimonides Dream Laboratory]]",
      "[[Duke Parapsychology Laboratory]]",
      "[[J. B. Rhine]]",
      "[[Stanley Krippner]]",
      "[[Monroe Institute]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble remote-viewing protocols]]",
      "[[Claim - GATE classroom recollections resemble Gateway-style exercises]]",
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - CIA Remote Viewing Training Protocol]]",
      "[[Source - CIA Gateway assessment]]",
      "[[Source - CIA Maimonides precedent report]]",
      "[[Source - Duke exhibit on parapsychology]]",
    ],
    summary:
      "This map holds the methods and institutions behind the exported note's strongest exercise-level comparisons: Zener-card testing, remote viewing, Gateway-style audio work, and dream telepathy. The graph here is about documented method lineages, not proof of classroom adoption.",
  },
  {
    path: "00 Maps/Psychometrics and Testing.md",
    title: "Psychometrics and Testing",
    type: "map",
    status: "curated",
    tags: ["map/testing", "psychometrics"],
    related: [
      "[[Gifted identification methods]]",
      "[[Personality Assessment System]]",
      "[[Wechsler scales]]",
      "[[Torrance Tests]]",
      "[[John W. Gittinger]]",
      "[[E. Paul Torrance]]",
    ],
    claims: [
      "[[Claim - Wechsler-derived profiling overlaps with gifted identification tools]]",
      "[[Claim - Gifted testing and PAS share a Wechsler lineage]]",
    ],
    sources: [
      "[[Source - CIA PAS screening report]]",
      "[[Source - CIA PAS review report]]",
      "[[Source - NAGC on E. Paul Torrance]]",
      "[[Source - ERIC ED056243 - Marland Report]]",
    ],
    summary:
      "This is the measurement side of the vault. It connects normal gifted-program testing infrastructure to the personality-screening logic found in intelligence-adjacent remote-viewing documents.",
  },
  {
    path: "01 Entities/People/Sidney P. Marland Jr..md",
    title: "Sidney P. Marland Jr.",
    type: "person",
    status: "curated",
    tags: ["entity/person", "education/policy", "defense/history"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]"],
    related: ["[[Marland Report]]", "[[Office of Gifted and Talented]]", "[[Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control]]"],
    sources: ["[[Source - ERIC ED056243 - Marland Report]]", "[[Source - DVIDS PACMIRS history]]"],
    summary:
      "Marland is the federal-policy origin point of the vault. His wartime history matters because it complicates the exported note's claims without collapsing into an unsupported \"Marland was intelligence\" narrative.",
  },
  {
    path: "01 Entities/People/Harold C. Lyon Jr..md",
    title: "Harold C. Lyon Jr.",
    type: "person",
    status: "curated",
    tags: ["entity/person", "education/policy", "defense/history"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]"],
    related: ["[[Office of Gifted and Talented]]", "[[Recondo School]]", "[[Esalen Institute]]", "[[George Leonard]]", "[[Michael Murphy]]"],
    claims: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    sources: ["[[Source - Harold C. Lyon obituary]]", "[[Source - West Point record for Harold C. Lyon Jr.]]", "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]"],
    summary:
      "Lyon is the clearest person-level bridge between military training culture and federal gifted policy. His note is where the Recondo, Esalen, and gifted-office threads visibly meet.",
  },
  {
    path: "01 Entities/People/Stanley Krippner.md",
    title: "Stanley Krippner",
    type: "person",
    status: "curated",
    tags: ["entity/person", "parapsychology", "gifted-ed"],
    themes: ["[[Parapsychology and ESP]]", "[[Gifted Education]]"],
    related: ["[[Maimonides Dream Laboratory]]", "[[Dream Telepathy]]", "[[California GATE]]"],
    claims: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    sources: ["[[Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth]]", "[[Source - CIA Maimonides precedent report]]", "[[Source - Stanley Krippner bibliography 1960-1965]]"],
    summary:
      "Krippner is the strongest single crossover person in the vault because he appears in gifted-education writing and in intelligence-adjacent psi literature. The overlap is documented even where the causal claims remain open.",
  },
  {
    path: "01 Entities/People/John W. Gittinger.md",
    title: "John W. Gittinger",
    type: "person",
    status: "curated",
    tags: ["entity/person", "psychometrics", "cia"],
    themes: ["[[Psychometrics and Testing]]", "[[Defense and Intelligence]]"],
    related: ["[[Personality Assessment System]]", "[[Wechsler scales]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - Gifted testing and PAS share a Wechsler lineage]]"],
    sources: ["[[Source - CIA PAS screening report]]", "[[Source - CIA PAS review report]]", "[[Source - Senate 1977 MKULTRA hearing]]"],
    summary:
      "Gittinger anchors the psychometric intelligence side of the vault. His PAS framework is the cleanest way to connect Wechsler-derived profiling to later remote-viewing selection literature.",
  },
  {
    path: "01 Entities/People/E. Paul Torrance.md",
    title: "E. Paul Torrance",
    type: "person",
    status: "curated",
    tags: ["entity/person", "creativity/testing", "gifted-ed"],
    themes: ["[[Psychometrics and Testing]]", "[[Gifted Education]]"],
    related: ["[[Torrance Tests]]", "[[Gifted identification methods]]", "[[California GATE]]"],
    sources: ["[[Source - NAGC on E. Paul Torrance]]"],
    summary:
      "Torrance matters because he represents what was mainstream inside gifted education. His Air Force background gives the graph a defense-adjacent edge without making creativity testing itself a covert program.",
  },
  {
    path: "01 Entities/People/J. B. Rhine.md",
    title: "J. B. Rhine",
    type: "person",
    status: "curated",
    tags: ["entity/person", "parapsychology"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Duke Parapsychology Laboratory]]", "[[Zener Cards]]", "[[Duke University]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "Rhine is the Duke-side anchor for Zener-card research and laboratory ESP work. His note makes the Duke cluster legible without overstating later continuity claims.",
  },
  {
    path: "01 Entities/People/Robert Monroe.md",
    title: "Robert Monroe",
    type: "person",
    status: "curated",
    tags: ["entity/person", "consciousness/audio"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Gateway Process]]", "[[Monroe Institute]]", "[[Skip Atwater]]"],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "Monroe is the altered-state side of the vault's consciousness cluster. He matters less as an education figure than as the origin point for the audio-guided techniques compared against remembered GATE exercises.",
  },
  {
    path: "01 Entities/People/George Leonard.md",
    title: "George Leonard",
    type: "person",
    status: "curated",
    tags: ["entity/person", "esalen", "human-potential"],
    themes: ["[[Parapsychology and ESP]]", "[[Defense and Intelligence]]"],
    related: ["[[Esalen Institute]]", "[[Michael Murphy]]", "[[Harold C. Lyon Jr.]]"],
    sources: ["[[Source - Esalen memorial for George Leonard]]"],
    summary:
      "Leonard matters because his Esalen role and intelligence background make him a clean bridge between the human-potential movement and the intelligence-adjacent cluster.",
  },
  {
    path: "01 Entities/People/Michael Murphy.md",
    title: "Michael Murphy",
    type: "person",
    status: "curated",
    tags: ["entity/person", "esalen"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Esalen Institute]]", "[[George Leonard]]", "[[Harold C. Lyon Jr.]]"],
    sources: ["[[Source - Esalen memorial for George Leonard]]", "[[Source - Harold C. Lyon obituary]]"],
    summary:
      "Murphy is a network node more than a documentary one. He helps the graph show how Lyon's Washington-era social connections touched the Esalen world.",
  },
  {
    path: "01 Entities/People/Skip Atwater.md",
    title: "Skip Atwater",
    type: "person",
    status: "curated",
    tags: ["entity/person", "remote-viewing"],
    themes: ["[[Parapsychology and ESP]]", "[[Defense and Intelligence]]"],
    related: ["[[Stargate Project (U.S. Army)]]", "[[Monroe Institute]]", "[[Gateway Process]]"],
    sources: ["[[Source - CIA AIR evaluation of Remote Viewing]]", "[[Source - CIA Gateway assessment]]"],
    summary:
      "Atwater is useful because he visibly links the Stargate-era remote-viewing world to the Monroe/Gateway world. That helps the graph show lineage rather than isolated topics.",
  },
  {
    path: "01 Entities/Organizations/Office of Gifted and Talented.md",
    title: "Office of Gifted and Talented",
    type: "organization",
    status: "curated",
    tags: ["entity/organization", "education/federal"],
    themes: ["[[Federal Gifted Policy]]"],
    related: ["[[Harold C. Lyon Jr.]]", "[[Marland Report]]", "[[Jacob K. Javits Gifted and Talented Students Education Act]]"],
    sources: ["[[Source - Congressional Record 1975 Office of the Gifted and Talented]]", "[[Source - Federal Register 1979 Office for the Gifted and Talented notice]]"],
    summary:
      "The Office of Gifted and Talented is the administrative center of the federal gifted-policy cluster. It is where Marland-era definition and Lyon-era management visibly join.",
  },
  {
    path: "01 Entities/Organizations/Esalen Institute.md",
    title: "Esalen Institute",
    type: "organization",
    status: "curated",
    tags: ["entity/organization", "human-potential"],
    themes: ["[[Parapsychology and ESP]]", "[[Defense and Intelligence]]"],
    related: ["[[George Leonard]]", "[[Michael Murphy]]", "[[Harold C. Lyon Jr.]]"],
    claims: ["[[Claim - Esalen sat inside intelligence-tracked human potential networks]]"],
    sources: ["[[Source - Esalen memorial for George Leonard]]", "[[Source - CIA Esalen hot-tub diplomacy document]]"],
    summary:
      "Esalen is an important atmosphere-setting institution in this vault: a human-potential node that intelligence institutions tracked, clipped, and intersected with socially. It is not treated here as a proven covert program.",
  },
  {
    path: "01 Entities/Organizations/Monroe Institute.md",
    title: "Monroe Institute",
    type: "organization",
    status: "curated",
    tags: ["entity/organization", "consciousness/audio"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Gateway Process]]", "[[Robert Monroe]]", "[[Skip Atwater]]"],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "The Monroe Institute is the institutional home of the Gateway-style audio and altered-state work that appears in the exported note's recollection comparisons.",
  },
  {
    path: "01 Entities/Organizations/Duke University.md",
    title: "Duke University",
    type: "organization",
    status: "curated",
    tags: ["entity/organization", "gifted-ed", "parapsychology"],
    themes: ["[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    related: ["[[Duke TIP]]", "[[Duke Parapsychology Laboratory]]", "[[J. B. Rhine]]"],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]", "[[Source - Duke Today on Duke TIP]]"],
    summary:
      "Duke is the institutional overlap node where gifted-talent search and older parapsychology archives coexist. The vault treats that as a documented institutional overlap, not as proof of operational continuity.",
  },
  {
    path: "01 Entities/Programs/California Mentally Gifted Minor Program.md",
    title: "California Mentally Gifted Minor Program",
    type: "program",
    status: "curated",
    tags: ["entity/program", "education/california"],
    themes: ["[[California GATE]]", "[[Gifted Education]]"],
    related: ["[[California GATE]]", "[[Gifted identification methods]]"],
    sources: ["[[Source - California Mentally Gifted Minor Program brief history]]", "[[Source - LAO 1988 GATE sunset review]]"],
    summary:
      "MGM is the cleanest California predecessor node for GATE. It lets the graph show an actual state-program lineage before the later recollection-driven claims enter the picture.",
  },
  {
    path: "01 Entities/Programs/Duke TIP.md",
    title: "Duke TIP",
    type: "program",
    status: "curated",
    tags: ["entity/program", "gifted-ed"],
    themes: ["[[Gifted Education]]"],
    related: ["[[Duke University]]", "[[Gifted identification methods]]", "[[Duke Parapsychology Laboratory]]"],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    sources: ["[[Source - Duke Today on Duke TIP]]", "[[Source - Scholars@Duke on Duke TIP]]"],
    summary:
      "Duke TIP represents the talent-search side of the gifted-program ecosystem. It sits in this vault because Duke is also the home of the older Rhine/Zener materials used in the parapsychology cluster.",
  },
  {
    path: "01 Entities/Programs/Duke Parapsychology Laboratory.md",
    title: "Duke Parapsychology Laboratory",
    type: "program",
    status: "curated",
    tags: ["entity/program", "parapsychology"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Duke University]]", "[[J. B. Rhine]]", "[[Zener Cards]]", "[[Duke TIP]]"],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "This is the concrete institutional home of the Rhine/Zener branch of the story. It exists so the graph can show the Duke overlap as a place-based relationship rather than a vague coincidence.",
  },
  {
    path: "01 Entities/Programs/Maimonides Dream Laboratory.md",
    title: "Maimonides Dream Laboratory",
    type: "program",
    status: "curated",
    tags: ["entity/program", "dream-telepathy"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Stanley Krippner]]", "[[Dream Telepathy]]"],
    sources: ["[[Source - CIA Maimonides precedent report]]", "[[Source - CIA Dream Laboratory bulletin 1969]]"],
    summary:
      "Maimonides is the dream-telepathy lab node behind the Krippner overlap. It is one of the clearest places where later CIA-linked anomalous-cognition literature cites earlier civilian research.",
  },
  {
    path: "01 Entities/Programs/MKULTRA.md",
    title: "MKULTRA",
    type: "program",
    status: "curated",
    tags: ["entity/program", "cia/history"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[Stargate Project (U.S. Army)]]"],
    claims: ["[[Claim - CIA research involving children overlapped with selection and steering questions]]"],
    sources: ["[[Source - Senate 1977 MKULTRA hearing]]", "[[Source - Rockefeller Commission report]]", "[[Source - CIA document 00017369 - MKULTRA Subproject 112]]", "[[Source - CIA document 00017445 - MKULTRA Subproject 47]]"],
    summary:
      "MKULTRA is the mind-control and behavior-research anchor in the vault. It is relevant because it documents intelligence interest in children, altered states, and selection questions even where it does not document GATE itself.",
  },
  {
    path: "01 Entities/Programs/Recondo School.md",
    title: "Recondo School",
    type: "program",
    status: "curated",
    tags: ["entity/program", "military/training"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[Harold C. Lyon Jr.]]"],
    claims: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    sources: ["[[Source - Harold C. Lyon obituary]]", "[[Source - West Point record for Harold C. Lyon Jr.]]"],
    summary:
      "Recondo is Lyon's military-training node. It matters because it gives the gifted-policy cluster a documented military-prehistory edge.",
  },
  {
    path: "01 Entities/Programs/Stargate Project (U.S. Army).md",
    title: "Stargate Project (U.S. Army)",
    type: "program",
    status: "curated",
    tags: ["entity/program", "remote-viewing"],
    themes: ["[[Defense and Intelligence]]", "[[Parapsychology and ESP]]"],
    related: ["[[Remote Viewing]]", "[[Skip Atwater]]", "[[John W. Gittinger]]"],
    sources: ["[[Source - CIA Remote Viewing Training Protocol]]", "[[Source - CIA AIR evaluation of Remote Viewing]]", "[[Source - CIA gifted individuals proposal]]"],
    summary:
      "Stargate is the program node that makes the remote-viewing cluster institutional rather than mythical. It is the best place to hold the viewer-monitor-target and gifted-individuals language together without forcing a school-program conclusion.",
  },
  {
    path: "02 Themes/Gifted identification methods.md",
    title: "Gifted identification methods",
    type: "theme",
    status: "curated",
    tags: ["theme/testing", "gifted-ed"],
    related: ["[[Wechsler scales]]", "[[Torrance Tests]]", "[[Personality Assessment System]]", "[[California GATE]]", "[[Duke TIP]]"],
    sources: ["[[Source - ERIC ED056243 - Marland Report]]", "[[Source - LAO 1988 GATE sunset review]]", "[[Source - NAGC on E. Paul Torrance]]"],
    summary:
      "This theme collects the normal screening and enrichment apparatus around gifted programs. It exists so the vault can distinguish ordinary gifted-program testing from the narrower set of remote-viewing and Gateway-style analogies.",
  },
  {
    path: "02 Themes/Classroom recollections of GATE.md",
    title: "Classroom recollections of GATE",
    type: "theme",
    status: "curated",
    tags: ["theme/recollections", "gate"],
    related: ["[[Remote Viewing]]", "[[Gateway Process]]", "[[Zener Cards]]"],
    claims: ["[[Claim - GATE classroom recollections resemble remote-viewing protocols]]", "[[Claim - GATE classroom recollections resemble Gateway-style exercises]]", "[[Claim - GATE memories form an anecdotal pattern rather than verified program history]]"],
    sources: ["[[Source - Yahoo News Jan 2025 on GATE recollections]]"],
    summary:
      "This theme holds the modern recollection layer: dark rooms, headphones, sealed targets, visualization, symbol-guessing, and the sense of being studied. It is useful because it creates a consistent graph node for memory reports without treating them as settled history.",
  },
  {
    path: "02 Themes/Remote Viewing.md",
    title: "Remote Viewing",
    type: "theme",
    status: "curated",
    tags: ["theme/remote-viewing", "psi"],
    related: ["[[Stargate Project (U.S. Army)]]", "[[Personality Assessment System]]", "[[Gateway Process]]"],
    claims: ["[[Claim - GATE classroom recollections resemble remote-viewing protocols]]", "[[Claim - Similar methods do not prove CIA control of GATE classrooms]]"],
    sources: ["[[Source - CIA Remote Viewing Training Protocol]]", "[[Source - CIA AIR evaluation of Remote Viewing]]", "[[Source - CIA gifted individuals proposal]]"],
    summary:
      "Remote viewing is the named protocol that provides the strongest exercise-level comparison in the vault. The documentary record is strong for the protocol itself and weak for any direct classroom transfer claim.",
  },
  {
    path: "02 Themes/Gateway Process.md",
    title: "Gateway Process",
    type: "theme",
    status: "curated",
    tags: ["theme/gateway", "consciousness/audio"],
    related: ["[[Monroe Institute]]", "[[Robert Monroe]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - GATE classroom recollections resemble Gateway-style exercises]]"],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "The Gateway theme is where the headphones, altered-state preparation, and audio-guided exercises live in the graph. It is adjacent to remote viewing but not reducible to it.",
  },
  {
    path: "02 Themes/Personality Assessment System.md",
    title: "Personality Assessment System",
    type: "theme",
    status: "curated",
    tags: ["theme/psychometrics", "cia"],
    related: ["[[John W. Gittinger]]", "[[Wechsler scales]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - Gifted testing and PAS share a Wechsler lineage]]", "[[Claim - Wechsler-derived profiling overlaps with gifted identification tools]]"],
    sources: ["[[Source - CIA PAS screening report]]", "[[Source - CIA PAS review report]]"],
    summary:
      "PAS is the intelligence-side psychometric theme of the vault. It matters because it creates a concrete overlap between school testing families and CIA personality profiling logic.",
  },
  {
    path: "02 Themes/Zener Cards.md",
    title: "Zener Cards",
    type: "theme",
    status: "curated",
    tags: ["theme/zener", "esp"],
    related: ["[[J. B. Rhine]]", "[[Duke Parapsychology Laboratory]]", "[[Duke University]]"],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]", "[[Claim - GATE classroom recollections resemble remote-viewing protocols]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "Zener cards are the clearest visual bridge between the exported note's remembered symbol tests and the older Duke ESP laboratory record. The bridge is documentary at the method level, not at the institutional-transfer level.",
  },
  {
    path: "02 Themes/Dream Telepathy.md",
    title: "Dream Telepathy",
    type: "theme",
    status: "curated",
    tags: ["theme/dream-telepathy", "psi"],
    related: ["[[Maimonides Dream Laboratory]]", "[[Stanley Krippner]]"],
    claims: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    sources: ["[[Source - CIA Maimonides precedent report]]", "[[Source - CIA Dream Laboratory bulletin 1969]]"],
    summary:
      "Dream telepathy is the Maimonides branch of the consciousness-research web. It gives the Krippner cluster a real laboratory and documentary context.",
  },
  {
    path: "02 Themes/Wechsler scales.md",
    title: "Wechsler scales",
    type: "theme",
    status: "curated",
    tags: ["theme/testing", "psychometrics"],
    related: ["[[Gifted identification methods]]", "[[Personality Assessment System]]", "[[John W. Gittinger]]"],
    claims: ["[[Claim - Gifted testing and PAS share a Wechsler lineage]]"],
    sources: ["[[Source - CIA PAS screening report]]", "[[Source - CIA PAS review report]]", "[[Source - LAO 1988 GATE sunset review]]"],
    summary:
      "The Wechsler theme holds the most concrete methodological overlap between gifted-program testing and intelligence-adjacent personality assessment. It is a testing-family connection, not proof of a shared program.",
  },
  {
    path: "02 Themes/Torrance Tests.md",
    title: "Torrance Tests",
    type: "theme",
    status: "curated",
    tags: ["theme/creativity", "gifted-ed"],
    related: ["[[E. Paul Torrance]]", "[[Gifted identification methods]]"],
    sources: ["[[Source - NAGC on E. Paul Torrance]]"],
    summary:
      "Torrance testing represents the normal creativity-assessment side of gifted education. It belongs in the graph because it helps separate routine enrichment practices from the stranger recollection claims.",
  },
  {
    path: "03 Claims/Claim - GATE classroom recollections resemble remote-viewing protocols.md",
    title: "Claim - GATE classroom recollections resemble remote-viewing protocols",
    type: "claim",
    status: "speculative",
    tags: ["claim/resemblance", "claim/remote-viewing"],
    related: ["[[Classroom recollections of GATE]]", "[[Remote Viewing]]", "[[Stargate Project (U.S. Army)]]", "[[Zener Cards]]"],
    sources: ["[[Source - CIA Remote Viewing Training Protocol]]", "[[Source - CIA gifted individuals proposal]]", "[[Source - Yahoo News Jan 2025 on GATE recollections]]"],
    summary:
      "This claim tracks the resemblance between remembered classroom exercises and named remote-viewing structures such as target work, symbol testing, and role-based sessions. It does not claim a proven institutional pipeline into GATE classrooms.",
  },
  {
    path: "03 Claims/Claim - GATE classroom recollections resemble Gateway-style exercises.md",
    title: "Claim - GATE classroom recollections resemble Gateway-style exercises",
    type: "claim",
    status: "speculative",
    tags: ["claim/resemblance", "claim/gateway"],
    related: ["[[Classroom recollections of GATE]]", "[[Gateway Process]]", "[[Monroe Institute]]"],
    sources: ["[[Source - CIA Gateway assessment]]", "[[Source - Yahoo News Jan 2025 on GATE recollections]]"],
    summary:
      "This claim is about the heavy-headphones, guided-visualization side of the recollection cluster. It is one of the strongest consciousness-technique analogies in the vault, but still an analogy.",
  },
  {
    path: "03 Claims/Claim - No direct document places CIA operatives inside GATE classrooms.md",
    title: "Claim - No direct document places CIA operatives inside GATE classrooms",
    type: "claim",
    status: "supported",
    tags: ["claim/caution"],
    related: ["[[GATE Program]]", "[[Remote Viewing]]", "[[MKULTRA]]"],
    sources: ["[[Source - CIA AIR evaluation of Remote Viewing]]", "[[Source - Senate 1977 MKULTRA hearing]]"],
    summary:
      "This is the vault's main cautionary claim. It exists to keep the graph epistemically honest: the material supports overlap and resemblance more strongly than direct operational control.",
  },
  {
    path: "03 Claims/Claim - GATE memories form an anecdotal pattern rather than verified program history.md",
    title: "Claim - GATE memories form an anecdotal pattern rather than verified program history",
    type: "claim",
    status: "anecdotal",
    tags: ["claim/anecdotal"],
    related: ["[[Classroom recollections of GATE]]", "[[GATE Program]]"],
    sources: ["[[Source - Yahoo News Jan 2025 on GATE recollections]]"],
    summary:
      "This claim is the right frame for the memory layer: repeated details make the recollections worth tracking, but they remain weaker than state, federal, and declassified archival records.",
  },
  {
    path: "03 Claims/Claim - Krippner bridged gifted education and parapsychology networks.md",
    title: "Claim - Krippner bridged gifted education and parapsychology networks",
    type: "claim",
    status: "supported",
    tags: ["claim/network-overlap"],
    related: ["[[Stanley Krippner]]", "[[Maimonides Dream Laboratory]]", "[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    sources: ["[[Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth]]", "[[Source - CIA Maimonides precedent report]]", "[[Source - Stanley Krippner bibliography 1960-1965]]"],
    summary:
      "This is one of the strongest bridge claims in the vault because Krippner genuinely appears in both gifted-education and psi-research records. The open question is influence, not overlap.",
  },
  {
    path: "03 Claims/Claim - Duke housed both gifted pipeline and ESP research.md",
    title: "Claim - Duke housed both gifted pipeline and ESP research",
    type: "claim",
    status: "supported",
    tags: ["claim/institutional-overlap"],
    related: ["[[Duke University]]", "[[Duke TIP]]", "[[Duke Parapsychology Laboratory]]", "[[J. B. Rhine]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]", "[[Source - Duke Today on Duke TIP]]", "[[Source - Scholars@Duke on Duke TIP]]"],
    summary:
      "This claim is factual at the institutional level: Duke hosted both a major gifted-talent pipeline and the earlier parapsychology laboratory associated with Rhine. Any stronger continuity claim needs separate proof.",
  },
  {
    path: "03 Claims/Claim - Gifted testing and PAS share a Wechsler lineage.md",
    title: "Claim - Gifted testing and PAS share a Wechsler lineage",
    type: "claim",
    status: "supported",
    tags: ["claim/testing-overlap"],
    related: ["[[Personality Assessment System]]", "[[Wechsler scales]]", "[[Gifted identification methods]]", "[[John W. Gittinger]]"],
    sources: ["[[Source - CIA PAS screening report]]", "[[Source - CIA PAS review report]]", "[[Source - LAO 1988 GATE sunset review]]"],
    summary:
      "This claim is intentionally narrow: both school gifted identification and PAS profiling touch the Wechsler testing family. It is a real overlap in measurement infrastructure, not a proven covert pipeline.",
  },
  {
    path: "03 Claims/Claim - CIA research involving children overlapped with selection and steering questions.md",
    title: "Claim - CIA research involving children overlapped with selection and steering questions",
    type: "claim",
    status: "supported",
    tags: ["claim/mkultra"],
    related: ["[[MKULTRA]]", "[[Defense and Intelligence]]", "[[GATE Program]]"],
    sources: ["[[Source - CIA document 00017369 - MKULTRA Subproject 112]]", "[[Source - CIA document 00017445 - MKULTRA Subproject 47]]", "[[Source - Senate 1977 MKULTRA hearing]]"],
    summary:
      "This claim keeps the MKULTRA side of the vault specific. The evidence supports child-focused intelligence research and selection concerns; it does not by itself prove a later GATE link.",
  },
  {
    path: "03 Claims/Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control.md",
    title: "Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control",
    type: "claim",
    status: "supported",
    tags: ["claim/marland"],
    related: ["[[Sidney P. Marland Jr.]]", "[[Federal Gifted Policy]]", "[[Defense and Intelligence]]"],
    sources: ["[[Source - DVIDS PACMIRS history]]", "[[Source - ERIC ED056243 - Marland Report]]"],
    summary:
      "This claim exists to correct both extremes: Marland's wartime background matters, but the documents do not justify turning him into a cartoon intelligence mastermind.",
  },
  {
    path: "03 Claims/Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks.md",
    title: "Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks",
    type: "claim",
    status: "supported",
    tags: ["claim/lyon-network"],
    related: ["[[Harold C. Lyon Jr.]]", "[[Office of Gifted and Talented]]", "[[Recondo School]]", "[[Esalen Institute]]"],
    sources: ["[[Source - Harold C. Lyon obituary]]", "[[Source - West Point record for Harold C. Lyon Jr.]]", "[[Source - Esalen memorial for George Leonard]]"],
    summary:
      "This is the strongest personnel-network claim in the vault. It is grounded in Lyon's documented military background, federal gifted role, and Esalen-adjacent relationships.",
  },
  {
    path: "03 Claims/Claim - Esalen sat inside intelligence-tracked human potential networks.md",
    title: "Claim - Esalen sat inside intelligence-tracked human potential networks",
    type: "claim",
    status: "supported",
    tags: ["claim/esalen-network"],
    related: ["[[Esalen Institute]]", "[[George Leonard]]", "[[Michael Murphy]]", "[[Defense and Intelligence]]"],
    sources: ["[[Source - Esalen memorial for George Leonard]]", "[[Source - CIA Esalen hot-tub diplomacy document]]"],
    summary:
      "This claim keeps the Esalen cluster precise. The vault treats Esalen as intelligence-tracked and network-adjacent rather than as a proven covert operation.",
  },
];

const claimsIndex = {
  path: "00 Maps/Claims Index.md",
  title: "Claims Index",
  type: "map",
  status: "curated",
  tags: ["map/claims"],
  related: notes.filter((note) => note.type === "claim").map((note) => `[[${note.title}]]`),
  summary:
    "This index pulls the interpretation layer into one place. It makes the graph dense without forcing every relationship into the same certainty class.",
};

const sourceIndex = {
  path: "00 Maps/Source Index.md",
  title: "Source Index",
  type: "map",
  status: "curated",
  tags: ["map/sources"],
  related: sourceTitles.map((title) => `[[${title}]]`),
  summary:
    "Source notes are the evidence spine of the vault. Every major person, program, and claim should route back through these notes rather than resting on naked adjacency alone.",
};

const timeline = {
  path: "05 Timelines/GATE Timeline.md",
  title: "GATE Timeline",
  type: "timeline",
  status: "curated",
  tags: ["timeline/gate"],
  related: [
    "[[MKULTRA]]",
    "[[California Mentally Gifted Minor Program]]",
    "[[Marland Report]]",
    "[[Office of Gifted and Talented]]",
    "[[California GATE]]",
    "[[Duke TIP]]",
    "[[Stargate Project (U.S. Army)]]",
  ],
  sources: [
    "[[Source - California Mentally Gifted Minor Program brief history]]",
    "[[Source - ERIC ED056243 - Marland Report]]",
    "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
    "[[Source - LAO 1988 GATE sunset review]]",
    "[[Source - Senate 1977 MKULTRA hearing]]",
    "[[Source - CIA AIR evaluation of Remote Viewing]]",
  ],
  summary:
    "1953: MKULTRA begins. 1961: California's MGM history enters the archival record. 1964-1973: Maimonides dream-telepathy work develops. 1972: the Marland Report defines giftedness and the Office of Gifted and Talented appears. 1977: the Senate MKULTRA hearing becomes a public record. 1979: California GATE succeeds MGM. 1980: Duke TIP launches. 1983-1986: Gateway, PAS, and remote-viewing documents deepen the intelligence-side archive. 1995: the AIR evaluation closes the remote-viewing program on skeptical terms.",
};

const welcome = {
  path: "Welcome.md",
  title: "Welcome",
  type: "map",
  status: "curated",
  tags: ["map/home"],
  related: [
    "[[Vault Home]]",
    "[[GATE Program]]",
    "[[Federal Gifted Policy]]",
    "[[California GATE]]",
    "[[Defense and Intelligence]]",
    "[[Parapsychology and ESP]]",
    "[[Psychometrics and Testing]]",
    "[[Source Index]]",
    "[[Claims Index]]",
  ],
  summary:
    "This vault is organized around cluster maps, entity notes, claim notes, and source notes. Start with [[Vault Home]] if you want the whole network, or jump directly into the major hubs listed below.",
};

const graphConfig = {
  showTags: true,
  showOrphans: false,
  "collapse-color-groups": false,
  colorGroups: [
    { query: 'path:"00 Maps"', color: { a: 1, rgb: 14251782 } },
    { query: 'path:"01 Entities"', color: { a: 1, rgb: 2450411 } },
    { query: 'path:"02 Themes"', color: { a: 1, rgb: 366185 } },
    { query: 'path:"03 Claims"', color: { a: 1, rgb: 14427686 } },
    { query: 'path:"04 Sources"', color: { a: 1, rgb: 7041664 } },
    { query: 'path:"05 Timelines"', color: { a: 1, rgb: 8141549 } },
  ],
};

const allNotes = [...notes, claimsIndex, sourceIndex, timeline, welcome];

async function main() {
  for (const note of allNotes) {
    await writeVaultFile(note.path, render(note));
  }

  let currentGraph = {};
  try {
    currentGraph = JSON.parse(await readFile(join(root, ".obsidian/graph.json"), "utf8"));
  } catch {}

  await writeVaultFile(
    ".obsidian/graph.json",
    `${JSON.stringify({ ...currentGraph, ...graphConfig }, null, 2)}\n`,
  );
}

await main();
