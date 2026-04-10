"use client";

import { useRef, useState } from "react";

type Props = {
  onFile: (content: string, fileName: string) => void;
  onZipFile?: (file: File) => void;
  onError: (message: string) => void;
};

export function DropZone({ onFile, onZipFile, onError }: Props) {
  const [highlighted, setHighlighted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    if (file.name.endsWith(".zip")) {
      if (!onZipFile) {
        onError("Upload de ZIP não suportado aqui.");
        return;
      }
      onZipFile(file);
      return;
    }

    if (!file.name.endsWith(".json")) {
      onError("Selecione um arquivo .json ou .zip válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        JSON.parse(content);
        onFile(content, file.name);
      } catch {
        onError("O arquivo JSON está mal formatado.");
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setHighlighted(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  const acceptedFormats = onZipFile ? ".json,.zip" : ".json";
  const formatLabel = onZipFile ? (
    <>
      <span className="text-primary font-semibold">.json</span>
      {" ou "}
      <span className="text-primary font-semibold">.zip</span>
    </>
  ) : (
    <span className="text-primary font-semibold">.json</span>
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHighlighted(true); }}
      onDragLeave={() => setHighlighted(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-3 w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        highlighted
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary hover:bg-primary/5"
      }`}
    >
      <span className="text-3xl">📂</span>
      <p className="text-foreground/70 text-sm text-center px-4">
        Arraste o arquivo {formatLabel} aqui
        <br />
        ou clique para procurar
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
