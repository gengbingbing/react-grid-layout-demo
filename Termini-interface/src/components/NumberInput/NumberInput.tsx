import cx from "classnames";
import { ChangeEvent, KeyboardEvent, RefObject } from "react";

export function escapeSpecialRegExpChars(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`);

type Props = {
  value?: string | number;
  inputRef?: RefObject<HTMLInputElement>;
  onValueChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  qa?: string;
  style?:any;
};

function NumberInput({
  value = "",
  inputRef,
  style,
  onValueChange,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  placeholder,
  qa,
}: Props) {
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (!onValueChange) return;
    // Replace comma with dot
    let newValue = e.target.value.replace(/,/g, ".");
    if (newValue === ".") {
      newValue = "0.";
    }

    if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
      e.target.value = newValue;
      onValueChange(e);
    }
  }
  return (
    <input
      data-qa={qa}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={cx(className, "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]")}
      value={value}
      style={style}
      ref={inputRef}
      onChange={onChange}
      autoComplete="off"
      autoCorrect="off"
      minLength={1}
      maxLength={15}
      spellCheck="false"
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}

export default NumberInput;
