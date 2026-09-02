import { Typography } from '@arco-design/web-react'

const { Paragraph } = Typography

// Presentational only — renders whatever a worksheet/submission record
// contains, picking the right viewer from its MIME type. A base64 data URL
// is directly openable/downloadable by the browser, so non-image/audio
// files (PDFs, etc.) just need a link, no extra server route.
export default function FilePreview({ mimeType, data, fileName, textContent }) {
  return (
    <div className="file-preview">
      {textContent && <Paragraph className="file-preview-text">{textContent}</Paragraph>}
      {data && mimeType?.startsWith('image/') && (
        <img src={data} alt={fileName || 'Uploaded file'} className="file-preview-img" />
      )}
      {data && mimeType?.startsWith('audio/') && (
        <audio controls src={data} className="file-preview-audio" />
      )}
      {data && !mimeType?.startsWith('image/') && !mimeType?.startsWith('audio/') && (
        <a href={data} download={fileName || 'file'} target="_blank" rel="noopener noreferrer" className="file-preview-link">
          Open {fileName || 'file'}
        </a>
      )}
      {!data && !textContent && <Paragraph className="file-preview-empty">Nothing uploaded yet.</Paragraph>}
    </div>
  )
}
