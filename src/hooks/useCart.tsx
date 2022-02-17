import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const productExist = newCart.find((product) => product.id === productId);

      const amountProduct = productExist ? productExist.amount : 0;

      const response = await api.get(`stock/${productId}`);

      const amountDisponible = response.data as Stock;

      const totalAmount = amountProduct + 1;

      if (totalAmount > amountDisponible.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExist) {
        productExist.amount = totalAmount;

      } else {
        const response = await api.get(`products/${productId}`);

        const data = response.data;

        const newProduct = { ...data, amount: totalAmount };

        newCart.push(newProduct);
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      const productExist = newCart.find((product) => product.id === productId);

      if (!productExist) {
        toast.error('Erro na remoção do produto')
        return;
      }

      const products = newCart.filter((product) => product.id !== productId);

      setCart(products);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const newCart = [...cart];

      const product = newCart.find((product) => product.id === productId) as Product;

      if (!product) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const response = await api.get(`stock/${productId}`);

      const amountDisponible = response.data as Stock;

      if (amount > amountDisponible.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      product.amount = amount;

      Object.assign(newCart, {
        product,
        ...newCart,
      })

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
