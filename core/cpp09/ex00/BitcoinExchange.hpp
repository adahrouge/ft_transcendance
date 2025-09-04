#ifndef BITCOINEXCHANGE_HPP
#define BITCOINEXCHANGE_HPP

#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
#include <map>
#include <algorithm>

bool readAndValidate(std::string &filename);
bool isValidDate(std::string &date);
bool isValidValue(std::string &value);
void trimSpaces(std::string &str);
bool fillMap(std::map<std::string, double> &map);
void btcExchange(std::string filename, std::map<std::string, double> &map);
void calculatePrice(std::string date, std::string value, std::map<std::string, double> &map);

#endif