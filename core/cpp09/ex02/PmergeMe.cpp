#include "PmergeMe.hpp"

#include <algorithm>
#include <iostream>
#include <iterator>
#include <cstdio>
#include <cstdlib>



int jacobsthalNumber(int n)
{
    if (n == 0)
        return 0;
    if (n == 1)
        return 1;

    int prevPrev = 0;
    int prev = 1;
    int current = 0;

    for (int i = 2; i <= n; ++i)
    {
        current = prev + 2 * prevPrev;
        prevPrev = prev;
        prev = current;
    }
    return current;
}


std::vector<int> priorityInsertionLosers(int losersToBeAdded)
{
    std::vector<int> priorityInsertionOrder;
    int positionInSequence = 3; // we're starting with 3 because 0 1 1 are useless for our sorting purpose
    while (true) 
    {
        int value = jacobsthalNumber(positionInSequence);
        if (value > losersToBeAdded)
            break;
        priorityInsertionOrder.push_back(value);
        ++positionInSequence;
    }
    return priorityInsertionOrder;
}

std::deque<int> priorityInsertionLosersDeq(int losersToBeAdded)
{
    std::deque<int> priorityInsertionOrder;
    int positionInSequence = 3;
    while (true)
    {
        int value = jacobsthalNumber(positionInSequence);
        if (value > losersToBeAdded)
            break;
        priorityInsertionOrder.push_back(value);
        ++positionInSequence;
    }
    return priorityInsertionOrder;
}

void scheduleRemainingLosers(std::vector<int>& loserInsertionPriority, std::vector<int> losers)
{
    std::vector<int> seenNumbers;
    std::vector<int> finalOrder;
    for (std::vector<int>::iterator it = loserInsertionPriority.begin(); it != loserInsertionPriority.end(); ++it) 
    {
        if (*it < 0) 
            continue;
        int x = *it;
        while (x > 1)
        {
            if (std::find(seenNumbers.begin(), seenNumbers.end(), x) == seenNumbers.end()) 
            {
                finalOrder.push_back(x - 1);
                seenNumbers.push_back(x);
            } 
            else 
                break;
            --x;
        }
    }
    if (finalOrder.size() == losers.size()) 
        loserInsertionPriority = finalOrder;
    else
    {
        int backfill = (int)losers.size();
        while (finalOrder.size() < losers.size())
        {
            if (std::find(seenNumbers.begin(), seenNumbers.end(), backfill) == seenNumbers.end())
            {
                finalOrder.push_back(backfill - 1);
                seenNumbers.push_back(backfill);
            } 
            else
                break;
            --backfill;
        }
        loserInsertionPriority = finalOrder;
    }
}

void scheduleRemainingLosersDeq(std::deque<int>& priorityInsertionOrder, std::deque<int> losers)
{
    std::deque<int> seenNumbers;
    std::deque<int> finalOrder;
    for (std::deque<int>::iterator it = priorityInsertionOrder.begin(); it != priorityInsertionOrder.end(); ++it) 
    {
        if (*it < 0) 
            continue;
        int x = *it;
        while (x > 1)
        {
            if (std::find(seenNumbers.begin(), seenNumbers.end(), x) == seenNumbers.end())
            {
                finalOrder.push_back(x - 1);
                seenNumbers.push_back(x);
            } 
            else 
                break;
            --x;
        }
    }
    if (finalOrder.size() == losers.size())
        priorityInsertionOrder = finalOrder;
    else 
    {
        int backfill = (int)losers.size();
        while (finalOrder.size() < losers.size())
        {
            if (std::find(seenNumbers.begin(), seenNumbers.end(), backfill) == seenNumbers.end()) {
                finalOrder.push_back(backfill - 1);
                seenNumbers.push_back(backfill);
            }
            else
                break;
            --backfill;
        }
        priorityInsertionOrder = finalOrder;
    }
}
int binarySearchVec(const std::vector<int>& mainChain, int key, int upperBound, int* comparisons)
{
    if (mainChain.empty()) 
        return 0;
    int lowerBound = 0;
    if (upperBound >= (int)mainChain.size())
        upperBound = (int)mainChain.size() - 1;
    while (lowerBound <= upperBound) 
    {
        int mid = (lowerBound + upperBound) / 2;
        ++(*comparisons);
        if (mainChain[mid] == key) 
            return mid;
        else if (mainChain[mid] > key)
            upperBound = mid - 1;
        else lowerBound = mid + 1;
    }
    return lowerBound;
}

