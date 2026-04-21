export default function LoadingSpinner({ label = 'Cargando...' }) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-label={label}></div>
        <div className="mt-2 text-muted">{label}</div>
      </div>
    </div>
  )
}

