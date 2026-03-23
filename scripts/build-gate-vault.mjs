import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();

const generatedTargets = [
  "00 Maps",
  "01 Entities",
  "02 Themes",
  "03 Claims",
  "04 Sources/Primary",
  "04 Sources/Secondary",
  "05 Timelines",
  "Welcome.md",
];

const hex = (value) => Number.parseInt(value, 16);

function dedent(text) {
  const lines = text.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const margins = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)[0].length);
  const margin = margins.length ? Math.min(...margins) : 0;
  return lines.map((line) => line.slice(margin)).join("\n");
}

function yamlScalar(value) {
  if (value == null) return '""';
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function frontmatterBlock(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      if (!value.length) {
        lines.push("  []");
        continue;
      }
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

function renderNote(note) {
  const frontmatter = frontmatterBlock({
    type: note.type,
    aliases: note.aliases ?? [],
    tags: note.tags ?? [],
    status: note.status,
    themes: note.themes ?? [],
    related: note.related ?? [],
    sources: note.sources ?? [],
    ...note.extraFrontmatter,
  });

  const parts = [
    frontmatter,
    `# ${note.title}`,
    "## Summary",
    note.summary.trim(),
    section("Connected Notes", note.related),
    section("Claims", note.claims),
    section("Sources", note.sources),
  ].filter(Boolean);

  return `${parts.join("\n\n")}\n`;
}

function renderSourceNote(source) {
  const frontmatter = frontmatterBlock({
    type: "source",
    source_kind: source.sourceKind,
    author: source.author,
    year: source.year,
    url: source.url,
    archive_url: source.archiveUrl ?? "",
    local_file: source.localFileResolved ?? "",
    reliability: source.reliability,
    tags: source.tags ?? [`source/${source.sourceKind}`],
    supports: source.supports ?? [],
    mentions: source.mentions ?? [],
  });

  const parts = [
    frontmatter,
    `# ${source.title}`,
    "## Summary",
    source.summary.trim(),
    section("Mentions", source.mentions),
    section("Supports", source.supports),
  ].filter(Boolean);

  return `${parts.join("\n\n")}\n`;
}

function renderIndexNote(title, summary, links, sources = []) {
  return renderNote({
    title,
    type: "map",
    status: "curated",
    tags: ["map/index"],
    summary,
    related: links,
    sources,
  });
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function resetGeneratedOutput() {
  await Promise.all(
    generatedTargets.map((target) =>
      rm(join(root, target), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

async function writeVaultFile(relativePath, content) {
  const fullPath = join(root, relativePath);
  await ensureDir(dirname(fullPath));
  await writeFile(fullPath, content, "utf8");
}

async function tryDownload(source) {
  if (!source.downloadUrl || !source.localFile) return "";

  const response = await fetch(source.downloadUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
    headers: {
      "user-agent": "Mozilla/5.0 Codex vault builder",
      accept: "*/*",
    },
  });

  if (!response.ok) return "";

  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = join(root, source.localFile);
  await ensureDir(dirname(filePath));
  await writeFile(filePath, buffer);
  return source.localFile;
}

const mapNotes = [
  {
    path: "00 Maps/GATE Program.md",
    title: "GATE Program",
    type: "map",
    status: "curated",
    tags: ["map/gate", "education/gifted", "research/hub"],
    themes: ["[[Gifted Education]]", "[[Federal Gifted Policy]]", "[[Psychometrics and Testing]]"],
    related: [
      "[[Gifted Education]]",
      "[[Federal Gifted Policy]]",
      "[[California GATE]]",
      "[[Psychometrics and Testing]]",
      "[[Parapsychology and ESP]]",
      "[[Defense and Intelligence]]",
      "[[GATE Timeline]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - LAO 1988 GATE sunset review]]",
      "[[Source - California Mentally Gifted Minor Program brief history]]",
    ],
    summary:
      "[[GATE Program]] is the central map for the vault's gifted-education story and the claims web built around remembered classroom exercises. It ties the administrative history of gifted education to adjacent clusters in [[Psychometrics and Testing]], [[Parapsychology and ESP]], and [[Defense and Intelligence]].",
  },
  {
    path: "00 Maps/Gifted Education.md",
    title: "Gifted Education",
    type: "map",
    status: "curated",
    tags: ["map/gifted-ed", "education/gifted"],
    themes: ["[[Federal Gifted Policy]]", "[[Gifted Identification Methods]]"],
    related: [
      "[[GATE Program]]",
      "[[Federal Gifted Policy]]",
      "[[California Mentally Gifted Minor Program]]",
      "[[California GATE]]",
      "[[Office of Gifted and Talented]]",
      "[[Gifted Identification Methods]]",
      "[[Duke TIP]]",
    ],
    claims: [
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
      "[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - California Mentally Gifted Minor Program brief history]]",
      "[[Source - LAO 1988 GATE sunset review]]",
    ],
    summary:
      "[[Gifted Education]] anchors the documented policy and testing infrastructure behind programs later branded as [[GATE Program]]. This cluster is where federal definitions, California program history, talent-search pipelines, and testing methods intersect.",
  },
  {
    path: "00 Maps/Federal Gifted Policy.md",
    title: "Federal Gifted Policy",
    type: "map",
    status: "curated",
    tags: ["map/federal-policy", "education/policy"],
    themes: ["[[Gifted Education]]"],
    related: [
      "[[Sidney P. Marland Jr.]]",
      "[[Marland Report]]",
      "[[Office of Gifted and Talented]]",
      "[[Harold C. Lyon Jr.]]",
      "[[Jacob K. Javits Gifted and Talented Students Education Act]]",
      "[[Gifted Education]]",
    ],
    claims: [
      "[[Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control]]",
      "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
      "[[Source - Federal Register 1979 Office for the Gifted and Talented notice]]",
    ],
    summary:
      "This map keeps the federal record straight: the [[Marland Report]] defined giftedness for Congress, the [[Office of Gifted and Talented]] institutionalized that work, and later [[Jacob K. Javits Gifted and Talented Students Education Act]] efforts extended it. It is the cleanest entry point for separating documented policy history from wider network claims.",
  },
  {
    path: "00 Maps/California GATE.md",
    title: "California GATE",
    type: "map",
    status: "curated",
    tags: ["map/california-gate", "education/california"],
    themes: ["[[Gifted Education]]", "[[Gifted Identification Methods]]"],
    related: [
      "[[California Mentally Gifted Minor Program]]",
      "[[California GATE]]",
      "[[GATE Program]]",
      "[[Stanley Krippner]]",
      "[[Gifted Identification Methods]]",
      "[[Torrance Tests]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - California Mentally Gifted Minor Program brief history]]",
      "[[Source - LAO 1988 GATE sunset review]]",
      "[[Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth]]",
    ],
    summary:
      "[[California GATE]] is the state-level hub for the program history most often referenced in recollection threads. The cluster starts with the [[California Mentally Gifted Minor Program]], then tracks how testing, enrichment, and later GATE branding evolved in California.",
  },
  {
    path: "00 Maps/Defense and Intelligence.md",
    title: "Defense and Intelligence",
    type: "map",
    status: "curated",
    tags: ["map/defense-intelligence", "defense/intelligence"],
    themes: ["[[Human Potential Movement]]", "[[Remote Viewing]]"],
    related: [
      "[[Sidney P. Marland Jr.]]",
      "[[Harold C. Lyon Jr.]]",
      "[[John W. Gittinger]]",
      "[[MKULTRA]]",
      "[[Stargate Project]]",
      "[[Central Intelligence Agency]]",
      "[[Esalen Institute]]",
    ],
    claims: [
      "[[Claim - MKULTRA included child subjects and vocational steering research]]",
      "[[Claim - Esalen attracted intelligence attention]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
    ],
    sources: [
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - Rockefeller Commission report]]",
      "[[Source - CIA Esalen hot-tub diplomacy document]]",
    ],
    summary:
      "This map groups the military, intelligence, and behavior-research institutions that recur across the vault. It is where personnel histories, CIA files, MKULTRA documents, and the later [[Stargate Project]] cluster into a visible network around the education notes.",
  },
  {
    path: "00 Maps/Parapsychology and ESP.md",
    title: "Parapsychology and ESP",
    type: "map",
    status: "curated",
    tags: ["map/parapsychology", "consciousness/esp"],
    themes: ["[[Zener Cards]]", "[[Dream Telepathy]]", "[[Remote Viewing]]"],
    related: [
      "[[Stanley Krippner]]",
      "[[J. B. Rhine]]",
      "[[Karl Zener]]",
      "[[Maimonides Dream Laboratory]]",
      "[[Duke Parapsychology Laboratory]]",
      "[[Remote Viewing]]",
      "[[Zener Cards]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
      "[[Claim - Duke housed both gifted pipeline and ESP research]]",
    ],
    sources: [
      "[[Source - CIA Dream Laboratory bulletin 1969]]",
      "[[Source - CIA Maimonides precedent report]]",
      "[[Source - Stanley Krippner bibliography 1960-1965]]",
    ],
    summary:
      "This map covers the experimental methods and institutions that supplied many of the protocols later compared to GATE recollections. The strongest factual bridges here involve [[Stanley Krippner]], [[Maimonides Dream Laboratory]], [[J. B. Rhine]], and [[Zener Cards]].",
  },
  {
    path: "00 Maps/Remote Viewing.md",
    title: "Remote Viewing",
    type: "map",
    status: "curated",
    tags: ["map/remote-viewing", "consciousness/remote-viewing"],
    themes: ["[[Gateway Process]]", "[[Personality Assessment System]]"],
    related: [
      "[[Stargate Project]]",
      "[[Gateway Process]]",
      "[[John W. Gittinger]]",
      "[[Robert Monroe]]",
      "[[Skip Atwater]]",
      "[[Dale Graff]]",
      "[[Personality Assessment System]]",
    ],
    claims: [
      "[[Claim - Remote viewing programs used language of gifted individuals]]",
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
    ],
    sources: [
      "[[Source - CIA Remote Viewing Training Protocol]]",
      "[[Source - CIA Gateway assessment]]",
      "[[Source - CIA PAS screening report]]",
      "[[Source - CIA AIR evaluation of Remote Viewing]]",
    ],
    summary:
      "This cluster focuses on the documented viewer-monitor-target protocols, associated screening methods, and the Monroe/Gateway lineage. It is the cleanest place to compare classroom recollection motifs against declassified remote-viewing documents without overstating the bridge.",
  },
  {
    path: "00 Maps/Psychometrics and Testing.md",
    title: "Psychometrics and Testing",
    type: "map",
    status: "curated",
    tags: ["map/psychometrics", "testing/assessment"],
    themes: ["[[Gifted Identification Methods]]", "[[Wechsler Scales]]", "[[Torrance Tests]]"],
    related: [
      "[[Gifted Identification Methods]]",
      "[[Wechsler Scales]]",
      "[[Torrance Tests]]",
      "[[Personality Assessment System]]",
      "[[E. Paul Torrance]]",
      "[[John W. Gittinger]]",
      "[[GATE Program]]",
    ],
    claims: [
      "[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]",
    ],
    sources: [
      "[[Source - NAGC on E. Paul Torrance]]",
      "[[Source - CIA PAS screening report]]",
      "[[Source - ERIC ED056243 - Marland Report]]",
    ],
    summary:
      "This map groups the tests and assessment systems that recur in both gifted education and intelligence-adjacent screening discussions. It is especially useful for tracing how [[Wechsler Scales]], [[Torrance Tests]], and the [[Personality Assessment System]] create a shared vocabulary across otherwise separate domains.",
  },
];

const entityNotes = [
  {
    path: "01 Entities/Organizations/Central Intelligence Agency.md",
    title: "Central Intelligence Agency",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "defense/intelligence"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[MKULTRA]]", "[[Stargate Project]]", "[[John W. Gittinger]]", "[[Esalen Institute]]"],
    claims: [
      "[[Claim - MKULTRA included child subjects and vocational steering research]]",
      "[[Claim - Esalen attracted intelligence attention]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
    ],
    sources: [
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - CIA AIR evaluation of Remote Viewing]]",
      "[[Source - CIA Esalen hot-tub diplomacy document]]",
    ],
    summary:
      "The [[Central Intelligence Agency]] is the core institutional node behind the MKULTRA, STAR GATE, and behavior-research files linked throughout the vault. Its presence in the graph is documentary, not inferential: the disputed part is how far those interests reached into school gifted programs.",
  },
  {
    path: "01 Entities/People/Sidney P. Marland Jr..md",
    title: "Sidney P. Marland Jr.",
    type: "person",
    aliases: ["Sidney Marland"],
    status: "seed",
    tags: ["entity/person", "education/policy", "defense/army"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]"],
    related: [
      "[[Marland Report]]",
      "[[Federal Gifted Policy]]",
      "[[Gifted Education]]",
      "[[College Board]]",
      "[[Harold C. Lyon Jr.]]",
    ],
    claims: [
      "[[Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control]]",
    ],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - DVIDS PACMIRS history]]",
    ],
    summary:
      "[[Sidney P. Marland Jr.]] authored the federal report that standardized the government's definition of giftedness and pushed systematic identification of gifted children. His wartime service and later education-policy role make him a key bridge node between the administrative history of gifted education and the defense-adjacent biographies in the vault.",
  },
  {
    path: "01 Entities/Documents/Marland Report.md",
    title: "Marland Report",
    type: "document",
    aliases: ["Education of the Gifted and Talented"],
    status: "seed",
    tags: ["entity/document", "education/policy"],
    themes: ["[[Federal Gifted Policy]]", "[[Gifted Education]]"],
    related: [
      "[[Sidney P. Marland Jr.]]",
      "[[Federal Gifted Policy]]",
      "[[Office of Gifted and Talented]]",
      "[[Gifted Identification Methods]]",
      "[[GATE Program]]",
    ],
    claims: [],
    sources: ["[[Source - ERIC ED056243 - Marland Report]]"],
    summary:
      "The [[Marland Report]] is the foundational federal policy document for this vault. It anchors the shift from local gifted programs to a national definition-and-identification framework that later shaped offices, grants, and state-level gifted programs.",
  },
  {
    path: "01 Entities/Organizations/College Board.md",
    title: "College Board",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "education/testing"],
    themes: ["[[Gifted Education]]", "[[Psychometrics and Testing]]"],
    related: ["[[Sidney P. Marland Jr.]]", "[[Gifted Education]]", "[[Psychometrics and Testing]]"],
    claims: [],
    sources: [],
    summary:
      "[[College Board]] appears in the vault as Sidney Marland's post-federal institutional stop and as a reminder that gifted-identification policy eventually fed into larger testing and sorting systems. It is a minor node, but it helps close a visible path from federal policy to later testing infrastructure.",
  },
  {
    path: "01 Entities/People/Harold C. Lyon Jr..md",
    title: "Harold C. Lyon Jr.",
    aliases: ["Hal Lyon"],
    type: "person",
    status: "seed",
    tags: ["entity/person", "education/policy", "defense/army"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]", "[[Human Potential Movement]]"],
    related: [
      "[[Office of Gifted and Talented]]",
      "[[Federal Gifted Policy]]",
      "[[Esalen Institute]]",
      "[[George Leonard]]",
      "[[Michael Murphy]]",
    ],
    claims: [
      "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]",
    ],
    sources: [
      "[[Source - Harold C. Lyon obituary]]",
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
      "[[Source - Federal Register 1979 Office for the Gifted and Talented notice]]",
    ],
    summary:
      "[[Harold C. Lyon Jr.]] ran the federal [[Office of Gifted and Talented]] after a military career that included founding the Army's first Recondo school. His later friendships with [[George Leonard]] and [[Michael Murphy]] place him at one of the vault's clearest people-level intersections between federal gifted policy, defense experience, and Esalen-adjacent networks.",
  },
  {
    path: "01 Entities/Organizations/Office of Gifted and Talented.md",
    title: "Office of Gifted and Talented",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "education/policy"],
    themes: ["[[Federal Gifted Policy]]"],
    related: [
      "[[Federal Gifted Policy]]",
      "[[Harold C. Lyon Jr.]]",
      "[[Marland Report]]",
      "[[Gifted Education]]",
      "[[Jacob K. Javits Gifted and Talented Students Education Act]]",
    ],
    claims: [],
    sources: [
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
      "[[Source - Federal Register 1979 Office for the Gifted and Talented notice]]",
    ],
    summary:
      "The [[Office of Gifted and Talented]] is the federal administrative node that turned the report-era definition of giftedness into ongoing policy and grant infrastructure. In the graph it ties the Marland and Lyon biographies to a concrete office rather than a vague policy narrative.",
  },
  {
    path: "01 Entities/Documents/Jacob K. Javits Gifted and Talented Students Education Act.md",
    title: "Jacob K. Javits Gifted and Talented Students Education Act",
    type: "document",
    aliases: ["Javits gifted legislation"],
    status: "seed",
    tags: ["entity/document", "education/legislation"],
    themes: ["[[Federal Gifted Policy]]"],
    related: [
      "[[Federal Gifted Policy]]",
      "[[Office of Gifted and Talented]]",
      "[[Gifted Education]]",
      "[[Harold C. Lyon Jr.]]",
    ],
    claims: [],
    sources: ["[[Source - Congress.gov Javits gifted legislation history]]"],
    summary:
      "The [[Jacob K. Javits Gifted and Talented Students Education Act]] is the legislative follow-through on the federal gifted-policy arc. It belongs in the vault as the statutory continuation of the work associated with the [[Marland Report]] and the federal gifted office.",
  },
  {
    path: "01 Entities/Programs/California Mentally Gifted Minor Program.md",
    title: "California Mentally Gifted Minor Program",
    aliases: ["MGM"],
    type: "program",
    status: "seed",
    tags: ["entity/program", "education/california"],
    themes: ["[[Gifted Education]]", "[[California GATE]]"],
    related: [
      "[[California GATE]]",
      "[[GATE Program]]",
      "[[Gifted Identification Methods]]",
      "[[Stanley Krippner]]",
    ],
    claims: [
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - California Mentally Gifted Minor Program brief history]]",
      "[[Source - LAO 1988 GATE sunset review]]",
    ],
    summary:
      "The [[California Mentally Gifted Minor Program]] is the clearest documented predecessor to California's later GATE branding. It matters because it grounds the state-level part of the story in real program history before the vault branches into claims about screening, enrichment, and remembered exercises.",
  },
  {
    path: "01 Entities/Programs/California GATE.md",
    title: "California GATE",
    type: "program",
    status: "seed",
    tags: ["entity/program", "education/california"],
    themes: ["[[Gifted Education]]", "[[California GATE]]"],
    related: [
      "[[California Mentally Gifted Minor Program]]",
      "[[GATE Program]]",
      "[[Torrance Tests]]",
      "[[Gifted Identification Methods]]",
    ],
    claims: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
    ],
    sources: ["[[Source - LAO 1988 GATE sunset review]]"],
    summary:
      "[[California GATE]] is the state-program node most likely to pull together policy history, testing methods, and anecdotal recollections in one graph neighborhood. It follows directly from the [[California Mentally Gifted Minor Program]] and becomes the obvious landing point for the classroom-memory claims layer.",
  },
  {
    path: "01 Entities/People/Stanley Krippner.md",
    title: "Stanley Krippner",
    type: "person",
    status: "seed",
    tags: ["entity/person", "education/gifted", "consciousness/parapsychology"],
    themes: ["[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    related: [
      "[[Maimonides Dream Laboratory]]",
      "[[Dream Telepathy]]",
      "[[Gifted Education]]",
      "[[California GATE]]",
      "[[Remote Viewing]]",
    ],
    claims: [
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth]]",
      "[[Source - Stanley Krippner bibliography 1960-1965]]",
      "[[Source - CIA Maimonides precedent report]]",
    ],
    summary:
      "[[Stanley Krippner]] is one of the strongest overlap nodes in the vault because his gifted-education publications and his dream-telepathy work sit on the record at the same time. His note is designed to show overlap of roles and influence without overstating it as proof of intelligence-directed educational design.",
  },
  {
    path: "01 Entities/Programs/Maimonides Dream Laboratory.md",
    title: "Maimonides Dream Laboratory",
    type: "program",
    status: "seed",
    tags: ["entity/program", "consciousness/parapsychology"],
    themes: ["[[Parapsychology and ESP]]", "[[Dream Telepathy]]"],
    related: [
      "[[Stanley Krippner]]",
      "[[Dream Telepathy]]",
      "[[Remote Viewing]]",
      "[[Parapsychology and ESP]]",
    ],
    claims: [
      "[[Claim - Krippner bridged gifted education and parapsychology networks]]",
    ],
    sources: [
      "[[Source - CIA Dream Laboratory bulletin 1969]]",
      "[[Source - CIA Maimonides precedent report]]",
    ],
    summary:
      "The [[Maimonides Dream Laboratory]] is the dream-telepathy institution that makes the Krippner overlap concrete. It also serves as a source-backed precursor node for later CIA and SAIC discussions of anomalous cognition and remote viewing.",
  },
  {
    path: "01 Entities/People/John W. Gittinger.md",
    title: "John W. Gittinger",
    type: "person",
    status: "seed",
    tags: ["entity/person", "defense/intelligence", "testing/psychometrics"],
    themes: ["[[Psychometrics and Testing]]", "[[Remote Viewing]]"],
    related: [
      "[[Personality Assessment System]]",
      "[[Wechsler Scales]]",
      "[[Remote Viewing]]",
      "[[Central Intelligence Agency]]",
    ],
    claims: [
      "[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]",
    ],
    sources: [
      "[[Source - CIA PAS screening report]]",
      "[[Source - CIA PAS review report]]",
      "[[Source - Senate 1977 MKULTRA hearing]]",
    ],
    summary:
      "[[John W. Gittinger]] developed the [[Personality Assessment System]] used in CIA contexts and derived it from Wechsler subtest patterns. That makes him a key note for tracing how psychometric tools overlap across intelligence screening and school gifted identification without assuming they were the same pipeline.",
  },
  {
    path: "01 Entities/People/E. Paul Torrance.md",
    title: "E. Paul Torrance",
    type: "person",
    status: "seed",
    tags: ["entity/person", "education/testing", "defense/air-force"],
    themes: ["[[Psychometrics and Testing]]", "[[Gifted Education]]"],
    related: [
      "[[Torrance Tests]]",
      "[[Gifted Identification Methods]]",
      "[[Psychometrics and Testing]]",
      "[[California GATE]]",
    ],
    claims: [],
    sources: ["[[Source - NAGC on E. Paul Torrance]]"],
    summary:
      "[[E. Paul Torrance]] created creativity tests widely used in gifted education after earlier work as an Air Force psychologist. His biography gives the vault a documented bridge between gifted assessment and military ideas about creativity, performance, and selection.",
  },
  {
    path: "01 Entities/Programs/Duke TIP.md",
    title: "Duke TIP",
    aliases: ["Talent Identification Program"],
    type: "program",
    status: "seed",
    tags: ["entity/program", "education/talent-search"],
    themes: ["[[Gifted Education]]"],
    related: [
      "[[Duke University]]",
      "[[Gifted Education]]",
      "[[GATE Program]]",
      "[[Duke Parapsychology Laboratory]]",
    ],
    claims: [
      "[[Claim - Duke housed both gifted pipeline and ESP research]]",
    ],
    sources: [
      "[[Source - Duke Today on Duke TIP]]",
      "[[Source - Scholars@Duke on Duke TIP]]",
    ],
    summary:
      "[[Duke TIP]] is included as a later gifted-pipeline institution that shares a university home with earlier parapsychology research. The factual bridge is institutional coexistence at Duke, not proof that one program flowed into the other.",
  },
  {
    path: "01 Entities/Organizations/Duke University.md",
    title: "Duke University",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "education/university"],
    themes: ["[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    related: [
      "[[Duke TIP]]",
      "[[Duke Parapsychology Laboratory]]",
      "[[J. B. Rhine]]",
      "[[Zener Cards]]",
    ],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    sources: [
      "[[Source - Duke Today on Duke TIP]]",
      "[[Source - Duke exhibit on parapsychology]]",
    ],
    summary:
      "[[Duke University]] is the institutional meeting point between later gifted-talent programming and earlier ESP research associated with [[J. B. Rhine]] and [[Zener Cards]]. The note is intentionally scoped to shared institutional context rather than direct continuity.",
  },
  {
    path: "01 Entities/Programs/Duke Parapsychology Laboratory.md",
    title: "Duke Parapsychology Laboratory",
    type: "program",
    status: "seed",
    tags: ["entity/program", "consciousness/parapsychology"],
    themes: ["[[Parapsychology and ESP]]"],
    related: [
      "[[Duke University]]",
      "[[J. B. Rhine]]",
      "[[Karl Zener]]",
      "[[Zener Cards]]",
      "[[Duke TIP]]",
    ],
    claims: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "The [[Duke Parapsychology Laboratory]] is the historical home of the Zener-card research that shows up repeatedly in later comparisons to GATE recollections. It gives the graph a concrete institutional home for the Rhine/Zener branch of the story.",
  },
  {
    path: "01 Entities/People/J. B. Rhine.md",
    title: "J. B. Rhine",
    type: "person",
    status: "seed",
    tags: ["entity/person", "consciousness/parapsychology"],
    themes: ["[[Parapsychology and ESP]]"],
    related: [
      "[[Duke Parapsychology Laboratory]]",
      "[[Karl Zener]]",
      "[[Zener Cards]]",
      "[[Duke University]]",
    ],
    claims: [],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "[[J. B. Rhine]] ran the Duke parapsychology work that popularized [[Zener Cards]] as a tool for ESP experiments. His note grounds the symbol-card branch of the vault in a specific person and laboratory rather than in internet lore.",
  },
  {
    path: "01 Entities/People/Karl Zener.md",
    title: "Karl Zener",
    type: "person",
    status: "seed",
    tags: ["entity/person", "consciousness/parapsychology"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Zener Cards]]", "[[J. B. Rhine]]", "[[Duke Parapsychology Laboratory]]"],
    claims: [],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "[[Karl Zener]] designed the symbol cards that later became a shorthand reference point in classroom recollection threads. In the vault he mainly exists to connect the artifact [[Zener Cards]] to the Duke laboratory that produced them.",
  },
  {
    path: "01 Entities/People/Robert Monroe.md",
    title: "Robert Monroe",
    aliases: ["Bob Monroe"],
    type: "person",
    status: "seed",
    tags: ["entity/person", "consciousness/gateway"],
    themes: ["[[Remote Viewing]]", "[[Human Potential Movement]]"],
    related: ["[[Gateway Process]]", "[[Monroe Institute]]", "[[Remote Viewing]]", "[[Skip Atwater]]"],
    claims: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
    ],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "[[Robert Monroe]] is the Monroe/Gateway anchor for the dark-room, headphones, and altered-state side of the vault. His significance here comes from declassified attention to Gateway methods rather than from any direct school-program document.",
  },
  {
    path: "01 Entities/Organizations/Monroe Institute.md",
    title: "Monroe Institute",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "consciousness/gateway"],
    themes: ["[[Remote Viewing]]", "[[Human Potential Movement]]"],
    related: ["[[Robert Monroe]]", "[[Gateway Process]]", "[[Skip Atwater]]", "[[Remote Viewing]]"],
    claims: [],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "The [[Monroe Institute]] is the institutional home of the [[Gateway Process]] and a later destination for [[Skip Atwater]] after his STAR GATE work. It clusters the Monroe, Gateway, and remote-viewing notes into one visible branch.",
  },
  {
    path: "01 Entities/Organizations/Esalen Institute.md",
    title: "Esalen Institute",
    type: "organization",
    status: "seed",
    tags: ["entity/organization", "consciousness/human-potential"],
    themes: ["[[Human Potential Movement]]", "[[Defense and Intelligence]]"],
    related: [
      "[[Michael Murphy]]",
      "[[George Leonard]]",
      "[[Harold C. Lyon Jr.]]",
      "[[Defense and Intelligence]]",
    ],
    claims: [
      "[[Claim - Esalen attracted intelligence attention]]",
      "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]",
    ],
    sources: [
      "[[Source - Esalen memorial for George Leonard]]",
      "[[Source - CIA Esalen hot-tub diplomacy document]]",
    ],
    summary:
      "[[Esalen Institute]] is the human-potential node that links gifted-policy biographies to consciousness-research and CIA-interest documents. It is a strong cluster visually, but the claim layer keeps the distinction between documented friendship networks and larger inferences clear.",
  },
  {
    path: "01 Entities/People/George Leonard.md",
    title: "George Leonard",
    type: "person",
    status: "seed",
    tags: ["entity/person", "consciousness/human-potential"],
    themes: ["[[Human Potential Movement]]", "[[Defense and Intelligence]]"],
    related: ["[[Esalen Institute]]", "[[Harold C. Lyon Jr.]]", "[[Michael Murphy]]"],
    claims: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    sources: ["[[Source - Esalen memorial for George Leonard]]"],
    summary:
      "[[George Leonard]] is useful in the graph because he concretely ties [[Esalen Institute]] to an intelligence-officer biography and to [[Harold C. Lyon Jr.]]'s Washington seminars. That makes him one of the shortest visible paths between gifted-policy notes and the human-potential cluster.",
  },
  {
    path: "01 Entities/People/Michael Murphy.md",
    title: "Michael Murphy",
    type: "person",
    status: "seed",
    tags: ["entity/person", "consciousness/human-potential"],
    themes: ["[[Human Potential Movement]]"],
    related: ["[[Esalen Institute]]", "[[George Leonard]]", "[[Harold C. Lyon Jr.]]"],
    claims: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    sources: ["[[Source - Harold C. Lyon obituary]]"],
    summary:
      "[[Michael Murphy]] co-founded [[Esalen Institute]] and appears in the vault because of documented friendship ties to [[Harold C. Lyon Jr.]]. His note mainly exists to make the Esalen branch graphable from the education-policy side.",
  },
  {
    path: "01 Entities/Programs/Stargate Project.md",
    title: "Stargate Project",
    aliases: ["STAR GATE"],
    type: "program",
    status: "seed",
    tags: ["entity/program", "defense/intelligence", "consciousness/remote-viewing"],
    themes: ["[[Remote Viewing]]", "[[Defense and Intelligence]]"],
    related: [
      "[[Remote Viewing]]",
      "[[Central Intelligence Agency]]",
      "[[Skip Atwater]]",
      "[[Dale Graff]]",
      "[[Maimonides Dream Laboratory]]",
    ],
    claims: [
      "[[Claim - Remote viewing programs used language of gifted individuals]]",
    ],
    sources: [
      "[[Source - CIA Maimonides precedent report]]",
      "[[Source - CIA AIR evaluation of Remote Viewing]]",
      "[[Source - CIA gifted individuals proposal]]",
    ],
    summary:
      "The [[Stargate Project]] is the later intelligence-program node where many of the vault's consciousness-research documents converge. It is especially useful for linking [[Remote Viewing]], psychometric screening, and the Krippner/Maimonides precedent documents into one cluster.",
  },
  {
    path: "01 Entities/People/Skip Atwater.md",
    title: "Skip Atwater",
    type: "person",
    status: "seed",
    tags: ["entity/person", "defense/intelligence", "consciousness/remote-viewing"],
    themes: ["[[Remote Viewing]]"],
    related: ["[[Stargate Project]]", "[[Monroe Institute]]", "[[Gateway Process]]"],
    claims: [],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "[[Skip Atwater]] makes the STAR GATE-to-Monroe lineage easy to see in the graph. His biography is a clean person-level bridge from intelligence remote-viewing work to the Monroe/Gateway cluster.",
  },
  {
    path: "01 Entities/People/Dale Graff.md",
    title: "Dale Graff",
    type: "person",
    status: "seed",
    tags: ["entity/person", "defense/intelligence", "consciousness/remote-viewing"],
    themes: ["[[Remote Viewing]]"],
    related: ["[[Stargate Project]]", "[[Remote Viewing]]", "[[Human Potential Movement]]"],
    claims: ["[[Claim - Remote viewing programs used language of gifted individuals]]"],
    sources: ["[[Source - CIA AIR evaluation of Remote Viewing]]"],
    summary:
      "[[Dale Graff]] belongs in the vault as a naming and program-history node for STAR GATE. He helps tie the language of human potential and remote-viewing recruitment back to a specific intelligence-program lineage.",
  },
  {
    path: "01 Entities/Programs/MKULTRA.md",
    title: "MKULTRA",
    type: "program",
    status: "seed",
    tags: ["entity/program", "defense/intelligence"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[Central Intelligence Agency]]", "[[John W. Gittinger]]", "[[GATE Program]]"],
    claims: [
      "[[Claim - MKULTRA included child subjects and vocational steering research]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
    ],
    sources: [
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - Rockefeller Commission report]]",
      "[[Source - CIA document 00017445 - MKULTRA Subproject 47]]",
      "[[Source - CIA document 00017369 - MKULTRA Subproject 112]]",
    ],
    summary:
      "[[MKULTRA]] is the vault's main behavior-control node and the strongest documentary cluster for child-subject and career-steering research claims. It supports a set of serious historical connections, while also helping define the boundary of what the documents do not show about GATE itself.",
  },
  {
    path: "02 Themes/Gifted Identification Methods.md",
    title: "Gifted Identification Methods",
    type: "theme",
    status: "seed",
    tags: ["theme/testing", "education/gifted"],
    themes: ["[[Gifted Education]]"],
    related: [
      "[[Wechsler Scales]]",
      "[[Torrance Tests]]",
      "[[GATE Program]]",
      "[[California GATE]]",
      "[[Marland Report]]",
    ],
    claims: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - NAGC on E. Paul Torrance]]",
    ],
    summary:
      "[[Gifted Identification Methods]] collects the assessment tools, talent-search practices, and screening assumptions that recur across the vault. It is where [[Wechsler Scales]], [[Torrance Tests]], and talent-search pipelines like [[Duke TIP]] can be seen together.",
  },
  {
    path: "02 Themes/Torrance Tests.md",
    title: "Torrance Tests",
    aliases: ["Torrance Tests of Creative Thinking"],
    type: "theme",
    status: "seed",
    tags: ["theme/testing", "education/creativity"],
    themes: ["[[Psychometrics and Testing]]"],
    related: ["[[E. Paul Torrance]]", "[[Gifted Identification Methods]]", "[[California GATE]]"],
    claims: [],
    sources: ["[[Source - NAGC on E. Paul Torrance]]"],
    summary:
      "[[Torrance Tests]] are the creativity-assessment branch of the vault's testing web. They matter because they tie gifted-program screening and enrichment to a designer with clear military-psychology experience.",
  },
  {
    path: "02 Themes/Wechsler Scales.md",
    title: "Wechsler Scales",
    type: "theme",
    status: "seed",
    tags: ["theme/testing", "testing/iq"],
    themes: ["[[Psychometrics and Testing]]"],
    related: ["[[Gifted Identification Methods]]", "[[John W. Gittinger]]", "[[Personality Assessment System]]", "[[GATE Program]]"],
    claims: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    sources: ["[[Source - CIA PAS screening report]]"],
    summary:
      "[[Wechsler Scales]] appear in the vault because they are standard in gifted identification and also feed the subtest logic behind [[Personality Assessment System]]. That overlap is one of the cleaner psychometric bridges in the graph.",
  },
  {
    path: "02 Themes/Personality Assessment System.md",
    title: "Personality Assessment System",
    aliases: ["PAS"],
    type: "theme",
    status: "seed",
    tags: ["theme/psychometrics", "defense/intelligence"],
    themes: ["[[Psychometrics and Testing]]", "[[Remote Viewing]]"],
    related: ["[[John W. Gittinger]]", "[[Wechsler Scales]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    sources: ["[[Source - CIA PAS screening report]]", "[[Source - CIA PAS review report]]"],
    summary:
      "The [[Personality Assessment System]] is the intelligence-side assessment method most relevant to this vault's testing cluster. It lets the graph show a specific psychometric link between CIA screening documents and school gifted testing tools.",
  },
  {
    path: "02 Themes/Zener Cards.md",
    title: "Zener Cards",
    type: "theme",
    status: "seed",
    tags: ["theme/parapsychology", "consciousness/esp"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[J. B. Rhine]]", "[[Karl Zener]]", "[[Duke Parapsychology Laboratory]]", "[[GATE Program]]"],
    claims: ["[[Claim - GATE classroom recollections resemble consciousness-research protocols]]"],
    sources: ["[[Source - Duke exhibit on parapsychology]]"],
    summary:
      "[[Zener Cards]] are the symbol-card artifact that makes one of the most memorable GATE recollection details legible against a documented research history. They are useful precisely because the artifact is so specific and recognizable.",
  },
  {
    path: "02 Themes/Gateway Process.md",
    title: "Gateway Process",
    aliases: ["Gateway Experience"],
    type: "theme",
    status: "seed",
    tags: ["theme/gateway", "consciousness/remote-viewing"],
    themes: ["[[Remote Viewing]]", "[[Human Potential Movement]]"],
    related: ["[[Robert Monroe]]", "[[Monroe Institute]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - GATE classroom recollections resemble consciousness-research protocols]]"],
    sources: ["[[Source - CIA Gateway assessment]]"],
    summary:
      "The [[Gateway Process]] is the headphones-and-altered-state method cluster referenced by many comparison claims. It gives the graph a concrete method note for dark-room audio sessions without requiring any claim of direct classroom adoption.",
  },
  {
    path: "02 Themes/Dream Telepathy.md",
    title: "Dream Telepathy",
    type: "theme",
    status: "seed",
    tags: ["theme/parapsychology", "consciousness/dreams"],
    themes: ["[[Parapsychology and ESP]]"],
    related: ["[[Stanley Krippner]]", "[[Maimonides Dream Laboratory]]", "[[Remote Viewing]]"],
    claims: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    sources: ["[[Source - CIA Dream Laboratory bulletin 1969]]", "[[Source - CIA Maimonides precedent report]]"],
    summary:
      "[[Dream Telepathy]] is the experimental-method note that pulls together Krippner, Maimonides, and later anomalous-cognition references. It exists to keep method, institution, and person links separable in the graph.",
  },
  {
    path: "02 Themes/Human Potential Movement.md",
    title: "Human Potential Movement",
    type: "theme",
    status: "seed",
    tags: ["theme/human-potential", "consciousness/esalen"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[Esalen Institute]]", "[[George Leonard]]", "[[Michael Murphy]]", "[[Gateway Process]]", "[[Stargate Project]]"],
    claims: ["[[Claim - Esalen attracted intelligence attention]]", "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    sources: ["[[Source - CIA Esalen hot-tub diplomacy document]]", "[[Source - Esalen memorial for George Leonard]]"],
    summary:
      "[[Human Potential Movement]] is the broadest consciousness-network note in the vault. It lets Esalen, Gateway, and some STAR GATE language cluster without pretending they were all one program.",
  },
  {
    path: "03 Claims/Claim - GATE classroom recollections resemble consciousness-research protocols.md",
    title: "Claim - GATE classroom recollections resemble consciousness-research protocols",
    type: "claim",
    status: "mixed",
    tags: ["claim/anecdotal", "claim/method-overlap"],
    themes: ["[[GATE Program]]", "[[Remote Viewing]]", "[[Parapsychology and ESP]]"],
    related: ["[[GATE Program]]", "[[Remote Viewing]]", "[[Gateway Process]]", "[[Zener Cards]]"],
    sources: [
      "[[Source - CIA Remote Viewing Training Protocol]]",
      "[[Source - CIA Gateway assessment]]",
      "[[Source - Duke exhibit on parapsychology]]",
      "[[Source - Yahoo News Jan 2025 on GATE recollections]]",
    ],
    extraFrontmatter: {
      claim_kind: "method-overlap",
      subjects: ["[[GATE Program]]", "[[Remote Viewing]]", "[[Gateway Process]]", "[[Zener Cards]]"],
    },
    summary:
      "Adults describing GATE in the 1980s and 1990s often mention dark rooms, headphones, symbol cards, sealed-envelope targets, and viewer-monitor-target style setups. The sources strongly support similarity to documented consciousness-research methods, but they do not prove those methods were formally imported into GATE classrooms.",
  },
  {
    path: "03 Claims/Claim - Krippner bridged gifted education and parapsychology networks.md",
    title: "Claim - Krippner bridged gifted education and parapsychology networks",
    type: "claim",
    status: "supported",
    tags: ["claim/network-link"],
    themes: ["[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    related: ["[[Stanley Krippner]]", "[[Maimonides Dream Laboratory]]", "[[California GATE]]"],
    sources: [
      "[[Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth]]",
      "[[Source - Stanley Krippner bibliography 1960-1965]]",
      "[[Source - CIA Maimonides precedent report]]",
    ],
    extraFrontmatter: {
      claim_kind: "career-overlap",
      subjects: ["[[Stanley Krippner]]", "[[Gifted Education]]", "[[Maimonides Dream Laboratory]]"],
    },
    summary:
      "This is one of the strongest claims in the vault because the overlap is on the record: [[Stanley Krippner]] published in gifted-education contexts while directing dream-telepathy research later cited in CIA anomalous-cognition documents. What remains unproven is the downstream effect of that overlap on any particular school program.",
  },
  {
    path: "03 Claims/Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks.md",
    title: "Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks",
    type: "claim",
    status: "mixed",
    tags: ["claim/network-link", "claim/biographical"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]", "[[Human Potential Movement]]"],
    related: ["[[Harold C. Lyon Jr.]]", "[[Office of Gifted and Talented]]", "[[Esalen Institute]]", "[[George Leonard]]", "[[Michael Murphy]]"],
    sources: [
      "[[Source - Harold C. Lyon obituary]]",
      "[[Source - Congressional Record 1975 Office of the Gifted and Talented]]",
      "[[Source - Esalen memorial for George Leonard]]",
    ],
    extraFrontmatter: {
      claim_kind: "network-link",
      subjects: ["[[Harold C. Lyon Jr.]]", "[[Office of Gifted and Talented]]", "[[Esalen Institute]]"],
    },
    summary:
      "The documented pieces are straightforward: [[Harold C. Lyon Jr.]] had a defense background, ran the federal gifted office, and was personally connected to [[George Leonard]] and [[Michael Murphy]]. The broader claim that those links materially shaped gifted-program design is plausible but not directly documented.",
  },
  {
    path: "03 Claims/Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control.md",
    title: "Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control",
    type: "claim",
    status: "mixed",
    tags: ["claim/biographical", "claim/boundary"],
    themes: ["[[Federal Gifted Policy]]", "[[Defense and Intelligence]]"],
    related: ["[[Sidney P. Marland Jr.]]", "[[Marland Report]]"],
    sources: [
      "[[Source - ERIC ED056243 - Marland Report]]",
      "[[Source - DVIDS PACMIRS history]]",
    ],
    extraFrontmatter: {
      claim_kind: "boundary",
      subjects: ["[[Sidney P. Marland Jr.]]", "[[Marland Report]]"],
    },
    summary:
      "The strongest version of this claim is modest: [[Sidney P. Marland Jr.]] had wartime duties that sit near intelligence work, and later became the key federal gifted-policy author. The available record does not support stronger online claims that the Marland Report itself was an intelligence program in disguise.",
  },
  {
    path: "03 Claims/Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification.md",
    title: "Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification",
    type: "claim",
    status: "mixed",
    tags: ["claim/psychometrics"],
    themes: ["[[Psychometrics and Testing]]"],
    related: ["[[John W. Gittinger]]", "[[Personality Assessment System]]", "[[Wechsler Scales]]", "[[Gifted Identification Methods]]"],
    sources: [
      "[[Source - CIA PAS screening report]]",
      "[[Source - CIA PAS review report]]",
      "[[Source - ERIC ED056243 - Marland Report]]",
    ],
    extraFrontmatter: {
      claim_kind: "method-overlap",
      subjects: ["[[John W. Gittinger]]", "[[Wechsler Scales]]", "[[Gifted Identification Methods]]"],
    },
    summary:
      "This claim rests on a genuine testing overlap: gifted identification often used Wechsler measures, and [[John W. Gittinger]]'s CIA-linked [[Personality Assessment System]] was built from Wechsler subtest patterns. What it does not prove is that gifted testing functioned as a CIA screening pipeline.",
  },
  {
    path: "03 Claims/Claim - Duke housed both gifted pipeline and ESP research.md",
    title: "Claim - Duke housed both gifted pipeline and ESP research",
    type: "claim",
    status: "supported",
    tags: ["claim/institutional-overlap"],
    themes: ["[[Gifted Education]]", "[[Parapsychology and ESP]]"],
    related: ["[[Duke University]]", "[[Duke TIP]]", "[[Duke Parapsychology Laboratory]]", "[[J. B. Rhine]]"],
    sources: [
      "[[Source - Duke Today on Duke TIP]]",
      "[[Source - Duke exhibit on parapsychology]]",
    ],
    extraFrontmatter: {
      claim_kind: "institutional-overlap",
      subjects: ["[[Duke University]]", "[[Duke TIP]]", "[[Duke Parapsychology Laboratory]]"],
    },
    summary:
      "This claim is factual at the institutional level: Duke hosted both a major gifted-talent pipeline and the earlier parapsychology laboratory associated with [[J. B. Rhine]]. The vault treats any stronger influence claim as a separate leap rather than baking it into the entity notes.",
  },
  {
    path: "03 Claims/Claim - MKULTRA included child subjects and vocational steering research.md",
    title: "Claim - MKULTRA included child subjects and vocational steering research",
    type: "claim",
    status: "supported",
    tags: ["claim/program-history"],
    themes: ["[[Defense and Intelligence]]"],
    related: ["[[MKULTRA]]", "[[Central Intelligence Agency]]", "[[GATE Program]]"],
    sources: [
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - Rockefeller Commission report]]",
      "[[Source - CIA document 00017445 - MKULTRA Subproject 47]]",
      "[[Source - CIA document 00017369 - MKULTRA Subproject 112]]",
    ],
    extraFrontmatter: {
      claim_kind: "program-history",
      subjects: ["[[MKULTRA]]", "[[Central Intelligence Agency]]"],
    },
    summary:
      "MKULTRA records and later document releases support the claim that some subprojects involved children and some focused on vocational concepts related to technical and scientific careers. The leap from that record to GATE remains a separate question, which is why this note sits as a support cluster rather than a conclusion.",
  },
  {
    path: "03 Claims/Claim - Esalen attracted intelligence attention.md",
    title: "Claim - Esalen attracted intelligence attention",
    type: "claim",
    status: "supported",
    tags: ["claim/network-link"],
    themes: ["[[Defense and Intelligence]]", "[[Human Potential Movement]]"],
    related: ["[[Esalen Institute]]", "[[Central Intelligence Agency]]", "[[George Leonard]]"],
    sources: [
      "[[Source - CIA Esalen hot-tub diplomacy document]]",
      "[[Source - Esalen memorial for George Leonard]]",
    ],
    extraFrontmatter: {
      claim_kind: "documented-interest",
      subjects: ["[[Esalen Institute]]", "[[Central Intelligence Agency]]"],
    },
    summary:
      "The documents support a narrow claim: [[Central Intelligence Agency]] files tracked Esalen-related human-potential activity, and Esalen leadership included people with intelligence-adjacent biographies. That is evidence of attention and overlap, not proof of operational direction.",
  },
  {
    path: "03 Claims/Claim - Remote viewing programs used language of gifted individuals.md",
    title: "Claim - Remote viewing programs used language of gifted individuals",
    type: "claim",
    status: "supported",
    tags: ["claim/lexical-overlap"],
    themes: ["[[Remote Viewing]]"],
    related: ["[[Remote Viewing]]", "[[Stargate Project]]", "[[GATE Program]]"],
    sources: [
      "[[Source - CIA gifted individuals proposal]]",
      "[[Source - CIA AIR evaluation of Remote Viewing]]",
    ],
    extraFrontmatter: {
      claim_kind: "lexical-overlap",
      subjects: ["[[Remote Viewing]]", "[[Stargate Project]]", "[[GATE Program]]"],
    },
    summary:
      "Some CIA and SRI-era anomalous-cognition documents explicitly refer to recruiting or testing 'gifted individuals.' The vault treats this as a meaningful lexical overlap with gifted-education language, but not as evidence that the same institutions were selecting the same people.",
  },
  {
    path: "03 Claims/Claim - No declassified document shows CIA operatives ran GATE classrooms.md",
    title: "Claim - No declassified document shows CIA operatives ran GATE classrooms",
    type: "claim",
    status: "supported",
    tags: ["claim/boundary"],
    themes: ["[[GATE Program]]", "[[Defense and Intelligence]]"],
    related: ["[[GATE Program]]", "[[Central Intelligence Agency]]", "[[MKULTRA]]", "[[Stargate Project]]"],
    sources: [
      "[[Source - CIA AIR evaluation of Remote Viewing]]",
      "[[Source - Senate 1977 MKULTRA hearing]]",
      "[[Source - LAO 1988 GATE sunset review]]",
    ],
    extraFrontmatter: {
      claim_kind: "boundary",
      subjects: ["[[GATE Program]]", "[[Central Intelligence Agency]]"],
    },
    summary:
      "This boundary note exists to keep the graph honest. The vault contains many real overlaps in people, methods, and institutions, but none of the declassified records collected here directly place CIA operatives inside GATE classrooms or prove a covert K-12 screening program.",
  },
];

