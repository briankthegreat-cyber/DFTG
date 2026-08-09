export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={checked ? 'aui-toggle is-on' : 'aui-toggle'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="aui-toggle__track" aria-hidden="true">
        <span className="aui-toggle__thumb" />
      </span>
      <span className="aui-toggle__label">{label}</span>
    </button>
  );
}
