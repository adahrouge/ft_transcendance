#include "Server.hpp"

void Server::handlePASS(Client *c, const std::string &args)
 {
    if (c->isRegistered())
    { 
        outputMessage(c,":You may not re-register"); 
        return; 
    }
    if (args.empty()) 
    {
        outputMessage(c, "PASS :Not enough parameters"); 
        serverNotice(c, "PASS command requires a parameter.");
        return; 
    }

    std::string pass = args;
    if (!pass.empty() && pass[0] == ':') pass = pass.substr(1);
    if (pass == _password) 
    {
        c->markPassed();
        serverNotice(c, "Password accepted.");
    } 
    else 
    {
        outputMessage(c,":Password incorrect");
        serverNotice(c, "Incorrect password.");
    }
}

void Server::handleNICK(Client *c, const std::string &args) 
{
    if (args.empty()) 
    { 
        outputMessage(c, ":No nickname given"); 
        return; 
    }
    std::string nick = args;
    // trim trailing spaces
    while (!nick.empty() && (nick[nick.size()-1] == ' ')) nick.erase(nick.size()-1, 1);

    // no spaces, commas
    for (size_t i = 0; i < nick.size(); ++i) 
    {
        if (nick[i] <= 0x20 || nick[i] == ',' || nick[i] == 0x7F) 
        {
            outputMessage(c, nick + " :Erroneous nickname");
            return;
        }
    }
    Client *conflict = findByNick(nick);
    if (conflict && conflict != c) 
    {
        outputMessage(c, nick + " :Nickname is already in use");
        return;
    }

    // If changing from an existing nickname, free it
    if (!c->getNickname().empty()) 
    {
        std::map<std::string, Client*>::iterator it = _nicks.find(c->getNickname());
        if (it != _nicks.end() && it->second == c) 
            _nicks.erase(it);
    }
    c->setNickname(nick);
    _nicks[nick] = c;
}

void Server::handleUSER(Client *c, const std::string &args) 
{
    if (c->isRegistered()) 
    { 
        outputMessage(c, ":You may not reregister"); 
        return; 
    }
    std::istringstream iss(args);
    std::string user, mode, unused, trailing;
    iss >> user >> mode >> unused;
    std::getline(iss, trailing);
    if (!trailing.empty() && trailing[0] == ' ') 
        trailing.erase(0,1);
    if (!trailing.empty() && trailing[0] == ':')
        trailing.erase(0,1);
    if (user.empty())
    { 
        outputMessage(c, "USER :Not enough parameters");
        return;
    }
    c->setUsername(user, trailing);
}

void Server::handleJOIN(Client *c, const std::string &args) 
{
    if (!c->isRegistered()) 
    { 
        outputMessage(c, ":You have not registered"); 
        return; 
    }
    if (args.empty())
    { 
        outputMessage(c, "JOIN :Not enough parameters");
        return;
    }
    std::istringstream iss(args);
    std::string chan; iss >> chan;
    std::string key; iss >> key;

    if (chan.empty() || chan[0] != '#') 
    {
        outputMessage(c, ":Bad Channel Mask"); 
        return; 
    }

    Channel *ch = NULL;
    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end()) 
    {
        ch = new Channel(chan);
        _channels[chan] = ch;
        ch->addOperator(c->getFd()); // creator gets op
    } 
    else
        ch = it->second;

    if (ch->isMember(c->getFd())) 
    { 
        serverNotice(c, "You are already on channel " + chan);
        outputMessage(c, chan + " :is already on channel");
        return; 
    }

    if (ch->isInviteOnly() && !ch->isInvited(c->getFd())) 
    {
        serverNotice(c, "JOIN " + chan + " failed: Invite only channel");
        outputMessage(c, chan + " :Invite only channel");
        return;
    }
    if (ch->hasKey()) 
    {
        if (key != ch->getKey()) 
        {
            serverNotice(c, "JOIN " + chan + " failed: Incorrect password"); 
            outputMessage(c, chan + " :Cannot join channel (+k)");
            return; 
        }
    }
    if (ch->isFull()) 
    {
        serverNotice(c, "JOIN " + chan + " failed: Channel is full");   
        outputMessage(c, chan + " :Channel is full"); 
        return; 
    }

    ch->addMember(c);
    std::string joinMsg = ":" + c->getNickname() + " JOIN " + chan + "\r\n";
    channelBroadcast(ch, joinMsg, -1);
    serverNotice(c, "You have joined channel " + chan + ".");
    if (!ch->getTopic().empty()) 
    {
        std::ostringstream t;
        t << c->getNickname() << " " << chan << " :" << ch->getTopic() << "\r\n";
        reply(c, t.str());
    }
    std::ostringstream names;
    names << c->getNickname() << " = " << chan << " :";
    const std::map<int, Client*> &m = ch->getMembers();
    for (std::map<int, Client*>::const_iterator mi = m.begin(); mi != m.end(); ++mi)
    {
        if (ch->isOperator(mi->first)) names << "@";
        names << mi->second->getNickname() << " ";
    }
    names << "\r\n";
    reply(c, names.str());
    std::ostringstream end;
    end << c->getNickname() << " " << chan << " :End of /NAMES list.\r\n";
    reply(c, end.str());
}

