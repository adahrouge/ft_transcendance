# Compiler and flags
CC      = cc
CFLAGS  = -Wall -Wextra -Werror -Iincludes -Iminilibx-linux

# Executable name
NAME    = cub3d

# Directories
OBJ_DIR = obj
MLX_DIR = minilibx-linux
MLX_LIB = $(MLX_DIR)/libmlx.a
MLX_FLAGS = -L$(MLX_DIR) -lmlx -lXext -lX11 -lm

# Source files (manually listed)
SRC = \
	main/main.c \
	libft/libft.c \
	libft/split.c \
	parsing/parsing.c \
	parsing/map_parsing.c \
	parsing/color_parsing.c \
	parsing/parsing.utils.c \
	utils/directions.c \
	utils/utils.c

# Object files
OBJ = $(SRC:.c=.o)
OBJ := $(addprefix $(OBJ_DIR)/, $(OBJ))

# Default rule
all: $(NAME)

# Link all
$(NAME): $(MLX_LIB) $(OBJ)
	$(CC) $(CFLAGS) $(OBJ) $(MLX_FLAGS) -o $(NAME)

# Compile .c -> .o inside obj/
$(OBJ_DIR)/%.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

# MiniLibX build
$(MLX_LIB):
	$(MAKE) -C $(MLX_DIR)

# Clean object files
clean:
	rm -rf $(OBJ_DIR)
	$(MAKE) -C $(MLX_DIR) clean

# Clean object files and binary
fclean: clean
	rm -f $(NAME)

# Rebuild all
re: fclean all

.PHONY: all clean fclean re
