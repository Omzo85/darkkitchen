import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte du panier
const CartContext = createContext();

// Fournisseur du panier qui gère l'état du panier d'achat
export function CartProvider({ children }) {
  // État pour stocker les articles du panier
  const [cartItems, setCartItems] = useState(() => {
    // Récupération des articles du panier depuis le localStorage au chargement
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sauvegarde du panier dans le localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fonction pour ajouter un article au panier
  const addToCart = (dish) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === dish.id);
      if (existingItem) {
        // Si l'article existe déjà, augmenter la quantité
        return prevItems.map(item =>
          item.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Sinon, ajouter le nouvel article
      return [...prevItems, { ...dish, quantity: 1 }];
    });
  };

  // Fonction pour retirer un article du panier
  const removeFromCart = (dishId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== dishId));
  };

  // Fonction pour mettre à jour la quantité d'un article
  const updateQuantity = (dishId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(dishId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === dishId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Fonction pour calculer le total du panier
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Fonction pour obtenir le nombre total d'articles dans le panier
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Fonction pour vider le panier
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // Fournit le contexte à tous les composants enfants
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      getCartCount,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte du panier
export function useCart() {
  return useContext(CartContext);
}