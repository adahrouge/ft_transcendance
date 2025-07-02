/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cub3d.h                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 18:57:51 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 16:38:11 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef CUB3D_H
#define CUB3D_H

#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <stdio.h>
#define BUFFER_SIZE 1024
typedef struct s_data
{
	char *north_filename;
	char *south_filename;
	char *west_filename;
	char *east_filename;
	char *floor_color;
	char *ceiling_color;
	int	fd;
	char *map_filename;
	char **map_content;
	char **map;
	char *error_message;
	ssize_t bytes_read;
	char *file_buffer;
	int has_no;
	int has_so;
	int has_we;
	int has_ea;
	int has_floor;
	int has_ceiling;
	int position;
	int x_coordinate;
	int y_coordinate;
	int set;
}	t_data;

//libft
char	*ft_strjoin(char *s1, char *s2);
char	**ft_split(char *s, char c);
char	*word_dup(const char *str, int start, int finish);
int		count_words(const char *str, char c);
char	*ft_strdup(char *str);
int		ft_strncmp(const char *s1, const char *s2, size_t n);
int		ft_strlen(char *str);
void	ft_strcpy(char *dest, char *src);
char	*ft_substr(char *s, unsigned int start, size_t len);
int		ft_atoi(const char *nptr);
int		ft_strcmp(char *s1, char *s2);
//parsing
void	parse_map(t_data *p);
int		open_map(t_data *p);
int		read_map(t_data *p);
int 	extract_mapcontent(t_data *p);
int		is_map(char *line);
int		parse_line(t_data *p, char *line);
int		check_mapcontent(t_data *p);

//map parsing
int validate_map(t_data *p);
int check_previous_line(t_data *p, char *line, char *previous_line);
int check_next_line(t_data *p, char *line, char *next_line);
int check_column_map(char *line, t_data *p);
int check_row_map(char *line, t_data *p);
int process_map(char *line, t_data *p, int *len);
int check_char_map(t_data *p, char *line, int *i);

//parsing utils
int check_texture(char *filename);
void copy_map(t_data *p, int map_start);
void trimwhitespace_str(char *line);
void set_x_coordinate(t_data *p, int i);
//color_parsing
int		check_color(char *color, t_data *p);
int		recheck_colors(char **colors);
void	handle_color(char **colors, t_data *p);


//directions
int	north(t_data *p, char *line);
int south(t_data *p, char *line);
int west(t_data *p, char *line);
int east(t_data *p, char *line);
int floorcolor(t_data *p, char *line);
int ceiling(t_data *p, char *line);



//utils
void	error_message(char *str);
void	free_2d_array(char **array);
void	free_allocated(t_data *p);
void exit_and_error(t_data *p);
void initialize_struct(t_data *p);

#endif

