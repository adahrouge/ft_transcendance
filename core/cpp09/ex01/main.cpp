#include "RPN.hpp"


int main(int argc, char **argv)
{
    if (argc != 2)
    {
        std::cerr << "Error: Only one argument is accepted" << std::endl;
        return 1;
    }
    std::string arg = argv[1];
    if (!validateArgument(arg))
        return 1;
    int tokenCount = countTokens(arg);
    std::string *tokens = splitArg(arg, tokenCount);
    int result = evaluateRPN(tokens, tokenCount);
    std::cout << result << std::endl;
    delete[] tokens;
}