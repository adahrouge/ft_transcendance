NAME		= philo

# List all .c files here
SRCS		= main.c       \
			  parsing.c    \
			  dinner.c     \
			  setup.c      \
			  synchronize.c\
			  utils.c      \
			  getters_setters.c \
			  philo.c \
			  time.c \
			  write_status.c \
			  threads.c \

# Objects are derived from SRCS
OBJS		= $(SRCS:.c=.o)

# Compiler & flags (typical 42 guidelines)
CC			= cc
CFLAGS		= -Wall -Wextra -Werror

# Cleanup
RM			= rm -f

# Default rule
all: $(NAME)

# Link all objects into the final binary
$(NAME): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(NAME)

# Compile each .c -> .o
%.o: %.c philosophers.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	$(RM) $(OBJS)

fclean: clean
	$(RM) $(NAME)

re: fclean all

.PHONY: all clean fclean re