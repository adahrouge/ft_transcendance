#include "BitcoinExchange.hpp"

bool readAndValidate(std::string &filename)
{
	std::ifstream file(filename.c_str());
	if (!file.is_open())
		std::cerr << "Error, could not open file" << std::endl;
	std::string line;
	std::getline(file, line);
	while (std::getline(file, line))
	{
		size_t pos = line.find('|');
		if (pos == std::string::npos)
		{
			std::cerr << "Wrong format in map" << std::endl;
			return false;
		}
		std::string date = line.substr(0, pos);
		std::string value = line.substr(pos + 1);
		if (!(isValidDate(date)) || !(isValidValue(value)))
			return false;
	}
	file.close();
	return true;
}
void trimSpaces(std::string &str)
{
	for (size_t i = 0; i < str.length();)
	{
		if (str[i] == ' ')
			str.erase(i, 1);
		else
			i++;
	}
}
bool isValidDate(std::string &date)
{
	trimSpaces(date);
	if (date.length() != 10)
	{
		std::cerr << "Date must be exactly 10 chars long" << std::endl;
		return false;
	}
	if (date[4] != '-' || date[7] != '-')
	{
		std::cerr << "Wrong format in date, should have '-'" << std::endl;
		return false;
	}
	for (size_t i = 0; i < date.length(); i++)
	{
		if (i == 4 || i == 7)
			continue;
		if (!(std::isdigit(date[i])))
		{
			std::cerr << "Date must be digits between 0 and 9" << std::endl;
			return false;
		}
	}
	// int year = std::atoi(date.substr(0, 4).c_str());
	int month = std::atoi(date.substr(5, 2).c_str());
	int day = std::atoi(date.substr(8, 2).c_str());
	if ((month < 1 || month > 12) || (day <= 0 || day > 31))
	{
		std::cerr << "Error in the date" << std::endl;
		return false;
	}
	return true;
}
bool isValidValue(std::string &value)
{
	int dotCount = 0;
	trimSpaces(value);
	if (value.empty())
	{
		std::cerr << "value is empty" << std::endl;
		return false;
	}
	for (size_t i = 0; i < value.length(); i++)
	{
		if (value[i] == '.')
		{
			dotCount++;
			if (dotCount > 1)
			{
				std::cerr << "value has more than one dot" << std::endl;
				return false;
			}
		}
		else if (!(std::isdigit(value[i])))
		{
			std::cerr << "value is not a digit" << std::endl;
			return false;
		}
	}
	double num = std::atof(value.c_str());
	if (num < 0.0 || num > 1000000)
	{
		std::cerr << "Error: issue with the number: " << num << std::endl;
		return false;
	}
	return true;
}
bool fillMap(std::map<std::string, double> &map)
{
	std::ifstream file("data.csv");
	if (!file.is_open())
	{
		return false;
	}
	std::string line;
	std::getline(file, line);
	while (std::getline(file, line))
	{
		size_t pos = line.find(',');
		if (pos == std::string::npos)
		{
			std::cerr << "problem with .csv file" << std::endl;
			return false;
		}
		std::string date = line.substr(0, pos);
		std::string value = line.substr(pos + 1);
		if (!(isValidDate(date)) || !(isValidValue(value)))
			return false;
		double val = std::atof(value.c_str());
		map[date] = val;
	}
	file.close();
	return true;
}
void btcExchange(std::string filename, std::map<std::string, double> &map)
{
	std::ifstream file(filename.c_str());
	if (!file.is_open())
		std::cerr << "Error, could not open file" << std::endl;
	std::string line;
	std::getline(file, line);
	while (std::getline(file, line))
	{
		trimSpaces(line);
		size_t delim_pos = line.find('|');
		if (delim_pos == std::string::npos)
		{
			std::cerr << "problem with format, but should be checked earlier lol" << std::endl;
			return ;
		}
		std::string date = line.substr(0, delim_pos);
		std::string value = line.substr(delim_pos + 1);
		calculatePrice(date, value, map);
	}
}
void calculatePrice(std::string date, std::string value, std::map<std::string, double> &map)
{

	double inputValue = std::atof(value.c_str());
	std::map<std::string, double>::iterator it = map.lower_bound(date);
	if (it == map.end())
		it = --map.end();
	else if (it->first != date)
	{
		if (it == map.begin()) // first element...
		{
			std::cerr << "No earlier date found for " << date << std::endl;
			return;
		}
		--it;
	}
	double btcPrice = it->second;
	double result = inputValue * btcPrice;
	std::cout << date << " => " << inputValue << " * " << btcPrice << " = " << result << std::endl;
}