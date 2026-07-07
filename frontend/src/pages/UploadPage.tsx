import { useState, FormEvent } from 'react';
import { uploadResults } from '../api/client';

function isXmlFile(file: File | null): boolean {
  return (
    !!file &&
    (file.type === 'text/xml' || file.type === 'application/xml' || file.name.toLowerCase().endsWith('.xml'))
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    // Reset the visible status before attempting a new upload.
    setSuccessMessage(null);
    setErrorMessage(null);
    setFileWarning(null);

    if (!file) {
      setErrorMessage('Please select an XML file to upload');
      return;
    }

    if (!isXmlFile(file)) {
      setFileWarning('Selected file must be an XML document');
      setFile(null);
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const body = await uploadResults(text);
      const imported = body.imported ?? 0;
      setSuccessMessage(`Imported ${imported} record${imported === 1 ? '' : 's'}`);
      setFile(null);
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="app-shell">

      <main>
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading">Upload exam results</h2>

          <form onSubmit={handleUpload} className="upload-form">
            <div>
              <label htmlFor="file-input">Choose XML file</label>
              <div className="file-action-row">
                <input
                  id="file-input"
                  type="file"
                  accept="text/xml,.xml,application/xml"
                  onChange={(e) => {
                    const nextFile = e.target.files?.[0] ?? null;
                    setFile(nextFile);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    if (nextFile && !isXmlFile(nextFile)) {
                      setFileWarning('Selected file may not be recognized as XML');
                    } else {
                      setFileWarning(null);
                    }
                  }}
                />
                <button type="submit" disabled={!file || uploading}>
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
              {fileWarning && <p className="warning">{fileWarning}</p>}
            </div>
          </form>

          <div aria-live="polite" className="status-message" style={{ marginTop: '1rem' }}>
            {successMessage && <p className="success">{successMessage}</p>}
          </div>

          {errorMessage && (
            <div role="alert" aria-live="assertive" className="error" style={{ marginTop: '1rem' }}>
              <strong>Upload error:</strong> {errorMessage}
            </div>
          )}


        </section>
      </main>
    </div>
  );
}
