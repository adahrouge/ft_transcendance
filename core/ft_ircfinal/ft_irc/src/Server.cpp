#include "Server.hpp"

Server::Server(int port, const std::string &password)
: _port(port), _password(password), _serverFd(-1), _running(false) {
    setupServer();
}

Server::~Server() 
{
    stop();
}

void Server::setNonBlocking(int fd)
{
    // int flags = fcntl(fd, F_GETFL, 0);
    // if (flags == -1) 
    //     flags = 0;
    fcntl(fd, F_SETFL,/*flags |*/  O_NONBLOCK);
}

void Server::setupServer() 
{
    _serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (_serverFd < 0) 
        throw std::runtime_error("socket() failed");

    int yes = 1;
    setsockopt(_serverFd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));
    sockaddr_in addr;
    std::memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(_port);
    if (bind(_serverFd, (sockaddr*)&addr, sizeof(addr)) < 0)
        throw std::runtime_error("bind() failed");
    if (listen(_serverFd, SOMAXCONN) < 0)
        throw std::runtime_error("listen() failed");
    setNonBlocking(_serverFd);
}

void Server::addPollFd(int fd, short events) 
{
    pollfd p;
    p.fd = fd; 
    p.events = events; 
    p.revents = 0;
    _pollFds.push_back(p);
}

void Server::modPollEvents(int fd, short addEv, short removeEv) 
{
    for (size_t i = 0; i < _pollFds.size(); ++i) 
    {
        if (_pollFds[i].fd == fd) 
        {
            short e = _pollFds[i].events;
            e = (e | addEv);
            e = (short)(e & ~removeEv);
            _pollFds[i].events = e;
            return;
        }
    }
}

void Server::removePollFd(int fd) 
{
    for (size_t i = 0; i < _pollFds.size(); ++i) 
    {
        if (_pollFds[i].fd == fd) 
        {
            _pollFds.erase(_pollFds.begin() + i);
            return;
        }
    }
}

void Server::run() 
{
    _running = true;
    addPollFd(_serverFd, POLLIN);
    std::cout << "ircserv listening on " << _port << std::endl;
    while (_running) 
    {
        int eventsReady = poll(&_pollFds[0], _pollFds.size(), -1);
        if (eventsReady < 0) 
        {
            if (_running) 
                std::cerr << "poll() error\n";
            break;
        }
        for (size_t i = 0; i < _pollFds.size(); ++i) 
        {
            int fd = _pollFds[i].fd;
            short readyEvents = _pollFds[i].revents;
            if (!readyEvents) 
                continue;
            if (fd == _serverFd && (readyEvents & POLLIN)) 
            {
                acceptNewClient();
                continue;
            }
            if (readyEvents & (POLLERR | POLLHUP | POLLNVAL)) 
            {
                disconnectClient(fd, "connection closed");
                if (i > 0) 
                    --i;
                continue;
            }
            if (readyEvents & POLLIN) //input is ready recv wont block
                handleClientReadable(fd);
            if (readyEvents & POLLOUT) //output is ready send wont block
                handleClientWritable(fd);
        }
    }
}

void Server::stop() 
{
    if (!_running) 
        return;
    _running = false;
    for (std::map<int, Client*>::iterator it = _clients.begin(); it != _clients.end(); ++it) 
    {
        close(it->first);
        // delete it->second;
        // it->second = NULL;
    }
    _clients.clear();
    _nicks.clear();
    for (std::map<std::string, Channel*>::iterator ct = _channels.begin(); ct != _channels.end(); ++ct) 
    {
        // delete ct->second;
        // ct->second = NULL;
    }
    _channels.clear();
    if (_serverFd >= 0) 
    {
        close(_serverFd);
        _serverFd = -1;
    }
    _pollFds.clear();
}

void Server::acceptNewClient() 
{
    sockaddr_in clientAddress; 
    socklen_t clientSize = sizeof(clientAddress);
    int ClientFd = accept(_serverFd, (sockaddr*)&clientAddress, &clientSize); // i used sockaddr_in because our server is IPv4
    if (ClientFd < 0) //safety measure LOL it should never fail
        return;
    setNonBlocking(ClientFd);
    addPollFd(ClientFd, POLLIN);
    Client *c = new Client(ClientFd);
    _clients[ClientFd] = c;
}

void Server::handleClientReadable(int fd) 
{
    std::map<int, Client*>::iterator it = _clients.find(fd);
    if (it == _clients.end())  //should never return, just for safety lol
        return;
    Client *c = it->second;
    char buf[4096];
    ssize_t bytesRead = recv(fd, buf, sizeof(buf), 0);
    if (bytesRead == 0)
    {
        disconnectClient(fd, "EOF");
        return;
    }
    if (bytesRead < 0) 
    {
        if (errno == EAGAIN || errno == EWOULDBLOCK) 
            return;
        disconnectClient(fd, "recv error");
        return;
    }
    c->appendToInbuf(buf, (size_t)bytesRead);
    processClientCommands(c);
}