int binarySearchDeque(const std::deque<int>& mainChain, int key, int upperBound, int* comparisons)
{
    if (mainChain.empty()) 
        return 0;
    int lowerBound = 0;
    if (upperBound >= (int)mainChain.size())
        upperBound = (int)mainChain.size() - 1;
    while (lowerBound <= upperBound)
    {
        int mid = (lowerBound + upperBound) / 2;
        ++(*comparisons);
        if (mainChain[mid] == key) 
            return mid;
        else if (mainChain[mid] > key)
            upperBound = mid - 1;
        else lowerBound = mid + 1;
    }
    return lowerBound;
}
 
int getIndexVec(std::vector<int>& array, int value)
{
    if (value == -1)
        return (int)array.size();
    std::vector<int>::iterator it = std::find(array.begin(), array.end(), value);
    if (it != array.end())
        return (int)std::distance(array.begin(), it);
    else
        return -1;
}

int getIndexDeque(std::deque<int>& array, int value)
{
    if (value == -1)
        return (int)array.size();
    std::deque<int>::iterator it = std::find(array.begin(), array.end(), value);
    if (it != array.end())
        return (int)std::distance(array.begin(), it);
    else
        return -1;
}

int findPair(const std::vector<std::pair<int,int> >& pairs, int loserValue)
{
    for (std::vector<std::pair<int,int> >::const_iterator it = pairs.begin(); it != pairs.end(); ++it)
        if (it->second == loserValue) 
            return it->first;
    return -1;
}

int findPairDeq(const std::deque<std::pair<int,int> >& pairs, int loserValue)
{
    for (std::deque<std::pair<int,int> >::const_iterator it = pairs.begin(); it != pairs.end(); ++it)
        if (it->second == loserValue)
            return it->first;
    return -1;
}

int FindLoserOfWinner(const std::vector<std::pair<int,int> >& pairs, int winnerValue)
{
    for (std::vector<std::pair<int,int> >::const_iterator it = pairs.begin(); it != pairs.end(); ++it)
        if (it->first == winnerValue)
            return it->second;
    return -1;
}

int FindLoserOfWinnerDeq(const std::deque<std::pair<int,int> >& pairs, int winnerValue)
{
    for (std::deque<std::pair<int,int> >::const_iterator it = pairs.begin(); it != pairs.end(); ++it)
        if (it->first == winnerValue)
            return it->second;
    return -1;
}

std::vector<int> arrangeLosersIndex(std::vector<std::pair<int,int> > mainChain, std::vector<int> losersChain, std::vector<int> winnersSorted, int oddValue)
{
    std::vector<int> losersReordered;
    for (std::vector<int>::iterator it = winnersSorted.begin(); it != winnersSorted.end(); ++it)
    {
        int winner = *it;
        int pairedLoser = FindLoserOfWinner(mainChain, winner);
        losersReordered.push_back(pairedLoser);
    }
    if (oddValue != -1) 
        losersReordered.push_back(oddValue);
    losersChain.swap(losersReordered);
    return losersChain;
}
//arrange losers and put them in the same index as their pairs in the winners. if the initial pair was 50,10. if 50 is index 0 in the winners, 10 should be index 0 in the losers

std::deque<int> arrangeLosersIndexDeq(std::deque<std::pair<int,int> > mainPairs, std::deque<int> losersInput, std::deque<int> winnersSorted, int oddValue)
{
    std::deque<int> losersReordered;
    for (std::deque<int>::iterator it = winnersSorted.begin(); it != winnersSorted.end(); ++it)
    {
        int winner = *it;
        int pairedLoser = FindLoserOfWinnerDeq(mainPairs, winner);
        losersReordered.push_back(pairedLoser);
    }
    if (oddValue != -1) 
        losersReordered.push_back(oddValue);
    losersInput.swap(losersReordered);
    return losersInput;
}
 


PmergeMe::PmergeMe() {}
PmergeMe::PmergeMe(const PmergeMe& other) { (void)other; }
PmergeMe& PmergeMe::operator=(const PmergeMe& other) { if (this != &other) { (void)other; } return *this; }
PmergeMe::~PmergeMe() {}

void PmergeMe::printVector(const std::vector<int>& values)
{
    for (std::size_t i = 0; i < values.size(); ++i) 
    {
        std::cout << values[i];
        if (i + 1 < values.size()) 
            std::cout << " ";
    }
    std::cout << std::endl;
}

