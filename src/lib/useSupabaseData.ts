/**
 * useSupabaseData — central data hook for Payatas Ledger
 *
 * Fetches live data from Supabase on mount. Shows empty state when
 * Supabase is unreachable. No mock data — only real records.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase, dbFetch, getUsers } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface Resident {
  id: string; name: string; age: number; dob: string; gender: string; address: string;
  household: string; status: string; contact: string; occupation: string;
  civilStatus: string; purok: string; registered: string;
}

export interface DocRequest {
  id: string; resident: string; type: string; purpose: string; date: string;
  status: string; fee: string; processor: string; contact: string;
  id_upload: string;
}

export interface BlotterCase {
  id: string; complainant: string; respondent: string; incident: string;
  date: string; time: string; status: string; location: string;
  summary: string; handler: string; hearingDate: string;
}

export interface Announcement {
  id: string; title: string; category: string; date: string;
  author: string; content: string; priority: string; image: string; visible: boolean;
}

export interface Poll {
  id: string; title: string; category: string; startDate: string;
  endDate: string; status: string; options: { id: string; label: string; votes: number }[];
  totalVotes: number; description: string; winner?: string;
}

export interface AdminUser {
  id: number; name: string; email: string; role: string;
  username: string; position: string; lastLogin: string; status: string; permissions: string[];
}

export interface AuditLog {
  id: string; user: string; action: string; target: string; detail: string; date: string; module: string; ip: string;
}

export interface Official {
  id: number; name: string; position: string; committee: string;
  contact: string; email: string; since: string; bio: string; image: string;
}

export interface BarangayInfo {
  name: string;
  municipality: string;
  province: string;
  region: string;
  captain: string;
  established: string;
  population: number;
  households: number;
  area: string;
  hotline: string;
  emergency: string;
  email: string;
  address: string;
  officeHours: string;
  vision: string;
  mission: string;
  history: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  duration: string;
  fee: string;
  requirements: string[];
}

export interface SuggestionItem {
  id: string; name: string; content: string; admin_reply: string;
  status: string; created_at: string;
}

export interface VolunteerItem {
  id: string; full_name: string; email: string; contact: string;
  body_conditions: string; status: string; created_at: string;
}

export interface ReportItem {
  id: string; category: string; description: string; location: string;
  urgency: string; status: string; reporter_name: string;
  reporter_contact: string; created_at: string; updated_at: string;
}

export interface AppData {
  residents:     Resident[];
  docRequests:   DocRequest[];
  blotter:       BlotterCase[];
  announcements: Announcement[];
  polls:         Poll[];
  adminUsers:    AdminUser[];
  auditLogs:     AuditLog[];
  officials:     Official[];
  barangayInfo:  BarangayInfo;
  services:      Service[];
  reports:       ReportItem[];
  suggestions:   SuggestionItem[];
  volunteers:    VolunteerItem[];
  loading:       boolean;
  offline:       boolean;
  refetch:       () => void;
}

// ============================================================
// Helpers — map DB row shapes to the shape the UI expects
// ============================================================

function calcAge(dob: string): number {
  if (!dob || dob === 'N/A') return 0;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function mapResident(r: Record<string, unknown>): Resident {
  return {
    id:          String(r.id ?? ""),
    name:        `${r.fname ?? ""} ${r.lname ?? ""}`.trim(),
    age:         calcAge(String(r.dob ?? "")),
    dob:         String(r.dob ?? ""),
    gender:      String(r.gender ?? "N/A"),
    address:     String(r.address ?? ""),
    household:   String(r.household ?? ""),
    status:      String(r.status ?? "Active"),
    contact:     String(r.contact ?? "N/A"),
    occupation:  String(r.occupation ?? ""),
    civilStatus: String(r.civil_status ?? "Single"),
    purok:       String(r.purok ?? ""),
    registered:  String(r.registered ?? ""),
  };
}

function mapDocument(d: Record<string, unknown>): DocRequest {
  return {
    id:        String(d.id ?? ""),
    resident:  String(d.resident ?? ""),
    type:      String(d.type ?? ""),
    purpose:   String(d.purpose ?? ""),
    date:      String(d.date ?? ""),
    status:    String(d.status ?? "pending").toLowerCase(),
    fee:       "₱50",
    processor: String(d.remarks ?? ""),
    contact:   String(d.contact ?? ""),
    id_upload: String(d.id_upload ?? ""),
  };
}

function mapComplaint(c: Record<string, unknown>): BlotterCase {
  return {
    id:          String(c.id ?? ""),
    complainant: String(c.complainant ?? ""),
    respondent:  String(c.respondent ?? ""),
    incident:    String(c.category ?? ""),
    date:        String(c.date ?? ""),
    time:        String(c.time ?? ""),
    status:      (String(c.status ?? "pending").toLowerCase()),
    location:    String(c.location ?? ""),
    summary:     String(c.description ?? ""),
    handler:     String(c.handler ?? ""),
    hearingDate: String(c.hearing_date ?? ""),
  };
}

function mapAnnouncement(a: Record<string, unknown>): Announcement {
  return {
    id:       String(a.id ?? ""),
    title:    String(a.title ?? ""),
    category: String(a.category ?? "general"),
    date:     String(a.date ?? ""),
    author:   String(a.author ?? "Barangay Payatas"),
    content:  String(a.content ?? ""),
    priority: String(a.priority ?? "normal"),
    image:    "",
    visible:  a.visible !== false,
  };
}

function mapPoll(p: Record<string, unknown>): Poll {
  const options = Array.isArray(p.options) ? p.options : [];
  const votes   = (p.votes ?? {}) as Record<string, number>;
  const total   = Object.values(votes).reduce((s, v) => s + (v as number), 0);
  return {
    id:          String(p.id ?? ""),
    title:       String(p.question ?? ""),
    category:    "General",
    startDate:   (String(p.created_at ?? "").split("T")[0] ?? ""),
    endDate:     (String(p.expires_at ?? "").split("T")[0] ?? ""),
    status:      String(p.status ?? "active"),
    options:     options.map((opt: string, i: number) => ({
      id:    String(i),
      label: opt,
      votes: votes[String(i)] ?? 0,
    })),
    totalVotes:  total,
    description: "",
    winner:      String(p.winner ?? ""),
  };
}

// ============================================================
// Hook
// ============================================================

export function useSupabaseData(): AppData {
const defaultBarangayInfo: BarangayInfo = {
  name: "Barangay Payatas", municipality: "Quezon City", province: "Metro Manila",
  region: "NCR", captain: "Hon. Maria Santos Cruz", established: "1945",
  population: 12458, households: 3125, area: "2.4 sq km",
  hotline: "+63 2 8123 4567", emergency: "911", email: "payatas.ledger@qc.gov.ph",
  address: "Litex Road, Barangay Payatas, QC 1119",
  officeHours: "Monday – Friday, 8:00 AM – 5:00 PM",
  vision: "A progressive, peaceful, and prosperous barangay with empowered citizens living in a clean, green, and sustainable environment.",
  mission: "To deliver efficient and transparent public service, promote community participation, uphold the rule of law, and ensure the welfare and development of every resident.",
  history: "Barangay Payatas is one of the well-known barangays of Quezon City, located along Litex Road. It has grown from a small community into a vibrant urban village with a rich history of civic engagement, community service, and sustainable development.",
};

const defaultServices: Service[] = [
  { id: 1, title: "Barangay Clearance", description: "Official certification that you are a resident in good standing", icon: "FileCheck", duration: "30 mins", fee: "₱50", requirements: ["Valid ID", "Proof of Residency"] },
  { id: 2, title: "Barangay Certificate", description: "General certificate for various purposes (employment, school, etc.)", icon: "Award", duration: "30 mins", fee: "₱30", requirements: ["Valid ID", "Purpose Statement"] },
  { id: 3, title: "Certificate of Indigency", description: "Proof of financial status for assistance programs", icon: "Heart", duration: "1 hour", fee: "Free", requirements: ["Valid ID", "Proof of Income", "Social Case Study"] },
  { id: 4, title: "Certificate of Residency", description: "Confirms that you are a legitimate resident of the barangay", icon: "Home", duration: "30 mins", fee: "₱30", requirements: ["Valid ID", "Utility Bill"] },
  { id: 5, title: "Business Clearance", description: "Required for business permit renewal from the city government", icon: "Briefcase", duration: "2-3 days", fee: "₱200", requirements: ["DTI/SEC Registration", "Business Address Proof", "Tax Clearance"] },
  { id: 6, title: "Blotter Report", description: "Official record of incidents, disputes, or complaints", icon: "Shield", duration: "1-2 hours", fee: "Free", requirements: ["Valid ID", "Written Complaint"] },
  { id: 7, title: "Good Moral Certificate", description: "Attests to the good character and moral standing of the resident", icon: "Star", duration: "1 hour", fee: "₱50", requirements: ["Valid ID", "2 Endorsement Letters"] },
  { id: 8, title: "Certification for Solo Parent", description: "Official recognition as a solo parent for government benefits", icon: "Users", duration: "3-5 days", fee: "Free", requirements: ["Birth Certificate of Child", "Marriage Certificate (if applicable)", "Death Certificate (if widowed)"] },
];

  const [data, setData] = useState<Omit<AppData, "loading" | "offline" | "refetch">>({
    residents:     [],
    docRequests:   [],
    blotter:       [],
    announcements: [],
    polls:         [],
    adminUsers:    [],
    auditLogs:     [],
    officials:     [],
    barangayInfo:  defaultBarangayInfo,
    services:      defaultServices,
    reports:       [],
    suggestions:   [],
    volunteers:    [],
  });
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetch = useCallback(async () => {
    if (!supabase) {
      setOffline(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        resRows, docRows, cmpRows, annRows, pollRows, userRows,
        offRows, audRows, infoRows, svcRows, rptRows, sugRows, volRows,
      ] = await Promise.allSettled([
        dbFetch<Record<string, unknown>>("residents"),
        dbFetch<Record<string, unknown>>("documents"),
        dbFetch<Record<string, unknown>>("complaints"),
        dbFetch<Record<string, unknown>>("announcements"),
        dbFetch<Record<string, unknown>>("polls"),
        getUsers(),
        dbFetch<Record<string, unknown>>("officials"),
        dbFetch<Record<string, unknown>>("audit_logs"),
        dbFetch<Record<string, unknown>>("barangay_info"),
        dbFetch<Record<string, unknown>>("services"),
        dbFetch<Record<string, unknown>>("reports"),
        dbFetch<Record<string, unknown>>("suggestions"),
        dbFetch<Record<string, unknown>>("volunteer_signups"),
      ]);

      function mapOfficial(o: Record<string, unknown>): Official {
        return {
          id:       Number(o.id ?? 0),
          name:     String(o.name ?? ""),
          position: String(o.position ?? ""),
          committee: String(o.committee ?? ""),
          contact:  String(o.contact ?? ""),
          email:    String(o.email ?? ""),
          since:    String(o.since ?? ""),
          bio:      String(o.bio ?? ""),
          image:    String(o.image ?? ""),
        };
      }

      function mapBarangayInfo(rows: Record<string, unknown>[]): BarangayInfo {
        const row = rows[0] ?? {};
        return {
          name:         String(row.name ?? defaultBarangayInfo.name),
          municipality: String(row.municipality ?? defaultBarangayInfo.municipality),
          province:     String(row.province ?? defaultBarangayInfo.province),
          region:       String(row.region ?? defaultBarangayInfo.region),
          captain:      String(row.captain ?? defaultBarangayInfo.captain),
          established:  String(row.established ?? defaultBarangayInfo.established),
          population:   Number(row.population ?? defaultBarangayInfo.population),
          households:   Number(row.households ?? defaultBarangayInfo.households),
          area:         String(row.area ?? defaultBarangayInfo.area),
          hotline:      String(row.hotline ?? defaultBarangayInfo.hotline),
          emergency:    String(row.emergency ?? defaultBarangayInfo.emergency),
          email:        String(row.email ?? defaultBarangayInfo.email),
          address:      String(row.address ?? defaultBarangayInfo.address),
          officeHours:  String(row.office_hours ?? defaultBarangayInfo.officeHours),
          vision:       String(row.vision ?? defaultBarangayInfo.vision),
          mission:      String(row.mission ?? defaultBarangayInfo.mission),
          history:      String(row.history ?? defaultBarangayInfo.history),
        };
      }

      function mapService(s: Record<string, unknown>): Service {
        let reqs: string[] = [];
        if (Array.isArray(s.requirements)) reqs = s.requirements as string[];
        else if (typeof s.requirements === "string") {
          try { reqs = JSON.parse(s.requirements as string); } catch { reqs = []; }
        }
        return {
          id:           Number(s.id ?? 0),
          title:        String(s.title ?? ""),
          description:  String(s.description ?? ""),
          icon:         String(s.icon ?? "FileText"),
          duration:     String(s.duration ?? ""),
          fee:          String(s.fee ?? ""),
          requirements: reqs,
        };
      }

      function mapAuditLog(a: Record<string, unknown>): AuditLog {
        return {
          id:       String(a.id ?? ""),
          user:     String(a.user_name ?? ""),
          action:   String(a.action ?? ""),
          target:   "",
          detail:   String(a.details ?? ""),
          date:     String(a.created_at ?? ""),
          module:   String(a.module ?? ""),
          ip:       String(a.ip_address ?? ""),
        };
      }

      function mapReport(r: Record<string, unknown>): ReportItem {
        return {
          id:              String(r.id ?? ""),
          category:        String(r.category ?? ""),
          description:     String(r.description ?? ""),
          location:        String(r.location ?? ""),
          urgency:         String(r.urgency ?? "low"),
          status:          String(r.status ?? "pending"),
          reporter_name:   String(r.reporter_name ?? ""),
          reporter_contact: String(r.reporter_contact ?? ""),
          created_at:      String(r.created_at ?? ""),
          updated_at:      String(r.updated_at ?? ""),
        };
      }

      function mapSuggestion(s: Record<string, unknown>): SuggestionItem {
        return {
          id:         String(s.id ?? ""),
          name:       String(s.name ?? "Anonymous"),
          content:    String(s.content ?? ""),
          admin_reply: String(s.admin_reply ?? ""),
          status:     String(s.status ?? "pending"),
          created_at: String(s.created_at ?? ""),
        };
      }

      function mapVolunteer(v: Record<string, unknown>): VolunteerItem {
        return {
          id:             String(v.id ?? ""),
          full_name:      String(v.full_name ?? ""),
          email:          String(v.email ?? ""),
          contact:        String(v.contact ?? ""),
          body_conditions: String(v.body_conditions ?? ""),
          status:         String(v.status ?? "pending"),
          created_at:     String(v.created_at ?? ""),
        };
      }

      setData(() => ({
        residents:     resRows.status  === "fulfilled" ? (resRows.value as Record<string, unknown>[]).map(mapResident)        : [],
        docRequests:   docRows.status  === "fulfilled" ? (docRows.value as Record<string, unknown>[]).map(mapDocument)        : [],
        blotter:       cmpRows.status  === "fulfilled" ? (cmpRows.value as Record<string, unknown>[]).map(mapComplaint)       : [],
        announcements: annRows.status  === "fulfilled" ? (annRows.value as Record<string, unknown>[]).map(mapAnnouncement)    : [],
        polls:         pollRows.status === "fulfilled" ? (pollRows.value as Record<string, unknown>[]).map(mapPoll)           : [],
        adminUsers:    userRows.status === "fulfilled" ? (userRows.value as AdminUser[])                                     : [],
        auditLogs:     audRows.status  === "fulfilled" ? (audRows.value as Record<string, unknown>[]).map(mapAuditLog)       : [],
        officials:     offRows.status  === "fulfilled" ? (offRows.value as Record<string, unknown>[]).map(mapOfficial)       : [],
        barangayInfo:  infoRows.status === "fulfilled" ? mapBarangayInfo(infoRows.value as Record<string, unknown>[])         : defaultBarangayInfo,
        services:      svcRows.status  === "fulfilled" ? (svcRows.value as Record<string, unknown>[]).map(mapService)        : defaultServices,
        reports:       rptRows.status  === "fulfilled" ? (rptRows.value as Record<string, unknown>[]).map(mapReport)         : [],
        suggestions:   sugRows.status  === "fulfilled" ? (sugRows.value as Record<string, unknown>[]).map(mapSuggestion)     : [],
        volunteers:    volRows.status  === "fulfilled" ? (volRows.value as Record<string, unknown>[]).map(mapVolunteer)     : [],
      }));

      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime — reload relevant slices on live changes
  useEffect(() => {
    if (!supabase) return;

    const tables = ["residents", "documents", "complaints", "announcements", "polls", "officials", "audit_logs", "barangay_info", "services", "reports", "suggestions", "volunteer_signups"] as const;
    const channels = tables.map(table =>
      supabase!
        .channel(`rt:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => fetch())
        .subscribe()
    );

    return () => { channels.forEach(ch => ch.unsubscribe()); };
  }, [fetch]);

  return { ...data, loading, offline, refetch: fetch };
}
