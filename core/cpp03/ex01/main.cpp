#include "ScavTrap.hpp"

int main()
{
    std::cout << "\n--- Creating ScavTrap Serena ---" << std::endl;
    ScavTrap serena("Serena");

    std::cout << "\n--- Testing attack() ---" << std::endl;
    serena.attack("intruder");

    std::cout << "\n--- Testing takeDamage() ---" << std::endl;
    serena.takeDamage(30);

    std::cout << "\n--- Testing beRepaired() ---" << std::endl;
    serena.beRepaired(20);

    std::cout << "\n--- Activating Gate Keeper Mode ---" << std::endl;
    serena.guardGate();

    std::cout << "\n--- Destruction Chain ---" << std::endl;

    return 0;
}

