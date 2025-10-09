#ifndef CHANNEL_HPP
#define CHANNEL_HPP

#include <string>
#include <set>
#include <map>
#include <errno.h>

class Client;

class Channel 
{
  private:
    std::string _name;
    std::string _topic;

    std::map<int, Client*> _members;   // fd -> client
    std::set<int> _operators;          // fds with op status

    // Modes / state
    bool _inviteOnly;                  // +i
    bool _topicRestricted;             // +t
    std::string _key;                  // +k (empty => no key)
    int _userLimit;                    // +l (-1 => unlimited)

    std::set<int> _invited;            // fds invited (for +i)

  public:
    Channel(const std::string &name);

    // Membership
    void addMember(Client *client);
    void removeMember(int fd);
    bool isMember(int fd) const;
    bool isEmpty() const;

    // Topic
    void setTopic(const std::string &topic);
    const std::string &getTopic() const;

    // Identity
    const std::string &getName() const;

    // Operators
    void addOperator(int fd);
    void removeOperator(int fd);
    bool isOperator(int fd) const;

    // Accessors
    const std::map<int, Client*> &getMembers() const;

    // Invite list
    void inviteUser(int fd);
    bool isInvited(int fd) const;

    // Modes setters
    void setInviteOnly(bool invite);
    void setTopicRestricted(bool restricted);
    void setKey(const std::string &key); // set or clear (empty clears)
    void clearKey();
    void setUserLimit(int limit); // -1 clears

    // Modes getters
    bool isInviteOnly() const;
    bool isTopicRestricted() const;
    bool hasKey() const;
    const std::string &getKey() const;
    int getUserLimit() const;
    bool isFull() const;
};

#endif
