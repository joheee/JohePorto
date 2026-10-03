import "server-only";
import { cache } from "react";
import type { Project } from "@/types/content";
import { adminDb } from "./firebase-admin";
import { sortProjectsByDate } from "./format";
import { parseProject } from "./validation";

// Projects saved before month/year existed have neither field. Rather than hiding them, they fall back
// to the month they were last saved (nothing is written); editing the project sets the real date.
function withLegacyDate(data: FirebaseFirestore.DocumentData) {
  if (data.month != null && data.year != null) return data;
  const saved = data.updatedAt?.toDate?.();
  return saved ? { ...data, month: saved.getUTCMonth() + 1, year: saved.getUTCFullYear() } : data;
}

// All projects, oldest first by their month and year. Invalid documents are skipped.
export const getProjects = cache(async (): Promise<Project[]> => {
  try {
    const snap = await adminDb().collection("projects").get();
    const projects: Project[] = [];
    for (const doc of snap.docs) {
      try {
        projects.push(parseProject({ ...withLegacyDate(doc.data()), slug: doc.id }));
      } catch (e) {
        console.warn(`Skipping invalid project "${doc.id}": ${e instanceof Error ? e.message : e}`);
      }
    }
    return sortProjectsByDate(projects);
  } catch (e) {
    console.error("getProjects failed:", e);
    return [];
  }
});

export async function getProject(slug: string): Promise<Project | null> {
  const snap = await adminDb().collection("projects").doc(slug).get();
  if (!snap.exists) return null;
  try {
    return parseProject({ ...withLegacyDate(snap.data()!), slug: snap.id });
  } catch {
    return null;
  }
}
