#include "FragTrap.hpp"

FragTrap::FragTrap(const std::string &name) : ClapTrap(name)
{
	std::cout << "FragTrap default constructor called" << std::endl;
	_HitPoints = 100;
	_EnergyPoints = 100;
	_AttackDamage = 30;
}
FragTrap::FragTrap(const std::string &name, unsigned int hitpoints, unsigned int energypoints, unsigned int attackdamage) : ClapTrap(name, hitpoints, energypoints, attackdamage)
{
	std::cout << "FragTrap Parameterized constructor called" << std::endl;
	_HitPoints = 100;
	_EnergyPoints = 100;
	_AttackDamage = 30;
}
FragTrap::FragTrap(const FragTrap &other) : ClapTrap(other)
{
	std::cout << "FragTrap copy constructor called" << std::endl;
}
FragTrap& FragTrap::operator=(const FragTrap &other)
{
	std::cout << "FragTrap assignement operator called" << std::endl;
	if (this != &other)
	{
		_name = other._name;
		_HitPoints = other._HitPoints;
		_EnergyPoints = other._EnergyPoints;
		_AttackDamage = other._AttackDamage;
	}
	return *this;
}
FragTrap::~FragTrap()
{
	std::cout << "FragTrap destructor called" << std::endl;
}

void FragTrap::attack(const std::string &target)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "energy points <= 0, cannot attack" << std::endl;
		return ;
	}
	std::cout << "Fragtrap " << _name << " attacks " << target << " causing " << _AttackDamage << " points of damage " << std::endl;
	_EnergyPoints--;
}
void FragTrap::takeDamage(unsigned int amount)
{
	if (_HitPoints <= 0)
	{
		std::cout << "Fragtrap " << _name << " is already dead" << std::endl;
		return;
	}
	if (amount >= _HitPoints)
		_HitPoints = 0;
	else
		_HitPoints = _HitPoints - amount;
	std::cout << "FragTrap " << _name << " took " << amount << " of damage" << std::endl;
}
void FragTrap::beRepaired(unsigned int amount)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "cannot repair, energy points <= 0" << std::endl;
		return ;
	}
	std::cout << "Fragtrap has been repaired by " << amount << " amount" << std::endl;
	_HitPoints = _HitPoints + amount;
}
void FragTrap::highFivesGuys(void)
{
	std::cout << "Positive high fives request" << std::endl;
}