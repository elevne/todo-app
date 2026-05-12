import { useLayoutEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * 내용 길이에 맞춰 자동으로 높이가 늘어나는 textarea.
 * Enter / Shift+Enter 동작은 사용하는 쪽에서 onKeyDown로 처리한다.
 */
export function AutoGrowTextarea(props: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      {...props}
      className={`resize-none overflow-hidden ${props.className ?? ""}`}
    />
  );
}
