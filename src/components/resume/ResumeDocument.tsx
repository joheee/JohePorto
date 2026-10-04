import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData, ResumeEntry } from "@/lib/resume";

// Never split a word across lines: a hyphenated word extracts as two words in an ATS.
Font.registerHyphenationCallback((word) => [word]);

// ATS-friendly on purpose: one column, built-in Times (no embedded subset fonts), plain text,
// standard section names, no icons, and nothing in page headers or footers.
const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 40, fontFamily: "Times-Roman", fontSize: 10.5, lineHeight: 1.2, color: "#000" },
  name: { fontFamily: "Times-Bold", fontSize: 22, lineHeight: 1.1, textAlign: "center" },
  contact: { marginTop: 6, textAlign: "center", fontSize: 10 },
  link: { color: "#000", textDecoration: "none" },
  heading: { marginTop: 10, paddingBottom: 1, borderBottomWidth: 0.8, borderBottomColor: "#000", fontFamily: "Times-Bold", fontSize: 12.5 },
  entry: { marginTop: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flexShrink: 1, paddingRight: 10 },
  right: { flexShrink: 0, textAlign: "right" },
  bold: { fontFamily: "Times-Bold" },
  italic: { fontFamily: "Times-Italic", fontSize: 10 },
  bullet: { flexDirection: "row", marginTop: 1.5, paddingLeft: 10 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
  skill: { marginTop: 2 },
});

function Entry({ entry, projectStyle = false }: { entry: ResumeEntry; projectStyle?: boolean }) {
  return (
    <View style={s.entry}>
      {/* Header rows stay together, and are never left alone at the bottom of a page. */}
      <View wrap={false} minPresenceAhead={40}>
        <View style={s.row}>
          <Text style={[s.left, s.bold]}>
            {entry.title}
            {projectStyle && entry.detail ? <Text style={s.italic}>{`  |  ${entry.detail}`}</Text> : null}
          </Text>
          <Text style={s.right}>{projectStyle ? entry.period : entry.org}</Text>
        </View>
        {!projectStyle && (entry.detail || entry.period) && (
          <View style={s.row}>
            <Text style={[s.left, s.italic]}>{entry.detail}</Text>
            <Text style={[s.right, s.italic]}>{entry.period}</Text>
          </View>
        )}
      </View>
      {entry.bullets.map((b, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.dot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.heading} minPresenceAhead={60}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ResumeDocument({ data }: { data: ResumeData }) {
  return (
    <Document title={`${data.name} - Resume`} author={data.name} subject="Resume" creator="johePorto" producer="johePorto">
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{data.name}</Text>
        <Text style={s.contact}>
          {data.contact.map((c, i) => (
            <Text key={c.href}>
              {i > 0 ? "  |  " : ""}
              <Link src={c.href} style={s.link}>
                {c.text}
              </Link>
            </Text>
          ))}
        </Text>

        {data.experience.length > 0 && (
          <Section title="Work Experience">
            {data.experience.map((e, i) => (
              <Entry key={i} entry={e} />
            ))}
          </Section>
        )}

        {data.education.length > 0 && (
          <Section title="Education">
            {data.education.map((e, i) => (
              <Entry key={i} entry={e} />
            ))}
          </Section>
        )}

        {data.projects.length > 0 && (
          <Section title="Projects">
            {data.projects.map((p, i) => (
              <Entry key={i} entry={p} projectStyle />
            ))}
          </Section>
        )}

        {data.skills.length > 0 && (
          <Section title="Technical Summary">
            {data.skills.map((g) => (
              <Text key={g.name} style={s.skill}>
                <Text style={s.bold}>{g.name}: </Text>
                {g.items.join(", ")}
              </Text>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}