const sourceCatalog = [
  {
    title: "Source - ERIC ED056243 - Marland Report",
    path: "04 Sources/Primary/Source - ERIC ED056243 - Marland Report.md",
    sourceKind: "primary",
    author: "U.S. Office of Education",
    year: "1971",
    url: "https://eric.ed.gov/?id=ED056243",
    archiveUrl: "https://files.eric.ed.gov/fulltext/ED056243.pdf",
    downloadUrl: "https://files.eric.ed.gov/fulltext/ED056243.pdf",
    localFile: "04 Sources/Primary/files/eric-ed056243-marland-report.pdf",
    reliability: "high",
    mentions: ["[[Sidney P. Marland Jr.]]", "[[Marland Report]]", "[[Gifted Education]]"],
    supports: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    summary:
      "ERIC record and full text for the federal report that defined giftedness for Congress and helped normalize systematic identification of gifted students.",
  },
  {
    title: "Source - California Mentally Gifted Minor Program brief history",
    path: "04 Sources/Primary/Source - California Mentally Gifted Minor Program brief history.md",
    sourceKind: "primary",
    author: "California State Department of Education",
    year: "1971",
    url: "https://archive.org/stream/ERIC_ED060585/ERIC_ED060585_djvu.txt",
    archiveUrl: "https://archive.org/stream/ERIC_ED060585/ERIC_ED060585_djvu.txt",
    downloadUrl: "https://archive.org/stream/ERIC_ED060585/ERIC_ED060585_djvu.txt",
    localFile: "04 Sources/Primary/files/california-mgm-brief-history-1971.txt",
    reliability: "high",
    mentions: ["[[California Mentally Gifted Minor Program]]", "[[California GATE]]"],
    supports: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    summary:
      "Archived text of a contemporary history of California's Mentally Gifted Minor program, useful for anchoring the pre-GATE state-program lineage.",
  },
  {
    title: "Source - LAO 1988 GATE sunset review",
    path: "04 Sources/Primary/Source - LAO 1988 GATE sunset review.md",
    sourceKind: "primary",
    author: "Legislative Analyst's Office",
    year: "1988",
    url: "https://lao.ca.gov/reports/1988/428_0488_the_gifted_and_talented_education_program_a_sunset_review.pdf",
    archiveUrl: "https://lao.ca.gov/reports/1988/428_0488_the_gifted_and_talented_education_program_a_sunset_review.pdf",
    downloadUrl: "https://lao.ca.gov/reports/1988/428_0488_the_gifted_and_talented_education_program_a_sunset_review.pdf",
    localFile: "04 Sources/Primary/files/lao-1988-gate-sunset-review.pdf",
    reliability: "high",
    mentions: ["[[California GATE]]", "[[California Mentally Gifted Minor Program]]", "[[GATE Program]]"],
    supports: ["[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]"],
    summary:
      "California's own program review stating that GATE succeeded the Mentally Gifted Minor program and describing the state-program structure.",
  },
  {
    title: "Source - Congressional Record 1975 Office of the Gifted and Talented",
    path: "04 Sources/Primary/Source - Congressional Record 1975 Office of the Gifted and Talented.md",
    sourceKind: "primary",
    author: "U.S. Congress",
    year: "1975",
    url: "https://www.govinfo.gov/content/pkg/GPO-CRECB-1975-pt28/pdf/GPO-CRECB-1975-pt28-2-1.pdf",
    archiveUrl: "https://www.govinfo.gov/content/pkg/GPO-CRECB-1975-pt28/pdf/GPO-CRECB-1975-pt28-2-1.pdf",
    downloadUrl: "https://www.govinfo.gov/content/pkg/GPO-CRECB-1975-pt28/pdf/GPO-CRECB-1975-pt28-2-1.pdf",
    localFile: "04 Sources/Primary/files/congressional-record-1975-gifted-office.pdf",
    reliability: "high",
    mentions: ["[[Office of Gifted and Talented]]", "[[Harold C. Lyon Jr.]]"],
    supports: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    summary:
      "Congressional Record material confirming the federal office's existence and Harold Lyon's leadership role in the mid-1970s.",
  },
  {
    title: "Source - Federal Register 1979 Office for the Gifted and Talented notice",
    path: "04 Sources/Primary/Source - Federal Register 1979 Office for the Gifted and Talented notice.md",
    sourceKind: "primary",
    author: "U.S. Department of Education",
    year: "1979",
    url: "https://www.govinfo.gov/content/pkg/FR-1979-08-23/pdf/FR-1979-08-23.pdf",
    archiveUrl: "https://www.govinfo.gov/content/pkg/FR-1979-08-23/pdf/FR-1979-08-23.pdf",
    downloadUrl: "https://www.govinfo.gov/content/pkg/FR-1979-08-23/pdf/FR-1979-08-23.pdf",
    localFile: "04 Sources/Primary/files/federal-register-1979-gifted-office.pdf",
    reliability: "high",
    mentions: ["[[Office of Gifted and Talented]]", "[[Harold C. Lyon Jr.]]"],
    supports: [],
    summary:
      "Federal Register notice documenting Harold Lyon as director of the gifted office in a formal agency context.",
  },
  {
    title: "Source - Congress.gov Javits gifted legislation history",
    path: "04 Sources/Primary/Source - Congress.gov Javits gifted legislation history.md",
    sourceKind: "primary",
    author: "Congress.gov",
    year: "1973-1987",
    url: "https://www.congress.gov/bill/100th-congress/senate-bill/303",
    archiveUrl: "",
    downloadUrl: "",
    localFile: "",
    reliability: "high",
    mentions: ["[[Jacob K. Javits Gifted and Talented Students Education Act]]", "[[Federal Gifted Policy]]"],
    supports: [],
    summary:
      "Legislative history anchor for the Javits line of gifted-and-talented legislation; used as the official continuity reference for the policy branch.",
  },
  {
    title: "Source - Harold C. Lyon obituary",
    path: "04 Sources/Secondary/Source - Harold C. Lyon obituary.md",
    sourceKind: "secondary",
    author: "Laconia Daily Sun",
    year: "2019",
    url: "https://www.laconiadailysun.com/community/obituaries/dr-harold-clifford-hal-lyon-jr-84/article_aadc8968-0b08-11ea-88be-4b036b54ef39.html",
    archiveUrl: "https://www.laconiadailysun.com/community/obituaries/dr-harold-clifford-hal-lyon-jr-84/article_aadc8968-0b08-11ea-88be-4b036b54ef39.html",
    downloadUrl: "https://www.laconiadailysun.com/community/obituaries/dr-harold-clifford-hal-lyon-jr-84/article_aadc8968-0b08-11ea-88be-4b036b54ef39.html",
    localFile: "04 Sources/Secondary/files/harold-c-lyon-obituary.html",
    reliability: "medium",
    mentions: ["[[Harold C. Lyon Jr.]]", "[[Esalen Institute]]", "[[Office of Gifted and Talented]]"],
    supports: ["[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    summary:
      "Useful biographical summary for Lyon's military background, education-policy work, and later personal network ties.",
  },
  {
    title: "Source - West Point record for Harold C. Lyon Jr.",
    path: "04 Sources/Secondary/Source - West Point record for Harold C. Lyon Jr..md",
    sourceKind: "secondary",
    author: "West Point Association of Graduates",
    year: "n.d.",
    url: "http://www.west-point.org/users/usma1958/21905/",
    archiveUrl: "http://www.west-point.org/users/usma1958/21905/",
    downloadUrl: "http://www.west-point.org/users/usma1958/21905/",
    localFile: "04 Sources/Secondary/files/west-point-lyon-record.html",
    reliability: "medium",
    mentions: ["[[Harold C. Lyon Jr.]]"],
    supports: [],
    summary:
      "Class and service record used to confirm Lyon's West Point and Army background.",
  },
  {
    title: "Source - Duke Today on Duke TIP",
    path: "04 Sources/Secondary/Source - Duke Today on Duke TIP.md",
    sourceKind: "secondary",
    author: "Duke Today",
    year: "2016",
    url: "https://today.duke.edu/2016/04/duketip",
    archiveUrl: "https://today.duke.edu/2016/04/duketip",
    downloadUrl: "https://today.duke.edu/2016/04/duketip",
    localFile: "04 Sources/Secondary/files/duke-today-duketip.html",
    reliability: "medium",
    mentions: ["[[Duke TIP]]", "[[Duke University]]"],
    supports: ["[[Claim - Duke housed both gifted pipeline and ESP research]]"],
    summary:
      "Institutional-history piece confirming Duke TIP's start and role inside Duke's gifted-talent infrastructure.",
  },
  {
    title: "Source - Scholars@Duke on Duke TIP",
    path: "04 Sources/Secondary/Source - Scholars@Duke on Duke TIP.md",
    sourceKind: "secondary",
    author: "Scholars@Duke",
    year: "2004",
    url: "https://scholars.duke.edu/publication/657832",
    archiveUrl: "https://scholars.duke.edu/publication/657832",
    downloadUrl: "https://scholars.duke.edu/publication/657832",
    localFile: "04 Sources/Secondary/files/scholars-duke-duketip.html",
    reliability: "medium",
    mentions: ["[[Duke TIP]]"],
    supports: [],
    summary:
      "University publication metadata used to corroborate the Duke TIP institutional timeline.",
  },
  {
    title: "Source - Duke exhibit on parapsychology",
    path: "04 Sources/Secondary/Source - Duke exhibit on parapsychology.md",
    sourceKind: "secondary",
    author: "Duke University Libraries",
    year: "n.d.",
    url: "https://exhibits.library.duke.edu/exhibits/show/parapsychology/about-the-exhibit",
    archiveUrl: "https://exhibits.library.duke.edu/exhibits/show/parapsychology/about-the-exhibit",
    downloadUrl: "https://exhibits.library.duke.edu/exhibits/show/parapsychology/about-the-exhibit",
    localFile: "04 Sources/Secondary/files/duke-parapsychology-exhibit.html",
    reliability: "medium",
    mentions: ["[[Duke Parapsychology Laboratory]]", "[[J. B. Rhine]]", "[[Karl Zener]]", "[[Duke University]]"],
    supports: ["[[Claim - Duke housed both gifted pipeline and ESP research]]", "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]"],
    summary:
      "Institutional exhibit describing Duke's parapsychology collections and the Rhine/Zener research lineage.",
  },
  {
    title: "Source - NAGC on E. Paul Torrance",
    path: "04 Sources/Secondary/Source - NAGC on E. Paul Torrance.md",
    sourceKind: "secondary",
    author: "National Association for Gifted Children",
    year: "2003",
    url: "https://www.nagc.org/news/the-father-of-creativity-the-life-legacy-and-lessons-of-dr-e-paul-torrance-1915---2003",
    archiveUrl: "https://www.nagc.org/news/the-father-of-creativity-the-life-legacy-and-lessons-of-dr-e-paul-torrance-1915---2003",
    downloadUrl: "https://www.nagc.org/news/the-father-of-creativity-the-life-legacy-and-lessons-of-dr-e-paul-torrance-1915---2003",
    localFile: "04 Sources/Secondary/files/nagc-e-paul-torrance.html",
    reliability: "medium",
    mentions: ["[[E. Paul Torrance]]", "[[Torrance Tests]]"],
    supports: [],
    summary:
      "Gifted-education source summarizing Torrance's Air Force work and the later significance of his creativity tests.",
  },
  {
    title: "Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth",
    path: "04 Sources/Primary/Source - ERIC ED015503 - Characteristics of Gifted and Talented Youth.md",
    sourceKind: "primary",
    author: "Stanley Krippner",
    year: "1967",
    url: "https://eric.ed.gov/?id=ED015503",
    archiveUrl: "https://files.eric.ed.gov/fulltext/ED015503.pdf",
    downloadUrl: "https://files.eric.ed.gov/fulltext/ED015503.pdf",
    localFile: "04 Sources/Primary/files/eric-ed015503-krippner-gifted-youth.pdf",
    reliability: "high",
    mentions: ["[[Stanley Krippner]]", "[[Gifted Education]]"],
    supports: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    summary:
      "Primary gifted-education paper by Stanley Krippner, useful for anchoring his role in gifted-youth discourse with a stable ERIC record.",
  },
  {
    title: "Source - Stanley Krippner bibliography 1960-1965",
    path: "04 Sources/Secondary/Source - Stanley Krippner bibliography 1960-1965.md",
    sourceKind: "secondary",
    author: "Stanley Krippner archive site",
    year: "n.d.",
    url: "https://stanleykrippner.weebly.com/1960-1965.html",
    archiveUrl: "https://stanleykrippner.weebly.com/1960-1965.html",
    downloadUrl: "https://stanleykrippner.weebly.com/1960-1965.html",
    localFile: "04 Sources/Secondary/files/stanley-krippner-1960-1965.html",
    reliability: "medium",
    mentions: ["[[Stanley Krippner]]"],
    supports: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    summary:
      "Bibliographic page used to corroborate the run of Krippner's Gifted Child Quarterly publications in the 1960s.",
  },
  {
    title: "Source - DVIDS PACMIRS history",
    path: "04 Sources/Secondary/Source - DVIDS PACMIRS history.md",
    sourceKind: "secondary",
    author: "DVIDS",
    year: "2022",
    url: "https://www.dvidshub.net/news/428686/mid-establishes-pacmirs",
    archiveUrl: "https://www.dvidshub.net/news/428686/mid-establishes-pacmirs",
    downloadUrl: "https://www.dvidshub.net/news/428686/mid-establishes-pacmirs",
    localFile: "04 Sources/Secondary/files/dvids-pacmirs-history.html",
    reliability: "medium",
    mentions: ["[[Sidney P. Marland Jr.]]"],
    supports: ["[[Claim - Marland's wartime service was intelligence-adjacent but not proof of intelligence control]]"],
    summary:
      "Defense-history page noting Marland's later role in the Pacific Military Intelligence Research Section chronology.",
  },
  {
    title: "Source - Esalen memorial for George Leonard",
    path: "04 Sources/Secondary/Source - Esalen memorial for George Leonard.md",
    sourceKind: "secondary",
    author: "Esalen Institute",
    year: "2018",
    url: "https://www.esalen.org/memorial/george-leonard",
    archiveUrl: "https://www.esalen.org/memorial/george-leonard",
    downloadUrl: "https://www.esalen.org/memorial/george-leonard",
    localFile: "04 Sources/Secondary/files/esalen-george-leonard-memorial.html",
    reliability: "medium",
    mentions: ["[[George Leonard]]", "[[Esalen Institute]]"],
    supports: ["[[Claim - Esalen attracted intelligence attention]]", "[[Claim - Lyon's career connected gifted-ed policy to defense and Esalen networks]]"],
    summary:
      "Official Esalen memorial used to document George Leonard's Esalen role and his Korean War intelligence-officer background.",
  },
  {
    title: "Source - Senate 1977 MKULTRA hearing",
    path: "04 Sources/Primary/Source - Senate 1977 MKULTRA hearing.md",
    sourceKind: "primary",
    author: "U.S. Senate",
    year: "1977",
    url: "https://www.intelligence.senate.gov/wp-content/uploads/2024/08/sites-default-files-hearings-95mkultra.pdf",
    archiveUrl: "https://www.intelligence.senate.gov/wp-content/uploads/2024/08/sites-default-files-hearings-95mkultra.pdf",
    downloadUrl: "https://www.intelligence.senate.gov/wp-content/uploads/2024/08/sites-default-files-hearings-95mkultra.pdf",
    localFile: "04 Sources/Primary/files/senate-1977-mkultra-hearing.pdf",
    reliability: "high",
    mentions: ["[[MKULTRA]]", "[[John W. Gittinger]]", "[[Central Intelligence Agency]]"],
    supports: [
      "[[Claim - MKULTRA included child subjects and vocational steering research]]",
      "[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]",
    ],
    summary:
      "Senate hearing transcript on MKULTRA, used here as the main official oversight source for the program's scope and personnel.",
  },
  {
    title: "Source - Rockefeller Commission report",
    path: "04 Sources/Primary/Source - Rockefeller Commission report.md",
    sourceKind: "primary",
    author: "Rockefeller Commission",
    year: "1975",
    url: "https://www.fordlibrarymuseum.gov/library/document/0005/1561495.pdf",
    archiveUrl: "https://www.fordlibrarymuseum.gov/library/document/0005/1561495.pdf",
    downloadUrl: "https://www.fordlibrarymuseum.gov/library/document/0005/1561495.pdf",
    localFile: "04 Sources/Primary/files/rockefeller-commission-report.pdf",
    reliability: "high",
    mentions: ["[[MKULTRA]]", "[[Central Intelligence Agency]]"],
    supports: ["[[Claim - MKULTRA included child subjects and vocational steering research]]"],
    summary:
      "Primary oversight report on CIA abuses, used as a second anchor for MKULTRA-era claims in the vault.",
  },
  {
    title: "Source - CIA Remote Viewing Training Protocol",
    path: "04 Sources/Primary/Source - CIA Remote Viewing Training Protocol.md",
    sourceKind: "primary",
    author: "CIA / INSCOM",
    year: "1980s",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00789r002200070001-0",
    archiveUrl: "https://documents3.theblackvault.com/documents/stargate/pdfs/CIA-RDP96-00789R002200070001-0.pdf",
    downloadUrl: "https://documents3.theblackvault.com/documents/stargate/pdfs/CIA-RDP96-00789R002200070001-0.pdf",
    localFile: "04 Sources/Primary/files/cia-remote-viewing-training-protocol.pdf",
    reliability: "high",
    mentions: ["[[Remote Viewing]]", "[[Stargate Project]]"],
    supports: [
      "[[Claim - GATE classroom recollections resemble consciousness-research protocols]]",
      "[[Claim - Remote viewing programs used language of gifted individuals]]",
    ],
    summary:
      "Declassified training material containing the viewer-monitor-target formulation that features prominently in the remote-viewing branch of the vault.",
  },
  {
    title: "Source - CIA Gateway assessment",
    path: "04 Sources/Primary/Source - CIA Gateway assessment.md",
    sourceKind: "primary",
    author: "U.S. Army / INSCOM",
    year: "1983",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00788r001700210016-5",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00788R001700210016-5.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00788R001700210016-5.pdf",
    localFile: "04 Sources/Primary/files/cia-gateway-assessment.pdf",
    reliability: "high",
    mentions: ["[[Gateway Process]]", "[[Robert Monroe]]", "[[Monroe Institute]]"],
    supports: ["[[Claim - GATE classroom recollections resemble consciousness-research protocols]]"],
    summary:
      "The best single primary source for the Monroe/Gateway branch, documenting binaural-audio and altered-state methods later compared to GATE recollections.",
  },
  {
    title: "Source - CIA PAS screening report",
    path: "04 Sources/Primary/Source - CIA PAS screening report.md",
    sourceKind: "primary",
    author: "CIA",
    year: "1986",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00789r002200010001-6",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R002200010001-6.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R002200010001-6.pdf",
    localFile: "04 Sources/Primary/files/cia-pas-screening-report.pdf",
    reliability: "high",
    mentions: ["[[John W. Gittinger]]", "[[Personality Assessment System]]", "[[Wechsler Scales]]"],
    supports: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    summary:
      "Declassified screening report documenting CIA use of Gittinger's PAS in anomalous-cognition candidate selection.",
  },
  {
    title: "Source - CIA PAS review report",
    path: "04 Sources/Primary/Source - CIA PAS review report.md",
    sourceKind: "primary",
    author: "CIA",
    year: "1986",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00789r002200230001-2",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R002200230001-2.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R002200230001-2.pdf",
    localFile: "04 Sources/Primary/files/cia-pas-review-report.pdf",
    reliability: "high",
    mentions: ["[[Personality Assessment System]]", "[[John W. Gittinger]]"],
    supports: ["[[Claim - Gittinger and Wechsler testing create a psychometric overlap with gifted identification]]"],
    summary:
      "Companion CIA review of the PAS used to flesh out the psychometric side of the remote-viewing screening materials.",
  },
  {
    title: "Source - CIA Dream Laboratory bulletin 1969",
    path: "04 Sources/Primary/Source - CIA Dream Laboratory bulletin 1969.md",
    sourceKind: "primary",
    author: "Maimonides Dream Laboratory / CIA holding",
    year: "1969",
    url: "https://www.cia.gov/readingroom/document/00173512",
    archiveUrl: "",
    downloadUrl: "",
    localFile: "",
    reliability: "high",
    mentions: ["[[Maimonides Dream Laboratory]]", "[[Stanley Krippner]]"],
    supports: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    summary:
      "CIA-held bulletin from the Maimonides Dream Laboratory, included as the primary anchor for the dream-telepathy branch even though automated download was unavailable.",
  },
  {
    title: "Source - CIA Maimonides precedent report",
    path: "04 Sources/Primary/Source - CIA Maimonides precedent report.md",
    sourceKind: "primary",
    author: "SAIC / CIA collection",
    year: "1991",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00789r003100140001-2",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R003100140001-2.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00789R003100140001-2.pdf",
    localFile: "04 Sources/Primary/files/cia-maimonides-precedent-report.pdf",
    reliability: "high",
    mentions: ["[[Maimonides Dream Laboratory]]", "[[Stanley Krippner]]", "[[Stargate Project]]"],
    supports: ["[[Claim - Krippner bridged gifted education and parapsychology networks]]"],
    summary:
      "SAIC-era STAR GATE material explicitly citing Maimonides dream-telepathy work as precedent for later anomalous-cognition research.",
  },
  {
    title: "Source - CIA gifted individuals proposal",
    path: "04 Sources/Primary/Source - CIA gifted individuals proposal.md",
    sourceKind: "primary",
    author: "SRI / CIA collection",
    year: "1972",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00787r000200210003-6",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00787R000200210003-6.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00787R000200210003-6.pdf",
    localFile: "04 Sources/Primary/files/cia-gifted-individuals-proposal.pdf",
    reliability: "high",
    mentions: ["[[Remote Viewing]]", "[[Stargate Project]]"],
    supports: ["[[Claim - Remote viewing programs used language of gifted individuals]]"],
    summary:
      "Early anomalous-cognition proposal in the CIA collection using 'gifted individuals' language that now recurs in the lexicon-overlap claim note.",
  },
  {
    title: "Source - CIA AIR evaluation of Remote Viewing",
    path: "04 Sources/Primary/Source - CIA AIR evaluation of Remote Viewing.md",
    sourceKind: "primary",
    author: "American Institutes for Research / CIA collection",
    year: "1995",
    url: "https://www.cia.gov/readingroom/document/cia-rdp96-00791r000200180005-5",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00791R000200180005-5.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP96-00791R000200180005-5.pdf",
    localFile: "04 Sources/Primary/files/cia-air-evaluation-remote-viewing.pdf",
    reliability: "high",
    mentions: ["[[Remote Viewing]]", "[[Stargate Project]]"],
    supports: ["[[Claim - No declassified document shows CIA operatives ran GATE classrooms]]", "[[Claim - Remote viewing programs used language of gifted individuals]]"],
    summary:
      "The 1995 evaluation that closed out the remote-viewing program and provides an important boundary source for the vault's larger claims.",
  },
  {
    title: "Source - CIA Esalen hot-tub diplomacy document",
    path: "04 Sources/Primary/Source - CIA Esalen hot-tub diplomacy document.md",
    sourceKind: "primary",
    author: "CIA clipping file",
    year: "1983",
    url: "https://www.cia.gov/readingroom/document/cia-rdp90-00806r000100380026-1",
    archiveUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP90-00806R000100380026-1.pdf",
    downloadUrl: "https://web.archive.org/web/0/https://www.cia.gov/library/readingroom/docs/CIA-RDP90-00806R000100380026-1.pdf",
    localFile: "04 Sources/Primary/files/cia-esalen-hot-tub-diplomacy.pdf",
    reliability: "high",
    mentions: ["[[Esalen Institute]]", "[[Human Potential Movement]]", "[[Central Intelligence Agency]]"],
    supports: ["[[Claim - Esalen attracted intelligence attention]]"],
    summary:
      "CIA-held material showing documented agency attention to Esalen-linked human-potential activity.",
  },
  {
    title: "Source - CIA document 00017445 - MKULTRA Subproject 47",
    path: "04 Sources/Primary/Source - CIA document 00017445 - MKULTRA Subproject 47.md",
    sourceKind: "primary",
    author: "CIA",
    year: "1950s-1970s",
    url: "https://www.cia.gov/readingroom/document/00017445",
    archiveUrl: "",
    downloadUrl: "",
    localFile: "",
    reliability: "high",
    mentions: ["[[MKULTRA]]"],
    supports: ["[[Claim - MKULTRA included child subjects and vocational steering research]]"],
    summary:
      "CIA reading-room entry for MKULTRA Subproject 47, cited for juvenile testing and child-subject context.",
  },
  {
    title: "Source - CIA document 00017369 - MKULTRA Subproject 112",
    path: "04 Sources/Primary/Source - CIA document 00017369 - MKULTRA Subproject 112.md",
    sourceKind: "primary",
    author: "CIA",
    year: "1950s-1970s",
    url: "https://www.cia.gov/readingroom/document/00017369",
    archiveUrl: "",
    downloadUrl: "",
    localFile: "",
    reliability: "high",
    mentions: ["[[MKULTRA]]"],
    supports: ["[[Claim - MKULTRA included child subjects and vocational steering research]]"],
    summary:
      "CIA reading-room entry for MKULTRA Subproject 112, cited for children's occupational-role research and technical-career steering language.",
  },
  {
    title: "Source - Yahoo News Jan 2025 on GATE recollections",
    path: "04 Sources/Secondary/Source - Yahoo News Jan 2025 on GATE recollections.md",
    sourceKind: "secondary",
    author: "Yahoo News",
    year: "2025",
    url: "https://news.yahoo.com/enrolled-gifted-classes-child-now-230027333.html",
    archiveUrl: "https://news.yahoo.com/enrolled-gifted-classes-child-now-230027333.html",
    downloadUrl: "https://news.yahoo.com/enrolled-gifted-classes-child-now-230027333.html",
    localFile: "04 Sources/Secondary/files/yahoo-2025-gate-recollections.html",
    reliability: "low",
    mentions: ["[[GATE Program]]"],
    supports: ["[[Claim - GATE classroom recollections resemble consciousness-research protocols]]"],
    summary:
      "Secondary news coverage documenting the contemporary spread of GATE recollection claims online. Used as an anecdotal lead, not a primary historical anchor.",
  },
];

const timeline = dedent(`
  ---
  type: "timeline"
  tags:
    - "timeline/gate"
  status: "seed"
  sources:
    - "[[Source - ERIC ED056243 - Marland Report]]"
    - "[[Source - California Mentally Gifted Minor Program brief history]]"
    - "[[Source - LAO 1988 GATE sunset review]]"
    - "[[Source - Senate 1977 MKULTRA hearing]]"
  ---

  # GATE Timeline

  ## Summary
  This note collects the main dates that link gifted-education policy, California program history, and the intelligence/consciousness documents used elsewhere in the vault.

  ## Timeline
  - 1930s: [[J. B. Rhine]] and [[Karl Zener]] establish the [[Zener Cards]] branch of the Duke ESP research tradition.
  - 1953: [[MKULTRA]] begins under the [[Central Intelligence Agency]].
  - 1961-1965: [[Stanley Krippner]] publishes a run of gifted-education articles, later documented in [[Source - Stanley Krippner bibliography 1960-1965]].
  - 1962: [[Esalen Institute]] is founded by [[Michael Murphy]] and others.
  - 1964-1973: [[Stanley Krippner]] directs work at [[Maimonides Dream Laboratory]].
  - 1971: California publishes a brief history of the [[California Mentally Gifted Minor Program]].
  - 1972: [[Sidney P. Marland Jr.]]'s [[Marland Report]] defines giftedness for Congress.
  - 1972: Early CIA/SRI anomalous-cognition materials use 'gifted individuals' language.
  - 1975: Congressional Record documents the [[Office of Gifted and Talented]] under [[Harold C. Lyon Jr.]].
  - 1977: Senate hearings expose [[MKULTRA]].
  - 1979: Federal Register notice confirms Lyon's ongoing leadership; California GATE replaces MGM as the state successor program.
  - 1980: [[Duke TIP]] launches at [[Duke University]].
  - 1983: The Army/CIA [[Gateway Process]] assessment is written.
  - 1986: CIA documents on the [[Personality Assessment System]] appear in the remote-viewing record.
  - 1988: California's LAO publishes its GATE sunset review.
  - 1991: SAIC STAR GATE material cites [[Maimonides Dream Laboratory]] as precedent.
  - 1995: AIR evaluates the remote-viewing program and finds no actionable intelligence output.
`);

const sourceIndexLinks = sourceCatalog.map((source) => `[[${source.title}]]`);
const claimLinks = entityNotes
  .filter((note) => note.type === "claim")
  .map((note) => `[[${note.title}]]`);

const extraIndexes = [
  {
    path: "00 Maps/Source Index.md",
    content: renderIndexNote(
      "Source Index",
      "Source notes are the backbone of the graph. They connect entity notes to claim notes and record whether each item was archived locally, mirrored, or left as an external-only link.",
      sourceIndexLinks,
    ),
  },
  {
    path: "00 Maps/Claims Index.md",
    content: renderIndexNote(
      "Claims Index",
      "This map gathers the interpretation layer so the graph can stay dense without pretending every link is equally certain.",
      claimLinks,
    ),
  },
];

const allStructuredNotes = [...mapNotes, ...entityNotes];

const graphConfig = {
  "collapse-filter": true,
  search: "",
  showTags: false,
  showAttachments: false,
  hideUnresolved: false,
  showOrphans: true,
  "collapse-color-groups": false,
  colorGroups: [
    { query: 'path:"00 Maps"', color: { a: 1, rgb: hex("D97706") } },
    { query: 'path:"01 Entities"', color: { a: 1, rgb: hex("2563EB") } },
    { query: 'path:"02 Themes"', color: { a: 1, rgb: hex("059669") } },
    { query: 'path:"03 Claims"', color: { a: 1, rgb: hex("DC2626") } },
    { query: 'path:"04 Sources"', color: { a: 1, rgb: hex("6B7280") } },
    { query: 'path:"05 Timelines"', color: { a: 1, rgb: hex("7C3AED") } },
  ],
  "collapse-display": true,
  showArrow: false,
  textFadeMultiplier: 0,
  nodeSizeMultiplier: 1,
  lineSizeMultiplier: 1,
  "collapse-forces": true,
  centerStrength: 0.52,
  repelStrength: 10,
  linkStrength: 1,
  linkDistance: 250,
  scale: 1,
  close: true,
};

async function main() {
  await resetGeneratedOutput();

  await Promise.allSettled(
    sourceCatalog.map(async (source) => {
      try {
        source.localFileResolved = await tryDownload(source);
      } catch {
        source.localFileResolved = "";
      }
    }),
  );

  for (const note of allStructuredNotes) {
    await writeVaultFile(note.path, renderNote(note));
  }

  for (const source of sourceCatalog) {
    await writeVaultFile(source.path, renderSourceNote(source));
  }

  for (const indexNote of extraIndexes) {
    await writeVaultFile(indexNote.path, indexNote.content);
  }

  await writeVaultFile("05 Timelines/GATE Timeline.md", timeline);

  const welcome = renderIndexNote(
    "Welcome",
    "This vault is organized around hubs, entities, claims, and source notes so the Obsidian graph shows both hard documentary links and the interpretive bridges around them.",
    [
      "[[GATE Program]]",
      "[[Gifted Education]]",
      "[[Federal Gifted Policy]]",
      "[[California GATE]]",
      "[[Defense and Intelligence]]",
      "[[Parapsychology and ESP]]",
      "[[Remote Viewing]]",
      "[[Psychometrics and Testing]]",
      "[[Source Index]]",
      "[[Claims Index]]",
    ],
  );
  await writeVaultFile("Welcome.md", welcome);

  const rootExport = join(root, "VIDEO The GATE Program - Full Outline + Sources 32b629dddcbe8161b305eaacecea8e35.md");
  const archivedExport = join(root, "98 Archive/Original Notion Export - GATE Outline.md");
  let exportSource = rootExport;

  try {
    await access(rootExport);
  } catch {
    exportSource = archivedExport;
  }

  await ensureDir(join(root, "98 Archive"));
  try {
    await copyFile(exportSource, archivedExport);
  } catch {
    // Leave the best available archive copy in place.
  }

  let currentGraph = {};
  try {
    currentGraph = JSON.parse(await readFile(join(root, ".obsidian/graph.json"), "utf8"));
  } catch {
    currentGraph = {};
  }

  await ensureDir(join(root, ".obsidian"));
  await writeFile(
    join(root, ".obsidian/graph.json"),
    `${JSON.stringify({ ...currentGraph, ...graphConfig }, null, 2)}\n`,
    "utf8",
  );
}

await main();
