import tkinter as tk
from tkinter import ttk

# Création de la fenêtre principale
root = tk.Tk()
root.title("Exemple de Frame")
root.geometry("400x300")  # Taille de la fenêtre : 400x300 pixels

# Création d'un cadre (Frame)
frame = ttk.Frame(
    root,
    padding="20",  # Padding interne de 20 pixels
    borderwidth=2,  # Largeur de la bordure
    relief="solid"  # Style de la bordure (solid, raised, sunken, ridge, groove)
)
frame.pack(padx=20, pady=20)  # Padding externe de 20 pixels

# Ajout de widgets dans le cadre
label = ttk.Label(frame, text="Je suis dans un cadre!")
label.pack(pady=10)

button = ttk.Button(frame, text="Bouton")
button.pack(pady=10)

# Lancement de la boucle principale
root.mainloop()