void Server::handlePART(Client *c, const std::string &args)
{
    std::istringstream iss(args);
    std::string chan; iss >> chan;
    if (chan.empty())
    { 
        outputMessage(c, "PART :Not enough parameters");
        return; 
    }
    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end())
    { 
        outputMessage(c, chan + " :No such channel");
        return;
    }
    Channel *ch = it->second;
    if (!ch->isMember(c->getFd()))
    { 
        outputMessage(c, chan + " :You're not on that channel");
        return;
    }
    std::string msg = ":" + c->getNickname() + " PART " + chan + "\r\n";
    channelBroadcast(ch, msg, -1);
    ch->removeMember(c->getFd());
    if (ch->isEmpty())
    {
        // delete ch;
        // ch = NULL;
        _channels.erase(it);
    }
}

void Server::handlePRIVMSG(Client *c, const std::string &args)
{
    if (!c->isRegistered())
    { 
        outputMessage(c, ":You have not registered");
        return;
    }
    // target :trailing text
    std::istringstream iss(args);
    std::string target; iss >> target;
    std::string trailing; std::getline(iss, trailing);
    if (!trailing.empty() && trailing[0] == ' ')
        trailing.erase(0,1);
    if (!trailing.empty() && trailing[0] == ':')
        trailing.erase(0,1);
    if (target.empty() || trailing.empty())
    {
        outputMessage(c, "PRIVMSG :Not enough parameters");
        return;
    }
    std::string full = ":" + c->getNickname() + " PRIVMSG " + target + " :" + trailing + "\r\n";
    if (!target.empty() && target[0] == '#')
    {
        std::map<std::string, Channel*>::iterator it = _channels.find(target);
        if (it == _channels.end())
        { 
            outputMessage(c, target + " :No such channel");
            return;
        }
        Channel *ch = it->second;
        if (!ch->isMember(c->getFd()))
        { 
            outputMessage(c, target + " :Cannot send to channel");
            return;
        }
        channelBroadcast(ch, full, c->getFd());
    } 
    else
    {
        Client *to = findByNick(target);
        if (!to)
        { 
            outputMessage(c, target + " :No such nick");
            return;
        }
        reply(to, full);
    }
}

void Server::handlePING(Client *c, const std::string &args)
{
    std::string token = args;
    if (!token.empty() && token[0] == ':')
        token.erase(0,1);
    if (token.empty())
        token = "ping";
    reply(c, "PONG :" + token + "\r\n");
}

void Server::handleQUIT(Client *c, const std::string &args)
{
    std::string reason = args;
    if (!reason.empty() && reason[0] == ':')
        reason.erase(0,1);
    if (reason.empty())
        reason = "Client Quit";
    // Inform channels
    for (std::map<std::string, Channel*>::iterator ct = _channels.begin(); ct != _channels.end(); ++ct) 
    {
        Channel *ch = ct->second;
        if (ch->isMember(c->getFd())) 
        {
            std::string msg = ":" + c->getNickname() + " QUIT :" + reason + "\r\n";
            channelBroadcast(ch, msg, c->getFd());
        }
    }
    disconnectClient(c->getFd(), reason);
}

