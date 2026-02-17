/**
 * Компонент загрузки файлов (фото) с превью
 */
import { useRef, useState } from 'react';

interface Props {
  maxFiles?: number;
  accept?: string;
  onFilesChange: (files: File[]) => void;
}

export function FileUpload({ maxFiles = 3, accept = 'image/*', onFilesChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, maxFiles);
    setFiles(combined);
    onFilesChange(combined);

    const urls = combined.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return urls;
    });
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);

    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className="file-upload">
      <div className="file-upload__previews">
        {previews.map((url, i) => (
          <div key={i} className="file-upload__preview">
            <img src={url} alt={`Фото ${i + 1}`} />
            <button
              type="button"
              className="file-upload__remove"
              onClick={() => removeFile(i)}
              title="Удалить"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {files.length < maxFiles && (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => inputRef.current?.click()}
        >
          + Добавить фото ({files.length}/{maxFiles})
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}
