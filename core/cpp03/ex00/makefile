NAME        = ClapTrap
CXX         = c++
CXXFLAGS    = -Wall -Wextra -Werror -std=c++98

SRC         = main.cpp ClapTrap.cpp
OBJS        = $(SRC:.cpp=.o)

all: $(NAME)

$(NAME): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $(NAME) $(OBJS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS)

fclean: clean
	rm -f $(NAME)

re: fclean all

.PHONY: all clean fclean re