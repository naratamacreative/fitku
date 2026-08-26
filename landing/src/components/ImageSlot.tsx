import type { AssetDef } from '../types'

interface ImageSlotProps {
  asset: AssetDef | undefined
  tall?: boolean
}

/**
 * Renders the real image once its asset is marked "ready" in asset-manifest.json.
 * Until then, shows a labeled placeholder describing exactly what photo is needed,
 * so the spec doubles as a shot list for whoever produces the final assets.
 */
export function ImageSlot({ asset, tall }: ImageSlotProps) {
  if (!asset) return null

  if (asset.status === 'ready') {
    return (
      <div className={`lp-photo-slot${tall ? ' lp-tall' : ''}`}>
        <img src={asset.finalPath} alt={asset.altText} />
      </div>
    )
  }

  return (
    <div className={`lp-photo-slot${tall ? ' lp-tall' : ''}`}>
      <div className="lp-cam">📷</div>
      <div className="lp-cap">{asset.description}</div>
    </div>
  )
}
