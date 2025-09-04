#include "BitcoinExchange.hpp"

int main(int argc, char **argv)
{
	if (argc != 2)
	{
		std::cerr << "Wrong arguments" << std::endl;
		return 1;
	}
	std::string filename = argv[1];
	if (!readAndValidate(filename))
	return 1;
	std::map<std::string, double> map;
	if (!fillMap(map))
		return 1;
	btcExchange(filename, map);

}
