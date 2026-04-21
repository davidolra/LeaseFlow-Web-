export default function AlertBanner({ variant = 'info', title, message, onClose }) {
  if (!message) return null
  return (
    <div className={`alert alert-${variant} ${onClose ? 'alert-dismissible' : ''}`} role="alert">
      {title ? <div className="fw-semibold mb-1">{title}</div> : null}
      <div>{message}</div>
      {onClose ? (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      ) : null}
    </div>
  )
}

