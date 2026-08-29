"use client";

import { useState } from "react";

const PRESETS = [
  { label: "Terracota", value: "linear-gradient(140deg,#B8634A 0%,#8e4a35 100%)" },
  { label: "Terracota suave", value: "linear-gradient(140deg,#D88068 0%,#B8634A 100%)" },
  { label: "Dourado", value: "linear-gradient(140deg,#C9A063 0%,#a07840 100%)" },
  { label: "Dourado suave", value: "linear-gradient(140deg,#D9B47A 0%,#C9A063 100%)" },
  { label: "Sálvia", value: "linear-gradient(140deg,#4F5841 0%,#6A7256 100%)" },
  { label: "Sálvia claro", value: "linear-gradient(140deg,#8A9476 0%,#6A7256 100%)" },
  { label: "Creme", value: "linear-gradient(140deg,#EFE8DC 0%,#E5DCC8 100%)" },
  { label: "Escuro", value: "linear-gradient(140deg,#2A2722 0%,#3d3530 100%)" },
  { label: "Terra + Ouro", value: "linear-gradient(140deg,#B8634A 0%,#C9A063 100%)" },
  { label: "Sálvia + Ouro", value: "linear-gradient(140deg,#4F5841 0%,#C9A063 100%)" },
  { label: "Escuro + Terra", value: "linear-gradient(140deg,#2A2722 0%,#B8634A 100%)" },
  { label: "Creme + Ouro", value: "linear-gradient(140deg,#EFE8DC 0%,#C9A063 100%)" },
];

interface GradientPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function GradientPicker({ value, onChange }: GradientPickerProps) {
  const matchedPreset = PRESETS.find((p) => p.value === value);
  const [isCustom, setIsCustom] = useState(!matchedPreset && !!value);
  const [customValue, setCustomValue] = useState(!matchedPreset && value ? value : "");

  function selectPreset(gradient: string) {
    setIsCustom(false);
    onChange(gradient);
  }

  function openCustom() {
    setIsCustom(true);
    onChange(customValue);
  }

  function handleCustomChange(v: string) {
    setCustomValue(v);
    onChange(v);
  }

  const activeGradient = isCustom ? customValue : value;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest text-ink-soft font-body">Gradiente fallback</p>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {PRESETS.map((preset) => {
          const selected = !isCustom && value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => selectPreset(preset.value)}
              title={preset.label}
              className={`rounded overflow-hidden border-2 transition-all ${
                selected
                  ? "border-ink scale-[1.06] shadow"
                  : "border-transparent hover:border-ink/40"
              }`}
            >
              <div className="h-10 w-full" style={{ background: preset.value }} />
              <p className="text-[8px] text-center py-0.5 px-0.5 font-body text-ink-soft bg-cream-soft truncate leading-tight">
                {preset.label}
              </p>
            </button>
          );
        })}

        {/* Opção personalizado */}
        <button
          type="button"
          onClick={openCustom}
          title="Personalizado"
          className={`rounded overflow-hidden border-2 transition-all ${
            isCustom
              ? "border-ink scale-[1.06] shadow"
              : "border-dashed border-ink/30 hover:border-ink/60"
          }`}
        >
          <div
            className="h-10 w-full flex items-center justify-center"
            style={customValue ? { background: customValue } : { background: "#E5DCC8" }}
          >
            {!customValue && (
              <span className="text-ink-soft text-xs font-body">CSS</span>
            )}
          </div>
          <p className="text-[8px] text-center py-0.5 font-body text-ink-soft bg-cream-soft leading-tight">
            Personalizado
          </p>
        </button>
      </div>

      {/* Preview + input do personalizado */}
      {isCustom && (
        <div className="flex flex-col gap-2 mt-1">
          <div
            className="h-14 w-full rounded-btn transition-all"
            style={{ background: customValue || "#E5DCC8" }}
          />
          <textarea
            rows={2}
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="linear-gradient(140deg,#B8634A 0%,#8e4a35 100%)"
            className="w-full border border-ink/20 bg-cream-soft px-3 py-2 text-xs text-ink font-mono focus:outline-none focus:border-ink rounded-btn resize-none"
          />
          <p className="text-[10px] text-ink-soft/70 font-body">Cole qualquer CSS válido de gradiente — o preview atualiza ao digitar.</p>
        </div>
      )}

      {/* Preview do preset selecionado */}
      {!isCustom && activeGradient && (
        <div
          className="h-8 w-full rounded-btn transition-all"
          style={{ background: activeGradient }}
        />
      )}
    </div>
  );
}
