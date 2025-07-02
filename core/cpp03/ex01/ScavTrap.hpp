#ifndef SCAVTRAP_HPP
#define SCAVTRAP_hpp
#include "ClapTrap.hpp"
class ScavTrap : public ClapTrap
{
 public:
 	ScavTrap(const std::string &name);
	ScavTrap(const std::string &name, unsigned int hitpoints, unsigned int energypoints, unsigned int attackdamage);
	ScavTrap(const ScavTrap &other);
	ScavTrap &operator=(const ScavTrap &other);
	~ScavTrap();
	void guardGate();
	void attack(const std::string &target);
 	void takeDamage(unsigned int amount);
 	void beRepaired(unsigned int amount);
};


#endif