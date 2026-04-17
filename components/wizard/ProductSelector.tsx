'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Product } from '@/types'

type Props = {
  selectedProductId: string | null
  onSelect: (product: Product) => void
  onCreateNew: () => void
}

export default function ProductSelector({ selectedProductId, onSelect, onCreateNew }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setProducts((data as Product[]) || [])
      setLoading(false)
    }
    loadProducts()
  }, [supabase])

  const categoryIcon: Record<string, string> = { fisico: '📦', digital: '💻', servicio: '⚡' }
  const platformLabel: Record<string, string> = { hotmart: 'Hotmart', shopify: 'Shopify', mercadolibre: 'MercadoLibre', otro: 'Otro' }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">Seleccioná un producto</h3>
          <p className="text-white/40 text-xs mt-0.5">Elegí el producto para el que querés generar creativos</p>
        </div>
        <button onClick={onCreateNew} className="btn-primary text-xs px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-16 rounded-lg shimmer" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="3" stroke="#444" strokeWidth="1.5"/>
              <path d="M6 10h8M10 6v8" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white/50 text-sm font-medium">Sin productos aún</p>
            <p className="text-white/25 text-xs mt-1">Creá tu primer producto para comenzar</p>
          </div>
          <button onClick={onCreateNew} className="btn-primary text-sm px-4 py-2 mt-2">
            Crear producto
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products.map(product => (
            <button key={product.id} onClick={() => onSelect(product)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                selectedProductId === product.id
                  ? 'card-selected'
                  : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
              }`}>
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                {product.image_url
                  ? <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  : <span>{categoryIcon[product.category] || '📦'}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium truncate">{product.name}</p>
                  {product.platform && (
                    <span className="tag tag-gray text-[10px] flex-shrink-0">{platformLabel[product.platform]}</span>
                  )}
                </div>
                <p className="text-white/40 text-xs truncate mt-0.5">{product.description}</p>
              </div>
              {selectedProductId === product.id && (
                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
