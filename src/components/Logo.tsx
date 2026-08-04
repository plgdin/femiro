export function Logo() {
  return (
    <div className="brand-logo-container">
      <img
        src="/Untitled design.png"
        alt="Femiro Logo"
        className="brand-logo-img"
        onError={e => {
          ;(e.target as HTMLImageElement).src = '/logo.svg'
        }}
      />
    </div>
  )
}