void Server::handleClientWritable(int fd) 
{
    std::map<int, Client*>::iterator it = _clients.find(fd);
    if (it == _clients.end()) //shouldnt happen lol
    { 
        removePollFd(fd); 
        return; 
    }
    Client *c = it->second;
    while (c->hasPendingWrite()) 
    {
        const std::string &msg = c->frontWrite();
        ssize_t sent = send(fd, msg.data(), msg.size(), 0);
        if (sent < 0) 
        {
            if (errno == EAGAIN || errno == EWOULDBLOCK) 
                return;
            disconnectClient(fd, "send error");
            return;
        }
        if ((size_t)sent < msg.size()) 
        {
            std::string rest = msg.substr((size_t)sent);
            c->popFrontWrite();
            c->queueWrite(rest);
            return; // wait for next POLLOUT
        } 
        else 
            c->popFrontWrite();
    }
    modPollEvents(fd, 0, POLLOUT);
}

void Server::disconnectClient(int fd, const std::string &reason) 
{
    std::map<int, Client*>::iterator it = _clients.find(fd);
    if (it == _clients.end())
    { 
        removePollFd(fd); 
        close(fd); 
        return; 
    }
    Client *c = it->second;
    for (std::map<std::string, Channel*>::iterator ct = _channels.begin(); ct != _channels.end();) 
    {
        Channel *ch = ct->second;
        if (ch->isMember(fd)) 
        {
            std::string msg = ":" + c->getNickname() + " PART " + ch->getName() + " :Quit: " + reason + "\r\n";
            channelBroadcast(ch, msg, -1);
            ch->removeMember(fd);
        }
        if (ch->isEmpty()) 
        {
            // delete ch;
            // ch =NULL;
            std::map<std::string, Channel*>::iterator toErase = ct++;
            _channels.erase(toErase);
        } 
        else
            ++ct;
    }
    if (!c->getNickname().empty()) 
    {
        std::map<std::string, Client*>::iterator nit = _nicks.find(c->getNickname());
        if (nit != _nicks.end() && nit->second == c)
            _nicks.erase(nit);
    }
    removePollFd(fd);
    close(fd);
    // delete c;
    // c = NULL;
    _clients.erase(it);
     
}
void Server::reply(Client *c, const std::string &msg) 
{
    if (!c) 
        return;
    c->queueWrite(msg);
    modPollEvents(c->getFd(), POLLOUT, 0);
}

void Server::outputMessage(Client *c, const std::string &msg) 
{
    std::ostringstream oss;
    std::string nick = c->getNickname().empty() ? "*" : c->getNickname();
    oss << ":localhost " << " " << nick << " " << msg << "\r\n";
    reply(c, oss.str());
}

void Server::welcomeIfReady(Client *c) 
{   if (!c) return;
    if (!c->hasPassed() || !c->hasNick() || !c->hasUser() || c->isRegistered())
        return;
    c->setRegistered(true);
    outputMessage(c, ":Welcome to the IRC network " + c->getNickname());
    outputMessage(c, ":Your host is localhost");
}

void Server::splitCommand(const std::string &line, std::string &cmd, std::string &args) 
{
    std::istringstream iss(line);
    iss >> cmd;
    std::getline(iss, args);
    if (!args.empty() && args[0] == ' ') 
        args.erase(0, 1);
}

void Server::channelBroadcast(Channel *ch, const std::string &msg, int excludeFd) 
{
    const std::map<int, Client*> &m = ch->getMembers();
    for (std::map<int, Client*>::const_iterator it = m.begin(); it != m.end(); ++it) 
    {
        if (it->first == excludeFd) 
            continue;
        reply(it->second, msg);
    }
}

Client* Server::findByNick(const std::string &nick) 
{
    std::map<std::string, Client*>::iterator it = _nicks.find(nick);
    if (it == _nicks.end()) 
        return NULL;
    return it->second;
}
void Server::serverNotice(Client *c, const std::string &text) 
{
    if (!c) 
        return;
    std::string nick = c->getNickname().empty() ? "*" : c->getNickname();
    reply(c, ":localhost NOTICE " + nick + " :" + text + "\r\n");
}

