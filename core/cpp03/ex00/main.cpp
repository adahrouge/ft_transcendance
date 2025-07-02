#include "ClapTrap.hpp"


int main()
{
    ClapTrap mark("Mark");
    ClapTrap john("John");
	
    mark.attack("John");
    john.takeDamage(5);
    john.beRepaired(3);
    mark.beRepaired(5);

    john.takeDamage(100);

    john.attack("Mark");

    john.beRepaired(5);


    return 0;
}
