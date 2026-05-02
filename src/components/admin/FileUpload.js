import React, { useState } from 'react';
import { storage, db } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const FileUpload = ({ bookId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { profile } = useAuth();

  const handleFileUpload = async (event, format) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Check permissions
      if (!['admin', 'librarian'].includes(profile?.role)) {
        alert('Only librarians and admins can upload files');
        return;
      }

      setUploading(true);
      setProgress(0);

      // Upload to storage
      const result = await storage.uploadBookFile(file, bookId, format);
      
      // Save to database
      await db.addBookFormat({
        book_id: bookId,
        format_type: format,
        file_url: result.url,
        file_size: file.size,
        accessibility_features: []
      });

      setProgress(100);
      onUploadComplete?.();
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Upload Book Files</h3>
      
      <div className="upload-section">
        <label>EPUB Format:</label>
        <input
          type="file"
          accept=".epub"
          onChange={(e) => handleFileUpload(e, 'epub')}
          disabled={uploading}
        />
      </div>

      <div className="upload-section">
        <label>PDF Format:</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload(e, 'pdf')}
          disabled={uploading}
        />
      </div>

      <div className="upload-section">
        <label>Audio (MP3):</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileUpload(e, 'audio')}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span>Uploading... {progress}%</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;