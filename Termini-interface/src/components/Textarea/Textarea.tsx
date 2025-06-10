import "./Textarea.scss";

type Props = { onChange: (answer: string) => void; value?: string; placeholder?: string };

export function Textarea({ onChange, value, placeholder }: Props) {
  return (
    <textarea
      value={value}
      className="textarea-bg mt-15 h-full min-h-96 w-full resize-none appearance-none border-none p-15 focus:outline-none focus:ring-0"
      style={{
        marginTop: "var(--spacing-6)",
        padding: "var(--spacing-6)",
        color: "var(--color-text-primary)"
      }}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
