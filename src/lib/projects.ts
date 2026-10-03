import "server-only";
import { cache } from "react";
import type { Project } from "@/types/content";
import { adminDb } from "./firebase-admin";
import { parseProject } from "./validation";

// All projects, ordered by `order` then title. Invalid documents are skipped.
export const getProjects = cache(async (): Promise<Project[]> => {
  try {
    const snap = await adminDb().collection("projects").get();
    const projects: Project[] = [];
    for (const doc of snap.docs) {
      try {
        projects.push(parseProject({ ...doc.data(), slug: doc.id }));
      } catch (e) {
        console.warn(`Skipping invalid project "${doc.id}": ${e instanceof Error ? e.message : e}`);
      }
    }
    return projects.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  } catch (e) {
    console.error("getProjects failed:", e);
    return [];
  }
});

export async function getProject(slug: string): Promise<Project | null> {
  const snap = await adminDb().collection("projects").doc(slug).get();
  if (!snap.exists) return null;
  try {
    return parseProject({ ...snap.data(), slug: snap.id });
  } catch {
    return null;
  }
}
