#include "RPN.hpp"
std::string* splitArg(std::string &arg, int tokenCount)
{
    std::string* tokens = new std::string[tokenCount];
    int index = 0;
    std::string token;
    for (size_t i = 0; i < arg.length(); ++i)
    {
        if (arg[i] != ' ')
        {
            token = arg[i];
            if (i == arg.length() - 1 || arg[i + 1] == ' ')
            {
                tokens[index] = token;
                index++;
                token.clear();
            }
        }
    }
    return tokens;
}

bool validateArgument(std::string &arg)
{
    if (!(std::isdigit(arg[0])))
    {
        std::cerr << "first char should be a number" << std::endl;
        return false;
    }
    if (!isValidinput(arg))
        return false;
    if (!isValidSize(arg))
        return false; 
    if (!checkSpaces(arg))
        return false;
    if (!isValidArgs(arg))
        return false;
    return true;
}
bool checkSpaces(std::string &arg)
{
    for (size_t i = 0; i < arg.length(); i++)
    {
        if (arg[i] == ' ' && arg[i + 1] == ' ')
        {
            std::cerr << "Error, consecutive spaces" << std::endl;
            return false;
        }
    }
    if (arg[arg.length() - 1] == ' ')
    {
        std::cerr << "Error, last arg cannot be a space" << std::endl;
        return false;
    }
    return true;
}
bool isValidinput(std::string &arg)
{
    for (size_t i = 0; i < arg.length(); i++)
    {
        if (!(std::isdigit(arg[i])|| arg[i] == '+' || arg[i] == ' ' || arg[i] == '-' || arg[i] == '*' || arg[i] == '/'))
        {
            std::cerr << "Wrong input" << std::endl;
            return false;
        }
    }
    return true;
}
bool isValidSize(std::string &arg)
{
    for (size_t i = 0; i < arg.length(); i++)
    {
        if (std::isdigit(arg[i]) && std::isdigit(arg[i + 1]))
        {
            std::cerr << "Error, number too big" << std::endl;
            return false;
        }
    }
    return true;
}
bool isValidArgs(std::string &arg)
{
    int numCount = 0;
    int operatorCount = 0;
    for (size_t i = 0; i < arg.length(); i++)
    {
        if (std::isdigit(arg[i]))
            numCount++;
        else if (arg[i] == '+' || arg[i] == '-' || arg[i] == '*' || arg[i] == '/')
            operatorCount++;
    }
    if (numCount != operatorCount + 1)
    {
        std::cerr << "Error, cannot do the calculation based of this argument" << std::endl;
        return false;
    }
    return true;
}
int countTokens(std::string &arg)
{
    int count = 0;
    bool inToken = false;
    for (size_t i = 0; i < arg.length(); i++)
    {
        if (arg[i] != ' ' && !inToken)
        {
            inToken = true;
            count++;
        }
        else if (arg[i] == ' ')
            inToken = false;
    }
    return count;
}

int evaluateRPN(std::string *tokens, int tokenCount)
{
    std::stack<int> st;

    for (int i = 0; i < tokenCount; ++i)
    {
        std::string token = tokens[i];

        if (token == "+" || token == "-" || token == "*" || token == "/")
        {
            if (st.size() < 2)
            {
                std::cerr << "Error: Not enough operands for operator " << token << std::endl;
                delete[] tokens;
                exit(EXIT_FAILURE);
            }
            int right = st.top(); 
            st.pop();
            int left = st.top(); 
            st.pop();
            int result = 0;

            if (token == "+")
                result = left + right;
            else if (token == "-")
                result = left - right;
            else if (token == "*")
                result = left * right;
            else if (token == "/")
            {
                if (right == 0)
                {
                    std::cerr << "Error: Division by zero" << std::endl;
                    exit(1);
                }
                result = left / right;
            }
            st.push(result);
        }
        else
        {
            int num = std::atoi(token.c_str());
            st.push(num);
        }
    }

    if (st.size() != 1)
    {
        std::cerr << "Error: Invalid expression, leftover operands." << std::endl;
        exit(1);
    }

    return st.top();
}
