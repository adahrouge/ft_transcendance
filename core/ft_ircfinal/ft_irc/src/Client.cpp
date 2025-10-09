#include "Client.hpp"
#include <iostream>

Client::Client(int clientFd)
: _fd(clientFd),
  _inbuf(""),
  _outq(),
  _nickname(""),
  _username(""),
  _realname(""),
  _passed(false),
  _hasNickname(false),
  _hasUsername(false),
  _registered(false)
{
    std::cout << "Client created fd=" << _fd << std::endl;
}

Client::~Client() 
{
    std::cout << "Client destroyed fd=" << _fd << std::endl;
}

void Client::appendToInbuf(const char *data, size_t length) 
{
    _inbuf.append(data, length);
    if (_inbuf.size() > 8192) 
        _inbuf.erase(0, _inbuf.size() - 8192); //to remove potential garbage value LOL
}

std::string Client::popNextCommand() 
{
    std::string::size_type pos = _inbuf.find("\r\n");
    bool hadCRLF = true;
    if (pos == std::string::npos) 
    {
        pos = _inbuf.find('\n');
        hadCRLF = false;
        if (pos == std::string::npos) 
            return "";
    }
    size_t endlen;
    if (hadCRLF) 
        endlen = 2;
    else 
        endlen = 1;
    std::string line = _inbuf.substr(0, pos + endlen);
    _inbuf.erase(0, pos + endlen);
    // strip CRLF / LF
    if (line.size() >= 2 && line.substr(line.size() -2) == "\r\n")
        line = line.substr(0, line.size() -2);
    else if (!line.empty() && line[line.size() -1] == '\n')
        line = line.substr(0, line.size() -1);
    return line;
}

bool Client::hasPendingWrite() const 
{
    return !_outq.empty();
}

const std::string &Client::frontWrite() const 
{
    return _outq.front();
}

void Client::popFrontWrite() 
{
    if (!_outq.empty())
        _outq.pop_front();
}

void Client::queueWrite(const std::string &msg) 
{
    _outq.push_back(msg);
}

int Client::getFd() const { return _fd; }

void Client::setNickname(const std::string &nickname) 
{
    _nickname = nickname;
    _hasNickname = true;
}

void Client::setUsername(const std::string &username, const std::string &realname) 
{
    _username = username;
    _realname = realname;
    _hasUsername = true;
}
