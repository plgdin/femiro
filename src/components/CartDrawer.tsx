import type { Dispatch, SetStateAction } from 'react'
import { ShoppingBag, X, ArrowRight } from 'lucide-react'
import type { CartItem } from '../types'
import { money } from '../data/initialData'

export function CartDrawer({
  open,
  cart,
  setCart,
  close,
  navigate
}: {
  open: boolean
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
  close: () => void
  navigate: (path: string) => void
}) {
  return (
    <>
      <div className={open ? 'drawer-backdrop show' : 'drawer-backdrop'} onClick={close} />
      <aside className={open ? 'cart-drawer open' : 'cart-drawer'}>
        <header>
          <h2>
            Your bag <sup>({cart.reduce((sum, i) => sum + i.qty, 0)})</sup>
          </h2>
          <button className="icon-button" onClick={close} aria-label="Close cart">
            <X />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="empty">
            <ShoppingBag size={36} color="var(--wine)" />
            <p>Your bag is waiting.</p>
            <button className="button dark" onClick={close}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div className="cart-item" key={`${item.product.id}-${index}`}>
                  <img src={item.product.image} alt="" />
                  <div>
                    <p>{item.product.type}</p>
                    <h3>{item.product.name}</h3>
                    <b>
                      {money(item.product.price)} (Size: {item.size}) × {item.qty}
                    </b>
                    <button onClick={() => setCart(items => items.filter((_, current) => current !== index))}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-bottom">
              <p>
                Subtotal <b>{money(cart.reduce((total, item) => total + item.product.price * item.qty, 0))}</b>
              </p>
              <button
                className="button dark"
                onClick={() => {
                  close()
                  navigate('/cart')
                }}
              >
                Go to Cart & Checkout <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
