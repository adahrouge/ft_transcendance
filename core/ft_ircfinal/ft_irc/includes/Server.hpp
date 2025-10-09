#ifndef SERVER_HPP
#define SERVER_HPP

#include <string>
#include <vector>
#include <map>
#include <set>
#include <poll.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <fcntl.h>
#include <cstring>
#include <cstdlib>
#include <iostream>
#include <sstream>

#include "Channel.hpp"
#include "Client.hpp"

class Server 
{
  public:
    Server(int port, const std::string &password);
    ~Server();

    void run();
    void stop();

  private:
    int _port;
    std::string _password;

    int _serverFd;
    bool _running;

    std::vector<pollfd> _pollFds;             // 0 = listen, rest = clients
    std::map<int, Client*> _clients;          // fd -> Client*
    std::map<std::string, Channel*> _channels;// name -> Channel*
    std::map<std::string, Client*> _nicks;    // nick -> Client* (unique)

    // Setup
    void setupServer();
    static void setNonBlocking(int fd);
    void serverNotice(Client *c, const std::string &msg);

    // Poll helpers
    void addPollFd(int fd, short events);
    void modPollEvents(int fd, short eventsAdd, short eventsRemove);
    void removePollFd(int fd);

    // Client lifecycle
    void acceptNewClient();
    void handleClientReadable(int fd);
    void handleClientWritable(int fd);
    void disconnectClient(int fd, const std::string &reason);

    // Command dispatch
    void processClientCommands(Client *c);
    static void splitCommand(const std::string &line, std::string &cmd, std::string &args);

    // Replies (enqueue only; actual sending occurs on POLLOUT)
    void reply(Client *c, const std::string &msg);
    void outputMessage(Client *c, const std::string &msg);
    void welcomeIfReady(Client *c);

    // Broadcast helpers
    void channelBroadcast(Channel *ch, const std::string &msg, int excludeFd);

    // Finders
    Client* findByNick(const std::string &nick);

    // Handlers
    void handlePASS(Client *c, const std::string &args);
    void handleNICK(Client *c, const std::string &args);
    void handleUSER(Client *c, const std::string &args);
    void handleJOIN(Client *c, const std::string &args);
    void handlePART(Client *c, const std::string &args);
    void handlePRIVMSG(Client *c, const std::string &args);
    void handlePING(Client *c, const std::string &args);
    void handleQUIT(Client *c, const std::string &args);
    void handleKICK(Client *c, const std::string &args);
    void handleINVITE(Client *c, const std::string &args);
    void handleTOPIC(Client *c, const std::string &args);
    void handleMODE(Client *c, const std::string &args);
};

#endif
