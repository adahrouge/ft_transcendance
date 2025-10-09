#include "Server.hpp"

int main(int argc, char **argv) 
{
    if (argc != 3) 
    {
        std::cerr << "Usage: ./ircserv <port> <password>\n";
        return 1;
    }
    int port = std::atoi(argv[1]);
    if (port <= 0 || port > 65535)
    {

        std::cerr << "Invalid port\n";
        return 1;
    }
    std::string password = argv[2];
    try 
    {
        Server s(port, password);
        s.run();
    } catch (const std::exception &e) {
        std::cerr << "Fatal: " << e.what() << "\n";
        return 1;
    }
    return 0;
}
