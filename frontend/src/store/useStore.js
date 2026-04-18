import { create } from 'zustand';

export const useStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, cart: [], shopId: null });
    },
    
    // Cart is specific to a single shop in hyperlocal delivery usually
    cart: [],
    shopId: null,
    addToCart: (product, shopId) => set((state) => {
        if (state.shopId && state.shopId !== shopId) {
            // If trying to add from a different shop, clear cart or block. Let's clear for simplicity.
            return { cart: [{ ...product, quantity: 1 }], shopId };
        }
        
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
            return {
                cart: state.cart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                ),
                shopId
            };
        } else {
            return {
                cart: [...state.cart, { ...product, quantity: 1 }],
                shopId
            };
        }
    }),
    removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
    })),
    clearCart: () => set({ cart: [], shopId: null })
}));
