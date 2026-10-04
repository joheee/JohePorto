import { renderToBuffer } from "@react-pdf/renderer";
import ResumeDocument from "@/components/resume/ResumeDocument";
import { getProjects } from "@/lib/projects";
import { buildResume, resumeFilename } from "@/lib/resume";
import { getProfile } from "@/lib/settings";

// Built once and cached. Saving settings or a project revalidates the whole site, which rebuilds it.
export const dynamic = "force-static";

export async function GET() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  const data = buildResume(profile, projects);
  const pdf = await renderToBuffer(<ResumeDocument data={data} />);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // "inline" opens it in the browser; the filename is used when it is downloaded.
      "Content-Disposition": `inline; filename="${resumeFilename(data.name)}"`,
    },
  });
}
