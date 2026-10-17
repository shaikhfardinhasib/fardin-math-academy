"use client";

import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

interface Props {
  text: string;
}

export default function MathRenderer({ text }: Props) {
  if (!text) return null;

  // $...$ দিয়ে ঘেরা LaTeX অংশগুলোকে আলাদা করে
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}