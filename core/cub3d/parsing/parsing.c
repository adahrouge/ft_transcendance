/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parsing.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 19:11:51 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 15:03:04 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

void parse_map(t_data *p)
{
	int map_start;
	if (!open_map(p) || !read_map(p))
		exit_and_error(p);
	map_start = extract_mapcontent(p);
	if (map_start == -1)
		exit_and_error(p);
	if (!check_mapcontent(p))
		exit_and_error(p);
	copy_map(p, map_start); //must free p->map;
	if (!validate_map(p))
		exit_and_error(p);
}

int open_map(t_data *p)
{
	p->fd = open(p->map_filename, O_RDONLY);
	if (p->fd == -1)
	{
		p->error_message = "couldnt open map\n";
		return 0;
	}
	return 1;
}
int read_map(t_data *p)
{
	char buffer[BUFFER_SIZE + 1];
	char *tmp;

	while ((p->bytes_read = read(p->fd, buffer, BUFFER_SIZE)) > 0)
	{
		buffer[p->bytes_read] = '\0';
		if (p->file_buffer == NULL)
			p->file_buffer = ft_strdup(buffer);
		else
		{
			tmp = p->file_buffer;
			p->file_buffer = ft_strjoin(tmp, buffer);
			free(tmp);
		}
	}
	if (p->bytes_read < 0)
	{
		p->error_message = "not reading from map\n";
		return 0;
	}
	p->map_content = ft_split(p->file_buffer, '\n');
	free(p->file_buffer);
	close(p->fd);
	return 1;
}
int extract_mapcontent(t_data *p)
{
	int i;

	i = 0;
	while (p->map_content[i] != NULL)
	{
		trimwhitespace_str(p->map_content[i]);
		if (is_map(p->map_content[i]))
			break;
		if (!parse_line(p, p->map_content[i]))
			return -1;
		i++;
	}
	if (!p->has_no || !p->has_so || !p->has_we || !p->has_ea
		|| !p->has_ceiling || !p->has_floor)
		{
			printf("%d\n", p->has_no);
			printf("%d\n", p->has_so);
			printf("%d\n" ,p->has_we);
			printf("%d\n", p->has_ea);
			printf("%d\n", p->has_floor);
			printf("%d\n", p->has_ceiling);
			p->error_message = "error, attribute missing\n";
			return -1;
		}
	return (i);
}

int parse_line(t_data *p, char *line)
{
	while (*line == ' ')
		line++;
	if (ft_strncmp(line, "NO ", 3) == 0)
	{
		if (!north(p, line))
		return 0;
	}
	else if (ft_strncmp(line, "SO ", 3) == 0)
	{
		if (!south(p, line))
		return 0;
	}
	else if (ft_strncmp(line, "WE ", 3) == 0)
	{	
		if (!west(p, line))
		return 0;
	}
	else if (ft_strncmp(line, "EA ", 3) == 0)
	{
		if (!east(p, line))
		return 0;
	}
	else if (ft_strncmp(line, "F", 1) == 0)
		floorcolor(p, line);
	else if (ft_strncmp(line, "C", 1) == 0)
		ceiling(p, line);
	return 1;
}
int is_map(char *line)
{
	while (*line == ' ')
		line++;
	if (ft_strncmp(line, "NO ", 3) == 0 || ft_strncmp(line, "SO ", 3) == 0 
		|| ft_strncmp(line, "WE ", 3) == 0 || ft_strncmp(line, "EA ", 3) == 0 
		|| *line == 'F' || *line == 'C')
		return 0;
	if (*line == '1' || *line == '0' || *line == 'N'
		|| *line == 'S' || *line == 'E' || *line == 'W')
		return 1;
	return 0;
}
int check_mapcontent(t_data *p)
{
	if (!check_texture(p->north_filename)
	|| !check_texture(p->south_filename)
	|| !check_texture(p->west_filename)
	|| !check_texture(p->east_filename))
	{
		p->error_message = "error with texture of map";
		return 0;
	}
	if (!check_color(p->ceiling_color, p) 
	|| !check_color(p->floor_color, p))
	{
		p->error_message = "error with color of map";
		return 0;
	}
	return 1;
}
