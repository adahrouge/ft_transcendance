#include "Channel.hpp"
#include "Client.hpp"

Channel::Channel(const std::string &name)
: _name(name), _topic(""),
  _inviteOnly(false), _topicRestricted(false),
  _key(""), _userLimit(-1) {}

void Channel::addMember(Client *client) 
{
    _members[client->getFd()] = client;
    std::set<int>::iterator it = _invited.find(client->getFd());
    if (it != _invited.end())
        _invited.erase(it);
}

void Channel::removeMember(int fd) 
{
    _members.erase(fd);
    _operators.erase(fd);
}

bool Channel::isMember(int fd) const 
{
    return _members.find(fd) != _members.end();
}

bool Channel::isEmpty() const 
{
    return _members.empty();
}

void Channel::setTopic(const std::string &topic) 
{
    _topic = topic;
}

const std::string &Channel::getTopic() const 
{
    return _topic;
}

const std::string &Channel::getName() const 
{
    return _name;
}

void Channel::addOperator(int fd) 
{
    _operators.insert(fd);
}

void Channel::removeOperator(int fd) 
{
    std::set<int>::iterator it = _operators.find(fd);
    if (it != _operators.end())
        _operators.erase(it);
}

bool Channel::isOperator(int fd) const 
{
    return _operators.find(fd) != _operators.end();
}

const std::map<int, Client*> &Channel::getMembers() const 
{
    return _members;
}

void Channel::inviteUser(int fd) 
{
    _invited.insert(fd);
}
bool Channel::isInvited(int fd) const 
{
    return _invited.find(fd) != _invited.end();
}

void Channel::setInviteOnly(bool invite) 
{
    _inviteOnly = invite;
}

void Channel::setTopicRestricted(bool restricted) 
{
    _topicRestricted = restricted;
}

void Channel::setKey(const std::string &key) 
{
    _key = key;
}

void Channel::clearKey() 
{
    _key.clear();
}

void Channel::setUserLimit(int limit) 
{
    _userLimit = limit;
}

bool Channel::isInviteOnly() const { return _inviteOnly; }
bool Channel::isTopicRestricted() const { return _topicRestricted; }
bool Channel::hasKey() const { return !_key.empty(); }
const std::string &Channel::getKey() const { return _key; }
int Channel::getUserLimit() const { return _userLimit; }

bool Channel::isFull() const 
{
    if (_userLimit < 0) 
        return false;
    return (int)_members.size() >= _userLimit;
}