void Server::processClientCommands(Client *c) 
{
    while (true) 
    {
        std::string line = c->popNextCommand();
        if (line.empty()) 
            break;
        if (line.size() > 512) 
        {
            reply(c, "ERROR :Line too long\r\n");
            continue;
        }
        std::string cmd, args;
        splitCommand(line, cmd, args);
        if (cmd == "PASS") 
            handlePASS(c, args);
        else if (cmd == "NICK")
            handleNICK(c, args);
        else if (cmd == "USER")
            handleUSER(c, args);
        else if (cmd == "JOIN")
            handleJOIN(c, args);
        else if (cmd == "PART")
            handlePART(c, args);
        else if (cmd == "PRIVMSG")
            handlePRIVMSG(c, args);
        else if (cmd == "PING")
            handlePING(c, args);
        else if (cmd == "QUIT")
            handleQUIT(c, args);
        else if (cmd == "KICK")
            handleKICK(c, args);
        else if (cmd == "INVITE")
            handleINVITE(c, args);
        else if (cmd == "TOPIC")
            handleTOPIC(c, args);
        else if (cmd == "MODE")
            handleMODE(c, args);
        else 
            outputMessage(c, cmd + " :Unknown command");
        welcomeIfReady(c);
    }
}

void Server::handleMODE(Client *c, const std::string &args) 
{
    // MODE #chan +/-flags [params...]
    std::istringstream iss(args);
    std::string chan, flags; iss >> chan >> flags;
    if (chan.empty()) 
    { 
        outputMessage(c,"MODE :Not enough parameters"); 
        return;
     }

    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end()) 
    { 
        outputMessage(c, chan + " :No such channel"); 
        return; 
    }
    Channel *ch = it->second;

    if (flags.empty()) 
    {
        // For brevity, we don't list all modes; you could add 324/329 outputMessages here
        outputMessage(c, chan + " +"
            + std::string(ch->isInviteOnly() ? "i" : "")
            + std::string(ch->isTopicRestricted() ? "t" : "")
            + std::string(ch->hasKey() ? "k" : "")
            + std::string(ch->getUserLimit() >= 0 ? "l" : ""));
        return;
    }
    if (!ch->isOperator(c->getFd())) 
    { 
        outputMessage(c, chan + " :You're not channel operator"); 
        return;
    }

    bool adding = true;
    std::string param;
    std::ostringstream broadcastModes;

    for (size_t i = 0; i < flags.size(); ++i) 
    {
        char f = flags[i];
        if (f == '+') 
        { 
            adding = true; 
            continue;
        }
        if (f == '-') 
        { 
            adding = false;
            continue; 
        }
        switch (f) 
        {
            case 'i':
                ch->setInviteOnly(adding);
                broadcastModes << (adding?"+":"-") << "i";
                break;
            case 't':
                ch->setTopicRestricted(adding);
                broadcastModes << (adding?"+":"-") << "t";
                break;
            case 'k': 
            {
                if (adding) 
                {
                    if (!(iss >> param))
                     {
                        outputMessage(c, "MODE :Not enough parameters"); 
                        return; 
                    }
                    ch->setKey(param);
                    broadcastModes << "+k " << param;
                } 
                else
                {
                    ch->clearKey();
                    broadcastModes << "-k";
                }
                break;
            }
            case 'l': 
            {
                if (adding) 
                {
                    if (!(iss >> param)) 
                    { 
                        outputMessage(c, "MODE :Not enough parameters");
                        return;
                    }
                    int lim = std::atoi(param.c_str());
                    if (lim < 1) 
                        lim = 1;
                    ch->setUserLimit(lim);
                    broadcastModes << "+l " << lim;
                } 
                else 
                {
                    ch->setUserLimit(-1);
                    broadcastModes << "-l";
                }
                break;
            }
            case 'o': 
            {
                if (!(iss >> param))
                { 
                    outputMessage(c, "MODE :Not enough parameters");
                    return;
                }
                Client *target = findByNick(param);
                if (!target || !ch->isMember(target->getFd())) 
                {
                    outputMessage(c, param + " " + chan + " :They aren't on that channel");
                    return;
                }
                if (adding) 
                    ch->addOperator(target->getFd());
                else 
                    ch->removeOperator(target->getFd());
                std::string msg = ":" + c->getNickname() + " MODE " + chan + " " + (adding?"+o ":"-o ") + param + "\r\n";
                channelBroadcast(ch, msg, -1);
                break;
            }
            default:
                outputMessage(c, std::string(1,f) + " :is unknown mode char to me");
                break;
        }
    }
    if (broadcastModes.str().size() > 0) 
    {
        std::string msg = ":" + c->getNickname() + " MODE " + chan + " " + broadcastModes.str() + "\r\n";
        channelBroadcast(ch, msg, -1);
    }
}
