type Props = {
  color?: string
  size?: number
  className?: string
}

export default function MintongLogo({ color = '#1e40af', size = 40, className = '' }: Props) {
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-black text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.round(size * 0.42),
        letterSpacing: '-0.02em',
      }}
    >
      민
    </div>
  )
}
