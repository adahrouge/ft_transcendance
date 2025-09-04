#ifndef RPN_HPP
#define RPN_HPP

#include <string>
#include <iostream>
#include <stack>
#include <algorithm>
#include <cstdlib>
bool validateArgument(std::string &arg);
std::string *splitArg(std::string &arg, int tokenCount);
bool checkSpaces(std::string &arg);
bool isValidinput(std::string &arg);
bool isValidSize(std::string &arg);
bool isValidArgs(std::string &arg);
int countTokens(std::string &arg);
int evaluateRPN(std::string *tokens, int tokenCount);


#endif