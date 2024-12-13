# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/30 10:18:51 by abouraad          #+#    #+#              #
#    Updated: 2024/12/13 15:29:17 by adahroug         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

SRCS =	push_swap.c push_swap_utils.c instructions.c \
		sort.c sort_utils.c sort_big_utils.c

BSRCS = checker.c push_swap_utils.c instructions.c get_next_line.c

OBJS =	$(SRCS:.c=.o)

BOBJS = $(BSRCS:.c=.o)

CFLAGS = -Wall -Wextra -Werror

LIBFT = libft/libft.a

all: push_swap

bonus: push_swap checker

push_swap: $(OBJS) $(LIBFT)
	gcc -o $@ $(OBJS) -Llibft -lft

checker: $(BOBJS) $(LIBFT)
	gcc -o $@ $(BOBJS) -Llibft -lft

%.o: %.c
	gcc -c $(CFLAGS) $< -o $@

$(LIBFT):
	make -C libft bonus

clean:
	rm -f $(OBJS) $(BOBJS)
	make -C libft clean

fclean: clean
	rm -f push_swap checker
	make -C libft fclean

re: fclean all

.PHONY: all bonus clean fclean re
