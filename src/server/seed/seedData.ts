import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  challenges,
  citizenSatisfaction,
  essentialServices,
  fieldPersons,
  impactReports,
  industryExpertise,
  projectMilestones,
  projects,
  universitiesExpertise,
  users,
} from "@/db/schema";
import { hashPassword } from "@/server/security/auth";
import { acceptChallenge, createChallenge } from "@/server/service/challengeService";
import { addProgressUpdate, requestIndustrySupport } from "@/server/service/projectService";

const DEMO_PASSWORD = "demo1234";
const ADMIN_EMAIL = "rithikanagineni021@gmail.com";
const ADMIN_PASSWORD = "Nagineni@123";

type SeedUser = {
  email: string; fullName: string; role: "CITIZEN" | "UNIVERSITY" | "INDUSTRY" | "FIELD_PERSON" | "ADMIN";
  organizationName?: string; city?: string; state?: string; language?: string; phone?: string;
};

const SEED_USERS: SeedUser[] = [
  { email: ADMIN_EMAIL, fullName: "Platform Administrator", role: "ADMIN", organizationName: "CivicSolve AI", city: "Hyderabad", state: "Telangana" },
  { email: "priya.citizen@civicsolve.in", fullName: "Priya Sharma", role: "CITIZEN", city: "Hyderabad", state: "Telangana", language: "te", phone: "+919876543210" },
  { email: "ravi.citizen@civicsolve.in", fullName: "Ravi Kumar", role: "CITIZEN", city: "Warangal", state: "Telangana", language: "te", phone: "+919876543211" },
  { email: "anita.citizen@civicsolve.in", fullName: "Anita Desai", role: "CITIZEN", city: "Pune", state: "Maharashtra", language: "mr", phone: "+919876543212" },
  { email: "kiran.citizen@civicsolve.in", fullName: "Kiran Raj", role: "CITIZEN", city: "Bengaluru", state: "Karnataka", language: "kn", phone: "+919876543213" },
  { email: "farhan.citizen@civicsolve.in", fullName: "Farhan Ali", role: "CITIZEN", city: "Chennai", state: "Tamil Nadu", language: "ta", phone: "+919876543214" },
  { email: "abc.university@civicsolve.in", fullName: "Dr. Meera Rao", role: "UNIVERSITY", organizationName: "ABC University", city: "Hyderabad", state: "Telangana" },
  { email: "xyz.university@civicsolve.in", fullName: "Prof. Arjun Nair", role: "UNIVERSITY", organizationName: "XYZ Institute of Technology", city: "Bengaluru", state: "Karnataka" },
  { email: "pqr.university@civicsolve.in", fullName: "Dr. Latha Menon", role: "UNIVERSITY", organizationName: "PQR Rural Innovation University", city: "Warangal", state: "Telangana" },
  { email: "urbaniot.industry@civicsolve.in", fullName: "Sneha Verma", role: "INDUSTRY", organizationName: "UrbanIoT Systems", city: "Hyderabad", state: "Telangana" },
  { email: "aquatech.industry@civicsolve.in", fullName: "Vikram Shetty", role: "INDUSTRY", organizationName: "AquaTech Solutions", city: "Pune", state: "Maharashtra" },
  { email: "gridsense.industry@civicsolve.in", fullName: "Neha Gupta", role: "INDUSTRY", organizationName: "GridSense Energy", city: "Bengaluru", state: "Karnataka" },
  { email: "rahul.field@civicsolve.in", fullName: "Rahul Kumar", role: "FIELD_PERSON", organizationName: "CivicSolve Field Ops / NREC", city: "Hyderabad", state: "Telangana", phone: "+91 98765 43210" },
  { email: "anjali.field@civicsolve.in", fullName: "Anjali Sharma", role: "FIELD_PERSON", organizationName: "CivicSolve Field Team", city: "Hyderabad", state: "Telangana", phone: "+91 98490 67890" },
  { email: "vikram.field@civicsolve.in", fullName: "Vikram Reddy", role: "FIELD_PERSON", organizationName: "CivicSolve Field Team", city: "Hyderabad", state: "Telangana", phone: "+91 98490 54321" },
  { email: "pooja.field@civicsolve.in", fullName: "Pooja Singh", role: "FIELD_PERSON", organizationName: "CivicSolve Field Team", city: "Hyderabad", state: "Telangana", phone: "+91 98490 11223" },
  { email: "suresh.field@civicsolve.in", fullName: "Suresh Babu", role: "FIELD_PERSON", organizationName: "CivicSolve Field Team", city: "Hyderabad", state: "Telangana", phone: "+91 98490 33445" },
  { email: "ramesh.field@civicsolve.in", fullName: "K. Ramesh", role: "FIELD_PERSON", organizationName: "CivicSolve Nalgonda Operations", city: "Nalgonda", state: "Telangana", phone: "+91 98490 88990" },
];

