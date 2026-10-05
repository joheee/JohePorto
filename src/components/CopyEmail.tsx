import CopyButton from "./CopyButton";

export default function CopyEmail({ email }: { email: string }) {
  return <CopyButton text={email} label="Copy email address" copiedLabel="Email copied" />;
}
