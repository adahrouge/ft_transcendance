#include "FragTrap.hpp"

int main()
{
    std::cout << "\n--- Creating FragTrap Bob ---" << std::endl;
    FragTrap bob("Bob");

    std::cout << "\n--- Testing attack() ---" << std::endl;
    bob.attack("EvilBot");

    std::cout << "\n--- Testing takeDamage() ---" << std::endl;
    bob.takeDamage(40);

    std::cout << "\n--- Testing beRepaired() ---" << std::endl;
    bob.beRepaired(25);

    std::cout << "\n--- Activating High Fives Mode ---" << std::endl;
    bob.highFivesGuys();

    std::cout << "\n--- End of main(), triggering destruction ---" << std::endl;

    return 0;
}