void PmergeMe::printDeque(const std::deque<int>& values)
{
    for (std::size_t i = 0; i < values.size(); ++i)
    {
        std::cout << values[i];
        if (i + 1 < values.size())
            std::cout << " ";
    }
    std::cout << std::endl;
}


void PmergeMe::vectorSort(std::vector<int>& values, int* comparisons)
{
    if (values.size() <= 1) 
        return;

    std::vector<std::pair<int,int> > pairs;
    std::vector<int> winners;
    std::vector<int> losers;
    int oddValue = -1;

    for (std::size_t i = 0; i < values.size(); i += 2) 
    {
        if (i + 1 < values.size()) 
        {
            ++(*comparisons);
            if (values[i] > values[i + 1])
                std::swap(values[i], values[i + 1]);
            pairs.push_back(std::make_pair(values[i + 1], values[i]));
        } 
        else
            oddValue = values[i];
    }

    for (std::size_t i = 0; i < pairs.size(); ++i) 
    {
        winners.push_back(pairs[i].first);
        losers.push_back(pairs[i].second);
    }
    if (oddValue != -1)
        losers.push_back(oddValue);

    vectorSort(winners, comparisons);
    losers = arrangeLosersIndex(pairs, losers, winners, oddValue); // align losers according to the position of their pair in the winners

    std::vector<int> loserInsertionPriority = priorityInsertionLosers((int)losers.size()); //priority order for insertion to reduce the number of comparisons, if insertionOrder = {3,5} take losers[3] and sort it first. then take losers[5] and sort it.
    scheduleRemainingLosers(loserInsertionPriority, losers);
    if (loserInsertionPriority.size() > 1)
    { // pre-insert first loser
        winners.insert(winners.begin(), losers[0]);
        losers[0] = -1;
    }

    for (std::vector<int>::iterator it = loserInsertionPriority.begin(); it != loserInsertionPriority.end(); ++it)
    {
        int loserIndex = *it;
        if (loserIndex < 0 || (std::size_t)loserIndex >= losers.size())
            continue;
        int loserValue = losers[loserIndex];
        if (loserValue == -1) 
            continue;

        int partnerWinner = findPair(pairs, loserValue);
        int upperBound = getIndexVec(winners, partnerWinner) - 1; // we start searching here because we know the losers is smaller than his paired winner

        std::vector<int>::iterator insertPos = winners.begin() + binarySearchVec(winners, loserValue, upperBound, comparisons);
        winners.insert(insertPos, loserValue);
    }
    values.swap(winners);
}

void PmergeMe::dequeSort(std::deque<int>& values, int* comparisons)
{
    if (values.size() <= 1)
        return;

    std::deque<std::pair<int,int> > pairs;
    std::deque<int> winners, losers;
    int oddValue = -1;

    for (std::size_t i = 0; i < values.size(); i += 2)
    {
        if (i + 1 < values.size())
        {
            ++(*comparisons);
            if (values[i] > values[i + 1]) std::swap(values[i], values[i + 1]);
            pairs.push_back(std::make_pair(values[i + 1], values[i]));
        } 
        else 
            oddValue = values[i];
    }

    for (std::size_t i = 0; i < pairs.size(); ++i)
    {
        winners.push_back(pairs[i].first);
        losers.push_back(pairs[i].second);
    }
    if (oddValue != -1) 
        losers.push_back(oddValue);

    dequeSort(winners, comparisons);
    losers = arrangeLosersIndexDeq(pairs, losers, winners, oddValue);

    std::deque<int> insertionOrder = priorityInsertionLosersDeq((int)losers.size());
    scheduleRemainingLosersDeq(insertionOrder, losers);

    if (insertionOrder.size() > 1)
    {
        winners.insert(winners.begin(), losers[0]);
        losers[0] = -1;
    }

    for (std::deque<int>::iterator it = insertionOrder.begin(); it != insertionOrder.end(); ++it)
    {
        int loserIndex = *it;
        if (loserIndex < 0 || (std::size_t)loserIndex >= losers.size())
            continue;
        int loserValue = losers[loserIndex];
        if (loserValue == -1)
            continue;

        int partnerWinner = findPairDeq(pairs, loserValue);
        int upperBound = getIndexDeque(winners, partnerWinner) - 1;

        std::deque<int>::iterator insertPos = winners.begin() + binarySearchDeque(winners, loserValue, upperBound, comparisons);
        winners.insert(insertPos, loserValue);
    }
    values.swap(winners);
}
