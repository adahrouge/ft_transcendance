#ifndef CLAPTRAP_HPP
#define CLAPTRAP_HPP
#include <iostream>
#include <string>

class ClapTrap
{
 protected:
	std::string _name;
	unsigned int _HitPoints;
	unsigned int _EnergyPoints;
	unsigned int _AttackDamage;
 public:
 ClapTrap(const std::string &name);
 ClapTrap(const std::string &name, int HitPoints, int EnergyPoints, int AttackDamage);
 ClapTrap(const ClapTrap &other);
 ClapTrap &operator=(const ClapTrap &other);
 ~ClapTrap();
 void attack(const std::string &target);
 void takeDamage(unsigned int amount);
 void beRepaired(unsigned int amount);
};






#endif