const UNIVERSITY_PROFILES: Record<string, { departments: string[]; skills: string[]; researchAreas: string[]; facultyExpertise: string[]; studentTeams: number; previousProjects: number }> = {
  "abc.university@civicsolve.in": {
    departments: ["Civil Engineering", "Transportation Engineering", "Environmental Engineering", "Electrical Engineering"],
    skills: ["Road Safety", "GIS", "Structural Design", "Traffic Simulation", "Electrical Engineering", "IoT", "Street Lighting"],
    researchAreas: ["Road Safety", "Urban Infrastructure", "Transportation", "Water Resource Management", "Smart Lighting", "IoT"],
    facultyExpertise: ["Civil Engineering", "Road Safety", "Hydrology", "Electrical Engineering"],
    studentTeams: 6, previousProjects: 3,
  },
  "xyz.university@civicsolve.in": {
    departments: ["Computer Science", "Electrical Engineering", "Data Science"],
    skills: ["IoT", "Machine Learning", "Sensor Networks", "Mobile Apps"],
    researchAreas: ["Smart Cities", "Energy Systems", "Digital Services", "Data Analytics"],
    facultyExpertise: ["IoT", "Data Science", "Electrical Engineering", "Networking"],
    studentTeams: 5, previousProjects: 2,
  },
  "pqr.university@civicsolve.in": {
    departments: ["Agricultural Engineering", "Environmental Science", "Public Health"],
    skills: ["Smart Irrigation", "Waste Management", "Soil Analysis", "Community Design"],
    researchAreas: ["Agriculture", "Environment", "Sanitation", "Rural Development"],
    facultyExpertise: ["Agricultural Engineering", "Environmental Science", "Public Health"],
    studentTeams: 4, previousProjects: 2,
  },
};

const INDUSTRY_PROFILES: Record<string, { technologies: string[]; domains: string[]; supportTypes: string[] }> = {
  "urbaniot.industry@civicsolve.in": {
    technologies: ["IoT", "Sensors", "Data Analytics", "Computer Vision", "Transportation"],
    domains: ["Smart Cities", "Infrastructure", "Road Safety", "Transportation"],
    supportTypes: ["Technology", "Hardware", "Mentorship", "Deployment"],
  },
  "aquatech.industry@civicsolve.in": {
    technologies: ["Water Treatment", "Hydrology", "Pumps", "Environmental Engineering", "Telemetry"],
    domains: ["Water", "Sanitation", "Environment", "Agriculture"],
    supportTypes: ["Technology", "Funding", "Infrastructure", "Expertise"],
  },
  "gridsense.industry@civicsolve.in": {
    technologies: ["Energy Systems", "Electrical Engineering", "Smart Grid", "IoT", "Solar"],
    domains: ["Electricity", "Digital Services", "Smart Cities"],
    supportTypes: ["Technology", "Mentorship", "Software", "Deployment"],
  },
};

type SeedChallenge = {
  citizen: string; title: string; description: string; category: string; location: string; landmark?: string;
  latitude?: number; longitude?: number;
  severity: string; durationDays: number; peopleAffected: number; language?: string; inputMethod?: string;
};

