#include "ClapTrap.hpp"

ClapTrap::ClapTrap(const std::string &name) : _name(name), _HitPoints(10) , _EnergyPoints(10), _AttackDamage(0)
{
	std::cout << "Default constructor called" << std::endl;
}
ClapTrap::ClapTrap(const std::string &name, int HitPoints, int EnergyPoints, int AttackDamage) : _name(name), _HitPoints(HitPoints), _EnergyPoints(EnergyPoints), _AttackDamage(AttackDamage)
{
	std::cout << "Parameterized constructor Called " << std::endl;
}
ClapTrap::ClapTrap(const ClapTrap &other) : _name(other._name), _HitPoints(other._HitPoints), _EnergyPoints(other._EnergyPoints), _AttackDamage(other._AttackDamage)
{
	std::cout << "Copy constructor called" << std::endl;
}
ClapTrap& ClapTrap::operator=(const ClapTrap &other)
{
	std::cout << "Copy assignement operator called" << std::endl;
	if (this != &other)
	{
		_name = other._name;
		_HitPoints = other._HitPoints;
		_EnergyPoints = other._EnergyPoints;
		_AttackDamage = other._AttackDamage;
	}
	return *this;
}
ClapTrap::~ClapTrap()
{
	std::cout << "Destructor Called" << std::endl;
}
void ClapTrap::attack(const std::string &target)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "energy points <= 0, cannot attack" << std::endl;
		return ;
	}
	std::cout << "Claptrap " << _name << " attacks " << target << " causing " << _AttackDamage << " points of damage " << std::endl;
	_EnergyPoints--;
}
void ClapTrap::takeDamage(unsigned int amount)
{
	if (_HitPoints <= 0)
	{
		std::cout << "Claptrap " << _name << " is already dead" << std::endl;
		return;
	}
	if (amount >= _HitPoints)
		_HitPoints = 0;
	else
		_HitPoints = _HitPoints - amount;
	std::cout << "ClapTrap " << _name << " took " << amount << " of damage" << std::endl;
}
void ClapTrap::beRepaired(unsigned int amount)
{
	if (_EnergyPoints <= 0)
	{
		std::cout << "cannot repair, energy points <= 0" << std::endl;
		return ;
	}
	std::cout << "Claptrap has been repaired by " << amount << " amount" << std::endl;
	_HitPoints = _HitPoints + amount;
}