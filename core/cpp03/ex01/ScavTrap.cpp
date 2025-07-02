#include "ScavTrap.hpp"

ScavTrap::ScavTrap(const std::string &name) : ClapTrap(name)
{
	std::cout << "ScavTrap default constructor called" << std::endl;
	_HitPoints = 100;
	_EnergyPoints = 50;
	_AttackDamage = 20;
}
ScavTrap::ScavTrap(const std::string &name, unsigned int hitpoints, unsigned int energypoints, unsigned int attackdamage) : ClapTrap(name, hitpoints, energypoints, attackdamage)
{
	std::cout << "ScavTrap Parameterized constructor called" << std::endl;
	_HitPoints = 100;
	_EnergyPoints = 50;
	_AttackDamage = 20;
}
ScavTrap::ScavTrap(const ScavTrap &other) : ClapTrap(other)
{
	std::cout << "ScavTrap copy constructor called" << std::endl;
	_HitPoints = 100;
	_EnergyPoints = 50;
	_AttackDamage = 20;
}
ScavTrap& ScavTrap::operator=(const ScavTrap &other)
{
	std::cout << "ScavTrap assignement operator called" << std::endl;
	if (this != &other)
	{
		_name = other._name;
		_HitPoints = other._HitPoints;
		_EnergyPoints = other._EnergyPoints;
		_AttackDamage = other._AttackDamage;
	}
	return *this;
}
ScavTrap::~ScavTrap()
{
	std::cout << "ScavTrap destructor called" << std::endl;
}
void ScavTrap::guardGate()
{
	std::cout << "ScavTrap is now in Gate Keeper mode" << std::endl;
}
void ScavTrap::attack(const std::string &target)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "energy points <= 0, cannot attack" << std::endl;
		return ;
	}
	std::cout << "Scavtrap " << _name << " attacks " << target << " causing " << _AttackDamage << " points of damage " << std::endl;
	_EnergyPoints--;
}
void ScavTrap::takeDamage(unsigned int amount)
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
	std::cout << "ScavTrap " << _name << " took " << amount << " of damage" << std::endl;
}
void ScavTrap::beRepaired(unsigned int amount)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "cannot repair, energy points <= 0" << std::endl;
		return ;
	}
	std::cout << "Scavtrap has been repaired by " << amount << " amount" << std::endl;
	_HitPoints = _HitPoints + amount;
}
