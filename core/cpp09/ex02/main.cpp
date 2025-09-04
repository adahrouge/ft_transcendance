#include "PmergeMe.hpp"

#include <iostream>
#include <vector>
#include <deque>
#include <set>
#include <ctime>
#include <cerrno>
#include <cstdlib>



int validate_input(int argc, char** argv, std::vector<int>& input)
{
    std::set<long> seen;
    for (int i = 1; i < argc; ++i) 
    {
        errno = 0;
        char *endPtr = 0;
        long n = std::strtol(argv[i], &endPtr, 10);
        if (*endPtr || n <= 0 || errno == ERANGE) 
        {
            std::cerr << "Error: invalid input '" << argv[i] << "'\n";
            return 0;
        }
        if (!seen.insert(n).second) 
        {
            std::cerr << "Error: duplicate number '" << n << "'\n";
            return 0;
        }
        input.push_back((int)n);
    }
    return 1;
}

int main(int argc, char** argv) 
{
    if (argc < 2) 
    { 
        std::cerr << "Usage: ./pmerge <numbers...>\n"; 
        return 1; 
    }

    std::vector<int> input;
    if (!validate_input(argc, argv, input))
        return 1;

    std::deque<int> input_deque(input.begin(), input.end());

    PmergeMe pmergeme;
    std::cout << "Before: ";
    pmergeme.printVector(input);
    std::size_t vecComp = 0, dequeComp = 0;
    std::clock_t start_v = std::clock();

    pmergeme.vectorSort(input, (int*)&vecComp);

    std::clock_t end_v = std::clock();
    std::cout << "After:  ";
    pmergeme.printVector(input);
    std::clock_t start_d = std::clock();
    pmergeme.dequeSort(input_deque, (int*)&dequeComp);
    std::clock_t end_d = std::clock();
    double t_vec_us = (double)(end_v - start_v) / CLOCKS_PER_SEC * 1e6;
    double t_deq_us = (double)(end_d - start_d) / CLOCKS_PER_SEC * 1e6;
    std::cout << "Time to process " << input.size() << " elements with std::vector: " << t_vec_us << " us\n";
    std::cout << "Vector Comparisons: " << vecComp << "\n";
    std::cout << "Time to process " << input_deque.size() << " elements with std::deque: " << t_deq_us << " us\n";
    std::cout << "Deque Comparisons: " << dequeComp << "\n";
    return 0;
}