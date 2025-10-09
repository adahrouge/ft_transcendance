#ifndef CLIENT_HPP
#define CLIENT_HPP

#include <string>
#include <deque>

class Client 
{
  private:
    int _fd;

    // I/O buffers
    std::string _inbuf;               // accumulate until CRLF
    std::deque<std::string> _outq;    // queued writes

    // Identity / auth
    std::string _nickname;
    std::string _username;
    std::string _realname;

    bool _passed;
    bool _hasNickname;
    bool _hasUsername;
    bool _registered;                 // after PASS+NICK+USER

  public:
    Client(int clientFd);
    ~Client();

    // I/O buffering
    void appendToInbuf(const char *data, size_t length);
    std::string popNextCommand();     // returns one line (without CRLF), or ""
    bool hasPendingWrite() const;
    const std::string &frontWrite() const;
    void popFrontWrite();
    void queueWrite(const std::string &msg);

    // Fd
    int getFd() const;

    // Auth & identity
    void markPassed() { _passed = true; }
    bool hasPassed() const { return _passed; }

    void setNickname(const std::string &nickname);
    void setUsername(const std::string &username, const std::string &realname);
    const std::string &getNickname() const { return _nickname; }
    const std::string &getUsername() const { return _username; }
    const std::string &getRealname() const { return _realname; }

    bool hasNick() const { return _hasNickname; }
    bool hasUser() const { return _hasUsername; }

    bool isRegistered() const { return _registered; }
    void setRegistered(bool v) { _registered = v; }
};

#endif