const SEED_CHALLENGES: SeedChallenge[] = [
  { citizen: "priya.citizen@civicsolve.in", title: "Lack of street lighting near a school in Shapur", description: "Lack of street lighting near a school in Shapur. Students face safety problems at night.", category: "Public Safety", location: "Shapur, Hyderabad", landmark: "Near Government High School, Shapur", latitude: 17.5169, longitude: 78.4350, severity: "HIGH", durationDays: 45, peopleAffected: 1500, language: "en", inputMethod: "TEXT" },
  { citizen: "priya.citizen@civicsolve.in", title: "Large potholes near our college", description: "There are large potholes near our college and students are facing accidents every day. Two-wheelers are falling during the rains and it is very unsafe for students walking to the campus.", category: "Infrastructure", location: "Kukatpally, Hyderabad", landmark: "Near JNTU main gate", latitude: 17.4938, longitude: 78.3914, severity: "HIGH", durationDays: 90, peopleAffected: 4000, language: "te", inputMethod: "VOICE" },
  { citizen: "ravi.citizen@civicsolve.in", title: "The road outside the college is badly damaged", description: "The road outside the college is badly damaged with broken tar and potholes. Students and auto drivers face accidents daily and it becomes worse after rain.", category: "Roads", location: "Kukatpally, Hyderabad", landmark: "College road", latitude: 17.4945, longitude: 78.3920, severity: "HIGH", durationDays: 60, peopleAffected: 2500 },
  { citizen: "ravi.citizen@civicsolve.in", title: "Village water shortage for the last three months", description: "Our village has had no drinking water supply for three months. The borewell has dried and tankers come only once a week. Women walk two kilometres daily to fetch water.", category: "Water", location: "Gudur village, Warangal", severity: "CRITICAL", durationDays: 95, peopleAffected: 1800, language: "te" },
  { citizen: "anita.citizen@civicsolve.in", title: "Garbage accumulation near the market", description: "Garbage is dumped near the vegetable market and is never cleared. There is a bad smell, stray dogs and risk of disease for shopkeepers and children in the area.", category: "Waste Management", location: "Kothrud, Pune", severity: "HIGH", durationDays: 45, peopleAffected: 1200, language: "mr" },
  { citizen: "anita.citizen@civicsolve.in", title: "Waste segregation is not followed in our society", description: "Wet and dry waste are mixed by collectors even though residents segregate. We need a proper segregation and composting model for the housing societies.", category: "Waste Management", location: "Baner, Pune", severity: "MEDIUM", durationDays: 120, peopleAffected: 800 },
  { citizen: "kiran.citizen@civicsolve.in", title: "Streetlight failures making the street unsafe at night", description: "More than twenty streetlights have not been working for two months. Women returning late at night feel unsafe and there have been two thefts on this street.", category: "Electricity", location: "HSR Layout, Bengaluru", severity: "HIGH", durationDays: 60, peopleAffected: 2200, language: "kn" },
  { citizen: "kiran.citizen@civicsolve.in", title: "Flooding on the main road during every rain", description: "The main road gets flooded with knee deep water during every rain because the storm water drain is blocked. Vehicles break down and shops are damaged.", category: "Infrastructure", location: "Bommanahalli, Bengaluru", severity: "CRITICAL", durationDays: 200, peopleAffected: 5200 },
  { citizen: "farhan.citizen@civicsolve.in", title: "Public transportation is inadequate for our area", description: "Only two buses serve our area in the morning and they are overcrowded. Students reach college late and workers lose wages because of the unreliable schedule.", category: "Transportation", location: "Tambaram, Chennai", severity: "MEDIUM", durationDays: 300, peopleAffected: 6000, language: "ta" },
  { citizen: "farhan.citizen@civicsolve.in", title: "Open sewage drain near the school", description: "An open sewage drain runs next to the primary school. Children are exposed to mosquitoes and bad odour, and one child fell into the drain last month.", category: "Sanitation", location: "Pallavaram, Chennai", severity: "CRITICAL", durationDays: 150, peopleAffected: 900 },
  { citizen: "priya.citizen@civicsolve.in", title: "Farmers need smart irrigation support", description: "Farmers in our mandal waste water because there is no soil moisture information. A smart irrigation system could save water and improve the paddy crop yield.", category: "Agriculture", location: "Shamirpet mandal, Hyderabad", severity: "MEDIUM", durationDays: 240, peopleAffected: 700 },
  { citizen: "priya.citizen@civicsolve.in", title: "Frequent power cuts affecting home based workers", description: "There are four to five power cuts every day for the last month. Home based tailoring workers lose income and children cannot study in the evening.", category: "Electricity", location: "Miyapur, Hyderabad", severity: "MEDIUM", durationDays: 35, peopleAffected: 1500 },
  { citizen: "anita.citizen@civicsolve.in", title: "Road safety near the school crossing", description: "Vehicles speed near the school crossing and there is no signage, speed breaker or zebra crossing. Parents fear accidents during school hours.", category: "Public Safety", location: "Aundh, Pune", severity: "HIGH", durationDays: 75, peopleAffected: 1300 },
];