void Server::handleKICK(Client *c, const std::string &args)
{
    std::istringstream iss(args);
    std::string chan, nick; iss >> chan >> nick;
    if (chan.empty() || nick.empty()) { outputMessage(c, "KICK :Not enough parameters"); return; }
    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end()) { outputMessage(c, chan + " :No such channel"); return; }
    Channel *ch = it->second;
    if (!ch->isMember(c->getFd())) { outputMessage(c, chan + " :You're not on that channel"); return; }
    if (!ch->isOperator(c->getFd())) { outputMessage(c, chan + " :You're not channel operator"); return; }

    Client *victim = findByNick(nick);
    if (!victim || !ch->isMember(victim->getFd())) {
        outputMessage(c, nick + " " + chan + " :They aren't on that channel");
        return;
    }
    std::string msg = ":" + c->getNickname() + " KICK " + chan + " " + nick + "\r\n";
    channelBroadcast(ch, msg, -1);
    ch->removeMember(victim->getFd());
    if (ch->isEmpty()) {
        // delete ch;
        // ch = NULL;
        _channels.erase(it);
    }
}

void Server::handleINVITE(Client *c, const std::string &args) 
{
    std::istringstream iss(args);
    std::string nick, chan; iss >> nick >> chan;
    if (nick.empty() || chan.empty()) 
    { 
        outputMessage(c,"INVITE :Not enough parameters"); 
        return; 
    }

    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end()) 
    { 
        outputMessage(c, chan + " :No such channel");
        return; 
    }
    Channel *ch = it->second;

    if (!ch->isMember(c->getFd())) 
    {
        outputMessage(c,chan + " :You're not on that channel"); 
        return; 
    }
    if (!ch->isOperator(c->getFd()))
    { 
        outputMessage(c, chan + " :You're not channel operator");
        return;
    }

    Client *t = findByNick(nick);
    if (!t) 
    { 
        outputMessage(c, nick + " :No such nick");
        return; 
    }
    ch->inviteUser(t->getFd());
    // Notify target
    std::string msg = ":" + c->getNickname() + " INVITE " + nick + " :" + chan + "\r\n";
    reply(t, msg);
    outputMessage(c, nick + " " + chan); // RPL_INVITING
}

void Server::handleTOPIC(Client *c, const std::string &args) 
{
    std::istringstream iss(args);
    std::string chan; iss >> chan;
    if (chan.empty()) 
    { 
        outputMessage(c, "TOPIC :Not enough parameters");
        return;
    }
    std::map<std::string, Channel*>::iterator it = _channels.find(chan);
    if (it == _channels.end()) 
    { 
        outputMessage(c, chan + " :No such channel"); 
        return; 
    }
    Channel *ch = it->second;

    if (!ch->isMember(c->getFd())) 
    { 
        outputMessage(c, chan + " :You're not on that channel"); 
        return;
    }

    std::string trailing; std::getline(iss, trailing);
    if (!trailing.empty() && trailing[0] == ' ')
        trailing.erase(0,1);
    if (trailing.empty()) 
    {
        // Show topic
        std::ostringstream t;
        t << c->getNickname() << " " << chan << " :" << ch->getTopic() << "\r\n";
        reply(c, t.str());
        return;
    }
    if (!trailing.empty() && trailing[0] == ':')
        trailing.erase(0,1);

    // Set topic
    if (ch->isTopicRestricted() && !ch->isOperator(c->getFd())) 
    {
        outputMessage(c, chan + " :You're not channel operator");
        return;
    }
    ch->setTopic(trailing);
    std::string msg = ":" + c->getNickname() + " TOPIC " + chan + " :" + trailing + "\r\n";
    channelBroadcast(ch, msg, -1);
}
