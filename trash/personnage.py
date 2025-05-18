class Personnage:
    def __init__(self, nom="Omar", vie=100, force=50, endurance=200, rapidite=100, intelligence=100):
        self.nom = nom
        self.vie = vie
        self.force = force
        self.endurance = endurance
        self.rapidite = rapidite
        self.intelligence = intelligence
   
    def estMort(self):
        # Retourne un booléen au lieu d'imprimer "true"/"false"
        return self.vie <= 0

    def afficheEtat(self):
        if not self.estMort():
            print(f"Il reste {self.vie} points de vie à {self.nom}")
        else:
            print(f"{self.nom} est mort !")  

    def afficheCaracteristiques(self):
        # Utilise les attributs de l'instance au lieu des paramètres
        print(f"{self.nom} a une force de {self.force}, une endurance de {self.endurance}, "
              f"une rapidité de {self.rapidite}, une intelligence de {self.intelligence}")   

    def perdVie(self, nbPointsDeViePerdus):
        if nbPointsDeViePerdus >= self.vie:
            self.vie = 0
            print(f"{self.nom} a subi une attaque mortelle !!")  
        else:
            self.vie -= nbPointsDeViePerdus
            print(f"{self.nom} subit une attaque, il perd {nbPointsDeViePerdus} points de vie !")   

    def gagneVie(self, nbPointVieGagne):
        if not self.estMort():
            self.vie += nbPointVieGagne
            print(f"{self.nom} a été soigné. Ses points de vie valent maintenant {self.vie}") 
        else:
            print(f"{self.nom} ne peut pas être soigné car il est mort!")    

    def attaque(self, cible):
        if self.estMort():
            print(f"{self.nom} ne peut attaquer personne : il est mort !!")
            return
            
        degats = int(0.6 * self.force)
        if not cible.estMort():
            cible.perdVie(degats)
            print(f"{self.nom} inflige {degats} points de dégâts à {cible.nom}!")
        else:
            print(f"{cible.nom} est déjà mort !")

    def soigne(self, cible, pointsDeSoins):
        if self.estMort():
            print(f"{self.nom} ne peut pas soigner : il est mort !")
            return
            
        if cible.estMort():
            print(f"{cible.nom} ne peut pas être soigné : il est mort !")
            return
            
        cible.gagneVie(pointsDeSoins)
        print(f"{self.nom} soigne {cible.nom} et lui restaure {pointsDeSoins} points de vie")

    def esquiveAttaque(self, attaquant):
        if self.estMort():
            print(f"{self.nom} ne peut pas esquiver : il est mort !")
            return
            
        if attaquant.estMort():
            print(f"{attaquant.nom} ne peut pas attaquer : il est mort !")
            return
            
        if self.rapidite * 1.2 > attaquant.force:
            print(f"{self.nom} esquive l'attaque de {attaquant.nom} ! "
                  f"(Rapidité de {self.nom}: {self.rapidite * 1.2} VS Force de {attaquant.nom}: {attaquant.force})")
        else:
            print(f"{self.nom} ne parvient pas à esquiver l'attaque de {attaquant.nom}")

# Exemple d'utilisation
if __name__ == "__main__":
    hero = Personnage("Naruto")
    sasuke = Personnage("Sasuke", force=60)
    
    # Test des méthodes
    hero.afficheEtat()
    hero.afficheCaracteristiques()
    hero.attaque(sasuke)
    sasuke.esquiveAttaque(hero)
    hero.soigne(sasuke, 30)