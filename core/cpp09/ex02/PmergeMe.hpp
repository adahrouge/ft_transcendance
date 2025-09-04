#ifndef PMERGEME_HPP
#define PMERGEME_HPP

#include <vector>
#include <deque>
#include <utility>
#include <cstddef>

class PmergeMe
{
public:
    PmergeMe();
    PmergeMe(const PmergeMe& other);
    PmergeMe& operator=(const PmergeMe& other);
    ~PmergeMe();

    void vectorSort(std::vector<int>& values, int* comparisons);
    void dequeSort(std::deque<int>& values, int* comparisons);

    void printVector(const std::vector<int>& values);
    void printDeque(const std::deque<int>& values);;
};

#endif 