export async function runSeed(force = false) {
  const [{ count: userCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [{ count: challengeCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(challenges);
  const [{ count: projectCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(projects);

  if (!force && userCount > 0 && challengeCount > 0 && projectCount > 0) {
    return { seeded: false, message: "Database already contains demo project data — seed skipped." };
  }

  const userIds = new Map<string, number>();

  for (const u of SEED_USERS) {
    const [existing] = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing) {
      userIds.set(u.email, existing.id);
      continue;
    }
    const [row] = await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash: u.role === "ADMIN" ? await hashPassword(ADMIN_PASSWORD) : await hashPassword(DEMO_PASSWORD),
        role: u.role,
        fullName: u.fullName,
        organizationName: u.organizationName ?? null,
        city: u.city ?? null,
        state: u.state ?? null,
        language: u.language ?? "en",
        phone: u.phone ?? null,
        verificationStatus: "VERIFIED",
        verificationDocType: u.role === "CITIZEN" ? "Aadhar / Ration Card verification" : u.role === "UNIVERSITY" ? "University ID + registration documents" : u.role === "INDUSTRY" ? "Industry registration / GST documents" : "Admin verification",
        verificationDocuments: "Seeded demo account verified by the platform admin.",
        isSeed: true,
        bio: "Seed / demo account for the CivicSolve AI prototype.",
      })
      .returning();
    userIds.set(u.email, row.id);

    if (u.role === "UNIVERSITY") {
      const profile = UNIVERSITY_PROFILES[u.email];
      await db.insert(universitiesExpertise).values({ universityId: row.id, ...profile });
    }
    if (u.role === "INDUSTRY") {
      const profile = INDUSTRY_PROFILES[u.email];
      await db.insert(industryExpertise).values({ industryId: row.id, ...profile, deploymentCapability: true });
    }
  }

  const createdIds: number[] = [];
  for (const c of SEED_CHALLENGES) {
    const citizenId = userIds.get(c.citizen);
    if (!citizenId) continue;
    const { challenge } = await createChallenge(citizenId, {
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      landmark: c.landmark,
      latitude: c.latitude,
      longitude: c.longitude,
      severity: c.severity,
      durationDays: c.durationDays,
      peopleAffected: c.peopleAffected,
      language: c.language ?? "en",
      inputMethod: c.inputMethod ?? "TEXT",
      originalLanguage: c.language ?? "en",
      originalText: c.description,
    });
    createdIds.push(challenge.id);
    await db.update(challenges).set({ isSeed: true, votes: 3 + (challenge.id % 17) }).where(eq(challenges.id, challenge.id));
  }

  const abc = userIds.get("abc.university@civicsolve.in")!;
  const xyz = userIds.get("xyz.university@civicsolve.in")!;
  const pqr = userIds.get("pqr.university@civicsolve.in")!;
  const urbanIot = userIds.get("urbaniot.industry@civicsolve.in")!;
  const aquaTech = userIds.get("aquatech.industry@civicsolve.in")!;
  const gridSense = userIds.get("gridsense.industry@civicsolve.in")!;

  // Seed Field Persons linked to University & login user accounts
  const rahulId = userIds.get("rahul.field@civicsolve.in");
  const anjaliId = userIds.get("anjali.field@civicsolve.in");
  const vikramId = userIds.get("vikram.field@civicsolve.in");
  const poojaId = userIds.get("pooja.field@civicsolve.in");
  const sureshId = userIds.get("suresh.field@civicsolve.in");
  const rameshId = userIds.get("ramesh.field@civicsolve.in");

  if (rahulId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, rahulId)).limit(1);
    const rahulValues = {
      universityId: abc,
      userId: rahulId,
      fullName: "Rahul Kumar",
      role: "Field Engineer",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98765 43210",
      email: "rahul.field@civicsolve.in",
      department: "Electrical Engineering",
      organization: "CivicSolve Field Ops / NREC",
      employeeId: "FP-2026-001",
      skills: ["Electrical Engineering", "IoT", "Street Lighting", "Solar Systems", "Infrastructure"],
      expertise: ["Electrical", "IoT", "Street Lighting"],
      experienceYears: 4,
      registeredLocation: "Jeedimetla Industrial Area, Hyderabad",
      latitude: 17.4930,
      longitude: 78.4050,
      serviceRadiusKm: 25,
      languages: ["English", "Telugu"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(rahulValues);
    } else {
      await db.update(fieldPersons).set(rahulValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  if (anjaliId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, anjaliId)).limit(1);
    const anjaliValues = {
      universityId: abc,
      userId: anjaliId,
      fullName: "Anjali Sharma",
      role: "Field Engineer",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98490 67890",
      email: "anjali.field@civicsolve.in",
      department: "Electronics & Communication",
      organization: "CivicSolve Field Team",
      employeeId: "FP-2026-002",
      skills: ["Electrical Engineering", "Sensors", "Field Survey"],
      expertise: ["Electrical", "Sensors"],
      experienceYears: 3,
      registeredLocation: "Kukatpally, Hyderabad",
      latitude: 17.4950,
      longitude: 78.3900,
      serviceRadiusKm: 25,
      languages: ["English", "Hindi", "Telugu"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(anjaliValues);
    } else {
      await db.update(fieldPersons).set(anjaliValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  if (vikramId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, vikramId)).limit(1);
    const vikramValues = {
      universityId: abc,
      userId: vikramId,
      fullName: "Vikram Reddy",
      role: "Civil Field Specialist",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98490 54321",
      email: "vikram.field@civicsolve.in",
      department: "Civil Engineering",
      organization: "CivicSolve Field Team",
      employeeId: "FP-2026-003",
      skills: ["Civil Engineering", "Site Inspection", "Road Survey"],
      expertise: ["Civil Engineering", "Inspection"],
      experienceYears: 2,
      registeredLocation: "Balanagar, Hyderabad",
      latitude: 17.4700,
      longitude: 78.4400,
      serviceRadiusKm: 20,
      languages: ["English", "Telugu"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(vikramValues);
    } else {
      await db.update(fieldPersons).set(vikramValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  if (poojaId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, poojaId)).limit(1);
    const poojaValues = {
      universityId: abc,
      userId: poojaId,
      fullName: "Pooja Singh",
      role: "IoT Technician",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98490 11223",
      email: "pooja.field@civicsolve.in",
      department: "Computer Engineering",
      organization: "CivicSolve Field Team",
      employeeId: "FP-2026-004",
      skills: ["IoT", "Networking", "Sensor Diagnostics"],
      expertise: ["IoT", "Networking"],
      experienceYears: 2,
      registeredLocation: "Miyapur, Hyderabad",
      latitude: 17.4965,
      longitude: 78.3580,
      serviceRadiusKm: 20,
      languages: ["English", "Hindi"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(poojaValues);
    } else {
      await db.update(fieldPersons).set(poojaValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  if (sureshId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, sureshId)).limit(1);
    const sureshValues = {
      universityId: abc,
      userId: sureshId,
      fullName: "Suresh Babu",
      role: "Maintenance Inspector",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98490 33445",
      email: "suresh.field@civicsolve.in",
      department: "Mechanical & Utilities",
      organization: "CivicSolve Field Team",
      employeeId: "FP-2026-005",
      skills: ["Utilities", "Safety Audit", "Wiring"],
      expertise: ["Utilities", "Safety"],
      experienceYears: 5,
      registeredLocation: "Bachupally, Hyderabad",
      latitude: 17.5350,
      longitude: 78.3700,
      serviceRadiusKm: 25,
      languages: ["English", "Telugu"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(sureshValues);
    } else {
      await db.update(fieldPersons).set(sureshValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  if (rameshId) {
    const [existing] = await db.select().from(fieldPersons).where(eq(fieldPersons.userId, rameshId)).limit(1);
    const rameshValues = {
      universityId: abc,
      userId: rameshId,
      fullName: "K. Ramesh",
      role: "Field Engineer",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      mobile: "+91 98490 88990",
      email: "ramesh.field@civicsolve.in",
      department: "Electrical & Infrastructure",
      organization: "CivicSolve Nalgonda Division",
      employeeId: "FP-2026-006",
      skills: ["Electrical Engineering", "Street Lighting", "Infrastructure", "Field Survey"],
      expertise: ["Electrical", "Street Lighting"],
      experienceYears: 5,
      registeredLocation: "Clock Tower Center, Nalgonda",
      latitude: 17.0504,
      longitude: 79.2669,
      serviceRadiusKm: 25,
      languages: ["Telugu", "English"],
      availabilityStatus: "AVAILABLE",
      status: "ACTIVE",
    };
    if (!existing) {
      await db.insert(fieldPersons).values(rameshValues);
    } else {
      await db.update(fieldPersons).set(rameshValues).where(eq(fieldPersons.id, existing.id));
    }
  }

  // Challenge → acceptance → project → industry support → progress (demo storyline)
  const [shapurLighting, potholes, , water, garbage, , streetlights, flooding] = createdIds;

  const potholeProject = await acceptChallenge(potholes, abc, "Civil Engineering");
  await db.update(projects).set({ title: "Smart Road Safety Initiative" }).where(eq(projects.id, potholeProject.project.id));
  await requestIndustrySupport({
    projectId: potholeProject.project.id, industryId: urbanIot, supportType: "Technology",
    description: "IoT road-condition sensors, computer-vision pothole detection and deployment engineers.",
    requestedBy: "INDUSTRY", matchScore: 91, reasons: ["Technology capability: IoT", "Domain experience: Road Safety", "Field deployment capability"],
  });
  await addProgressUpdate({ projectId: potholeProject.project.id, authorId: abc, progress: 40, note: "Field survey completed and prototype sensor kit installed on the college road stretch.", stage: "DEVELOPMENT" });

  const waterProject = await acceptChallenge(water, pqr, "Environmental Science");
  await db.update(projects).set({ title: "Village Water Security Programme" }).where(eq(projects.id, waterProject.project.id));
  await requestIndustrySupport({
    projectId: waterProject.project.id, industryId: aquaTech, supportType: "Infrastructure",
    description: "Recharge structure design, telemetry for the community borewell and funding for pumps.",
    requestedBy: "UNIVERSITY",
  });
  await addProgressUpdate({ projectId: waterProject.project.id, authorId: pqr, progress: 25, note: "Hydrogeological survey completed with the village water committee.", stage: "DEVELOPMENT" });

  const garbageProject = await acceptChallenge(garbage, pqr, "Environmental Science");
  await db.update(projects).set({ title: "Zero-Waste Market Model" }).where(eq(projects.id, garbageProject.project.id));

  const floodProject = await acceptChallenge(flooding, abc, "Civil Engineering");
  await db.update(projects).set({ title: "Urban Flood Resilience Project" }).where(eq(projects.id, floodProject.project.id));
  await addProgressUpdate({ projectId: floodProject.project.id, authorId: abc, progress: 55, note: "Drain hydraulic model built; retrofit design under review with the municipal corporation.", stage: "TESTING" });

  // Fully closed loop: streetlights project completed + citizen validation
  const lightsProject = await acceptChallenge(streetlights, xyz, "Electrical Engineering");
  await db.update(projects).set({ title: "Smart Streetlight Grid" }).where(eq(projects.id, lightsProject.project.id));
  await requestIndustrySupport({
    projectId: lightsProject.project.id, industryId: gridSense, supportType: "Hardware",
    description: "Smart LED controllers, fault telemetry dashboard and installation crew.",
    requestedBy: "INDUSTRY", matchScore: 88, reasons: ["Technology capability: Energy Systems", "Domain experience: Electricity", "Field deployment capability"],
  });
  await db
    .update(projectMilestones)
    .set({ status: "COMPLETED", completedAt: new Date() })
    .where(eq(projectMilestones.projectId, lightsProject.project.id));
  await addProgressUpdate({ projectId: lightsProject.project.id, authorId: xyz, progress: 100, note: "All 24 smart streetlights installed and handed over to the ward office.", stage: "IMPLEMENTATION" });

  const kiran = userIds.get("kiran.citizen@civicsolve.in")!;
  await db.insert(citizenSatisfaction).values({
    challengeId: streetlights,
    projectId: lightsProject.project.id,
    citizenId: kiran,
    rating: 5,
    comment: "The street is fully lit again and it feels safe to walk home at night. Excellent work by the students and the industry team.",
    resolved: true,
    suggestion: "Please extend the same system to the next two lanes.",
  });
  await db.update(challenges).set({ status: "CITIZEN_VALIDATION" }).where(eq(challenges.id, streetlights));
  const [report] = await db.select().from(impactReports).where(eq(impactReports.projectId, lightsProject.project.id)).limit(1);
  if (report) {
    await db.update(impactReports).set({ satisfaction: 5, impactScore: 92 }).where(eq(impactReports.id, report.id));
  }

  await db.insert(essentialServices).values([
    { name: "Municipal Water Helpline", category: "Water", contact: "1916", region: "Telangana" },
    { name: "Electricity Fault Reporting", category: "Electricity", contact: "1912", region: "Karnataka" },
    { name: "Sanitation Control Room", category: "Sanitation", contact: "1800-425-0333", region: "Tamil Nadu" },
  ]);

  return {
    seeded: true,
    users: SEED_USERS.length,
    challenges: createdIds.length,
    projects: 5,
    password: ADMIN_PASSWORD,
    message: "Seed/demo data created.",
  };
}
